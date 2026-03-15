import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (isDismissed) return;

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-card/90 backdrop-blur-md border border-primary/30 rounded-lg shadow-[0_0_15px_rgba(0,212,255,0.15)] flex items-start gap-4 max-w-sm animate-in slide-in-from-bottom-5">
      <div className="flex-1">
        <h3 className="text-sm font-mono text-primary flex items-center gap-2 mb-1">
          <Download className="w-4 h-4" /> Install Interface
        </h3>
        <p className="text-xs text-muted-foreground">
          Install the AI Digital Human interface as a standalone application for optimal performance.
        </p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={handleInstall} className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50 text-xs font-mono">
            INSTALL
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-xs">
            DISMISS
          </Button>
        </div>
      </div>
      <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}