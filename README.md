# The Clean Count

Minimal, local-first clean-time tracker built with Expo + React Native + TypeScript.

## Features

- Onboarding flow for clean date and optional display name.
- Focused home screen with live day count, hours, and progress summary.
- Settings to edit clean date and reset tracking.
- Daily reminder notifications (opt-in).
- Custom reminder time picker.
- Reminder content includes:
  - current day count at trigger time
  - gentle affirmation message
- Affirmations are shuffled on each app start for variety.
- Local encrypted persistence with no backend and no analytics.

## Tech Stack

- Expo React Native (`expo`)
- TypeScript
- React Navigation native stack
- `expo-secure-store` for encrypted local state
- `expo-notifications` for daily local reminders
- `@react-native-community/datetimepicker`
- `react-native-paper`

## Getting Started

1. `cd TheCleanCount`
2. `npm install`
3. `npm run start`
4. In Expo CLI:
   - press `a` for Android
   - press `i` for iOS
   - press `w` for web

## Available Scripts

- `npm run start`
- `npm run android`
- `npm run ios`
- `npm run web`

## Notifications Behavior

- Notifications are optional and controlled in **Settings**.
- When enabled, reminders are scheduled for the next 365 days at the selected time.
- Updating clean date or reminder time re-syncs the schedule.
- Resetting clean date clears scheduled reminders.
- If notification permission is denied, reminders remain disabled and the app shows guidance in Settings.

## Data and Privacy

- All app data is stored locally on-device in SecureStore.
- Storage key: `clean_count_state_v1`.
- Stored fields include:
  - `cleanStartISO`
  - `displayName`
  - `dailyReminderEnabled`
  - `dailyReminderHour`
  - `dailyReminderMinute`
  - `createdAtISO`
  - `updatedAtISO`

## Project Structure

- `App.tsx`: app providers and navigation container
- `src/navigation/RootNavigator.tsx`: app state orchestration and screen routing
- `src/screens/*`: onboarding, home, and settings screens
- `src/notifications/dailyReminder.ts`: notification setup and scheduling
- `src/storage/secureStore.ts`: local persistence layer
