import Dexie, { type Table } from 'dexie';

export const LOCAL_SINGLETON_ID = 'local-singleton';

export type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  age: string;
  classLevel: string;
  domain: string;
  heardAbout: string;
  goal: string;
  updatedAt: string;
};

export type AppState = {
  id: string;
  firstRunCompleted: boolean;
  onboardingStep: number;
  schedule: string[];
  updatedAt: string;
};

export type ProfSetup = {
  id: string;
  course: string;
  teacherPlan: string;
  availableTime: string;
  studyTime: string;
  frequency: string;
  completed: boolean;
  updatedAt: string;
};

export type ProgressRecord = {
  id: string;
  subject: string;
  percentage: number;
  note: string;
  updatedAt: string;
};

export type SharedChallenge = {
  id?: number;
  code: string;
  title: string;
  subject: string;
  question: string;
  answer: string;
  createdAt: string;
};

class AliLocalDatabase extends Dexie {
  profile!: Table<Profile, string>;
  appState!: Table<AppState, string>;
  profSetup!: Table<ProfSetup, string>;
  progress!: Table<ProgressRecord, string>;
  sharedChallenges!: Table<SharedChallenge, number>;

  constructor() {
    super('ali-local-first');
    this.version(1).stores({
      profile: 'id',
      appState: 'id',
      profSetup: 'id',
      progress: 'id, subject',
      sharedChallenges: '++id, code, createdAt',
    });
  }
}

export const localDb = new AliLocalDatabase();

const now = () => new Date().toISOString();

export const defaultProfile = (): Profile => ({
  id: LOCAL_SINGLETON_ID,
  firstName: '',
  lastName: '',
  age: '',
  classLevel: '',
  domain: '',
  heardAbout: '',
  goal: '',
  updatedAt: now(),
});

export const defaultAppState = (): AppState => ({
  id: LOCAL_SINGLETON_ID,
  firstRunCompleted: false,
  onboardingStep: 0,
  schedule: [],
  updatedAt: now(),
});

export const defaultProfSetup = (): ProfSetup => ({
  id: LOCAL_SINGLETON_ID,
  course: '',
  teacherPlan: '',
  availableTime: '',
  studyTime: '',
  frequency: '',
  completed: false,
  updatedAt: now(),
});

export const defaultProgress = (): ProgressRecord[] => [
  { id: 'maths', subject: 'Mathématiques', percentage: 42, note: 'Reprendre les fonctions et les équations.', updatedAt: now() },
  { id: 'sciences', subject: 'Sciences', percentage: 58, note: 'Les bases sont en place.', updatedAt: now() },
  { id: 'francais', subject: 'Français', percentage: 31, note: 'Une petite session de lecture aide déjà.', updatedAt: now() },
];

export async function loadLocalState() {
  try {
    const [profile, appState, profSetup, progress] = await Promise.all([
      localDb.profile.get(LOCAL_SINGLETON_ID),
      localDb.appState.get(LOCAL_SINGLETON_ID),
      localDb.profSetup.get(LOCAL_SINGLETON_ID),
      localDb.progress.toArray(),
    ]);
    const safeProgress = progress.length ? progress : defaultProgress();
    if (!progress.length) await localDb.progress.bulkPut(safeProgress);
    return {
      available: true,
      profile: profile ?? defaultProfile(),
      appState: appState ?? defaultAppState(),
      profSetup: profSetup ?? defaultProfSetup(),
      progress: safeProgress,
    };
  } catch {
    return {
      available: false,
      profile: defaultProfile(),
      appState: defaultAppState(),
      profSetup: defaultProfSetup(),
      progress: defaultProgress(),
    };
  }
}

export async function saveProfile(input: Partial<Profile>) {
  const existing = (await localDb.profile.get(LOCAL_SINGLETON_ID).catch(() => undefined)) ?? defaultProfile();
  const next = { ...existing, ...input, id: LOCAL_SINGLETON_ID, updatedAt: now() };
  await localDb.profile.put(next);
  return next;
}

export async function saveAppState(input: Partial<AppState>) {
  const existing = (await localDb.appState.get(LOCAL_SINGLETON_ID).catch(() => undefined)) ?? defaultAppState();
  const next = { ...existing, ...input, id: LOCAL_SINGLETON_ID, updatedAt: now() };
  await localDb.appState.put(next);
  return next;
}

export async function saveProfSetup(input: Partial<ProfSetup>) {
  const existing = (await localDb.profSetup.get(LOCAL_SINGLETON_ID).catch(() => undefined)) ?? defaultProfSetup();
  const next = { ...existing, ...input, id: LOCAL_SINGLETON_ID, updatedAt: now() };
  await localDb.profSetup.put(next);
  return next;
}

export async function saveProgress(record: ProgressRecord) {
  const next = { ...record, updatedAt: now() };
  await localDb.progress.put(next);
  return next;
}

export async function listSharedChallenges() {
  try {
    return await localDb.sharedChallenges.orderBy('createdAt').reverse().toArray();
  } catch {
    return [];
  }
}

export async function createSharedChallenge(challenge: Omit<SharedChallenge, 'id' | 'createdAt' | 'code'>) {
  const code = `ALI-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const next = { ...challenge, code, createdAt: now() };
  const id = await localDb.sharedChallenges.add(next);
  return { ...next, id };
}