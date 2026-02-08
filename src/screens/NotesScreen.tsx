import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { useAppData } from '../state/AppDataContext';
import { CheckInState } from '../types/appTypes';
import { AppTheme, useAppTheme } from '../theme';

const formatDate = (dateISO: string): string => {
  const [year, month, day] = dateISO.split('-').map(Number);
  if (!year || !month || !day) {
    return dateISO;
  }

  const localDate = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(localDate);
};

const formatState = (value: string): string => {
  if (value === 'worn') {
    return 'Uneasy';
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const MOOD_COLORS: Record<
  CheckInState,
  {
    badge: string;
    text: string;
  }
> = {
  steady: {
    badge: '#2FAF74',
    text: '#FFFFFF',
  },
  worn: {
    badge: '#E1B740',
    text: '#1E1E1E',
  },
  struggling: {
    badge: '#D55A5A',
    text: '#FFFFFF',
  },
};

export function NotesScreen() {
  const { appData } = useAppData();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const notes = useMemo(
    () =>
      [...appData.checkIns]
        .filter((checkIn) => Boolean(checkIn.note?.trim()))
        .sort((a, b) => b.dateISO.localeCompare(a.dateISO)),
    [appData.checkIns],
  );

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <Text variant="titleLarge" style={styles.title}>
            Past notes
          </Text>
          <Text style={styles.subtitle}>Your saved daily notes live only on this device.</Text>

          {notes.length === 0 ? (
            <Text style={styles.empty}>No saved notes yet.</Text>
          ) : (
            <View style={styles.notesList}>
              {notes.map((note) => (
                <View key={note.dateISO} style={styles.noteRow}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteDate}>{formatDate(note.dateISO)}</Text>
                    <View style={[styles.noteStateBadge, { backgroundColor: MOOD_COLORS[note.state].badge }]}>
                      <Text style={[styles.noteState, { color: MOOD_COLORS[note.state].text }]}>
                        {formatState(note.state)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.noteBody}>{note.note?.trim()}</Text>
                </View>
              ))}
            </View>
          )}
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
    subtitle: {
      color: theme.colors.textMuted,
      ...theme.typography.body,
      marginTop: theme.spacing.s8,
    },
    empty: {
      color: theme.colors.textMuted,
      ...theme.typography.body,
      marginTop: theme.spacing.s16,
    },
    notesList: {
      marginTop: theme.spacing.s16,
      rowGap: theme.spacing.s12,
    },
    noteRow: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      backgroundColor: theme.colors.inputBg,
      padding: theme.spacing.s12,
    },
    noteHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.s8,
    },
    noteDate: {
      color: theme.colors.textPrimary,
      ...theme.typography.label,
    },
    noteState: {
      ...theme.typography.label,
      letterSpacing: 0.2,
    },
    noteStateBadge: {
      borderRadius: 999,
      paddingHorizontal: theme.spacing.s8,
      paddingVertical: 4,
    },
    noteBody: {
      color: theme.colors.textPrimary,
      ...theme.typography.body,
    },
  });
