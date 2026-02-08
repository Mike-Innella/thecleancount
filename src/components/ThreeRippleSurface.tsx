import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';

type SplashVariant = 'launch' | 'install';

type ThreeRippleSurfaceProps = {
  variant: SplashVariant;
  isLightMode: boolean;
};

type ThreeSceneRefs = {
  renderer: Renderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  material: THREE.ShaderMaterial;
  geometry: THREE.PlaneGeometry;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
};

type ExpoThreeRendererCompat = Renderer & {
  setSize: (width: number, height: number) => void;
  setClearColor: (color: number, alpha: number) => void;
  render: (scene: THREE.Scene, camera: THREE.Camera) => void;
};

const VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform float uIntensity;
uniform float uTheme;
varying vec2 vUv;

float waveField(vec2 uv, float freq, float speed, float decay, float phase) {
  vec2 centered = uv - vec2(0.5);
  centered.x *= uResolution.x / max(uResolution.y, 1.0);
  float d = length(centered);
  float wave = sin(d * freq - uTime * speed + phase);
  return wave * exp(-d * decay);
}

void main() {
  vec2 centered = vUv - vec2(0.5);
  centered.x *= uResolution.x / max(uResolution.y, 1.0);
  float d = length(centered);

  float baseWave = waveField(vUv, mix(26.0, 34.0, uIntensity), mix(4.5, 6.4, uIntensity), mix(6.2, 4.6, uIntensity), 0.0);
  float detailWave = waveField(vUv, mix(40.0, 56.0, uIntensity), mix(7.4, 10.2, uIntensity), mix(8.2, 6.1, uIntensity), 1.6);
  float ringPulse = smoothstep(0.06, 0.0, abs(d - (0.06 + fract(uTime * (0.24 + 0.14 * uIntensity)) * (0.52 + 0.12 * uIntensity))));
  float crest = abs(baseWave) * 0.54 + abs(detailWave) * 0.36 + ringPulse * 0.9;
  float trough = clamp(1.0 - crest * 0.8, 0.0, 1.0);
  float caustic = pow(max(0.0, 1.0 - abs(baseWave) * 2.1), 5.0) * (0.16 + 0.24 * uIntensity);

  vec3 lightBase = vec3(0.91, 0.95, 0.99);
  vec3 darkBase = vec3(0.05, 0.10, 0.18);
  vec3 baseColor = mix(lightBase, darkBase, uTheme);
  vec3 lightTrough = vec3(0.78, 0.86, 0.96);
  vec3 darkTrough = vec3(0.03, 0.07, 0.14);
  vec3 troughColor = mix(lightTrough, darkTrough, uTheme);

  vec3 lightGlow = vec3(0.27, 0.50, 0.92);
  vec3 darkGlow = vec3(0.52, 0.80, 1.00);
  vec3 glowColor = mix(lightGlow, darkGlow, uTheme);

  vec3 color = mix(baseColor, troughColor, trough * 0.26);
  color += glowColor * crest * (0.56 + 0.3 * uIntensity);
  color += caustic;

  float vignette = smoothstep(0.82, 0.18, d);
  color *= mix(0.72, 1.06, vignette);

  gl_FragColor = vec4(color, 1.0);
}
`;

export function ThreeRippleSurface({ variant, isLightMode }: ThreeRippleSurfaceProps) {
  const frameRef = useRef<number | null>(null);
  const sceneRef = useRef<ThreeSceneRefs | null>(null);
  const fallbackPulse = useRef(new Animated.Value(0)).current;
  const [showFallback, setShowFallback] = useState(Platform.OS === 'web');

  const intensity = useMemo(() => (variant === 'install' ? 1 : 0), [variant]);
  const themeMode = useMemo(() => (isLightMode ? 0 : 1), [isLightMode]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }

      const activeScene = sceneRef.current;
      if (activeScene) {
        activeScene.geometry.dispose();
        activeScene.material.dispose();
        activeScene.scene.remove(activeScene.mesh);
      }

      fallbackPulse.stopAnimation();
    };
  }, [fallbackPulse]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const fallbackTimeout = setTimeout(() => {
      setShowFallback((prev) => prev || !sceneRef.current);
    }, 900);

    const loop = Animated.loop(
      Animated.timing(fallbackPulse, {
        toValue: 1,
        duration: variant === 'install' ? 1050 : 1500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      { resetBeforeIteration: true },
    );
    loop.start();

    return () => {
      clearTimeout(fallbackTimeout);
      loop.stop();
      fallbackPulse.setValue(0);
    };
  }, [fallbackPulse, variant]);

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    try {
      const renderer = new Renderer({ gl }) as ExpoThreeRendererCompat;
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const geometry = new THREE.PlaneGeometry(2, 2);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(gl.drawingBufferWidth, gl.drawingBufferHeight) },
          uIntensity: { value: intensity },
          uTheme: { value: themeMode },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      sceneRef.current = {
        renderer,
        scene,
        camera,
        material,
        geometry,
        mesh,
      };
      setShowFallback(false);

      const render = () => {
        const activeScene = sceneRef.current;
        if (!activeScene) {
          return;
        }

        activeScene.material.uniforms.uTime.value += 0.016;
        activeScene.material.uniforms.uIntensity.value = intensity;
        activeScene.material.uniforms.uTheme.value = themeMode;
        activeScene.material.uniforms.uResolution.value.set(gl.drawingBufferWidth, gl.drawingBufferHeight);

        activeScene.renderer.render(activeScene.scene, activeScene.camera);
        gl.endFrameEXP();
        frameRef.current = requestAnimationFrame(render);
      };

      render();
    } catch {
      setShowFallback(true);
    }
  };

  if (Platform.OS === 'web') {
    return <View style={[styles.fallback, isLightMode ? styles.fallbackLight : styles.fallbackDark]} />;
  }

  return (
    <View style={styles.wrapper}>
      <GLView style={styles.gl} onContextCreate={onContextCreate} />
      {showFallback ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fallbackRipple,
            {
              opacity: fallbackPulse.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0, 0.35, 0],
              }),
              transform: [
                {
                  scale: fallbackPulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.2, variant === 'install' ? 3.5 : 2.7],
                  }),
                },
              ],
              borderColor: isLightMode ? 'rgba(59, 122, 225, 0.7)' : 'rgba(124, 191, 255, 0.78)',
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gl: {
    ...StyleSheet.absoluteFillObject,
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
  },
  fallbackLight: {
    backgroundColor: '#E6EEF9',
  },
  fallbackDark: {
    backgroundColor: '#0A1426',
  },
  fallbackRipple: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
  },
});
