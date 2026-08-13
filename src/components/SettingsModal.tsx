import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { useMapStore, mergeCitiesWithInitial } from '../store/useMapStore';
import { sfx } from '../audio/soundEffects';
import { X, Volume2, VolumeX, Download, Upload, RotateCcw, BarChart2, ShieldCheck, Vibrate } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { audio, toggleSound, toggleHaptics, stats, resetAllProgress } = useGameStore();
  const { resetMapProgress } = useMapStore();

  const [importText, setImportText] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [exportCopied, setExportCopied] = useState<boolean>(false);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExport = () => {
    const gameState = useGameStore.getState();
    const mapState = useMapStore.getState();
    const fullBackup = {
      profile: gameState.profile,
      stats: gameState.stats,
      unlockedBadges: gameState.unlockedBadges,
      mapCities: mapState.cities,
      savedAt: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(fullBackup));
    sfx.playCoin();
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2500);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    try {
      const parsed = JSON.parse(importText.trim());
      if (parsed.profile && parsed.stats) {
        useGameStore.setState({
          profile: parsed.profile,
          stats: parsed.stats,
          unlockedBadges: parsed.unlockedBadges || ['welcome_badge'],
        });
        if (parsed.mapCities) {
          useMapStore.setState({
            cities: mergeCitiesWithInitial(parsed.mapCities),
          });
        }
        sfx.playVictory();
        setImportStatus('تم استيراد كافة بيانات الحفظ والتقدم بنجاح! 🎉');
        setTimeout(() => {
          setImportStatus(null);
          onClose();
        }, 1500);
      } else {
        setImportStatus('خطأ: صيغة البيانات غير صحيحة ❌');
        sfx.playWrong();
      }
    } catch {
      setImportStatus('خطأ: فشل قراءة رمز النسخة الاحتياطية ❌');
      sfx.playWrong();
    }
  };

  const handleResetAll = () => {
    resetAllProgress();
    resetMapProgress();
    setShowConfirmReset(false);
    onClose();
  };

  const accuracy =
    stats.questionsAnswered > 0
      ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100)
      : 0;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none"
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="الإعدادات والإحصائيات"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md bg-gradient-to-b from-[#1E293B] to-[#0B0F19] border border-[#E5A93B]/30 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>⚙️ الإعدادات والإحصائيات</span>
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/5 text-[#94A3B8] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Overview */}
          <div className="p-4 rounded-2xl bg-[#131C2E] border border-white/5 space-y-2">
            <h4 className="text-xs font-bold text-[#E5A93B] flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4" />
              إحصائيات إنجازاتك
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 rounded-xl bg-black/20">
                <span className="block text-base font-black text-white">{stats.questionsAnswered}</span>
                <span className="text-[10px] text-[#94A3B8]">أسئلة مُجابة</span>
              </div>
              <div className="p-2 rounded-xl bg-black/20">
                <span className="block text-base font-black text-[#10B981]">{accuracy}%</span>
                <span className="text-[10px] text-[#94A3B8]">دقة الإجابة</span>
              </div>
              <div className="p-2 rounded-xl bg-black/20">
                <span className="block text-base font-black text-[#FCD34D]">{stats.bestSpeedScore}</span>
                <span className="text-[10px] text-[#94A3B8]">أفضل سرعة</span>
              </div>
            </div>
          </div>

          {/* Audio Controls */}
          <div className="p-4 rounded-2xl bg-[#131C2E] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {audio.soundEnabled ? <Volume2 className="w-5 h-5 text-[#38BDF8]" /> : <VolumeX className="w-5 h-5 text-[#64748B]" />}
              <span className="text-xs font-bold text-white">المؤثرات الصوتية التفاعلية</span>
            </div>
            <button
              onClick={toggleSound}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                audio.soundEnabled ? 'bg-[#10B981] text-white' : 'bg-white/10 text-[#64748B]'
              }`}
            >
              {audio.soundEnabled ? 'مُفعل' : 'مكتوم'}
            </button>
          </div>

          {/* Haptics Control */}
          <div className="p-4 rounded-2xl bg-[#131C2E] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Vibrate
                className={`w-5 h-5 ${audio.hapticsEnabled ? 'text-[#E5A93B]' : 'text-[#64748B]'}`}
              />
              <span className="text-xs font-bold text-white">الاهتزاز اللمسي (على الجوال)</span>
            </div>
            <button
              onClick={toggleHaptics}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                audio.hapticsEnabled ? 'bg-[#10B981] text-white' : 'bg-white/10 text-[#64748B]'
              }`}
            >
              {audio.hapticsEnabled ? 'مُفعل' : 'متوقف'}
            </button>
          </div>

          {/* Backup & Restore */}
          <div className="p-4 rounded-2xl bg-[#131C2E] border border-white/5 space-y-3">
            <h4 className="text-xs font-bold text-[#38BDF8] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              النسخ الاحتياطي ونقل الحفظ الشامل
            </h4>

            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex-1 py-2 rounded-xl bg-[#1E293B] hover:bg-[#2A374D] border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exportCopied ? 'تم نسخ الحفظ للحافظة! ✓' : 'تصدير كود الحفظ الكامل'}</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <input
                type="text"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="الصق كود الحفظ هنا..."
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-[#64748B] text-left ltr"
              />
              <button
                onClick={handleImport}
                className="w-full py-2 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-[#0B0F19] font-black text-xs flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>استيراد واستعادة الحفظ الكامل</span>
              </button>
              {importStatus && (
                <p className="text-[11px] font-bold text-center mt-1 text-[#FCD34D]">{importStatus}</p>
              )}
            </div>
          </div>

          {/* Reset Game Data */}
          <div className="pt-2">
            {!showConfirmReset ? (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="w-full py-2.5 rounded-xl bg-[#F43F5E]/10 hover:bg-[#F43F5E]/20 text-[#F43F5E] text-xs font-bold flex items-center justify-center gap-1.5 border border-[#F43F5E]/20"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تصفير وإعادة تعيين تقدم اللعبة</span>
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-[#F43F5E]/15 border border-[#F43F5E]/40 text-center space-y-2">
                <p className="text-xs text-[#FECDD3] font-bold">
                  هل أنت متأكد؟ سيتم مسح كافة المراحل والدنانير!
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handleResetAll}
                    className="px-4 py-1.5 rounded-xl bg-[#F43F5E] text-white text-xs font-black"
                  >
                    نعم، احذف الكل
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="px-4 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
