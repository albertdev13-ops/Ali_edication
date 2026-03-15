import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Award, Flame, LineChart, ShieldCheck, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { loadLocalState, type ProgressRecord } from '@/lib/local-db';

function threshold(value: number) {
  if (value <= 50) return { label: 'À revoir', detail: 'Encouragement + révision ciblée', color: 'text-amber-300' };
  if (value <= 65) return { label: 'Bronze', detail: 'Les bases commencent à tenir', color: 'text-orange-300' };
  if (value <= 80) return { label: 'Argent', detail: 'Un bon rythme prend forme', color: 'text-slate-200' };
  if (value <= 92) return { label: 'Or', detail: 'Tu maîtrises de plus en plus', color: 'text-yellow-300' };
  return { label: 'Diamant', detail: 'Solide et prêt à transmettre', color: 'text-cyan-300' };
}

export default function ProgressionPage() {
  const [items, setItems] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { void loadLocalState().then((state) => { setItems(state.progress); setLoading(false); }); }, []);
  const average = items.length ? Math.round(items.reduce((sum, item) => sum + item.percentage, 0) / items.length) : 0;
  const badge = threshold(average);

  return <div className="ali-page h-full overflow-y-auto"><div className="mx-auto max-w-6xl px-5 py-7 pb-24 sm:px-8 lg:px-12 lg:py-10">
    <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Tableau de bord</Link>
    <div className="ali-enter mt-12 flex flex-col justify-between gap-7 sm:flex-row sm:items-end"><div><p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">ALI / PROGRESSION</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">Voir le chemin.</h1><p className="mt-3 max-w-xl text-muted-foreground">Les seuils ne te jugent pas. Ils indiquent simplement la prochaine marche.</p></div><div className="flex items-center gap-3 rounded-2xl border border-accent/25 bg-accent/5 px-4 py-3"><Flame className="h-5 w-5 text-accent" /><div><p className="font-mono text-2xl text-accent">3 jours</p><p className="text-xs text-muted-foreground">streak actuel</p></div></div></div>
    <section className="mt-9 grid gap-4 lg:grid-cols-[1fr_1.35fr]"><Card className="border-secondary/25 bg-card/55"><CardHeader><CardTitle className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-secondary"><Award className="h-4 w-4" /> Niveau hebdomadaire</CardTitle></CardHeader><CardContent><div className="flex items-end gap-3"><span className={`text-5xl font-semibold ${badge.color}`}>{average}%</span><span className={`pb-1 font-mono text-sm ${badge.color}`}>{badge.label}</span></div><p className="mt-3 text-sm text-muted-foreground">{badge.detail}.</p><div className="mt-7 grid grid-cols-2 gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground sm:grid-cols-5">{['≤50 Revoir', '51 Bronze', '66 Argent', '81 Or', '93 Diamant'].map((label) => <span key={label} className="rounded-lg border border-border/60 px-2 py-2 text-center">{label}</span>)}</div></CardContent></Card><Card className="border-primary/25 bg-card/55"><CardHeader><CardTitle className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-primary"><LineChart className="h-4 w-4" /> Seuils d’examen</CardTitle></CardHeader><CardContent><div className="space-y-3">{[['0–50%', 'Encouragement + revoir une notion'], ['51–65%', 'Bronze · consolider les bases'], ['66–80%', 'Argent · pratiquer en autonomie'], ['81–92%', 'Or · expliquer à quelqu’un'], ['93–100%', 'Diamant · prêt pour le défi']].map(([range, label]) => <div key={range} className="flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-background/25 px-3 py-2 text-sm"><span className="font-mono text-xs text-primary">{range}</span><span className="text-right text-muted-foreground">{label}</span></div>)}</div></CardContent></Card></section>
    <section className="mt-10"><div className="mb-4 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-accent" /><h2 className="text-xl font-semibold">Matières suivies</h2></div>{loading ? <div className="space-y-3"><div className="h-24 animate-pulse rounded-xl bg-muted/50" /><div className="h-24 animate-pulse rounded-xl bg-muted/50" /></div> : items.length ? <div className="grid gap-3 md:grid-cols-2">{items.map((item) => { const itemBadge = threshold(item.percentage); return <div key={item.id} className="rounded-xl border border-border/60 bg-card/45 p-5"><div className="flex items-start justify-between"><div><p className="font-medium">{item.subject}</p><p className={`mt-1 text-xs ${itemBadge.color}`}>{itemBadge.label}</p></div><span className="font-mono text-primary">{item.percentage}%</span></div><Progress value={item.percentage} className="mt-5" /><p className="mt-3 text-xs text-muted-foreground">{item.note}</p></div>; })}</div> : <div className="rounded-2xl border border-dashed border-border p-12 text-center"><Sparkles className="mx-auto h-6 w-6 text-primary" /><p className="mt-3 text-sm text-muted-foreground">Aucune progression enregistrée pour l’instant. Lance une session avec ALI pour commencer.</p></div>}</section>
  </div></div>;
}