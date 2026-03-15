import { useState } from 'react';
import { useGetGithubUser, useListGithubRepos, useCreateGithubRepo, getListGithubReposQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Github, Star, GitBranch, FolderGit2, Plus, Lock, Globe, Loader2, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function GithubPage() {
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useGetGithubUser();
  const { data: repos, isLoading: reposLoading } = useListGithubRepos();
  const createRepo = useCreateGithubRepo();

  const [search, setSearch] = useState('');
  
  // New Repo Form
  const [repoName, setRepoName] = useState('');
  const [repoDesc, setRepoDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const filteredRepos = repos?.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreateRepo = () => {
    if (!repoName) return;
    createRepo.mutate({
      data: {
        name: repoName,
        description: repoDesc,
        private: isPrivate,
        autoInit: true
      }
    }, {
      onSuccess: () => {
        setRepoName('');
        setRepoDesc('');
        setIsPrivate(false);
        queryClient.invalidateQueries({ queryKey: getListGithubReposQueryKey() });
      }
    });
  };

  return (
    <div className="h-full flex flex-col p-6 lg:p-10 relative">
      <div className="flex items-end justify-between mb-8 relative z-10">
        <div>
          <h1 className="text-3xl font-mono font-bold text-foreground flex items-center gap-3">
            <Github className="w-8 h-8" />
            SOURCE_CONTROL
          </h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm max-w-lg">
            GitHub integration matrix. Manage repositories and track source code artifacts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 flex-1 overflow-hidden">
        {/* Left Col: User & Create */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-8">
          
          {/* User Card */}
          <Card className="glass-panel border-border/50 shrink-0">
            <CardContent className="p-6">
              {userLoading ? (
                <div className="flex items-center gap-4 animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-muted/20" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted/20 rounded w-3/4" />
                    <div className="h-3 bg-muted/20 rounded w-1/2" />
                  </div>
                </div>
              ) : user ? (
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/30 neon-border p-0.5">
                    <img src={user.avatarUrl} alt={user.login} className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-foreground truncate">{user.name || user.login}</h2>
                    <p className="text-sm font-mono text-muted-foreground truncate">@{user.login}</p>
                    <div className="flex gap-3 mt-3">
                      <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                        <GitBranch className="w-3 h-3 text-primary" /> {user.publicRepos} Repos
                      </div>
                      <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                        <Star className="w-3 h-3 text-secondary" /> {user.followers} Followers
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm font-mono text-muted-foreground py-4">
                  GitHub account not connected.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Repo Card */}
          <Card className="glass-panel border-border/50 flex-1 flex flex-col min-h-[400px]">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="font-mono text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                INIT_REPOSITORY
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col gap-5 flex-1">
              <div className="space-y-2">
                <Label className="font-mono text-xs text-muted-foreground uppercase">Repository Name</Label>
                <Input 
                  value={repoName} 
                  onChange={e => setRepoName(e.target.value.replace(/[^a-zA-Z0-9-_.-]/g, ''))} 
                  placeholder="my-awesome-project"
                  className="font-mono bg-background/50 border-border focus-visible:ring-primary/50"
                />
              </div>
              
              <div className="space-y-2 flex-1 flex flex-col">
                <Label className="font-mono text-xs text-muted-foreground uppercase">Description (Optional)</Label>
                <Textarea 
                  value={repoDesc} 
                  onChange={e => setRepoDesc(e.target.value)} 
                  placeholder="What is this repository for?"
                  className="font-mono text-sm resize-none flex-1 bg-background/50 border-border focus-visible:ring-primary/50"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-md border border-border/50 bg-background/30">
                <div className="space-y-0.5">
                  <Label className="font-mono text-sm flex items-center gap-2">
                    {isPrivate ? <Lock className="w-3.5 h-3.5 text-secondary" /> : <Globe className="w-3.5 h-3.5 text-primary" />}
                    {isPrivate ? 'Private' : 'Public'}
                  </Label>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {isPrivate ? 'Only you can see this repository.' : 'Anyone on the internet can see this.'}
                  </p>
                </div>
                <Switch 
                  checked={isPrivate} 
                  onCheckedChange={setIsPrivate} 
                  className="data-[state=checked]:bg-secondary"
                />
              </div>

              <Button 
                onClick={handleCreateRepo} 
                disabled={createRepo.isPending || !repoName}
                className="w-full font-mono text-xs bg-foreground text-background hover:bg-foreground/90 mt-2"
              >
                {createRepo.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FolderGit2 className="w-4 h-4 mr-2" />}
                CREATE_REPO
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Repos List */}
        <div className="lg:col-span-8 flex flex-col h-full bg-card/30 border border-border/50 rounded-xl overflow-hidden glass-panel">
          <div className="p-4 border-b border-border/50 flex items-center justify-between gap-4 bg-background/50">
            <h3 className="font-mono text-sm uppercase tracking-widest flex items-center gap-2 shrink-0">
              <GitBranch className="w-4 h-4" /> REPOSITORY_INDEX
            </h3>
            <Input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter repositories..."
              className="max-w-xs h-8 font-mono text-xs bg-background/50"
            />
          </div>
          
          <ScrollArea className="flex-1 p-4">
            {reposLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-lg border border-border/30" />
                ))}
              </div>
            ) : filteredRepos?.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <Github className="w-8 h-8 mb-2" />
                <p className="font-mono text-xs uppercase tracking-widest">NO_REPOS_FOUND</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
                {filteredRepos?.map((repo) => (
                  <a 
                    key={repo.id} 
                    href={repo.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-5 rounded-lg bg-background/60 border border-border hover:border-primary/50 transition-colors group flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-mono text-sm text-primary font-bold truncate pr-4 group-hover:underline flex items-center gap-2">
                        {repo.private ? <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <FolderGit2 className="w-3.5 h-3.5 shrink-0" />}
                        {repo.name}
                      </h4>
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                    
                    <p className="text-xs text-muted-foreground font-sans line-clamp-2 mb-4 flex-1">
                      {repo.description || <span className="italic opacity-50">No description provided</span>}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/30">
                      <div className="flex items-center gap-3">
                        {repo.language && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-secondary"></div>
                            <span className="text-[10px] font-mono text-muted-foreground">{repo.language}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] font-mono text-muted-foreground">{repo.stars || 0}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground/50">
                        {format(new Date(repo.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}