import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4 text-center max-w-md p-8 glass-panel neon-border rounded-xl">
        <AlertCircle className="w-16 h-16 text-destructive mb-2" />
        <h1 className="text-4xl font-mono font-bold text-destructive neon-text tracking-widest uppercase">
          404_ERR
        </h1>
        <p className="text-sm font-mono text-muted-foreground uppercase mb-4 tracking-widest">
          Matrix Sector Not Found
        </p>
        <Link href="/" className="px-6 py-2 bg-primary/20 text-primary border border-primary hover:bg-primary hover:text-primary-foreground font-mono text-xs shadow-[0_0_10px_hsl(var(--primary)/0.2)] transition-all">
          RETURN_TO_CORE
        </Link>
      </div>
    </div>
  );
}