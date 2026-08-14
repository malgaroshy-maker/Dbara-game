import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Download, Copy, Check, Sparkles, Trophy, Flame, Star, Coins } from 'lucide-react';
import { sfx } from '../audio/soundEffects';

interface ShareResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  playerName: string;
  playerAvatar: string;
  playerTitle: string;
  scoreOrStars: {
    stars?: number;
    score?: number;
    dinarsEarned?: number;
    streakDays?: number;
  };
  contextType: 'quiz' | 'daily' | 'blitz' | 'duel';
}

export const ShareResultModal: React.FC<ShareResultModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  playerName,
  playerAvatar,
  playerTitle,
  scoreOrStars,
  contextType,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [downloadReady, setDownloadReady] = useState<boolean>(false);

  // `scoreOrStars` arrives as a fresh object literal from every caller, so
  // depending on it directly would redraw the whole card on every parent
  // render. Depend on its values instead.
  const { stars, score, dinarsEarned, streakDays } = scoreOrStars;

  useEffect(() => {
    if (!isOpen) return;

    // Render high-res achievement card on canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const height = 500;
    // Draw at device resolution so the shared PNG is crisp on retina phones.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.aspectRatio = `${width} / ${height}`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background Gradient (Deep Libyan Night)
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0B0F19');
    bgGradient.addColorStop(0.5, '#131C2E');
    bgGradient.addColorStop(1, '#080D1A');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative Geometric Corner Border in Gold
    ctx.strokeStyle = '#E5A93B';
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    ctx.strokeStyle = 'rgba(229, 169, 59, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(34, 34, width - 68, height - 68);

    // Corner Ornaments
    const drawCorner = (x: number, y: number) => {
      ctx.fillStyle = '#FCD34D';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCorner(24, 24);
    drawCorner(width - 24, 24);
    drawCorner(24, height - 24);
    drawCorner(width - 24, height - 24);

    // Subtle Heritage Watermark Crescent in Center
    ctx.fillStyle = 'rgba(229, 169, 59, 0.04)';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 140, 0, Math.PI * 2);
    ctx.fill();

    // Game Logo & Branding (Top Right)
    ctx.fillStyle = '#E5A93B';
    ctx.font = 'bold 28px Cairo, Rubik, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('لعبة دبارة 🧭', width - 60, 75);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '16px Tajawal, sans-serif';
    ctx.fillText('رحلة التحدي والمعرفة الليبية', width - 60, 102);

    // Player Avatar & Info (Top Left)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(playerAvatar || '🧭', 60, 85);

    ctx.font = 'bold 22px Cairo, sans-serif';
    ctx.fillText(playerName, 115, 75);

    ctx.fillStyle = '#FCD34D';
    ctx.font = '14px Tajawal, sans-serif';
    ctx.fillText(`رتبة: ${playerTitle}`, 115, 100);

    // Horizontal Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 125);
    ctx.lineTo(width - 60, 125);
    ctx.stroke();

    // Achievement Title & Subtitle in Center
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px Cairo, Rubik, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 180);

    ctx.fillStyle = '#38BDF8';
    ctx.font = '600 18px Tajawal, sans-serif';
    ctx.fillText(subtitle, width / 2, 215);

    // Stats Grid Box
    const boxY = 260;
    const boxHeight = 130;
    ctx.fillStyle = 'rgba(19, 28, 46, 0.85)';
    ctx.roundRect(60, boxY, width - 120, boxHeight, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(229, 169, 59, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw 3 Stats Inside the Box
    // Each column reports only what the context actually produced — a duel
    // awards neither stars nor dinars, so claiming either would be a lie on a
    // card the player shares.
    const isDuel = contextType === 'duel';
    const isBlitz = contextType === 'blitz';

    const statCols = [
      isDuel
        ? { label: 'نتيجة الفائز', val: `🏆 ${score ?? 0}`, color: '#E5A93B' }
        : {
            label: 'النجوم المكتسبة',
            val: stars !== undefined ? '⭐'.repeat(Math.max(1, stars)) : '⭐⭐⭐',
            color: '#E5A93B',
          },
      isBlitz
        ? { label: 'النقاط وسرعة الإجابة', val: `${score || 0} إجابات`, color: '#10B981' }
        : isDuel
        ? { label: 'نمط اللعب', val: '⚔️ مبارزة', color: '#10B981' }
        : { label: 'المكافأة المحققة', val: `+${dinarsEarned ?? 0} د.ل`, color: '#10B981' },
      isDuel
        ? { label: 'على نفس الجهاز', val: '👥 لاعبان', color: '#F59E0B' }
        : { label: 'سلسلة الأيام', val: `🔥 ${streakDays || 1} أيام`, color: '#F59E0B' },
    ];

    const colWidth = (width - 120) / 3;
    statCols.forEach((stat, i) => {
      const centerX = 60 + colWidth * i + colWidth / 2;

      ctx.fillStyle = stat.color;
      ctx.font = 'bold 26px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(stat.val, centerX, boxY + 55);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '14px Tajawal, sans-serif';
      ctx.fillText(stat.label, centerX, boxY + 95);
    });

    // Footer Signature
    ctx.fillStyle = '#64748B';
    ctx.font = '13px Tajawal, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('شارك التحدي وتحدى أصدقائك في معرفة تاريخ وتراث ليبيا 🇱🇾', width / 2, 445);

    setDownloadReady(true);
  }, [
    isOpen,
    title,
    subtitle,
    playerName,
    playerAvatar,
    playerTitle,
    stars,
    score,
    dinarsEarned,
    streakDays,
    contextType,
  ]);

  // Escape closes the card, matching every other dismissible surface.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getShareText = () => {
    const scoreLine =
      contextType === 'blitz'
        ? `⚡ النقاط: ${score ?? 0}`
        : contextType === 'duel'
        ? `⚔️ نتيجة المبارزة: ${score ?? 0}`
        : `⭐ النجوم: ${stars ?? 3}/3`;
    const streakLine =
      contextType === 'duel' ? '' : `\n🔥 سلسلة الأيام: ${streakDays || 1} أيام متتالية`;
    return `🏆 حققت إنجازاً جديداً في لعبة «دبارة»!\n✨ ${title} - ${subtitle}\n${scoreLine}${streakLine}\n💰 الرتبة: ${playerTitle}\n\nجرّب معلوماتك عن تاريخ وتراث ليبيا وتحداني! 🇱🇾🧭`;
  };

  const handleCopyText = () => {
    // Clipboard access is permission-gated and rejects on insecure origins;
    // an unhandled rejection here used to surface as a console error.
    navigator.clipboard?.writeText(getShareText()).catch(() => {});
    sfx.playCoin();
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    sfx.playVictory();
    const link = document.createElement('a');
    link.download = `dbara-achievement-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleNativeShare = async () => {
    const text = getShareText();
    if (navigator.share) {
      try {
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.toBlob(async (blob) => {
            if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'dbara.png', { type: 'image/png' })] })) {
              const file = new File([blob], 'dbara-card.png', { type: 'image/png' });
              await navigator.share({
                title: 'إنجاز لعبة دبارة 🧭',
                text,
                files: [file],
              });
              return;
            }
            await navigator.share({
              title: 'إنجاز لعبة دبارة 🧭',
              text,
            });
          });
        } else {
          await navigator.share({
            title: 'إنجاز لعبة دبارة 🧭',
            text,
          });
        }
      } catch {
        handleCopyText();
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none"
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="مشاركة بطاقة الإنجاز"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg bg-gradient-to-b from-night-700 to-night-900 border border-gold-400/40 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-400" />
              <span>مشاركة بطاقة الإنجاز 🏅</span>
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/5 text-ink-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Canvas Preview Container */}
          <div className="relative rounded-2xl overflow-hidden border border-gold-400/30 shadow-xl bg-night-900">
            <canvas ref={canvasRef} className="w-full h-auto block rounded-2xl" />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleNativeShare}
              className="py-3 px-2 rounded-2xl bg-gradient-to-r from-gold-400 to-flame text-night-900 font-black text-xs flex items-center justify-center gap-1.5 shadow-gold-glow-sm transition-transform active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={!downloadReady}
              className="py-3 px-2 rounded-2xl bg-oasis-500 hover:bg-oasis-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-oasis-glow transition-transform active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>حفظ كصورة</span>
            </button>

            <button
              onClick={handleCopyText}
              className="py-3 px-2 rounded-2xl bg-night-700 hover:bg-night-600 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            >
              {copiedText ? <Check className="w-4 h-4 text-oasis-500" /> : <Copy className="w-4 h-4 text-sea-300" />}
              <span>{copiedText ? 'تم النسخ!' : 'نسخ النص'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
