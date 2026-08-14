import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sfx } from '../../audio/soundEffects';
import { Compass, MapPin, Star, Sparkles, ArrowLeft, Play } from 'lucide-react';

interface OnboardingScreenProps {
  /** Finishes setup and drops the player straight into their first question. */
  onStart: (identity: { name: string; avatar: string }) => void;
  /** Finishes setup and goes to the menu instead. */
  onSkip: (identity: { name: string; avatar: string }) => void;
}

const AVATARS = ['🧭', '🦅', '🦁', '🌴', '🏛️', '🐪', '⚔️', '🌊', '🫒', '⭐'];

/**
 * First run.
 *
 * The job is not to teach the game — it is to reach the moment that proves the
 * game is worth the player's time: answering a question about their own
 * heritage and reading the «معلومة ع الماشي» card behind it. So this is two
 * short steps and then a real stage, not a tour.
 *
 * The name step is real setup rather than ceremony: the profile name was a
 * hard-coded placeholder that appeared in the header, the local duel and every
 * shared card, and nothing in the app could change it.
 *
 * No step assumes a context only one of the three audiences has — no classroom,
 * no second player present, no prior fluency in the dialect.
 */
export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onStart, onSkip }) => {
  const [step, setStep] = useState<0 | 1>(0);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);

  const identity = { name, avatar };
  const advance = () => {
    sfx.playTap();
    setStep(1);
  };

  return (
    <div className="min-h-screen flex flex-col px-5 py-8 max-w-lg mx-auto w-full select-none">
      {/* Step indicator + escape hatch */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5" aria-label={`الخطوة ${step + 1} من 2`}>
          {[0, 1].map((i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-gold-400' : 'w-3 bg-white/15'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => onSkip(identity)}
          className="text-xs font-bold text-ink-400 hover:text-white transition-colors"
        >
          تخطي
        </button>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div
            key="identity"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col justify-center"
          >
            <div className="text-center">
              <div className="mx-auto w-20 h-20 rounded-[1.75rem] bg-gradient-to-br from-gold-300 via-gold-400 to-gold-600 flex items-center justify-center shadow-gold-glow-lg">
                <Compass className="w-10 h-10 text-night-900" strokeWidth={2.2} />
              </div>
              <h1 className="mt-5 text-4xl font-black gold-gradient-text">أهلاً بك في دبارة</h1>
              <p className="text-sm text-ink-300 mt-2 leading-relaxed">
                رحلة في تاريخ ليبيا وجغرافيتها ولهجتها ومطبخها
              </p>
            </div>

            <div className="mt-8">
              <label
                htmlFor="player-name"
                className="block text-xs font-bold text-ink-400 mb-2"
              >
                بأي اسم نناديك؟
              </label>
              <input
                id="player-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اكتب اسمك هنا"
                maxLength={20}
                autoComplete="off"
                className="w-full p-3.5 rounded-2xl bg-night-850 border border-white/10 text-sm text-white font-bold placeholder:text-ink-500 focus:border-gold-400 transition-colors"
              />
              <p className="text-[11px] text-ink-500 mt-1.5">
                يظهر في بطاقات إنجازاتك وفي التحدي الثنائي. يمكنك تغييره لاحقاً من الإعدادات.
              </p>
            </div>

            <div className="mt-5">
              <span className="block text-xs font-bold text-ink-400 mb-2">اختر رمزك</span>
              <div className="grid grid-cols-5 gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      sfx.playTap();
                      setAvatar(a);
                    }}
                    aria-label={`الرمز ${a}`}
                    aria-pressed={avatar === a}
                    className={`aspect-square rounded-2xl text-2xl flex items-center justify-center border transition-all ${
                      avatar === a
                        ? 'bg-gold-400/20 border-gold-400 scale-105 shadow-gold-glow-sm'
                        : 'bg-night-800 border-white/10 hover:border-white/25'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={advance}
              className="mt-8 w-full py-4 rounded-3xl bg-gradient-to-r from-gold-400 to-flame text-night-900 font-black text-base shadow-gold-glow flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            >
              <span>متابعة</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="how"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col justify-center"
          >
            <div className="text-center">
              <h2 className="text-2xl font-black text-white">
                {name.trim() ? `يا هلا ${name.trim()}!` : 'كيف تُلعب؟'}
              </h2>
              <p className="text-sm text-ink-300 mt-2">ثلاث خطوات وتبدأ رحلتك</p>
            </div>

            <ol className="mt-7 space-y-3">
              {[
                {
                  icon: <MapPin className="w-5 h-5 text-sea-300" />,
                  title: 'اختر محطة على خريطة ليبيا',
                  body: 'عشرون مدينة من زوارة إلى الكفرة، كل واحدة بمراحلها.',
                },
                {
                  icon: <Sparkles className="w-5 h-5 text-gold-300" />,
                  title: 'أجب واكسب النجوم والدنانير',
                  body: 'كل إجابة تتبعها «معلومة ع الماشي» تشرح الحكاية وراء السؤال.',
                },
                {
                  icon: <Star className="w-5 h-5 text-oasis-500 fill-oasis-500" />,
                  title: 'النجوم تفتح مدناً جديدة',
                  body: 'كلما جمعت أكثر، انفتحت لك محطات أبعد وارتفعت رتبتك.',
                },
              ].map((s, i) => (
                <motion.li
                  key={s.title}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + i * 0.07 }}
                  className="glass-card rounded-2xl p-3.5 flex items-start gap-3"
                >
                  <span className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    {s.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-white">{s.title}</span>
                    <span className="block text-[11px] text-ink-400 mt-0.5 leading-relaxed">
                      {s.body}
                    </span>
                  </span>
                </motion.li>
              ))}
            </ol>

            <button
              type="button"
              onClick={() => {
                sfx.playTap();
                onStart(identity);
              }}
              className="mt-8 w-full py-4 rounded-3xl bg-gradient-to-r from-gold-400 to-flame text-night-900 font-black text-base shadow-gold-glow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>ابدأ أول تحدٍ</span>
            </button>

            <button
              type="button"
              onClick={() => onSkip(identity)}
              className="mt-3 w-full py-2.5 text-xs font-bold text-ink-400 hover:text-white transition-colors"
            >
              أفضّل التصفح بنفسي
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
