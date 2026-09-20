export const attendanceKeys = {
  all: ['attendance'] as const,
  today: () => [...attendanceKeys.all, 'today'] as const,
  summary: () => [...attendanceKeys.all, 'summary'] as const,
  history: () => [...attendanceKeys.all, 'history'] as const,
};

export const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'currentUser'] as const,
};

export const settingsKeys = {
  all: ['settings'] as const,
  userSettings: () => [...settingsKeys.all, 'userSettings'] as const,
};
