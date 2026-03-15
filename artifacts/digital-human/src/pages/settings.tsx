import { useState, useEffect } from 'react';
import { useGetSettings, useUpdateSettings, useListVoices, getGetSettingsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Save, Volume2, Cpu, Type, Server, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: settings, isLoading: settingsLoading } = useGetSettings();
  const { data: voices, isLoading: voicesLoading } = useListVoices();
  const updateSettings = useUpdateSettings();

  const [formData, setFormData] = useState({
    defaultModel: 'groq' as 'groq' | 'gemini',
    defaultVoiceId: '',
    streamingEnabled: true,
    autoSave: true,
    systemPrompt: '',
    fontSize: 'medium' as 'small' | 'medium' | 'large'
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        defaultModel: (settings.defaultModel as 'groq' | 'gemini') || 'groq',
        defaultVoiceId: settings.defaultVoiceId || '',
        streamingEnabled: settings.streamingEnabled ?? true,
        autoSave: settings.autoSave ?? true,
        systemPrompt: settings.systemPrompt || '',
        fontSize: (settings.fontSize as 'small' | 'medium' | 'large') || 'medium'
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({ data: formData }, {
      onSuccess: () => {
        toast({
          title: "SETTINGS_UPDATED",
          description: "System parameters have been successfully applied.",
        });
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      },
      onError: () => {
        toast({
          title: "UPDATE_FAILED",
          description: "An error occurred saving configuration.",
          variant: "destructive"
        });
      }
    });
  };

  if (settingsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 opacity-50">
          <SettingsIcon className="w-12 h-12 animate-spin-slow text-primary" />
          <p className="font-mono text-sm tracking-widest uppercase">Loading_Config...</p>
        </div>
      </div>
    );
  }

  const playPreview = (voiceId: string) => {
    const voice = voices?.find(v => v.id === voiceId);
    if (voice && voice.preview) {
      const audio = new Audio(voice.preview);
      audio.play();
    } else {
      toast({ title: "No preview available for this voice" });
    }
  };

  return (
    <div className="h-full flex flex-col p-6 lg:p-10 relative">
      <div className="flex items-end justify-between mb-8 relative z-10 shrink-0">
        <div>
          <h1 className="text-3xl font-mono font-bold text-foreground flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-muted-foreground" />
            SYSTEM_CONFIG
          </h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm max-w-lg">
            Core parameters for Humain Numérique operational matrix.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={updateSettings.isPending}
          className="font-mono text-xs shadow-[0_0_15px_hsl(var(--primary)/0.3)] bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
        >
          {updateSettings.isPending ? <RotateCcw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          APPLY_CHANGES
        </Button>
      </div>

      <ScrollArea className="flex-1 -mx-6 px-6">
        <div className="max-w-4xl mx-auto space-y-10 pb-20">
          
          {/* Model Selection */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <Cpu className="w-4 h-4 text-primary" />
              <h2 className="font-mono text-sm uppercase tracking-widest text-primary">Inference Engine</h2>
            </div>
            
            <RadioGroup 
              value={formData.defaultModel} 
              onValueChange={(val) => setFormData({...formData, defaultModel: val as any})}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Label 
                htmlFor="groq" 
                className={cn(
                  "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer glass-panel transition-all",
                  formData.defaultModel === 'groq' ? "neon-border bg-primary/5" : ""
                )}
              >
                <RadioGroupItem value="groq" id="groq" className="sr-only" />
                <Server className="mb-3 h-6 w-6" />
                <span className="font-mono font-bold">GROQ_LPU</span>
                <span className="font-sans text-xs text-muted-foreground mt-1">Ultra-low latency inference</span>
              </Label>
              <Label 
                htmlFor="gemini" 
                className={cn(
                  "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-secondary [&:has([data-state=checked])]:border-secondary cursor-pointer glass-panel transition-all",
                  formData.defaultModel === 'gemini' ? "violet-neon-border bg-secondary/5" : ""
                )}
              >
                <RadioGroupItem value="gemini" id="gemini" className="sr-only" />
                <Server className="mb-3 h-6 w-6" />
                <span className="font-mono font-bold">GEMINI_PRO</span>
                <span className="font-sans text-xs text-muted-foreground mt-1">Advanced reasoning capabilities</span>
              </Label>
            </RadioGroup>
          </section>

          {/* Voices */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <Volume2 className="w-4 h-4 text-secondary" />
              <h2 className="font-mono text-sm uppercase tracking-widest text-secondary">Vocal Synthesis</h2>
            </div>
            
            {voicesLoading ? (
              <div className="h-32 bg-muted/20 animate-pulse rounded-xl border border-border/30" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {voices?.map((voice) => (
                  <div 
                    key={voice.id}
                    onClick={() => setFormData({...formData, defaultVoiceId: voice.id})}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between glass-panel",
                      formData.defaultVoiceId === voice.id 
                        ? "border-secondary/50 bg-secondary/10 shadow-[0_0_15px_hsl(var(--secondary)/0.15)]" 
                        : "border-border/50 hover:border-secondary/30 bg-background/50"
                    )}
                  >
                    <div>
                      <h4 className="font-mono text-sm font-bold flex items-center gap-2">
                        {voice.name}
                        <Badge variant="outline" className="text-[9px] h-4 py-0 uppercase bg-muted/30 border-muted">
                          {voice.language} - {voice.gender}
                        </Badge>
                      </h4>
                      {voice.description && (
                        <p className="text-xs text-muted-foreground mt-1">{voice.description}</p>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-secondary hover:text-secondary-foreground hover:bg-secondary shrink-0 ml-4 z-10 relative"
                      onClick={(e) => {
                        e.stopPropagation();
                        playPreview(voice.id);
                      }}
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* System Prompt */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <Type className="w-4 h-4 text-accent" />
              <h2 className="font-mono text-sm uppercase tracking-widest text-accent">Core Directive (System Prompt)</h2>
            </div>
            <Textarea 
              value={formData.systemPrompt}
              onChange={e => setFormData({...formData, systemPrompt: e.target.value})}
              placeholder="You are an advanced digital human assistant..."
              className="font-mono text-sm min-h-[150px] bg-background/50 border-border focus-visible:ring-accent/50 glass-panel"
            />
          </section>

          {/* Display & Behavior */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <SettingsIcon className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-mono text-sm uppercase tracking-widest text-muted-foreground">Behavioral Toggles</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="glass-panel border-border/50 bg-background/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-mono text-foreground">Real-time Streaming</Label>
                    <p className="text-[10px] font-sans text-muted-foreground">Tokens arrive continuously over SSE.</p>
                  </div>
                  <Switch 
                    checked={formData.streamingEnabled}
                    onCheckedChange={val => setFormData({...formData, streamingEnabled: val})}
                    className="data-[state=checked]:bg-primary"
                  />
                </CardContent>
              </Card>

              <Card className="glass-panel border-border/50 bg-background/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-mono text-foreground">Auto-Save Context</Label>
                    <p className="text-[10px] font-sans text-muted-foreground">Save conversation states automatically.</p>
                  </div>
                  <Switch 
                    checked={formData.autoSave}
                    onCheckedChange={val => setFormData({...formData, autoSave: val})}
                    className="data-[state=checked]:bg-secondary"
                  />
                </CardContent>
              </Card>

              <Card className="glass-panel border-border/50 bg-background/30 md:col-span-2">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-mono text-foreground">Interface Font Scale</Label>
                    <p className="text-[10px] font-sans text-muted-foreground">Adjust text rendering scale.</p>
                  </div>
                  <div className="flex bg-muted/30 p-1 rounded-lg border border-border/50">
                    {['small', 'medium', 'large'].map((size) => (
                      <Button
                        key={size}
                        variant={formData.fontSize === size ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "h-7 px-3 text-xs font-mono capitalize",
                          formData.fontSize === size ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setFormData({...formData, fontSize: size as any})}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

        </div>
      </ScrollArea>
    </div>
  );
}