import { useState } from 'react';
import { useListVercelProjects, useDeployToVercel, getListVercelProjectsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Zap, Rocket, Plus, Trash2, Globe, ExternalLink, Loader2, Server } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function VercelPage() {
  const queryClient = useQueryClient();
  const { data: projects, isLoading: projectsLoading } = useListVercelProjects();
  const deploy = useDeployToVercel();

  const [projectName, setProjectName] = useState('');
  const [files, setFiles] = useState([{ file: 'index.html', data: '<h1>Hello World</h1>' }]);

  const handleDeploy = () => {
    if (!projectName || files.some(f => !f.file || !f.data)) return;
    deploy.mutate({
      data: {
        name: projectName,
        files: files
      }
    }, {
      onSuccess: () => {
        setProjectName('');
        setFiles([{ file: 'index.html', data: '<h1>Hello World</h1>' }]);
        queryClient.invalidateQueries({ queryKey: getListVercelProjectsQueryKey() });
      }
    });
  };

  const addFile = () => {
    setFiles([...files, { file: '', data: '' }]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const updateFile = (index: number, field: 'file' | 'data', value: string) => {
    const updated = [...files];
    updated[index][field] = value;
    setFiles(updated);
  };

  return (
    <div className="h-full flex flex-col p-6 lg:p-10 relative">
      <div className="flex items-end justify-between mb-8 relative z-10">
        <div>
          <h1 className="text-3xl font-mono font-bold text-foreground flex items-center gap-3">
            <Zap className="w-8 h-8 text-primary neon-text" />
            DEPLOYMENT_HUB
          </h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm max-w-lg">
            Vercel deployment matrix. Launch web applications directly to the edge network.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 flex-1 overflow-hidden">
        
        {/* Left Col: Deploy Form */}
        <div className="lg:col-span-5 flex flex-col h-full">
          <Card className="glass-panel border-primary/20 h-full flex flex-col">
            <CardHeader className="pb-4 border-b border-border/50 bg-background/50">
              <CardTitle className="font-mono text-lg text-primary flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                NEW_DEPLOYMENT
              </CardTitle>
              <CardDescription className="font-mono text-xs">Configure payload for edge network launch.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-6 flex flex-col overflow-hidden">
              <div className="space-y-2 mb-6 shrink-0">
                <Label className="font-mono text-xs text-muted-foreground uppercase">Project ID</Label>
                <Input 
                  value={projectName} 
                  onChange={e => setProjectName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} 
                  placeholder="my-deployment-app"
                  className="font-mono bg-background/50 border-primary/30 focus-visible:ring-primary/50 neon-border"
                />
              </div>
              
              <div className="flex items-center justify-between mb-2 shrink-0">
                <Label className="font-mono text-xs text-muted-foreground uppercase">Payload Files</Label>
                <Button variant="ghost" size="sm" onClick={addFile} className="h-6 px-2 text-xs font-mono text-primary hover:bg-primary/10 hover:text-primary">
                  <Plus className="w-3 h-3 mr-1" /> ADD_FILE
                </Button>
              </div>

              <ScrollArea className="flex-1 pr-4 mb-4 border border-border/30 rounded-lg p-2 bg-background/30">
                <div className="space-y-4">
                  {files.map((f, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-card/50 border border-border relative">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeFile(idx)}
                        disabled={files.length === 1}
                        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                      
                      <div className="space-y-3 mr-6">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground uppercase font-mono">File Path</Label>
                          <Input 
                            value={f.file}
                            onChange={e => updateFile(idx, 'file', e.target.value)}
                            placeholder="e.g. index.html or src/app.js"
                            className="h-8 font-mono text-xs bg-background/80 border-border"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground uppercase font-mono">Content</Label>
                          <Textarea 
                            value={f.data}
                            onChange={e => updateFile(idx, 'data', e.target.value)}
                            placeholder="File content..."
                            className="font-mono text-xs min-h-[120px] bg-background/80 border-border resize-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Button 
                onClick={handleDeploy} 
                disabled={deploy.isPending || !projectName || files.some(f => !f.file || !f.data)}
                className="w-full shrink-0 font-mono text-xs shadow-[0_0_15px_hsl(var(--primary)/0.3)] bg-primary hover:bg-primary/90 text-primary-foreground h-12"
              >
                {deploy.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Rocket className="w-5 h-5 mr-2" />}
                INITIATE_LAUNCH_SEQUENCE
              </Button>
              {deploy.isError && (
                <p className="mt-2 text-xs font-mono text-destructive text-center">Deploy failed. Check logs.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Projects List */}
        <div className="lg:col-span-7 flex flex-col h-full bg-card/30 border border-border/50 rounded-xl overflow-hidden glass-panel">
          <div className="p-4 border-b border-border/50 bg-background/50 flex justify-between items-center">
            <h3 className="font-mono text-sm uppercase tracking-widest flex items-center gap-2">
              <Server className="w-4 h-4 text-secondary" /> ACTIVE_DEPLOYMENTS
            </h3>
            <Badge variant="outline" className="font-mono text-[10px] bg-secondary/10 text-secondary border-secondary/30">
              VERCEL_EDGE
            </Badge>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            {projectsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-20 bg-muted/20 animate-pulse rounded-lg border border-border/30" />
                ))}
              </div>
            ) : projects?.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <Globe className="w-12 h-12 mb-4" />
                <p className="font-mono text-xs uppercase tracking-widest">NO_PROJECTS_FOUND</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 pb-12">
                {projects?.map((project) => (
                  <div key={project.id} className="p-5 rounded-lg bg-background/60 border border-border hover:border-secondary/50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-md bg-secondary/10 flex items-center justify-center border border-secondary/20">
                        <Globe className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <h4 className="font-mono text-sm text-foreground font-bold">{project.name}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-mono">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                            ONLINE
                          </span>
                          <span>•</span>
                          <span>{project.framework || 'unknown'}</span>
                          <span>•</span>
                          <span className="text-[10px] opacity-70">
                            {format(new Date(project.createdAt), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {project.url && (
                      <Button asChild variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[10px] border-secondary/50 text-secondary hover:bg-secondary/10 hover:text-secondary">
                        <a href={`https://${project.url}`} target="_blank" rel="noopener noreferrer">
                          VISIT <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}