import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { shuffle } from './helpers.js';
import { play } from '../lib/sound.js';

/** Money Match: a memory game pairing money words with their meanings. Fewer moves = more stars. */
export default function MoneyMatch({ game, onFinish }) {
  const { content } = useGame();
  const { t, tx } = useT();
  const [cards] = useState(() => {
    const pairs = shuffle(content.arcade.glossary).slice(0, game.pairs);
    return shuffle(pairs.flatMap((g, i) => [{ pair: i, kind: 'term', g }, { pair: i, kind: 'meaning', g }]));
  });
  const [open, setOpen] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const flip = (i) => {
    if (open.length === 2 || open.includes(i) || matched.includes(cards[i].pair)) return;
    play('tap');
    const o = [...open, i];
    setOpen(o);
    if (o.length === 2) {
      const mv = moves + 1;
      setMoves(mv);
      if (cards[o[0]].pair === cards[o[1]].pair) {
        play('correct');
        const m = [...matched, cards[i].pair];
        setMatched(m);
        setOpen([]);
        if (m.length === game.pairs) setTimeout(() => onFinish({ score: Math.max(0, 40 - mv), stars: mv <= game.stars[2] ? 3 : mv <= game.stars[1] ? 2 : 1, summary: t('arcade.moves', { n: mv }) }), 500);
      } else setTimeout(() => setOpen([]), 900);
    }
  };
  return (
    <div className="space-y-3">
      <p className="text-center font-bold">{t('arcade.moves', { n: moves })} · {matched.length}/{game.pairs}</p>
      <div className="grid grid-cols-3 gap-2">
        {cards.map((c, i) => {
          const shown = open.includes(i) || matched.includes(c.pair);
          return (
            <motion.button key={i} onClick={() => flip(i)} animate={{ rotateY: shown ? 0 : 180 }} transition={{ duration: 0.25 }} className={`min-h-[96px] rounded-2xl border-2 p-2 text-sm font-bold flex flex-col items-center justify-center text-center ${matched.includes(c.pair) ? 'border-leaf bg-leaf-pale' : shown ? 'border-ink bg-surface' : 'border-line bg-sky'}`} aria-label={shown ? (c.kind === 'term' ? tx(c.g.term) : tx(c.g.meaning)) : t('arcade.hidden')}>
              {shown ? (
                c.kind === 'term' ? (<><span className="text-2xl" aria-hidden>{c.g.emoji}</span><span>{tx(c.g.term)}</span></>) : <span className="text-xs leading-snug">{tx(c.g.meaning)}</span>
              ) : (
                <span className="text-3xl text-white" style={{ transform: 'rotateY(180deg)' }} aria-hidden>?</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
