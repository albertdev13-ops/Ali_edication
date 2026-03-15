import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock3, GraduationCap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalOnboarding } from '@/hooks/use-local-onboarding';

const questions = [
  {
    key: 'course',
    label: 'Quel terrain veux-tu explorer avec ALI ?',
    hint: 'Choisis une matière. On pourra changer de piste plus tard.',
    options: ['Mathématiques', 'Sciences', 'Français', 'Histoire', 'Géographie', 'Anglais', 'Informatique', 'Économie', 'Physique', 'Chimie', 'Biologie', 'Culture générale'],
  },
  {
    key: 'teacherPlan',
    label: 'Quel plan de prof te convient ?',
    hint: 'ALI adapte ses explications à ta façon de comprendre.',
    options: ['Comprendre puis pratiquer', 'Réviser avec des quiz', 'Avancer chapitre par chapitre'],
  },
  {
    key: 'availableTime',
    label: 'Combien de temps as-tu aujourd’hui ?',
    hint: 'Même dix minutes peuvent faire avancer une idée.',
    options: ['10 minutes', '25 minutes', '45 minutes', 'Une heure ou plus'],
  },
  {
    key: 'studyTime',
    label: 'Quand veux-tu étudier ?',
    hint: 'Pas de pression : on choisit un rythme réaliste.',
    options: ['Avant les cours', 'Après les cours', 'Le soir', 'Quand je suis disponible'],
  },
  {
    key: 'frequency',
    label: 'À quelle fréquence veux-tu revenir ?',
    hint: 'La régularité compte plus que la vitesse.',
    options: ['Chaque jour', '3 fois par semaine', 'Le week-end', 'Selon mes examens'],
  },
] as const;

const subjectCodes = ['MA', 'SC', 'FR', 'HI', 'GE', 'AN', 'IN', 'EC', 'PH', 'CH', 'BI', 'CG'];

export default function ProfSetupPage() {
  const [, setLocation] = useLocation();
  const { profSetup, loading, storageAvailable, saveProfSetup, error } = useLocalOnboarding();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (loading) {
    return (
      <div className="ali-page flex min-h-[100dvh] items-center justify-center px-5" data-testid="status-prof-setup-loading">
        <div className="w-full max-w-sm space-y-3">
          <div className="h-3 w-24 animate-pulse rounded-full bg-primary/20" />
          <div className="h-10 w-4/5 animate-pulse rounded-xl bg-muted" />
          <div className="h-32 animate-pulse rounded-2xl bg-muted/70" />
        </div>
      </div>
    );
  }

  const question = questions[step];
  const value = profSetup[question.key];
  const isCourseStep = step === 0;
  const isLastStep = step === questions.length - 1;

  const choose = async (answer: string) => {
    setSaving(true);
    try {
      await saveProfSetup({ [question.key]: answer, completed: isLastStep });
      if (isLastStep) {
        setCompleted(true);
      } else {
        setStep((current) => current + 1);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="ali-page min-h-[100dvh] overflow-y-auto">
      <div className="mx-auto min-h-[100dvh] w-full max-w-6xl px-5 py-5 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
        <header className="flex items-center justify-between">
          <Link
            href="/dashboard"
            data-testid="link-prof-setup-dashboard"
            className="inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Tableau de bord
          </Link>
          <span data-testid="status-prof-storage" className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-accent/80">
            {storageAvailable ? 'Sauvegarde instantanée' : 'Mode session'}
          </span>
        </header>

        <div className="grid gap-10 pb-10 pt-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-20 lg:pt-20">
          <section className="ali-enter max-w-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-secondary/30 bg-secondary/10 text-secondary shadow-[0_12px_30px_rgba(241,154,130,0.12)]">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-xs font-bold tracking-[0.22em] text-secondary">MODE PROF</p>
                <p className="mt-1 text-xs text-muted-foreground">Une courte boussole avant la première leçon.</p>
              </div>
            </div>

            <p className="mt-12 font-mono text-[11px] uppercase tracking-[0.2em] text-primary/70">Ton parcours avec ALI</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-foreground sm:text-6xl">
              Apprendre, mais à ta manière.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              Quelques réponses suffisent pour que Zack prépare une entrée en matière qui te ressemble.
            </p>

            <div className="mt-10 hidden rounded-3xl border border-primary/15 bg-primary/[0.035] p-5 lg:block">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground/90">
                <Sparkles className="h-4 w-4 text-primary" /> Ce que tu vas obtenir
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-primary" />Une première question pour entrer dans le sujet.</li>
                <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-secondary" />Des explications ajustées à ton rythme.</li>
                <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-accent" />Une leçon qui se poursuit directement dans le chat.</li>
              </ul>
            </div>
          </section>

          <section className="ali-enter ali-stagger-1 rounded-[1.75rem] border border-border/80 bg-card/75 p-5 shadow-[0_24px_80px_rgba(6,9,20,0.26)] backdrop-blur sm:p-7 lg:p-9" aria-label="Configuration de la leçon">
            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 text-primary">
                  <BookOpen className="h-4 w-4" />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em]">Réglage {String(step + 1).padStart(2, '0')}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{question.hint}</p>
              </div>
              <span className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">{step + 1} / {questions.length}</span>
            </div>

            <div className="mt-5 flex gap-1.5" aria-label="Progression de la configuration">
              {questions.map((item, index) => (
                <span
                  key={item.key}
                  data-testid={`progress-prof-step-${index + 1}`}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${index <= step ? 'bg-primary' : 'bg-muted'}`}
                />
              ))}
            </div>

            {completed ? (
              <div className="ali-enter py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-accent/30 bg-accent/10 text-accent">
                  <Check className="h-7 w-7" />
                </div>
                <p className="mt-7 font-mono text-[11px] uppercase tracking-[0.22em] text-accent">Parcours prêt</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">On ouvre ta leçon ?</h2>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  ALI a enregistré tes préférences. Zack t’attend dans le chat pour démarrer avec {profSetup.course || 'ton sujet'}.
                </p>
                <Button
                  type="button"
                  data-testid="button-start-ali-lesson"
                  className="mt-8 h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-[0_12px_28px_rgba(96,225,255,0.16)] transition-transform hover:-translate-y-0.5 hover:bg-primary/90"
                  onClick={() => setLocation('/chat')}
                >
                  Ouvrir ma leçon avec ALI <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <h2 className="mt-8 max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">{question.label}</h2>
                <div className={`mt-8 grid gap-3 ${isCourseStep ? 'grid-cols-2 sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                  {question.options.map((option, index) => (
                    <button
                      key={option}
                      type="button"
                      disabled={saving}
                      data-testid={`button-prof-option-${step + 1}-${index + 1}`}
                      aria-pressed={value === option}
                      onClick={() => void choose(option)}
                      className={`group relative flex min-h-[4.5rem] items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/55 hover:bg-primary/[0.06] disabled:cursor-wait disabled:opacity-60 ${value === option ? 'border-primary bg-primary/[0.09] shadow-[0_10px_26px_rgba(96,225,255,0.08)]' : 'border-border/75 bg-background/25'}`}
                    >
                      <span className="min-w-0">
                        {isCourseStep && <span className="mb-1 block font-mono text-[10px] tracking-[0.16em] text-primary/60">{subjectCodes[index]}</span>}
                        <span className="block text-sm font-medium leading-snug">{option}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 flex-none text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </button>
                  ))}
                </div>
                {value && (
                  <p data-testid="status-prof-answer-saved" className="mt-5 flex items-center gap-2 text-xs text-accent">
                    <Check className="h-4 w-4" /> Réponse enregistrée localement{saving ? '…' : '.'}
                  </p>
                )}
              </>
            )}

            {error && <p data-testid="status-prof-setup-error" className="mt-4 text-xs text-amber-300">{error}</p>}

            <div className="mt-8 flex items-center gap-2 border-t border-border/60 pt-5 text-xs text-muted-foreground">
              <Clock3 className="h-4 w-4 text-primary" /> ALI ajuste le rythme, pas la pression.
              {!completed && <span className="ml-auto font-mono text-[10px] text-muted-foreground/65">{isCourseStep ? '12 sujets' : 'Choix libre'}</span>}
            </div>
          </section>
        </div>

        {!completed && (
          <div className="flex items-center gap-2 lg:pl-[41%]">
            <Button
              type="button"
              variant="ghost"
              data-testid="button-prof-previous"
              disabled={step === 0 || saving}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              className="text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Question précédente
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}