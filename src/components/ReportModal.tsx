import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalA11y } from '../hooks/useModalA11y';
import { getReportUrl } from '../data/credits';
import { sfx } from '../audio/soundEffects';
import {
  Flag,
  X,
  Copy,
  Check,
  ExternalLink,
  WifiOff,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId?: string;
  questionText?: string;
  category?: string;
  source?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  questionId,
  questionText,
  category,
  source,
}) => {
  const [copied, setCopied] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [iframeLoading, setIframeLoading] = useState(true);

  const modalRef = useModalA11y(isOpen, onClose);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const reportUrl = getReportUrl(questionId, questionText);

  const handleCopyDetails = async () => {
    const reportText = [
      '📌 تبليغ عن سؤال في لعبة دبارة:',
      questionId ? `• معرّف السؤال: ${questionId}` : '',
      category ? `• التصنيف: ${category}` : '',
      questionText ? `• نص السؤال: ${questionText}` : '',
      source ? `• المصدر المذكور: ${source}` : '',
      `• التاريخ: ${new Date().toLocaleDateString('ar-LY')}`,
      '\nالملاحظة / التصحيح المقترح:',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      sfx.playCorrect();
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard API is restricted
      setCopied(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-night-950/80 backdrop-blur-md"
          role="presentation"
        >
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="التبليغ عن خطأ أو ملاحظة"
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 15 }}
            className="w-full max-w-lg bg-gradient-to-b from-night-800 to-night-900 border border-gold-400/30 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center gap-2 text-gold-300">
                <div className="p-2 rounded-xl bg-gold-400/10 border border-gold-400/20">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">بلّغ عن ملاحظة</h2>
                  <p className="text-[11px] text-ink-400">ملاحظتك تصنع فرقاً في جودة المحتوى</p>
                </div>
              </div>

              <button
                onClick={() => {
                  sfx.playTap();
                  onClose();
                }}
                aria-label="إغلاق النافذة"
                className="p-2 rounded-full hover:bg-white/10 text-ink-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Question Summary Badge */}
            {questionId && (
              <div className="bg-night-850 p-3 rounded-2xl border border-white/5 mb-3 text-right">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-ink-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-oasis-400" />
                    معرّف السؤال
                  </span>
                  <span className="text-xs font-mono font-bold text-gold-300 bg-gold-400/10 px-2 py-0.5 rounded-lg border border-gold-400/20">
                    {questionId}
                  </span>
                </div>
                {questionText && (
                  <p className="text-xs text-ink-200 line-clamp-2 leading-relaxed">
                    {questionText}
                  </p>
                )}
              </div>
            )}

            {/* Offline Notification Banner */}
            {!isOnline && (
              <div className="bg-flame/15 border border-flame/30 rounded-2xl p-3 mb-3 text-right flex items-start gap-2.5">
                <WifiOff className="w-4 h-4 text-flame shrink-0 mt-0.5" />
                <div className="text-xs text-flame-100 leading-relaxed">
                  <p className="font-bold text-flame">أنت تلعب دون إنترنت حالياً</p>
                  <p className="text-[11px] text-ink-300 mt-0.5">
                    يمكنك نسخ بيانات السؤال الآن بضغطة زر وإرسالها متى اتصلت بالشبكة.
                  </p>
                </div>
              </div>
            )}

            {/* In-App Tally Iframe or Direct Access */}
            <div className="relative flex-1 min-h-[280px] sm:min-h-[320px] rounded-2xl overflow-hidden border border-white/10 bg-night-900">
              {isOnline ? (
                <>
                  {iframeLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-night-900 text-ink-400 text-xs">
                      <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                      <span>جاري تجهيز استمارة التبليغ...</span>
                    </div>
                  )}
                  <iframe
                    src={reportUrl}
                    title="استمارة التبليغ عن الملاحظات"
                    className="w-full h-full border-0"
                    onLoad={() => setIframeLoading(false)}
                    allow="clipboard-write"
                  />
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-ink-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">استمارة التبليغ تحتاج اتصالاً</h3>
                  <p className="text-xs text-ink-400 max-w-xs leading-relaxed">
                    استخدم زر «نسخ تفاصيل السؤال» بالأسفل لحفظ كل البيانات وتقديم الملاحظة لاحقاً.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleCopyDetails}
                className="flex-1 py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-ink-100 flex items-center justify-center gap-1.5 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-oasis-400" />
                    <span className="text-oasis-400">تم نسخ تفاصيل السؤال!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-gold-300" />
                    <span>نسخ تفاصيل السؤال</span>
                  </>
                )}
              </button>

              {isOnline && (
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-2xl bg-gold-400/15 hover:bg-gold-400/25 border border-gold-400/30 text-xs font-bold text-gold-300 flex items-center justify-center gap-1 transition-all"
                  aria-label="فتح النموذج في لسان جديد"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح في متصفح خارجي</span>
                </a>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
