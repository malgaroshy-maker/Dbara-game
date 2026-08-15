import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RewardCelebrationProps {
  show: boolean;
  stars?: number;
  dinars?: number;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  size: number;
  rotation: number;
  type: 'star' | 'coin' | 'sparkle' | 'gem';
  delay: number;
}

export const RewardCelebration: React.FC<RewardCelebrationProps> = ({
  show,
  stars = 3,
  dinars = 35,
  onComplete,
}) => {
  // Trigger tactile vibration on mobile browsers if supported
  useEffect(() => {
    if (show && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 70, 40, 100]);
      } catch {
        // Ignored if browser permission denies vibration
      }
    }
  }, [show]);

  if (!show) return null;

  // Generate 24 golden particles bursting from the center outward
  const particles: Particle[] = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * 2 * Math.PI + (Math.random() * 0.4 - 0.2);
    const distance = 80 + Math.random() * 120;
    const types: Particle['type'][] = ['star', 'coin', 'sparkle', 'gem'];
    return {
      id: i,
      x: 0,
      y: 0,
      targetX: Math.cos(angle) * distance,
      targetY: Math.sin(angle) * distance - (30 + Math.random() * 40),
      size: 14 + Math.random() * 12,
      rotation: Math.random() * 360,
      type: types[i % types.length],
      delay: (i % 6) * 0.04,
    };
  });

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label={`تهانينا! حصلت على ${stars} نجوم و ${dinars} ديناراً`}
    >
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{
              scale: [0, 1.25, 0.9, 0],
              x: p.targetX,
              y: p.targetY,
              opacity: [0, 1, 1, 0],
              rotate: p.rotation + 180,
            }}
            transition={{
              duration: 1.6 + Math.random() * 0.6,
              delay: p.delay,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="absolute select-none"
            style={{ width: p.size, height: p.size }}
          >
            {p.type === 'star' ? (
              <svg viewBox="0 0 24 24" fill="#FCD34D" stroke="#E5A93B" strokeWidth="1" className="w-full h-full drop-shadow-gold-glow-sm">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ) : p.type === 'coin' ? (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-gold-300 via-gold-400 to-amber-500 border border-gold-200 flex items-center justify-center text-[9px] font-black text-night-950 shadow-gold-glow-sm">
                د.ل
              </div>
            ) : p.type === 'sparkle' ? (
              <svg viewBox="0 0 24 24" fill="#38BDF8" className="w-full h-full drop-shadow-oasis-glow">
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
            ) : (
              <div className="w-full h-full rounded-full bg-oasis-400 shadow-oasis-glow opacity-80" />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
