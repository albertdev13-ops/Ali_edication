import { Link, useLocation } from 'wouter';
import { MessageSquare, Settings, LayoutDashboard, GraduationCap, LineChart, UsersRound } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { icon: LayoutDashboard, path: '/dashboard', label: 'ALI' },
  { icon: GraduationCap, path: '/prof-setup', label: 'PROF' },
  { icon: LineChart, path: '/progression', label: 'SUIVI' },
  { icon: UsersRound, path: '/pote', label: 'POTE' },
  { icon: MessageSquare, path: '/', label: 'CHAT' },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="flex border-t border-border/40 bg-background/95 backdrop-blur-md">
      {NAV_ITEMS.map((item) => {
        const isActive = location === item.path;
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all relative",
              isActive ? "text-cyan-400" : "text-muted-foreground hover:text-cyan-400/70"
            )}
          >
            {isActive && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-cyan-400"
                style={{ boxShadow: '0 0 6px 1px rgba(0,212,255,0.8)' }}
              />
            )}
            <Icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_4px_rgba(0,212,255,0.8)]")} />
            <span className="text-[9px] font-mono tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
