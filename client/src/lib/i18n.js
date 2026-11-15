import { useCallback } from 'react';
import { tr, fill } from '@engine/text.js';
import { content } from '../content.js';
import { useGame } from '../store.jsx';
import { makeMoney } from './money.js';

/** Hook: t('key', vars) for UI strings, tx(contentValue, vars) for content text, money(n). */
export function useT() {
  const { lang, age, currency } = useGame();
  const money = makeMoney(currency, lang);
  const t = useCallback(
    (key, vars) => fill(content.i18n[lang]?.[key] ?? content.i18n.en[key] ?? key, vars, money),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, currency],
  );
  const tx = useCallback((v, vars) => fill(tr(v, lang, age), vars, money), [lang, age, currency]); // eslint-disable-line react-hooks/exhaustive-deps
  return { t, tx, money, lang, age, dir: lang === 'ar' ? 'rtl' : 'ltr' };
}
