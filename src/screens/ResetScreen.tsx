import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { useAppData } from '../state/AppDataContext';
import { RootStackParamList } from '../navigation/types';
import { AppTheme, useAppTheme } from '../theme';

type ResetScreenProps = NativeStackScreenProps<RootStackParamList, 'Reset'>;

const buildHistoryEntry = (cleanStartISO: string) => ({
  archivedCleanStartISO: cleanStartISO,
  archivedAtISO: new Date().toISOString(),
});

export function ResetScreen({ navigation }: ResetScreenProps) {
  const { setAppData, persistAppData } = useAppData();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isSaving, setIsSaving] = useState(false);

  const runReset = async (clearCheckIns: boolean) => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    const nextCleanStartISO = new Date().toISOString();
    setAppData((prev) => ({
      ...prev,
      cleanStartISO: nextCleanStartISO,
      history: [...(prev.history ?? []), buildHistoryEntry(prev.cleanStartISO)],
      checkIns: clearCheckIns ? [] : prev.checkIns,
    }));

    await persistAppData();
    setIsSaving(false);
    navigation.navigate('Home', { toastMessage: 'Saved. You are here.' });
  };

  return (
    <Screen>
      <Card>
        <Text variant="headlineSmall" style={styles.title}>
          Start again
        </Text>
        <Text style={styles.body}>
          If you need to reset your clean start time, you can. Your past entries can be kept or archived.
        </Text>

        <View style={styles.actions}>
          <Button mode="contained" onPress={() => void runReset(false)} loading={isSaving} disabled={isSaving}>
            Reset and keep history
          </Button>
          <Button mode="outlined" onPress={() => void runReset(true)} disabled={isSaving} style={styles.secondaryAction}>
            Reset and archive everything
          </Button>
          <Button mode="text" onPress={() => navigation.goBack()} disabled={isSaving}>
            Cancel
          </Button>
        </View>
      </Card>
    </Screen>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    title: {
      color: theme.colors.textPrimary,
    },
    body: {
      marginTop: theme.spacing.s12,
      color: theme.colors.textMuted,
      ...theme.typography.body,
    },
    actions: {
      marginTop: theme.spacing.s20,
      rowGap: theme.spacing.s12,
    },
    secondaryAction: {
      borderColor: theme.colors.inputBorder,
    },
  });
