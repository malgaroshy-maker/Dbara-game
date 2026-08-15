import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalA11y } from '../../hooks/useModalA11y';
import { Download, X, Share, PlusSquare, Zap, WifiOff, CheckCircle2 } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  onInstall: () => Promise<boolean>;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  isInstallable,
  isInstalled,
  onInstall,
}) => {
  const dialogRef = useModalA11y(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="تثبيت لعبة دبارة"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-sm bg-gradient-to-b from-night-800 to-night-950 border border-gold-400/40 rounded-3xl p-5 shadow-2xl space-y-4 text-center relative overflow-hidden"
        >
          {/* Subtle Ambient Gold Glow */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 bg-gold-400/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-ink-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Master App Icon */}
          <div className="pt-2 flex justify-center">
            <div className="relative group">
              <img
                src="/icon-192.png"
                alt="أيقونة دبارة"
                className="w-20 h-20 rounded-3xl shadow-gold-glow border-2 border-gold-400/50 object-cover"
              />
              <div className="absolute -bottom-1 -right-1 p-1 bg-gold-400 text-night-900 rounded-full shadow">
                <Zap className="w-3.5 h-3.5 fill-current" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-black text-white">تثبيت «دبارة» على هاتفك</h3>
            <p className="text-xs text-ink-400 mt-1 leading-relaxed">
              للوصول السريع من الشاشة الرئيسية واللعب دون إنترنت وبشاشة كاملة
            </p>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 gap-2 text-right text-xs">
            <div className="p-2.5 rounded-2xl bg-night-800/90 border border-white/5 flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-gold-400 shrink-0" />
              <div>
                <strong className="block text-[11px] text-white">100% بدون إنترنت</strong>
                <span className="text-[9px] text-ink-400">450 سؤال ومرحلة</span>
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-night-800/90 border border-white/5 flex items-center gap-2">
              <Zap className="w-4 h-4 text-sea-400 shrink-0" />
              <div>
                <strong className="block text-[11px] text-white">إقلاع فوري</strong>
                <span className="text-[9px] text-ink-400">بدون شريط متصفح</span>
              </div>
            </div>
          </div>

          {/* Already Installed State */}
          {isInstalled ? (
            <div className="p-3 rounded-2xl bg-oasis-500/15 border border-oasis-500/30 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-oasis-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>التطبيق مثبت بالفعل على جهازك!</span>
              </div>
              <p className="text-[11px] text-ink-300">
                افتح اللعبة من شاشتك الرئيسية للتمتع بالتجربة الكاملة.
              </p>
            </div>
          ) : isIOS ? (
            /* iOS Safari 3-Step Guide */
            <div className="p-3.5 rounded-2xl bg-night-850 border border-gold-400/20 text-right space-y-2.5 text-xs">
              <div className="font-bold text-gold-300 flex items-center gap-1.5 pb-1 border-b border-white/5">
                <span>طريقة التثبيت على الآيفون (iOS):</span>
              </div>
              <div className="space-y-2 text-[11px] text-ink-200">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-gold-400 shrink-0">1</span>
                  <span>اضغط زر <strong>المشاركة</strong> <Share className="w-3.5 h-3.5 inline text-sea-400 mx-0.5" /> أسفل شاشة Safari</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-gold-400 shrink-0">2</span>
                  <span>اختر <strong>إضافة إلى الشاشة الرئيسية</strong> <PlusSquare className="w-3.5 h-3.5 inline text-gold-400 mx-0.5" /></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-gold-400 shrink-0">3</span>
                  <span>اضغط <strong>إضافة (Add)</strong> في أعلى الزاوية</span>
                </div>
              </div>
            </div>
          ) : isInstallable ? (
            /* Android / Desktop 1-Click Install Button */
            <button
              onClick={async () => {
                const installed = await onInstall();
                if (installed) onClose();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-gold-400 to-flame hover:from-gold-300 hover:to-gold-400 text-night-900 font-black text-sm flex items-center justify-center gap-2 shadow-gold-glow transition-transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>تثبيت التطبيق الآن</span>
            </button>
          ) : (
            /* Generic Guide for other browsers */
            <div className="p-3 rounded-2xl bg-white/5 text-xs text-ink-300 text-right leading-relaxed">
              افتح قائمة المتصفح (⋮) واختر <strong>«تثبيت التطبيق»</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong> لتثبيت اللعبة.
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 text-xs text-ink-400 hover:text-white transition-colors"
          >
            إغلاق
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
