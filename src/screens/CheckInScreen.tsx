import { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { StateCheckCard } from '../components/StateCheckCard';
import { Screen } from '../components/Screen';
import { AppTheme, useAppTheme } from '../theme';

export function CheckInScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Screen padded={false}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
        <StateCheckCard />
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
  });
