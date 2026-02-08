import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { AppTheme, useAppTheme } from '../theme';

const BULLETS = [
  'Local-first',
  'No account',
  'Works offline',
  'Nothing is sent anywhere',
  'You control your data',
];

export function TrustScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <Text variant="headlineSmall" style={styles.title}>
            Trust & Privacy
          </Text>
          <Text style={styles.intro}>This app keeps your data on your device. It does not require accounts or cloud sync.</Text>

          <View style={styles.listWrap}>
            {BULLETS.map((bullet) => (
              <View key={bullet} style={styles.bulletRow}>
                <View style={styles.dot} />
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.s20,
      paddingTop: theme.spacing.s16,
      paddingBottom: theme.spacing.s24,
    },
    title: {
      color: theme.colors.textPrimary,
    },
    intro: {
      color: theme.colors.textMuted,
      ...theme.typography.body,
      marginTop: theme.spacing.s12,
    },
    listWrap: {
      marginTop: theme.spacing.s16,
      rowGap: theme.spacing.s12,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#6FB6FF',
      marginRight: theme.spacing.s12,
    },
    bulletText: {
      color: theme.colors.textPrimary,
      ...theme.typography.body,
    },
  });
