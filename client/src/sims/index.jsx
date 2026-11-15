import { useState } from 'react';
import { motion } from 'framer-motion';
import { useT } from '../lib/i18n.js';
import { useGame } from '../store.jsx';
import { sims as S } from '@engine/index.js';
import { pickAge } from '@engine/text.js';
import Slider from './Slider.jsx';

/** Interactive explainers, referenced from lesson JSON by `"sim": "<id>"`. All maths comes from engine/sims. */
const L = {
  goal: { en: 'Goal price', ar: 'سعر الهدف' },
  perWeek: { en: 'Saved each week', ar: 'الادخار الأسبوعي' },
  weeksNeeded: { en: 'Weeks to your goal', ar: 'أسابيع حتى الهدف' },
  save: { en: 'Save', ar: 'ادخار' },
  spend: { en: 'Spend', ar: 'إنفاق' },
  give: { en: 'Give', ar: 'عطاء' },
  start: { en: 'Starting money', ar: 'المبلغ الأول' },
  rate: { en: 'Interest rate', ar: 'نسبة الفائدة' },
  years: { en: 'Years', ar: 'السنوات' },
  simple: { en: 'Simple interest', ar: 'فائدة بسيطة' },
  compound: { en: 'Compound (snowball)', ar: 'مركبة (كرة الثلج)' },
  loan: { en: 'Loan amount', ar: 'مبلغ القرض' },
  months: { en: 'Months to repay', ar: 'أشهر السداد' },
  monthly: { en: 'Each month you pay', ar: 'تدفع كل شهر' },
  totalInterest: { en: 'Extra paid in interest', ar: 'الفائدة الإضافية' },
  totalPaid: { en: 'Total you pay back', ar: 'إجمالي ما تعيده' },
  deposits: { en: 'Savers deposit', ar: 'إيداعات المدخرين' },
  depositRate: { en: 'Bank pays savers', ar: 'البنك يدفع للمدخرين' },
  loanRate: { en: 'Borrowers pay the bank', ar: 'المقترضون يدفعون للبنك' },
  lent: { en: 'Lent to borrowers', ar: 'مُقرض للمقترضين' },
  reserve: { en: 'Kept safe (reserve)', ar: 'محفوظ (احتياطي)' },
  paidSavers: { en: 'Paid to savers', ar: 'دُفع للمدخرين' },
  earned: { en: 'Earned from borrowers', ar: 'كُسب من المقترضين' },
  profit: { en: "Bank's profit (the spread)", ar: 'ربح البنك (الهامش)' },
  capital: { en: 'Your money invested', ar: 'مالك المستثمر' },
  businessResult: { en: 'Business result this year', ar: 'نتيجة التجارة هذا العام' },
  share: { en: 'Your share of profit', ar: 'نصيبك من الربح' },
  you: { en: 'You get', ar: 'تحصل على' },
  bank: { en: 'Bank gets', ar: 'البنك يحصل على' },
  lossNote: { en: 'In a loss year, the money provider shares the loss, and the bank earns nothing for its work.', ar: 'في سنة الخسارة يتحمل صاحب المال الخسارة، ولا يكسب البنك شيئاً مقابل عمله.' },
};

function Stat({ label, value, tone = 'bg-cream' }) {
  return (
    <div className={`rounded-2xl ${tone} p-3 text-center`}>
      <div className="text-xs font-bold text-soft">{label}</div>
      <div className="text-2xl font-extrabold">{value}</div>
    </div>
  );
}

function SavingsGoal({ params }) {
  const { tx, money, t } = useT();
  const { age } = useGame();
  const [goal, setGoal] = useState(pickAge(params.goal, age) ?? 100);
  const [per, setPer] = useState(pickAge(params.perWeek, age) ?? 10);
  const weeks = S.weeksToGoal(goal, per);
  const plan = S.savingsPlan(goal, per, 0, 52);
  return (
    <div className="space-y-3">
      <Slider label={tx(L.goal)} value={goal} min={10} max={age === '7-9' ? 100 : 500} step={5} onChange={setGoal} format={money} />
      <Slider label={tx(L.perWeek)} value={per} min={1} max={age === '7-9' ? 20 : 60} onChange={setPer} format={money} />
      <Stat label={tx(L.weeksNeeded)} value={Number.isFinite(weeks) ? `${weeks} ${t('common.weeks')}` : '∞'} tone="bg-leaf-pale" />
      <div className="flex items-end gap-[2px] h-24" aria-hidden>
        {plan.slice(1, 53).map((r) => (
          <motion.div key={r.week} className="flex-1 rounded-t bg-berry" initial={{ height: 0 }} animate={{ height: `${(r.saved / goal) * 100}%` }} />
        ))}
        <span className="text-3xl">🐷</span>
      </div>
    </div>
  );
}

function Jars({ params }) {
  const { tx, money } = useT();
  const amount = params.amount || 20;
  const [save, setSave] = useState(50);
  const [give, setGive] = useState(10);
  const spend = Math.max(0, 100 - save - give);
  const j = S.jarSplit(amount, { save, spend, give });
  const jars = [
    ['save', '🐷', j.save, 'bg-berry-pale'],
    ['spend', '🛍️', j.spend, 'bg-sun-pale'],
    ['give', '💝', j.give, 'bg-leaf-pale'],
  ];
  return (
    <div className="space-y-3">
      <Slider label={`${tx(L.save)} %`} value={save} min={0} max={100 - give} step={5} onChange={setSave} format={(v) => `${v}%`} />
      <Slider label={`${tx(L.give)} %`} value={give} min={0} max={100 - save} step={5} onChange={setGive} format={(v) => `${v}%`} />
      <div className="grid grid-cols-3 gap-2">
        {jars.map(([k, e, v, tone]) => (
          <div key={k} className={`rounded-2xl ${tone} p-2 text-center`}>
            <div className="text-3xl" aria-hidden>{e}</div>
            <div className="text-xs font-bold">{tx(L[k])}</div>
            <div className="text-lg font-extrabold">{money(v)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Compound({ params }) {
  const { tx, money } = useT();
  const { age } = useGame();
  const principal = params.principal || 100;
  const [rate, setRate] = useState(pickAge(params.rate, age) || 6);
  const [years, setYears] = useState(pickAge(params.years, age) || 10);
  const rows = S.growthSeries(principal, rate, years);
  const max = rows.at(-1).compound;
  const last = rows.at(-1);
  return (
    <div className="space-y-3">
      <Slider label={tx(L.rate)} value={rate} min={1} max={15} onChange={setRate} format={(v) => `${v}%`} />
      <Slider label={tx(L.years)} value={years} min={1} max={age === '7-9' ? 10 : 40} onChange={setYears} />
      <div className="grid grid-cols-2 gap-2">
        <Stat label={`▦ ${tx(L.simple)}`} value={money(last.simple)} />
        <Stat label={`☃️ ${tx(L.compound)}`} value={money(last.compound)} tone="bg-sky-pale" />
      </div>
      <div className="flex items-end gap-[3px] h-32" role="img" aria-label={`${money(principal)} → ${money(last.compound)}`}>
        {rows.map((r) => (
          <div key={r.year} className="flex-1 flex flex-col justify-end h-full">
            <motion.div className="rounded-t bg-sky" animate={{ height: `${((r.compound - r.simple) / max) * 100}%` }} />
            <motion.div className="bg-sun-light" animate={{ height: `${(r.simple / max) * 100}%` }} style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent 0 3px, rgba(0,0,0,.08) 3px 6px)' }} />
          </div>
        ))}
      </div>
      <p className="text-xs text-soft">▦ {tx(L.simple)} · ■ {tx(L.compound)}</p>
    </div>
  );
}

function Loan({ params }) {
  const { tx, money, t } = useT();
  const [amount, setAmount] = useState(params.amount || 1000);
  const [rate, setRate] = useState(params.rate || 10);
  const [months, setMonths] = useState(params.months || 12);
  const s = S.loanSummary(amount, rate, months);
  return (
    <div className="space-y-3">
      <Slider label={tx(L.loan)} value={amount} min={100} max={5000} step={100} onChange={setAmount} format={money} />
      <Slider label={tx(L.rate)} value={rate} min={0} max={30} onChange={setRate} format={(v) => `${v}%`} />
      <Slider label={tx(L.months)} value={months} min={3} max={60} step={3} onChange={setMonths} format={(v) => `${v} ${t('common.months')}`} />
      <div className="grid grid-cols-3 gap-2">
        <Stat label={tx(L.monthly)} value={money(s.monthly)} />
        <Stat label={tx(L.totalInterest)} value={money(s.totalInterest)} tone="bg-ember-pale" />
        <Stat label={tx(L.totalPaid)} value={money(s.totalPaid)} />
      </div>
    </div>
  );
}

function BankSpread({ params }) {
  const { tx, money } = useT();
  const [depositRate, setDep] = useState(params.depositRate ?? 2);
  const [loanRate, setLoan] = useState(params.loanRate ?? 8);
  const r = S.bankSpread({ deposits: params.deposits || 1000, depositRatePct: depositRate, loanRatePct: loanRate, reservePct: params.reserve ?? 10 });
  const reduced = document.documentElement.classList.contains('reduce-motion');
  return (
    <div className="space-y-3">
      <div className="relative h-28 rounded-2xl bg-sky-pale overflow-hidden" aria-hidden>
        <span className="absolute start-2 top-8 text-4xl">🧑‍🤝‍🧑</span>
        <span className="absolute left-1/2 -translate-x-1/2 top-6 text-5xl">🏦</span>
        <span className="absolute end-2 top-8 text-4xl">🏠</span>
        {!reduced &&
          [0, 1, 2].map((i) => (
            <motion.span key={i} className="absolute top-3 text-xl" animate={{ left: ['12%', '45%', '80%'] }} transition={{ duration: 3, repeat: Infinity, delay: i, ease: 'linear' }}>
              🪙
            </motion.span>
          ))}
        {!reduced &&
          [0, 1].map((i) => (
            <motion.span key={'b' + i} className="absolute bottom-3 text-xl" animate={{ left: ['80%', '45%', '12%'] }} transition={{ duration: 3, repeat: Infinity, delay: i * 1.5, ease: 'linear' }}>
              💰
            </motion.span>
          ))}
      </div>
      <Slider label={tx(L.depositRate)} value={depositRate} min={0} max={10} step={0.5} onChange={setDep} format={(v) => `${v}%`} />
      <Slider label={tx(L.loanRate)} value={loanRate} min={0} max={20} step={0.5} onChange={setLoan} format={(v) => `${v}%`} />
      <div className="grid grid-cols-2 gap-2">
        <Stat label={tx(L.lent)} value={money(r.lent)} />
        <Stat label={tx(L.reserve)} value={money(r.reserve)} />
        <Stat label={`↘ ${tx(L.paidSavers)}`} value={money(r.paidToSavers)} />
        <Stat label={`↗ ${tx(L.earned)}`} value={money(r.earnedFromBorrowers)} />
      </div>
      <Stat label={tx(L.profit)} value={`${money(r.profit)} (${r.spreadPct}%)`} tone={r.profit >= 0 ? 'bg-leaf-pale' : 'bg-ember-pale'} />
    </div>
  );
}

function ProfitShare({ params }) {
  const { tx, money } = useT();
  const capital = params.capital || 1000;
  const [ret, setRet] = useState(params.returnPct ?? 10);
  const [share, setShare] = useState(params.sharePct ?? 60);
  const result = (capital * ret) / 100;
  const r = S.profitSharing({ capital, result, investorSharePct: share });
  return (
    <div className="space-y-3">
      <Stat label={tx(L.capital)} value={money(capital)} />
      <Slider label={tx(L.businessResult)} value={ret} min={-10} max={25} onChange={setRet} format={(v) => `${v > 0 ? '+' : ''}${v}% (${money(result)})`} />
      <Slider label={tx(L.share)} value={share} min={10} max={90} step={5} onChange={setShare} format={(v) => `${v}% / ${100 - v}%`} />
      <div className="grid grid-cols-2 gap-2">
        <Stat label={`🧒 ${tx(L.you)}`} value={money(r.investor)} tone={r.investor >= 0 ? 'bg-leaf-pale' : 'bg-ember-pale'} />
        <Stat label={`🏦 ${tx(L.bank)}`} value={money(r.manager)} />
      </div>
      {r.loss && <p className="text-sm font-bold">ℹ️ {tx(L.lossNote)}</p>}
    </div>
  );
}

export const SIMS = { savingsGoal: SavingsGoal, jars: Jars, compound: Compound, loan: Loan, bankSpread: BankSpread, profitShare: ProfitShare };
