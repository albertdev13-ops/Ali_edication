import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, ArrowRight, Check, Database, Sparkles, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocalOnboarding } from '@/hooks/use-local-onboarding';

const registrationFields = [
  { key: 'firstName', label: 'Nom', placeholder: 'Ton nom', type: 'text' },
  { key: 'lastName', label: 'Post-Nom', placeholder: 'Ton post-nom', type: 'text' },
  { key: 'age', label: 'Âge', placeholder: 'Ex. 16', type: 'number' },
  { key: 'classLevel', label: 'Classe', placeholder: 'Ex. 5e secondaire', type: 'text' },
  { key: 'domain', label: 'Domaine', placeholder: 'Ex. Sciences', type: 'text' },
] as const;

const heardChoices = ['Un ami ou une amie', 'Mon école', 'Les réseaux sociaux', 'Une recherche en ligne'];
const goalChoices = ['Réviser plus régulièrement', 'Mieux comprendre mes cours', 'Préparer un examen', 'Trouver ma méthode'];

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { profile, appState, loading, storageAvailable, error, saveProfile, saveOnboardingStep, markOnboardingComplete } = useLocalOnboarding();
  const [step, setStep] = useState(0);
  const [other, setOther] = useState('');
  const [saving, setSaving] = useState(false);
  const [draftValue, setDraftValue] = useState('');
  const hydratedStep = useRef(false);
  const isQuestionStep = step >= registrationFields.length;
  const totalSteps = 7;

  useEffect(() => {
    if (!loading && !hydratedStep.current && profile.id) {
      hydratedStep.current = true;
      setStep(Math.min(Math.max(appState.onboardingStep, 0), totalSteps - 1));
    }
  }, [appState.onboardingStep, loading, profile.id]);

  useEffect(() => {
    if (!loading && step < registrationFields.length) setDraftValue(currentValue);
  }, [loading, step]);

  const currentValue = useMemo(() => {
    if (step < registrationFields.length) return profile[registrationFields[step].key];
    return step === 5 ? profile.heardAbout : profile.goal;
  }, [profile, step]);

  const saveAndNext = async (value: string) => {
    if (!value.trim() || saving) return;
    setSaving(true);
    try {
      if (step < registrationFields.length) {
        await saveProfile({ [registrationFields[step].key]: value.trim() });
      } else if (step === 5) {
        await saveProfile({ heardAbout: value.trim() });
      } else {
        await saveProfile({ goal: value.trim() });
      }
      await saveOnboardingStep(step + 1);
      setOther('');
      if (step === totalSteps - 1) {
        await markOnboardingComplete();
        setLocation('/dashboard');
      } else {
        setStep((current) => current + 1);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="ali-page h-full flex items-center justify-center"><div className="w-64 space-y-3"><div className="h-2 rounded bg-primary/20 animate-pulse" /><div className="h-2 rounded bg-muted animate-pulse w-4/5" /><p className="font-mono text-[10px] text-muted-foreground">INITIALISATION LOCALE…</p></div></div>;
  }

  const title = step < registrationFields.length
    ? `Commençons par toi, Boss.`
    : step === 5 ? 'Comment as-tu trouvé ALI ?' : 'Qu’est-ce que tu veux construire ?';
  const description = step < registrationFields.length
    ? 'Quelques repères pour que mes conseils te ressemblent.'
    : step === 5 ? 'Une réponse simple suffit. Il n’y a pas de mauvaise réponse.'
    : 'Ton objectif devient notre fil conducteur, dès aujourd’hui.';

  return (
    <div className="ali-page h-full overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-5 py-8 sm:px-8 lg:py-14">
        <div className="ali-enter flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono text-xs tracking-[0.22em] text-primary">ALI / PREMIER PAS</p>
              <p className="text-xs text-muted-foreground">Ton espace reste à toi, sur cet appareil.</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground sm:flex">
            <Database className="h-3.5 w-3.5 text-accent" />
            {storageAvailable ? 'Sauvegarde locale active' : 'Mode session'}
          </div>
        </div>

        <div className="ali-enter ali-stagger-1 mt-14 flex-1">
          <div className="mb-7 flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-widest text-primary">ÉTAPE {step + 1} / {totalSteps}</span>
            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }).map((_, index) => <span key={index} className={`h-1.5 w-8 rounded-full transition-colors ${index <= step ? 'bg-primary' : 'bg-muted'}`} />)}
            </div>
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">{title}</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">{description}</p>

          <div className="mt-10 max-w-xl">
            {!isQuestionStep ? (
              <label className="block">
                <span className="mb-2 block font-mono text-xs uppercase tracking-widest text-primary">{registrationFields[step].label}</span>
                <Input
                  autoFocus
                  type={registrationFields[step].type}
                  placeholder={registrationFields[step].placeholder}
                  value={draftValue}
                  onChange={(event) => setDraftValue(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') void saveAndNext(draftValue); }}
                  className="h-14 border-primary/25 bg-card/60 text-lg focus-visible:ring-primary"
                />
              </label>
            ) : (
              <div className="grid gap-3">
                {(step === 5 ? heardChoices : goalChoices).map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => void saveAndNext(choice)}
                    className={`group flex items-center justify-between rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/5 ${currentValue === choice ? 'border-primary bg-primary/10' : 'border-border/70 bg-card/45'}`}
                  >
                    <span>{choice}</span><ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </button>
                ))}
                <div className="mt-2 flex gap-2">
                  <Input value={other} onChange={(event) => setOther(event.target.value)} placeholder="Autre…" className="h-12 bg-card/45" />
                  <Button onClick={() => void saveAndNext(other)} disabled={!other.trim() || saving} variant="outline" className="h-12 border-primary/35">Valider</Button>
                </div>
              </div>
            )}
          </div>
          {error && <p className="mt-4 text-xs text-amber-300">{error}</p>}
        </div>

        <div className="ali-enter ali-stagger-2 mt-12 flex items-center justify-between border-t border-border/60 pt-5">
          <Button variant="ghost" className="text-muted-foreground" disabled={step === 0 || saving} onClick={() => setStep((current) => Math.max(0, current - 1))}>
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          {!isQuestionStep && <Button onClick={() => void saveAndNext(draftValue)} disabled={!draftValue.trim() || saving} className="min-w-32 bg-primary text-primary-foreground">
            {saving ? 'Sauvegarde…' : step === registrationFields.length - 1 ? 'Continuer' : 'Suivant'} <ArrowRight className="h-4 w-4" />
          </Button>}
          {isQuestionStep && step === totalSteps - 1 && <div className="flex items-center gap-2 text-xs text-accent"><Check className="h-4 w-4" /> Presque prêt</div>}
        </div>
        <div className="mt-7 flex items-center gap-2 text-xs text-muted-foreground"><UserRound className="h-3.5 w-3.5" /> ALI apprend ton rythme, pas tes secrets.</div>
      </div>
    </div>
  );
}