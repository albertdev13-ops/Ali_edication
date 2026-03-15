import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Activity, ArrowUpRight, BookOpen, CalendarDays, CheckCircle2, CircleDashed, GraduationCap, Wifi, WifiOff, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLocalOnboarding } from '@/hooks/use-local-onboarding';
import { loadLocalState, type ProgressRecord } from '@/lib/local-db';

export default function DashboardPage() {
  const { profile, appState, profSetup, loading, storageAvailable } = useLocalOnboarding();
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine);

  useEffect(() => {
    const refresh = () => void loadLocalState().then((state) => setProgress(state.progress));
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    refresh();
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  if (loading) return <div className="ali-page h-full p-6 lg:p-12"><div className="mx-auto max-w-6xl space-y-4"><div className="h-10 w-72 animate-pulse rounded bg-muted" /><div className="h-36 animate-pulse rounded-2xl bg-muted/60" /><div className="grid gap-4 md:grid-cols-3"><div className="h-32 animate-pulse rounded-2xl bg-muted/50" /><div className="h-32 animate-pulse rounded-2xl bg-muted/50" /><div className="h-32 animate-pulse rounded-2xl bg-muted/50" /></div></div></div>;
  const displayName = profile.firstName || 'Boss';
  const average = progress.length ? Math.round(progress.reduce((sum, item) => sum + item.percentage, 0) / progress.length) : 0;

  return (
    <div className="ali-page h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-5 py-7 pb-24 sm:px-8 lg:px-12 lg:py-10">
        <header className="ali-enter flex flex-col gap-6 border-b border-border/60 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">ALI / TON COMMAND CENTER</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">Bonjour, {displayName}.</h1><p className="mt-3 text-muted-foreground">On garde le cap doucement. Une bonne session compte.</p></div>
          <div className={`flex items-center gap-2 self-start rounded-full border px-3 py-2 text-xs ${online ? 'border-accent/30 text-accent' : 'border-amber-400/30 text-amber-300'}`}><span className={`h-2 w-2 rounded-full ${online ? 'bg-accent' : 'bg-amber-300'}`} />{online ? <><Wifi className="h-3.5 w-3.5" /> En ligne</> : <><WifiOff className="h-3.5 w-3.5" /> Hors ligne</>}<span className="text-muted-foreground">· {storageAvailable ? 'local prêt' : 'session'}</span></div>
        </header>

        <section className="ali-enter ali-stagger-1 mt-8 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Card className="overflow-hidden border-primary/25 bg-card/65"><CardContent className="relative p-6 sm:p-8"><div className="absolute -right-14 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" /><div className="relative"><div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary"><Zap className="h-4 w-4" /> Prochaine impulsion</div><h2 className="mt-5 text-2xl font-semibold">Ton espace d’étude est prêt.</h2><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{profSetup.completed ? `${profSetup.course || 'Ton cours'} · ${profSetup.availableTime || 'à ton rythme'} · ${profSetup.frequency || 'quand tu veux'}.` : 'Configure Mode Prof pour donner à ALI un rythme qui te ressemble.'}</p><Button asChild className="mt-6 bg-primary text-primary-foreground"><Link href="/prof-setup">{profSetup.completed ? 'Ajuster Mode Prof' : 'Lancer Mode Prof'} <ArrowUpRight className="h-4 w-4" /></Link></Button></div></CardContent></Card>
          <Card className="border-secondary/25 bg-card/60"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-secondary"><CalendarDays className="h-4 w-4" /> Aujourd’hui</CardTitle></CardHeader><CardContent>{appState.schedule.length || profSetup.completed ? <div className="rounded-xl border border-border/60 bg-background/35 p-4"><p className="font-medium">{appState.schedule[0] || profSetup.course || 'Session libre'}</p><p className="mt-1 text-xs text-muted-foreground">{profSetup.studyTime || 'Quand tu es disponible'} · {profSetup.availableTime || '25 minutes'}</p><span className="mt-4 inline-flex items-center gap-2 text-xs text-accent"><CircleDashed className="h-3.5 w-3.5" /> Prêt à commencer</span></div> : <div className="py-4 text-sm text-muted-foreground"><p>Ton horaire apparaîtra ici après Mode Prof.</p><Link href="/prof-setup" className="mt-3 inline-flex text-primary hover:underline">Configurer maintenant →</Link></div>}</CardContent></Card>
        </section>

        <section className="ali-enter ali-stagger-2 mt-4 grid gap-4 md:grid-cols-3">
          <Card className="border-border/60 bg-card/45"><CardHeader className="pb-2"><CardTitle className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-muted-foreground">Progression <Activity className="h-4 w-4 text-primary" /></CardTitle></CardHeader><CardContent><p className="text-4xl font-semibold text-primary">{average}<span className="text-xl text-muted-foreground">%</span></p><p className="mt-1 text-xs text-muted-foreground">moyenne locale de tes matières</p></CardContent></Card>
          <Card className="border-border/60 bg-card/45"><CardHeader className="pb-2"><CardTitle className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-muted-foreground">Régularité <CheckCircle2 className="h-4 w-4 text-accent" /></CardTitle></CardHeader><CardContent><p className="text-4xl font-semibold text-accent">3<span className="text-xl text-muted-foreground"> jours</span></p><p className="mt-1 text-xs text-muted-foreground">streak de départ, à protéger</p></CardContent></Card>
          <Card className="border-border/60 bg-card/45"><CardHeader className="pb-2"><CardTitle className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-muted-foreground">Pote <BookOpen className="h-4 w-4 text-secondary" /></CardTitle></CardHeader><CardContent><p className="text-xl font-semibold">Défi local</p><p className="mt-1 text-xs text-muted-foreground">Partage un quiz sur cet appareil.</p><Button asChild variant="link" className="mt-2 h-auto p-0 text-secondary"><Link href="/pote">Ouvrir Pote →</Link></Button></CardContent></Card>
        </section>

        <section className="ali-enter ali-stagger-3 mt-10"><div className="mb-4 flex items-end justify-between"><div><p className="font-mono text-xs uppercase tracking-widest text-primary">Signal de progression</p><h2 className="mt-2 text-2xl font-semibold">Tes matières</h2></div><Link href="/progression" className="text-sm text-muted-foreground hover:text-primary">Voir le détail →</Link></div>{progress.length ? <div className="grid gap-3">{progress.map((item) => <div key={item.id} className="rounded-xl border border-border/60 bg-card/40 p-4"><div className="flex items-center justify-between gap-4"><div><p className="font-medium">{item.subject}</p><p className="mt-1 text-xs text-muted-foreground">{item.note}</p></div><span className="font-mono text-sm text-primary">{item.percentage}%</span></div><Progress value={item.percentage} className="mt-4 bg-primary/10" /></div>)}</div> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Tes premières matières apparaîtront ici.</div>}</section>
      </div>
    </div>
  );
}