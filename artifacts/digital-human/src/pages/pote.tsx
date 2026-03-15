import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Check, Clipboard, Copy, Radio, Send, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createSharedChallenge, listSharedChallenges, type SharedChallenge } from '@/lib/local-db';

export default function PotePage() {
  const [challenges, setChallenges] = useState<SharedChallenge[]>([]);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [created, setCreated] = useState<SharedChallenge | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => void listSharedChallenges().then(setChallenges);
  useEffect(() => { refresh(); }, []);

  const create = async () => {
    if (!title.trim() || !subject.trim() || !question.trim() || !answer.trim()) return;
    setSaving(true);
    try {
      const next = await createSharedChallenge({ title: title.trim(), subject: subject.trim(), question: question.trim(), answer: answer.trim() });
      setCreated(next);
      setChallenges((current) => [next, ...current]);
      setTitle(''); setSubject(''); setQuestion(''); setAnswer('');
      setError(null);
    } catch {
      setError('Le stockage local ne répond pas. Le défi n’a pas été créé.');
    }
    setSaving(false);
  };

  const copyCode = async (code: string) => {
    try { await navigator.clipboard.writeText(code); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); }
  };

  return <div className="ali-page h-full overflow-y-auto"><div className="mx-auto max-w-6xl px-5 py-7 pb-24 sm:px-8 lg:px-12 lg:py-10">
    <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Tableau de bord</Link>
    <div className="ali-enter mt-12 max-w-3xl"><p className="font-mono text-xs uppercase tracking-[0.2em] text-secondary">ALI / POTE</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">Apprendre à plusieurs.</h1><p className="mt-4 text-muted-foreground">Pote est honnête dans cette première version : pas de faux chat hors ligne, pas de livraison réseau inventée.</p></div>
    <section className="mt-9 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]"><Card className="border-secondary/25 bg-card/55"><CardHeader><CardTitle className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-secondary"><UsersRound className="h-4 w-4" /> Le vrai statut</CardTitle></CardHeader><CardContent className="space-y-4 text-sm leading-6 text-muted-foreground"><div className="flex gap-3"><Radio className="mt-1 h-4 w-4 shrink-0 text-amber-300" /><p>Le chat entre appareils et la synchronisation de squad demandent un transport de proximité. Cette brique viendra avec une connexion dédiée.</p></div><div className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-accent" /><p>En attendant, crée des défis localement et partage leur code par le canal de ton choix.</p></div></CardContent></Card>
      <Card className="border-primary/25 bg-card/55"><CardHeader><CardTitle className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-primary"><Send className="h-4 w-4" /> Créer un défi local</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titre du quiz" /><Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Matière" /><Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Question" className="sm:col-span-2" /><Input value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Réponse attendue" className="sm:col-span-2" /><Button onClick={() => void create()} disabled={saving || !title.trim() || !subject.trim() || !question.trim() || !answer.trim()} className="sm:col-span-2 bg-primary text-primary-foreground">{saving ? 'Création…' : 'Générer un code de partage'} <Send className="h-4 w-4" /></Button>{error && <p className="text-xs text-amber-300 sm:col-span-2">{error}</p>}</CardContent></Card></section>
    {created && <div className="ali-enter mt-5 flex flex-col justify-between gap-3 rounded-xl border border-accent/35 bg-accent/5 p-4 sm:flex-row sm:items-center"><div><p className="text-xs text-accent">Défi enregistré dans cet appareil.</p><p className="mt-1 font-mono text-2xl tracking-widest text-foreground">{created.code}</p></div><Button onClick={() => void copyCode(created.code)} variant="outline" className="border-accent/35">{copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}{copied ? 'Copié' : 'Copier le code'}</Button></div>}
    <section className="mt-10"><div className="mb-4 flex items-center gap-2"><Clipboard className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">Défis sur cet appareil</h2></div>{challenges.length ? <div className="grid gap-3 md:grid-cols-2">{challenges.map((item) => <div key={item.id} className="rounded-xl border border-border/60 bg-card/45 p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.subject} · code {item.code}</p></div><Button size="icon" variant="ghost" onClick={() => void copyCode(item.code)} aria-label={`Copier ${item.code}`}><Copy className="h-4 w-4" /></Button></div><p className="mt-4 text-sm text-muted-foreground">{item.question}</p></div>)}</div> : <div className="rounded-2xl border border-dashed border-border p-12 text-center"><Clipboard className="mx-auto h-6 w-6 text-secondary" /><p className="mt-3 text-sm text-muted-foreground">Aucun défi ici. Ton premier code apparaîtra après la création.</p></div>}</section>
  </div></div>;
}