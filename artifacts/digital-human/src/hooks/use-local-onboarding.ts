import { useCallback, useEffect, useState } from 'react';
import {
  defaultAppState,
  defaultProfSetup,
  defaultProfile,
  loadLocalState,
  saveAppState as persistAppState,
  saveProfSetup as persistProfSetup,
  saveProfile as persistProfile,
  type AppState,
  type ProfSetup,
  type Profile,
} from '@/lib/local-db';

export function useLocalOnboarding() {
  const [loading, setLoading] = useState(true);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [appState, setAppState] = useState<AppState>(defaultAppState);
  const [profSetup, setProfSetup] = useState<ProfSetup>(defaultProfSetup);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await loadLocalState();
      setStorageAvailable(snapshot.available);
      setProfile(snapshot.profile);
      setAppState(snapshot.appState);
      setProfSetup(snapshot.profSetup);
      setError(snapshot.available ? null : 'Le stockage local est indisponible sur cet appareil.');
    } catch {
      setStorageAvailable(false);
      setError('ALI continue en mode temporaire. Tes réponses ne pourront pas être conservées.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveProfile = useCallback(async (input: Partial<Profile>) => {
    const next = { ...profile, ...input };
    setProfile(next);
    try {
      const saved = await persistProfile(next);
      setProfile(saved);
      setError(null);
    } catch {
      setStorageAvailable(false);
      setError('Réponse gardée pour cette session seulement.');
    }
  }, [profile]);

  const saveProfSetup = useCallback(async (input: Partial<ProfSetup>) => {
    const next = { ...profSetup, ...input };
    setProfSetup(next);
    try {
      const saved = await persistProfSetup(next);
      setProfSetup(saved);
      setError(null);
    } catch {
      setStorageAvailable(false);
      setError('Réponse gardée pour cette session seulement.');
    }
  }, [profSetup]);

  const markOnboardingComplete = useCallback(async () => {
    const next = { ...appState, firstRunCompleted: true, onboardingStep: 7 };
    setAppState(next);
    try {
      sessionStorage.setItem('ali-onboarding-complete', '1');
    } catch {
      // Some private browsing modes block sessionStorage; IndexedDB remains the primary path.
    }
    try {
      const saved = await persistAppState(next);
      setAppState(saved);
      setError(null);
    } catch {
      setStorageAvailable(false);
      setError('On continue, Boss. La session reste active sans IndexedDB.');
    }
  }, [appState]);

  const saveOnboardingStep = useCallback(async (step: number) => {
    const next = { ...appState, onboardingStep: step };
    setAppState(next);
    try {
      const saved = await persistAppState(next);
      setAppState(saved);
    } catch {
      setStorageAvailable(false);
    }
  }, [appState]);

  return {
    loading,
    storageAvailable,
    error,
    profile,
    appState,
    profSetup,
    firstRunCompleted: appState.firstRunCompleted,
    saveProfile,
    saveProfSetup,
    saveOnboardingStep,
    markOnboardingComplete,
    refresh,
  };
}