import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';

type ThreeRippleSurfaceProps = {
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
uniform float uTheme;
varying vec2 vUv;

vec2 toAspect(vec2 uv) {
  vec2 centered = uv - vec2(0.5);
  centered.x *= uResolution.x / max(uResolution.y, 1.0);
  return centered;
}

float rippleWave(vec2 pos, vec2 source, float elapsed, float speed, float wavelength, float damping) {
  float distanceToSource = length(pos - source);
  float waveRadius = elapsed * speed;
  float travel = waveRadius - distanceToSource;
  float arrival = smoothstep(-0.03, 0.005, travel);
  float wake = exp(-max(waveRadius - distanceToSource, 0.0) * 7.5);
  float oscillation = sin(travel * 6.28318530718 / max(wavelength, 0.001));
  return oscillation * arrival * wake * exp(-elapsed * damping);
}

float heightField(vec2 uv) {
  vec2 pos = toAspect(uv);
  float cycle = 2.45;
  float t1 = mod(uTime + 0.00, cycle);
  float t2 = mod(uTime + 0.82, cycle);
  float t3 = mod(uTime + 1.54, cycle);

  float height = 0.0;
  height += rippleWave(pos, vec2(0.00, 0.00), t1, 0.42, 0.11, 0.90) * 0.85;
  height += rippleWave(pos, vec2(-0.16, 0.09), t2, 0.37, 0.095, 0.95) * 0.63;
  height += rippleWave(pos, vec2(0.14, -0.12), t3, 0.39, 0.102, 0.92) * 0.58;
  height += sin((pos.x * 26.0 + pos.y * 19.0) + uTime * 0.55) * 0.003;

  return height;
}

void main() {
  float texel = 1.25 / min(uResolution.x, uResolution.y);
  float h = heightField(vUv);
  float hLeft = heightField(vUv - vec2(texel, 0.0));
  float hRight = heightField(vUv + vec2(texel, 0.0));
  float hDown = heightField(vUv - vec2(0.0, texel));
  float hUp = heightField(vUv + vec2(0.0, texel));

  vec3 normal = normalize(vec3((hLeft - hRight) * 2.6, (hDown - hUp) * 2.6, 1.0));
  vec3 lightDir = normalize(vec3(-0.34, -0.42, 0.84));
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 reflected = reflect(-lightDir, normal);

  float diffuse = max(dot(normal, lightDir), 0.0);
  float specular = pow(max(dot(reflected, viewDir), 0.0), 52.0);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.2);

  vec2 centered = toAspect(vUv);
  float edgeDistance = length(centered);

  vec3 lightDeep = vec3(0.71, 0.82, 0.95);
  vec3 darkDeep = vec3(0.03, 0.08, 0.16);
  vec3 deepColor = mix(lightDeep, darkDeep, uTheme);

  vec3 lightShallow = vec3(0.90, 0.95, 1.00);
  vec3 darkShallow = vec3(0.10, 0.20, 0.34);
  vec3 shallowColor = mix(lightShallow, darkShallow, uTheme);

  vec3 lightTint = vec3(0.36, 0.59, 0.95);
  vec3 darkTint = vec3(0.55, 0.79, 1.00);
  vec3 tint = mix(lightTint, darkTint, uTheme);

  float depthMix = clamp(0.54 + h * 0.55 - edgeDistance * 0.34, 0.0, 1.0);
  vec3 color = mix(deepColor, shallowColor, depthMix);
  color += tint * (0.10 + diffuse * 0.42);
  color += tint * fresnel * 0.32;
  color += vec3(1.0) * specular * (0.24 + 0.18 * (1.0 - uTheme));

  float caustic = pow(clamp(abs(h) * 1.9, 0.0, 1.0), 1.35);
  color += tint * caustic * 0.22;

  float vignette = smoothstep(0.89, 0.22, edgeDistance);
  color *= mix(0.72, 1.04, vignette);

  gl_FragColor = vec4(color, 1.0);
}
`;

export function ThreeRippleSurface({ isLightMode }: ThreeRippleSurfaceProps) {
  const frameRef = useRef<number | null>(null);
  const sceneRef = useRef<ThreeSceneRefs | null>(null);
  const fallbackPulse = useRef(new Animated.Value(0)).current;
  const [showFallback, setShowFallback] = useState(Platform.OS === 'web');

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
        duration: 1400,
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
  }, [fallbackPulse]);

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
                    outputRange: [0.2, 3.1],
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
