import { DailyCheckIn, UserSettings } from '../types/appTypes';
import { todayISO } from './date';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const hasRecentSuggestion = (lastHardDaySuggestAt?: string): boolean => {
  if (!lastHardDaySuggestAt) {
    return false;
  }

  const suggestedAtMs = new Date(lastHardDaySuggestAt).getTime();
  if (Number.isNaN(suggestedAtMs)) {
    return false;
  }

  return Date.now() - suggestedAtMs < ONE_DAY_MS;
};

export const shouldSuggestHardDayMode = (checkIns: DailyCheckIn[], settings: UserSettings): boolean => {
  if (!settings.hardDayModeAutoSuggest || settings.hardDayModeEnabled) {
    return false;
  }

  if (hasRecentSuggestion(settings.lastHardDaySuggestAt)) {
    return false;
  }

  const today = todayISO();
  const strugglingToday = checkIns.some((checkIn) => checkIn.dateISO === today && checkIn.state === 'struggling');
  if (strugglingToday) {
    return true;
  }

  const lastThree = [...checkIns]
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
    .slice(0, 3);

  const strugglingCount = lastThree.filter((checkIn) => checkIn.state === 'struggling').length;
  return strugglingCount >= 2;
};
