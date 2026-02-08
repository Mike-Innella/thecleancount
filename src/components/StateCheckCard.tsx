import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

import { Card } from './Card';
import { useAppData } from '../state/AppDataContext';
import { CheckInState } from '../types/appTypes';
import { todayISO } from '../utils/date';
import { AppTheme, useAppTheme } from '../theme';

const CHECK_IN_OPTIONS: Array<{ label: string; value: CheckInState }> = [
  { label: 'Steady', value: 'steady' },
  { label: 'Uneasy', value: 'worn' },
  { label: 'Struggling', value: 'struggling' },
];

const MOOD_COLORS: Record<
  CheckInState,
  {
    active: string;
    inactiveBorder: string;
    selectedText: string;
  }
> = {
  steady: {
    active: '#2FAF74',
    inactiveBorder: '#2FAF7488',
    selectedText: '#FFFFFF',
  },
  worn: {
    active: '#E1B740',
    inactiveBorder: '#E1B74088',
    selectedText: '#1E1E1E',
  },
  struggling: {
    active: '#D55A5A',
    inactiveBorder: '#D55A5A88',
    selectedText: '#FFFFFF',
  },
};

const NOTE_MAX_LENGTH = 140;
const SAVED_MESSAGE_MS = 1200;

export function StateCheckCard() {
  const { appData, setAppData } = useAppData();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [noteDraft, setNoteDraft] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const today = todayISO();
  const todayCheckIn = useMemo(
    () => appData.checkIns.find((checkIn) => checkIn.dateISO === today),
    [appData.checkIns, today],
  );

  useEffect(() => {
    setNoteDraft(todayCheckIn?.note ?? '');
  }, [todayCheckIn?.note]);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  const showSavedMicrocopy = () => {
    setShowSaved(true);
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
    }

    savedTimerRef.current = setTimeout(() => {
      setShowSaved(false);
    }, SAVED_MESSAGE_MS);
  };

  const updateTodayCheckIn = (stateValue: CheckInState, noteValue?: string) => {
    setAppData((prev) => {
      const nextCheckIn = {
        dateISO: today,
        state: stateValue,
        note: noteValue?.trim() ? noteValue.trim() : undefined,
      };

      const otherDays = prev.checkIns.filter((checkIn) => checkIn.dateISO !== today);
      return {
        ...prev,
        checkIns: [...otherDays, nextCheckIn],
      };
    });
  };

  const handleSelectState = (stateValue: CheckInState) => {
    updateTodayCheckIn(stateValue, noteDraft);
    setShowSaved(false);
  };

  const handleSaveNote = () => {
    if (!todayCheckIn) {
      return;
    }

    updateTodayCheckIn(todayCheckIn.state, noteDraft.slice(0, NOTE_MAX_LENGTH));
    showSavedMicrocopy();
  };

  return (
    <Card style={styles.card}>
      <Text variant="titleMedium" style={styles.title}>
        How are you right now?
      </Text>

      <View style={styles.row}>
        {CHECK_IN_OPTIONS.map((option) => {
          const isSelected = todayCheckIn?.state === option.value;
          const colorSet = MOOD_COLORS[option.value];
          return (
            <Button
              key={option.value}
              mode={isSelected ? 'contained' : 'outlined'}
              onPress={() => handleSelectState(option.value)}
              style={[styles.stateButton, { borderColor: colorSet.inactiveBorder }]}
              contentStyle={styles.stateButtonContent}
              labelStyle={styles.stateButtonLabel}
              textColor={isSelected ? colorSet.selectedText : theme.colors.textPrimary}
              buttonColor={isSelected ? colorSet.active : undefined}
            >
              {option.label}
            </Button>
          );
        })}
      </View>

      {todayCheckIn ? (
        <View style={styles.noteWrap}>
          <TextInput
            mode="outlined"
            value={noteDraft}
            onChangeText={(value) => setNoteDraft(value.slice(0, NOTE_MAX_LENGTH))}
            multiline
            maxLength={NOTE_MAX_LENGTH}
            outlineStyle={styles.noteOutline}
            style={styles.noteInput}
            placeholder="Add a note (optional)"
            placeholderTextColor={theme.colors.placeholder}
            textColor={theme.colors.textPrimary}
          />
          <View style={styles.noteMetaRow}>
            <Text style={styles.noteMeta}>{`${noteDraft.length}/${NOTE_MAX_LENGTH}`}</Text>
            <View style={styles.noteMetaActions}>
              {showSaved ? <Text style={styles.saved}>Saved</Text> : null}
              <Button
                mode="outlined"
                onPress={handleSaveNote}
                style={styles.saveButton}
                textColor={theme.colors.textPrimary}
                disabled={noteDraft.trim() === (todayCheckIn.note?.trim() ?? '')}
              >
                Save note
              </Button>
            </View>
          </View>
        </View>
      ) : null}

      {!todayCheckIn && showSaved ? <Text style={styles.savedStandalone}>Saved</Text> : null}
    </Card>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      width: '100%',
      marginTop: theme.spacing.s16,
    },
    title: {
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.s12,
    },
    row: {
      flexDirection: 'row',
      columnGap: theme.spacing.s8,
    },
    stateButton: {
      flex: 1,
    },
    stateButtonContent: {
      minHeight: 38,
      paddingHorizontal: 4,
    },
    stateButtonLabel: {
      fontSize: 11,
      marginHorizontal: 0,
    },
    noteWrap: {
      marginTop: theme.spacing.s12,
    },
    noteInput: {
      minHeight: 86,
      backgroundColor: theme.colors.inputBg,
    },
    noteOutline: {
      borderColor: theme.colors.inputBorder,
    },
    noteMetaRow: {
      marginTop: theme.spacing.s8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    noteMetaActions: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.s8,
    },
    saveButton: {
      borderColor: theme.colors.inputBorder,
    },
    noteMeta: {
      color: theme.colors.textMuted,
      ...theme.typography.body,
    },
    saved: {
      color: '#37A16D',
      ...theme.typography.body,
    },
    savedStandalone: {
      marginTop: theme.spacing.s12,
      color: '#37A16D',
      ...theme.typography.body,
    },
  });
