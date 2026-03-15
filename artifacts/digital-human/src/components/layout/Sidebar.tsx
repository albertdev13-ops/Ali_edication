import { Link, useLocation } from 'wouter';
import { MessageSquare, Brain, FileArchive, Github, Zap, Settings, LayoutDashboard, GraduationCap, LineChart, UsersRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const NAV_ITEMS = [
  { icon: LayoutDashboard, path: '/dashboard', label: 'Tableau de bord ALI' },
  { icon: GraduationCap, path: '/prof-setup', label: 'Mode Prof' },
  { icon: LineChart, path: '/progression', label: 'Progression' },
  { icon: UsersRound, path: '/pote', label: 'Pote' },
  { icon: MessageSquare, path: '/', label: 'Chat Interface' },
  { icon: Brain, path: '/memory', label: 'Core Memory' },
  { icon: FileArchive, path: '/files', label: 'File System' },
  { icon: Github, path: '/github', label: 'Source Control' },
  { icon: Zap, path: '/vercel', label: 'Deployments' },
  { icon: Settings, path: '/settings', label: 'Configuration' },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-16 lg:w-20 h-full flex flex-col items-center py-6 bg-sidebar border-r border-sidebar-border z-50 flex-shrink-0 relative">
      {/* Brand logo / indicator */}
      <div className="mb-8 relative group">
        <div className="w-10 h-10 rounded-xl bg-background border border-primary/30 flex items-center justify-center neon-border">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_2px_hsl(var(--primary))]"></div>
        </div>
      </div>

      <nav className="flex-1 w-full flex flex-col items-center gap-6 mt-4">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link href={item.path} className="relative group p-3 flex items-center justify-center outline-none">
                  {isActive && (
                    <div className="absolute inset-0 bg-primary/10 rounded-lg neon-border z-0"></div>
                  )}
                  <Icon 
                    className={cn(
                      "w-6 h-6 relative z-10 transition-all duration-300",
                      isActive ? "text-primary filter drop-shadow-[0_0_5px_hsl(var(--primary))]" : "text-muted-foreground group-hover:text-primary/70"
                    )} 
                  />
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_8px_1px_hsl(var(--primary))]"></div>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover border-primary/30 text-primary neon-text font-mono text-xs ml-2">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </div>
  );
}