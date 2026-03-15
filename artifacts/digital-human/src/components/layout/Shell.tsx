import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden relative">
      <div className="scanline pointer-events-none" />
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>
      {/* Main content */}
      <main className="flex-1 h-full overflow-hidden relative z-10 flex flex-col">
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
        {/* Mobile bottom nav */}
        <div className="lg:hidden flex-shrink-0">
          <BottomNav />
        </div>
      </main>
    </div>
  );
}
