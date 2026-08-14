import React from 'react';
import { useGameStore } from '../store/useGameStore';
import type { GameMode } from '../types/game';
import { Map, Zap, Flame, Trophy } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentMode, setMode } = useGameStore();

  const navItems: { id: GameMode; label: string; icon: React.ReactNode }[] = [
    { id: 'map', label: 'خريطة ليبيا', icon: <Map className="w-5 h-5" /> },
    { id: 'quickplay', label: 'لعب سريع', icon: <Zap className="w-5 h-5" /> },
    { id: 'daily', label: 'تحدي اليوم', icon: <Flame className="w-5 h-5" /> },
    { id: 'badges', label: 'الأوسمة', icon: <Trophy className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 p-2 pointer-events-none">
      <div className="max-w-md mx-auto w-full pointer-events-auto bg-night-800/90 backdrop-blur-xl border border-gold-400/25 rounded-3xl p-1.5 shadow-[0_-5px_25px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const isActive = currentMode === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setMode(item.id)}
                className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all text-xs font-bold ${
                  isActive
                    ? 'bg-gradient-to-b from-gold-400 to-flame text-night-900 shadow-gold-glow-sm scale-105'
                    : 'text-ink-400 hover:text-ink-100 hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span className="text-[10px] leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
