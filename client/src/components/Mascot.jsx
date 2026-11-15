import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Companion from './Companion.jsx';
import { useGame } from '../store.jsx';
import { speak, canSpeak } from '../lib/speech.js';
import { LANGUAGES } from '../content.js';

/** The child's guide with a speech bubble. Reads aloud when the voice setting is on, or when tapped. */
export default function Mascot({ text, mood = 'happy', size = 84, compact = false, autoSpeak = true }) {
  const { active, content, lang, state, age } = useGame();
  const companion = content.characters.companions.find((c) => c.id === active?.meta?.companion) || content.characters.companions[0];
  const speechLang = LANGUAGES.find((l) => l.id === lang)?.speech;
  // Younger readers get a slower voice.
  const say = (force) => speak(text, { lang: speechLang, pitch: companion.voice?.pitch, rate: (companion.voice?.rate || 1) * (age === '7-9' ? 0.85 : 1), force });
  useEffect(() => {
    if (autoSpeak && text) say(false);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`flex items-end gap-2 ${compact ? '' : 'my-2'}`}>
      <button type="button" onClick={() => say(true)} className="shrink-0 rounded-full focus-visible:ring-4" aria-label={canSpeak() ? 'read aloud' : companion.name.en}>
        <Companion id={companion.id} level={state?.level || 1} skin={state?.inventory?.equipped?.mascotSkin} mood={mood} size={size} />
      </button>
      <AnimatePresence mode="wait">
        {text && (
          <motion.div
            key={text}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex-1 card px-4 py-3 text-[1.02rem] font-semibold mb-3"
            aria-live="polite"
          >
            {text}
            {canSpeak() && (
              <button type="button" onClick={() => say(true)} className="ms-2 align-middle text-lg" aria-label="read aloud">
                🔊
              </button>
            )}
            <span className="absolute -bottom-2 start-6 w-4 h-4 bg-surface border-b border-e border-line rotate-45" aria-hidden />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
