import { useState } from 'react';
import { useListMemory, useClearMemory, useSearchMemory, getListMemoryQueryKey, getSearchMemoryQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Brain, Search, Trash2, Cpu, Database, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function MemoryPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Decide whether to list or search based on query
  const { data: allMemory, isLoading: listLoading } = useListMemory(
    { limit: 100 }, 
    {
      query: {
        queryKey: getListMemoryQueryKey({ limit: 100 }),
        enabled: searchQuery.trim().length === 0,
      },
    }
  );
  
  const { data: searchResults, isLoading: searchLoading } = useSearchMemory(
    { q: searchQuery },
    {
      query: {
        queryKey: getSearchMemoryQueryKey({ q: searchQuery }),
        enabled: searchQuery.trim().length > 0,
      },
    }
  );

  const clearMemory = useClearMemory();
  
  const memories = searchQuery.trim().length > 0 ? searchResults : allMemory;
  const isLoading = listLoading || searchLoading;

  const handleClearMemory = () => {
    clearMemory.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMemoryQueryKey() });
        setSearchQuery('');
      }
    });
  };

  return (
    <div className="h-full flex flex-col p-6 lg:p-10 relative">
      <div className="flex items-end justify-between mb-8 relative z-10">
        <div>
          <h1 className="text-3xl font-mono font-bold text-primary flex items-center gap-3 neon-text">
            <Brain className="w-8 h-8" />
            CORE_MEMORY_BANK
          </h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm max-w-lg">
            Persistent semantic storage matrix. The AI retrieves context from this neural database.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-4 font-mono text-xs text-muted-foreground mr-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] opacity-50 uppercase">Total Vectors</span>
              <span className="text-primary text-sm">{allMemory?.length || 0}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] opacity-50 uppercase">Status</span>
              <span className="text-accent text-sm flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span> ONLINE</span>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive font-mono text-xs">
                <Trash2 className="w-4 h-4 mr-2" /> FORMAT_DB
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-popover border-destructive/30">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-mono text-destructive">WIPE MEMORY CORE?</AlertDialogTitle>
                <AlertDialogDescription className="font-mono text-xs text-muted-foreground">
                  This action will permanently delete all stored semantic vectors. The AI will lose all long-term context. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="font-mono text-xs border-border/50">CANCEL</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearMemory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs">
                  CONFIRM_WIPE
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="relative z-10 mb-6 flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Query semantic index..." 
            className="pl-9 bg-card/30 border-primary/30 focus-visible:ring-primary/50 font-mono text-sm h-10 neon-border"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 relative z-10 pr-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-48 rounded-xl glass-panel animate-pulse bg-muted/10 border-border/30"></div>
            ))}
          </div>
        ) : memories?.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground glass-panel rounded-xl mt-8">
            <Database className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-mono text-sm uppercase tracking-widest">Database_Empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
            {memories?.map(entry => (
              <div key={entry.id} className="glass-panel rounded-xl p-5 relative overflow-hidden group hover:border-primary/50 transition-colors">
                <div className="absolute top-0 right-0 p-3 flex gap-2">
                  <Badge variant="outline" className="font-mono text-[10px] border-primary/20 text-primary/70 bg-primary/5">
                    {entry.model || 'unknown'}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-[10px] border-secondary/20 text-secondary/70 bg-secondary/5 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {entry.accessCount || 0}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 mb-3 text-muted-foreground/50 font-mono text-[10px]">
                  <Cpu className="w-3 h-3" />
                  {format(new Date(entry.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                  <span className="mx-2">•</span>
                  <span>ID: {entry.id.split('-')[0]}</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-mono text-secondary mb-1 uppercase tracking-wider">Input_Vector</h4>
                    <p className="text-sm font-sans text-foreground/90 line-clamp-2 bg-background/50 p-2 rounded border border-border/30">
                      {entry.prompt}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-mono text-primary mb-1 uppercase tracking-wider">Output_Vector</h4>
                    <p className="text-sm font-sans text-muted-foreground line-clamp-3 bg-background/50 p-2 rounded border border-border/30">
                      {entry.response}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}