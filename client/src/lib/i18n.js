import { useCallback, useMemo } from 'react';
import { tr, fill } from '@engine/text.js';
import { content } from '../content.js';
import { useGame } from '../store.jsx';
import { makeMoney } from './money.js';
import { contentVars } from '@engine/city.js';

/**
 * Hook: t('key', vars) for UI strings, tx(contentValue, vars) for content text, money(n).
 * Both fill city and partner placeholders ({city}, {currencyName}, {bank}, {stop}…) automatically.
 * Pass the current world id so {stop} names that world's place in the chosen city.
 */
export function useT(worldId) {
  const { lang, age, currency, cityId, editionId } = useGame();
  const money = makeMoney(currency, lang);
  const base = useMemo(() => contentVars(content, { cityId, editionId, lang, worldId }), [cityId, editionId, lang, worldId]);
  const t = useCallback(
    (key, vars) => fill(fill(content.i18n[lang]?.[key] ?? content.i18n.en[key] ?? key, vars, money), base, money),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, currency, base],
  );
  // Fill twice so a value like {payFrequency} that itself contains placeholders resolves fully.
  const tx = useCallback((v, vars) => fill(fill(fill(tr(v, lang, age), vars, money), base, money), base, money), [lang, age, currency, base]); // eslint-disable-line react-hooks/exhaustive-deps
  return { t, tx, money, lang, age, dir: lang === 'ar' ? 'rtl' : 'ltr' };
}
