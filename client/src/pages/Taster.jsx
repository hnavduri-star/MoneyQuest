import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { stepsForAge } from '@engine/progress.js';
import ChoiceStep from '../steps/ChoiceStep.jsx';
import Companion from '../components/Companion.jsx';
import Mascot from '../components/Mascot.jsx';
import CoinBurst from '../components/CoinBurst.jsx';
import Confetti from '../components/Confetti.jsx';
import { Coin } from '../components/ui.jsx';
import { play } from '../lib/sound.js';

/** Play before signing up: pick a guide, answer three questions, earn coins. A grown-up then sets a PIN to keep them. */
export default function Taster() {
  const { content, cityCtx, setTasterCoins } = useGame();
  const { t, tx } = useT('money-basics');
  const nav = useNavigate();
  const [buddy, setBuddy] = useState(null);
  const qs = stepsForAge(content.worlds['money-basics'].nodes.find((n) => n.id === 'quiz'), '10-12', cityCtx).filter((s) => s.type === 'choice').slice(0, 3);
  const [i, setI] = useState(0);
  const [coins, setCoins] = useState(0);
  const [solved, setSolved] = useState(false);
  const [pop, setPop] = useState(null);
  const done = i >= qs.length;

  if (!buddy)
    return (
      <div className="max-w-app mx-auto p-6 text-center space-y-4">
        <h1 className="title text-3xl">{t('taster.pick')}</h1>
        <div className="grid grid-cols-3 gap-3">
          {content.characters.companions.map((c) => (
            <button key={c.id} className="card p-2 flex flex-col items-center" onClick={() => { play('tap'); setBuddy(c); }}>
              <Companion id={c.id} size={70} bounce={false} />
              <span className="text-xs font-bold">{tx(c.name)}</span>
            </button>
          ))}
        </div>
      </div>
    );
  if (done)
    return (
      <div className="max-w-app mx-auto p-6 text-center space-y-4 flex flex-col items-center">
        <Confetti />
        <Companion id={buddy.id} size={110} mood="excited" />
        <h1 className="title text-3xl">{t('taster.great')}</h1>
        <p className="text-2xl font-extrabold flex items-center gap-2"><Coin size={30} /> {coins}</p>
        <p className="text-soft">{t('taster.keep')}</p>
        <button className="btn-primary w-full" onClick={() => { setTasterCoins(coins); nav('/?setup=1'); }}>👨‍👩‍👧 {t('taster.askGrownUp')}</button>
      </div>
    );
  const q = qs[i];
  return (
    <div className="max-w-app mx-auto p-4 space-y-3">
      <CoinBurst pop={pop} />
      <div className="flex items-center justify-between">
        <span className="chip bg-sun-pale"><Coin size={16} /> {coins}</span>
        <span className="text-sm font-bold text-soft">{i + 1} / {qs.length}</span>
      </div>
      <Mascot text={t('taster.hi', { name: tx(buddy.name) })} size={64} autoSpeak={false} />
      <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        <ChoiceStep step={q} solved={solved} onCorrect={() => { play('coin'); setSolved(true); setCoins((c) => c + 10); setPop({ n: 10, key: Date.now() }); }} onWrong={() => play('wrong')} />
      </motion.div>
      {solved && (
        <div className="card p-4 bg-leaf-pale">
          <p className="font-bold">✅ {tx(q.explain)}</p>
          <button className="btn-leaf w-full mt-3" onClick={() => { setI(i + 1); setSolved(false); }}>{t('common.next')}</button>
        </div>
      )}
    </div>
  );
}
