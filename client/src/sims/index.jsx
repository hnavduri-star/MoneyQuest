import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useT } from '../lib/i18n.js';
import { useGame } from '../store.jsx';
import { sims as S } from '@engine/index.js';
import { pickAge } from '@engine/text.js';
import Slider from './Slider.jsx';
import { BrandMark } from '../components/Brand.jsx';

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
  basic: { en: 'Basic salary', ar: 'الراتب الأساسي' },
  allowances: { en: 'Allowances (housing, transport)', ar: 'البدلات (سكن، مواصلات)' },
  pension: { en: 'Pension contribution', ar: 'اشتراك التقاعد' },
  tax: { en: 'Income tax (in some countries)', ar: 'ضريبة الدخل (في بعض الدول)' },
  gross: { en: 'Gross pay', ar: 'الراتب الإجمالي' },
  deductions: { en: 'Deductions', ar: 'الخصومات' },
  net: { en: 'Net pay (arrives in the bank)', ar: 'الراتب الصافي (يصل للبنك)' },
  uaeNote: { en: 'UAE: no income tax on salaries', ar: 'الإمارات: لا ضريبة دخل على الرواتب' },
  income: { en: 'Family income', ar: 'دخل العائلة' },
  rent: { en: '🏠 Rent', ar: '🏠 الإيجار' },
  food: { en: '🛒 Groceries', ar: '🛒 البقالة' },
  bills: { en: '💡 Bills: {utilityShort}, phone', ar: '💡 الفواتير: {utilityShort}، الهاتف' },
  school: { en: '🎒 School', ar: '🎒 المدرسة' },
  transport: { en: '🚗 {transportShort}', ar: '🚗 {transportShort}' },
  emergency: { en: '☔ Emergency fund', ar: '☔ صندوق الطوارئ' },
  savings: { en: '🐷 Savings', ar: '🐷 الادخار' },
  fun: { en: '🎉 Fun', ar: '🎉 الترفيه' },
  left: { en: 'Left over', ar: 'المتبقي' },
  balanced: { en: 'Balanced budget ✓', ar: 'ميزانية متوازنة ✓' },
  over: { en: 'Over budget! ✗ Cut something', ar: 'تجاوزت الميزانية! ✗ قلّل شيئاً' },
  surprise: { en: 'Surprise! Car repair', ar: 'مفاجأة! إصلاح السيارة' },
  covered: { en: 'Covered without borrowing 🎉', ar: 'تمت التغطية دون اقتراض 🎉' },
  short: { en: 'Short by', ar: 'نقص بمقدار' },
  insert: { en: 'Insert card', ar: 'أدخل البطاقة' },
  enterPin: { en: 'Enter PIN (pretend: 1234)', ar: 'أدخل الرقم السري (تجريبي: ١٢٣٤)' },
  wrongPin: { en: 'Wrong PIN. Try again', ar: 'رقم سري خاطئ. حاول مجدداً' },
  chooseAmount: { en: 'Choose an amount', ar: 'اختر المبلغ' },
  network: { en: 'Sending request through the ATM network…', ar: 'إرسال الطلب عبر شبكة الصرّافات…' },
  bankCheck: { en: 'Your bank checks your balance…', ar: 'بنكك يتحقق من رصيدك…' },
  approved: { en: 'Approved! Counting notes…', ar: 'تمت الموافقة! عدّ الأوراق…' },
  takeCash: { en: 'Take your cash and your card', ar: 'خذ نقودك وبطاقتك' },
  declined: { en: 'Declined', ar: 'مرفوض' },
  insufficient: { en: 'Not enough money in your account', ar: 'لا يوجد مال كافٍ في حسابك' },
  overLimit: { en: 'Over your daily limit', ar: 'تجاوز حدك اليومي' },
  notMultiple: { en: 'This ATM only gives notes of {min} and up', ar: 'هذا الصرّاف يصرف أوراقاً من فئة {min} فأكثر' },
  balance: { en: 'Balance', ar: 'الرصيد' },
  again: { en: 'Start again', ar: 'ابدأ من جديد' },
  change: { en: 'Money to change', ar: 'المال المراد صرفه' },
  to: { en: 'Change into', ar: 'حوّل إلى' },
  fair: { en: 'Fair value', ar: 'القيمة العادلة' },
  get: { en: 'You receive', ar: 'تستلم' },
  margin: { en: 'Exchange house keeps', ar: 'يحتفظ محل الصرافة بـ' },
  rateNote: { en: 'Example rates. Real rates change every day.', ar: 'أسعار للتوضيح. الأسعار الحقيقية تتغير كل يوم.' },
  repair: { en: 'Car repair (this month)', ar: 'إصلاح السيارة (هذا الشهر)' },
  savingsRate: { en: 'Saved', ar: 'المدخر' },
  needAtLeast: { en: '(need at least {n})', ar: '(تحتاج {n} على الأقل)' },
  customersDay: { en: 'Customers a day', ar: 'الزبائن يومياً' },
  avgSpend: { en: 'Average spend per customer', ar: 'متوسط إنفاق الزبون' },
  foodCost: { en: 'Food & drink cost (% of sales)', ar: 'تكلفة الطعام والشراب (٪ من المبيعات)' },
  staff: { en: 'Staff wages (month)', ar: 'أجور الموظفين (شهرياً)' },
  rentM: { en: 'Rent (month)', ar: 'الإيجار (شهرياً)' },
  plRevenue: { en: 'Revenue (sales)', ar: 'الإيرادات (المبيعات)' },
  plCogs: { en: '− Cost of food & drinks', ar: '− تكلفة الطعام والشراب' },
  plGross: { en: '= Gross profit', ar: '= إجمالي الربح' },
  plStaff: { en: '− Staff', ar: '− الموظفون' },
  plRent: { en: '− Rent', ar: '− الإيجار' },
  plBills: { en: '− Electricity & other bills', ar: '− الكهرباء والفواتير الأخرى' },
  plNet: { en: '= Net profit', ar: '= صافي الربح' },
  daysOpen: { en: '{n} days open a month', ar: 'مفتوح {n} يوماً في الشهر' },
  breakEvenDay: { en: 'Break-even: {n} customers a day', ar: 'نقطة التعادل: {n} زبوناً يومياً' },
  debtOwe: { en: 'You owe (card at {apr}% a year)', ar: 'عليك (بطاقة بفائدة {apr}٪ سنوياً)' },
  monthlyPay: { en: 'You pay each month', ar: 'تدفع كل شهر' },
  yourPlan: { en: 'Your plan', ar: 'خطتك' },
  minPlan: { en: 'Minimum payments only', ar: 'الحد الأدنى فقط' },
  monthsFree: { en: 'Months to be debt-free', ar: 'أشهر حتى التحرر من الدين' },
  interestTotal: { en: 'Interest paid', ar: 'الفائدة المدفوعة' },
  never: { en: 'Never! The interest grows faster', ar: 'أبداً! الفائدة تنمو أسرع' },
  years: { en: '{n} years', ar: '{n} سنوات' },
  chequeTitle: { en: 'Practice cheque', ar: 'شيك تدريبي' },
  date: { en: 'Date', ar: 'التاريخ' },
  today: { en: 'Tap for today', ar: 'اضغط لتاريخ اليوم' },
  payTo: { en: 'Pay to', ar: 'ادفعوا لأمر' },
  amountFig: { en: 'Amount in numbers', ar: 'المبلغ بالأرقام' },
  amountWords: { en: 'Amount in words', ar: 'المبلغ بالحروف' },
  signHere: { en: 'Tap to sign', ar: 'اضغط للتوقيع' },
  chequeOk: { en: 'Valid cheque! {bank} will pay {payee} when it clears.', ar: 'شيك صالح! سيدفع {bank} لـ{payee} عند صرفه.' },
  chequeMismatch: { en: 'The words and numbers don’t match. The bank would refuse this cheque.', ar: 'الحروف والأرقام غير متطابقة. سيرفض البنك هذا الشيك.' },
  chequeMissing: { en: 'Fill in every part, then sign.', ar: 'املأ كل جزء ثم وقّع.' },
  price: { en: 'Price per cup', ar: 'سعر الكوب' },
  customers: { en: 'Customers', ar: 'الزبائن' },
  revenue: { en: 'Revenue', ar: 'الإيرادات' },
  costsL: { en: 'Costs', ar: 'التكاليف' },
  profitL: { en: 'Profit', ar: 'الربح' },
  breakEven: { en: 'Break-even', ar: 'نقطة التعادل' },
  cups: { en: 'cups', ar: 'كوب' },
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


function Payslip({ params }) {
  const { tx, money } = useT();
  const [basic, setBasic] = useState(params.basic || 12000);
  const [allow, setAllow] = useState(params.allowances || 3000);
  const [pension, setPension] = useState(0);
  const [tax, setTax] = useState(0);
  const r = S.payslip({ basic, allowances: allow, pensionPct: pension, taxPct: tax });
  return (
    <div className="space-y-3">
      <Slider label={tx(L.basic)} value={basic} min={1000} max={40000} step={500} onChange={setBasic} format={money} />
      <Slider label={tx(L.allowances)} value={allow} min={0} max={15000} step={500} onChange={setAllow} format={money} />
      <Slider label={tx(L.pension)} value={pension} min={0} max={15} step={0.5} onChange={setPension} format={(v) => `${v}%`} />
      <Slider label={tx(L.tax)} value={tax} min={0} max={40} onChange={setTax} format={(v) => (v ? `${v}%` : `0% · ${tx(L.uaeNote)}`)} />
      <div className="rounded-2xl border-2 border-dashed border-line bg-surface p-3 font-bold text-sm space-y-1">
        <div className="flex justify-between"><span>{tx(L.gross)}</span><span>{money(r.gross)}</span></div>
        {r.pension > 0 && <div className="flex justify-between text-ember"><span>− {tx(L.pension)}</span><span>{money(r.pension)}</span></div>}
        {r.tax > 0 && <div className="flex justify-between text-ember"><span>− {tx(L.tax)}</span><span>{money(r.tax)}</span></div>}
      </div>
      <Stat label={`🏦 ${tx(L.net)}`} value={money(r.net)} tone="bg-leaf-pale" />
    </div>
  );
}

const BUDGET_KEYS = ['rent', 'food', 'bills', 'school', 'transport', 'emergency', 'savings', 'fun'];
const BUDGET_SHARE = { rent: 0.35, food: 0.15, bills: 0.07, school: 0.15, transport: 0.08, emergency: 0.05, savings: 0.05, fun: 0.08 };
function Budget({ params, onGoal }) {
  const { tx, money } = useT();
  const { age } = useGame();
  const income = pickAge(params.income, age) || 16000;
  const step = income >= 5000 ? 250 : 5;
  const locked = params.lockFixed ? ['rent', 'school'] : [];
  const surprise = params.surpriseShare ? Math.round((income * params.surpriseShare) / step) * step : 0;
  const startFactor = params.start === 'over' ? 1.14 : 1;
  // Savings round up so a challenge starts with savings on target; the puzzle is fitting everything else in.
  const roundFor = (k) => (k === 'savings' || k === 'emergency' ? Math.ceil : Math.round);
  const [alloc, setAlloc] = useState(() => Object.fromEntries(BUDGET_KEYS.map((k) => [k, roundFor(k)((income * BUDGET_SHARE[k] * (locked.includes(k) ? 1 : startFactor)) / step) * step])));
  const [surpriseResult, setSurpriseResult] = useState(null);
  const sum = S.budgetSummary(income, { ...alloc, ...(surprise ? { repair: surprise } : {}) });
  const target = params.target;
  // Savings goals are amounts ("at least 1,600"), which children find easier than percentages.
  const minSaved = target ? pickAge(target.minSavings, age) ?? ((target.minSavingsPct || 0) * income) / 100 : 0;
  const met = !!target && sum.balanced && sum.saved >= minSaved;
  useEffect(() => {
    if (onGoal) onGoal(met);
  }, [met]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="space-y-2">
      <Stat label={tx(L.income)} value={money(income)} />
      {BUDGET_KEYS.map((k) => (
        <div key={k} className={locked.includes(k) ? 'opacity-70' : ''}>
          <Slider label={`${tx(L[k])}${locked.includes(k) ? ' 🔒' : ''}`} value={alloc[k]} min={0} max={Math.round(income * 0.6)} step={step} onChange={(v) => { if (locked.includes(k)) return; setSurpriseResult(null); setAlloc((a) => ({ ...a, [k]: v })); }} format={money} />
        </div>
      ))}
      {surprise > 0 && <div className="rounded-2xl bg-ember-pale p-3 font-bold flex justify-between"><span>🚗💥 {tx(L.repair)} 🔒</span><span>{money(surprise)}</span></div>}
      <div className={`rounded-2xl p-3 text-center font-extrabold ${sum.balanced ? 'bg-leaf-pale' : 'bg-ember-pale'}`} role="status">
        {sum.balanced ? tx(L.balanced) : tx(L.over)} · {tx(L.left)}: {money(sum.left)}
        {target && <div className="text-sm font-bold">🐷 {tx(L.savingsRate)}: {money(sum.saved)} {sum.saved >= minSaved ? '✓' : tx(L.needAtLeast, { n: money(minSaved) })}</div>}
      </div>
      {!target && (
        <button type="button" className="btn-ghost w-full" onClick={() => setSurpriseResult(S.coverSurprise({ emergency: alloc.emergency, savings: alloc.savings }, Math.round(income * 0.08)))}>
          🚗💥 {tx(L.surprise)} ({money(Math.round(income * 0.08))})
        </button>
      )}
      {surpriseResult && (
        <p className={`rounded-2xl p-3 font-bold ${surpriseResult.covered ? 'bg-leaf-pale' : 'bg-sun-pale'}`} role="status">
          {surpriseResult.covered ? tx(L.covered) : `${tx(L.short)} ${money(surpriseResult.shortfall)} 😬`}
        </p>
      )}
    </div>
  );
}

function Atm() {
  const { tx, lang } = useT();
  const { city } = useGame();
  const { notes, amounts, odd } = city.atm;
  const limit = Math.round(amounts[amounts.length - 1] * 0.8);
  const aed = (n) => (lang === 'ar' ? `${n} ${city.currency}` : `${city.currency} ${n}`);
  const [balance, setBalance] = useState(amounts[3] * 2);
  const [stage, setStage] = useState('insert');
  const [pin, setPin] = useState('');
  const [pinErr, setPinErr] = useState(false);
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(0);
  const go = (amount) => {
    const r = S.withdraw({ balance, amount, dailyLimit: limit, notes });
    setResult({ ...r, amount });
    setStage('processing');
    setStep(0);
    [1, 2, 3].forEach((i) => setTimeout(() => setStep(i), i * 700));
    setTimeout(() => {
      setStage(r.ok ? 'cash' : 'declined');
      if (r.ok) setBalance(r.balance);
    }, 2400);
  };
  const press = (d) => {
    const p = (pin + d).slice(0, 4);
    setPin(p);
    if (p.length === 4) {
      if (p === '1234') { setStage('amount'); setPinErr(false); } else setPinErr(true);
      setTimeout(() => setPin(''), 200);
    }
  };
  return (
    <div className="rounded-2xl bg-[#1E2A3A] text-white p-4 space-y-3" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between text-sm font-bold"><span>🏧 ATM</span><span>{tx(L.balance)}: {aed(balance)}</span></div>
      <div className="rounded-xl bg-[#1d4f6e] p-3 min-h-[150px] flex flex-col items-center justify-center text-center gap-2" aria-live="polite">
        {stage === 'insert' && <button className="btn-sun" onClick={() => setStage('pin')}>💳 {tx(L.insert)}</button>}
        {stage === 'pin' && (
          <>
            <p className="font-bold">{tx(L.enterPin)}</p>
            <p className="text-2xl tracking-[0.5em]" dir="ltr">{'•'.repeat(pin.length).padEnd(4, '○')}</p>
            {pinErr && <p className="text-sun font-bold">{tx(L.wrongPin)}</p>}
            <div className="grid grid-cols-5 gap-1" dir="ltr">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((d) => <button key={d} onClick={() => press(d)} className="w-11 h-11 rounded-lg bg-white/90 text-[#1E2A3A] font-extrabold">{d}</button>)}
            </div>
          </>
        )}
        {stage === 'amount' && (
          <>
            <p className="font-bold">{tx(L.chooseAmount)}</p>
            <div className="grid grid-cols-3 gap-2">
              {amounts.map((a) => <button key={a} onClick={() => go(a)} className="min-h-[44px] px-2 rounded-lg bg-white/90 text-[#1E2A3A] font-extrabold">{aed(a)}</button>)}
              <button onClick={() => go(odd)} className="min-h-[44px] px-2 rounded-lg bg-white/90 text-[#1E2A3A] font-extrabold">{aed(odd)}</button>
            </div>
          </>
        )}
        {stage === 'processing' && (
          <ol className="text-start space-y-1 font-bold">
            {[L.network, L.bankCheck, result?.ok ? L.approved : L.declined].map((l, i) => (
              <li key={i} className={step > i ? 'opacity-100' : 'opacity-30'}>{step > i ? '✅' : '⏳'} {tx(l)}</li>
            ))}
          </ol>
        )}
        {stage === 'cash' && (
          <>
            <motion.div className="flex gap-1 flex-wrap justify-center" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              {Object.entries(result.notes).flatMap(([n, k]) => Array.from({ length: k }, (_, i) => <span key={n + i} className="rounded bg-leaf px-2 py-1 font-extrabold text-sm">💵 {n}</span>))}
            </motion.div>
            <p className="font-bold">{tx(L.takeCash)}</p>
          </>
        )}
        {stage === 'declined' && <p className="font-bold text-sun">⛔ {tx(L.declined)}: {tx(L[result.reason], { min: aed(Math.min(...notes)) })}</p>}
      </div>
      {(stage === 'cash' || stage === 'declined') && <button className="btn-ghost w-full text-ink" onClick={() => { setStage('insert'); setResult(null); }}>↻ {tx(L.again)}</button>}
    </div>
  );
}

const FX = [['AED', '🇦🇪'], ['USD', '🇺🇸'], ['EUR', '🇪🇺'], ['GBP', '🇬🇧'], ['SAR', '🇸🇦'], ['INR', '🇮🇳'], ['PKR', '🇵🇰'], ['PHP', '🇵🇭']];
const nice = (n) => {
  const p = Math.pow(10, Math.floor(Math.log10(n)));
  return Math.max(1, Math.round(n / p) * p);
};
function Currency() {
  const { tx } = useT();
  const { city } = useGame();
  const base = city.currency;
  const per = 1 / S.EXAMPLE_RATES[base];
  const [min, max, step] = [nice(100 * per), nice(10000 * per), nice(100 * per)];
  const [amount, setAmount] = useState(nice(1000 * per));
  const choices = FX.filter(([c]) => c !== base);
  const [to, setTo] = useState(choices.find(([c]) => c === (base === 'USD' ? 'EUR' : 'USD'))[0]);
  const q = S.exchangeQuote(amount, base, to, { marginPct: 2 });
  const fmt = (n, c) => new Intl.NumberFormat('en', { style: 'currency', currency: c, maximumFractionDigits: 2 }).format(n);
  return (
    <div className="space-y-3">
      <Slider label={`${city.flag} ${tx(L.change)}`} value={amount} min={min} max={max} step={step} onChange={setAmount} format={(v) => fmt(v, base)} />
      <p className="font-bold">{tx(L.to)}</p>
      <div className="flex flex-wrap gap-2">
        {choices.map(([c, f]) => <button key={c} onClick={() => setTo(c)} aria-pressed={to === c} className={`min-h-[44px] px-3 rounded-xl border-2 font-bold ${to === c ? 'border-ink bg-ink text-cream' : 'border-line bg-surface'}`}>{f} {c}</button>)}
      </div>
      <p className="text-sm font-bold text-center" dir="ltr">1 {to} ≈ {S.convert(1, to, base)} {base}</p>
      <div className="grid grid-cols-3 gap-2">
        <Stat label={tx(L.fair)} value={fmt(q.fair, to)} />
        <Stat label={tx(L.get)} value={fmt(q.received, to)} tone="bg-leaf-pale" />
        <Stat label={tx(L.margin)} value={fmt(q.cost, to)} tone="bg-sun-pale" />
      </div>
      <p className="text-xs text-soft">ℹ️ {tx(L.rateNote)}</p>
    </div>
  );
}

function Stand({ params }) {
  const { tx, money } = useT();
  const unitCost = params.unitCost ?? 2;
  const fixedCosts = params.fixedCosts ?? 50;
  const [price, setPrice] = useState(5);
  const sold = S.demand({ price, base: 100, sensitivity: 8 });
  const r = S.pnl({ price, unitCost, unitsSold: sold, fixedCosts });
  const be = S.breakEvenUnits(price, unitCost, fixedCosts);
  return (
    <div className="space-y-3">
      <Slider label={`🍋 ${tx(L.price)}`} value={price} min={0.5} max={12} step={0.5} onChange={setPrice} format={money} />
      <div className="rounded-2xl bg-sky-pale p-2 text-center" aria-label={`${sold} ${tx(L.customers)}`}>
        <div className="text-xs font-bold">{tx(L.customers)}: {sold}</div>
        <div className="text-lg leading-tight break-all" aria-hidden>{'🧍'.repeat(Math.ceil(sold / 5))}</div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label={tx(L.revenue)} value={money(r.revenue)} />
        <Stat label={tx(L.costsL)} value={money(r.variableCosts + r.fixedCosts)} />
        <Stat label={tx(L.profitL)} value={`${r.profit >= 0 ? '▲' : '▼'} ${money(r.profit)}`} tone={r.profit >= 0 ? 'bg-leaf-pale' : 'bg-ember-pale'} />
      </div>
      <p className="text-sm font-bold">⚖️ {tx(L.breakEven)}: {Number.isFinite(be) ? `${be} ${tx(L.cups)}` : '∞'}</p>
    </div>
  );
}

const CHEQUE_PAYEES = [
  { id: 'bakery', en: "Sara's Bakery", ar: 'مخبز سارة' },
  { id: 'school', en: 'Book Fair', ar: 'معرض الكتاب' },
  { id: 'gym', en: 'Football Club', ar: 'نادي كرة القدم' },
];
const CHEQUE_AMOUNTS = [
  { n: 250, en: 'Two hundred and fifty only', ar: 'مئتان وخمسون فقط' },
  { n: 25, en: 'Twenty-five only', ar: 'خمسة وعشرون فقط' },
  { n: 2500, en: 'Two thousand five hundred only', ar: 'ألفان وخمسمئة فقط' },
];
function Cheque() {
  const { tx, money, lang } = useT();
  const { bank } = useGame();
  const [date, setDate] = useState('');
  const [payee, setPayee] = useState(null);
  const [fig, setFig] = useState(null);
  const [words, setWords] = useState(null);
  const [signed, setSigned] = useState(false);
  const complete = date && payee && fig && words && signed;
  const match = fig && words && fig === words;
  const chip = (on) => `min-h-[40px] px-3 rounded-xl border-2 text-sm font-bold ${on ? 'border-ink bg-ink text-cream' : 'border-line bg-surface'}`;
  return (
    <div className="space-y-3">
      <div className="rounded-xl border-2 border-dashed border-line p-3 space-y-2 text-sm" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 22px, rgb(var(--c-line) / .5) 22px 23px)' }}>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-extrabold"><BrandMark brand={bank} size={26} /> {tx(bank.name)}</span>
          <button type="button" className={chip(!!date)} onClick={() => setDate(new Date().toLocaleDateString(lang === 'ar' ? 'ar-AE-u-nu-latn' : 'en-GB'))}>📅 {date || tx(L.today)}</button>
        </div>
        <div>
          <p className="font-bold">{tx(L.payTo)}</p>
          <div className="flex flex-wrap gap-1">{CHEQUE_PAYEES.map((p) => <button type="button" key={p.id} className={chip(payee?.id === p.id)} onClick={() => setPayee(p)}>{p[lang] || p.en}</button>)}</div>
        </div>
        <div>
          <p className="font-bold">{tx(L.amountFig)}</p>
          <div className="flex flex-wrap gap-1">{CHEQUE_AMOUNTS.map((a) => <button type="button" key={a.n} className={chip(fig === a.n)} onClick={() => setFig(a.n)}>{money(a.n)}</button>)}</div>
        </div>
        <div>
          <p className="font-bold">{tx(L.amountWords)}</p>
          <div className="flex flex-wrap gap-1">{CHEQUE_AMOUNTS.map((a) => <button type="button" key={a.n} className={chip(words === a.n)} onClick={() => setWords(a.n)}>{a[lang] || a.en}</button>)}</div>
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={() => setSigned(true)} className="min-h-[44px] px-4 border-b-2 border-ink font-bold" aria-label={tx(L.signHere)}>
            {signed ? <span className="font-display text-xl italic">✍️ ~〰️~</span> : tx(L.signHere)}
          </button>
        </div>
      </div>
      <p className={`rounded-2xl p-3 font-bold ${complete && match ? 'bg-leaf-pale' : complete ? 'bg-ember-pale' : 'bg-sun-pale'}`} role="status">
        {complete ? (match ? `✅ ${tx(L.chequeOk, { payee: payee[lang] || payee.en })}` : `⚠️ ${tx(L.chequeMismatch)}`) : `✍️ ${tx(L.chequeMissing)}`}
      </p>
    </div>
  );
}

function Cafe({ params, onGoal }) {
  const { tx, money } = useT();
  const fix = params.mode === 'fix';
  const days = params.daysOpen || 26;
  const [customers, setCustomers] = useState(params.customersPerDay ?? 80);
  const [spend, setSpend] = useState(params.avgSpend ?? 25);
  const [food, setFood] = useState(params.foodCostPct ?? 30);
  const [staff, setStaff] = useState(params.staff ?? 18000);
  const rent = params.rent ?? 12000;
  const utilities = params.utilities ?? 3000;
  const p = S.cafePnl({ customersPerDay: customers, avgSpend: spend, daysOpen: days, foodCostPct: food, staff, rent, utilities });
  const be = S.cafeBreakEvenCustomers({ avgSpend: spend, daysOpen: days, foodCostPct: food, staff, rent, utilities });
  const met = !!params.target && p.netProfit >= (params.target.minProfit ?? 1);
  useEffect(() => {
    if (onGoal) onGoal(met);
  }, [met]); // eslint-disable-line react-hooks/exhaustive-deps
  const row = (label, v, strong, tone) => (
    <div className={`flex justify-between gap-2 px-3 py-1.5 ${strong ? 'font-extrabold border-t border-line' : ''} ${tone || ''}`}>
      <span>{tx(label)}</span>
      <span className="tabular-nums">{money(v)}</span>
    </div>
  );
  return (
    <div className="space-y-3">
      <Slider label={`🧍 ${tx(L.customersDay)}`} value={customers} min={10} max={200} step={5} onChange={setCustomers} />
      <Slider label={`🧾 ${tx(L.avgSpend)}`} value={spend} min={5} max={80} onChange={setSpend} format={money} />
      <Slider label={`🥘 ${tx(L.foodCost)}`} value={food} min={20} max={60} onChange={setFood} format={(v) => `${v}%`} />
      {fix && <Slider label={`🧑‍🍳 ${tx(L.staff)}`} value={staff} min={10000} max={40000} step={1000} onChange={setStaff} format={money} />}
      <p className="text-xs text-soft">📅 {tx(L.daysOpen, { n: days })}</p>
      <div className="rounded-2xl border border-line bg-surface text-sm" role="table" aria-label="P&L">
        {row(L.plRevenue, p.revenue, true)}
        {row(L.plCogs, p.cogs)}
        {row(L.plGross, p.grossProfit, true)}
        {row(L.plStaff, staff)}
        {row(L.plRent, rent)}
        {row(L.plBills, utilities)}
        {row(L.plNet, p.netProfit, true, p.netProfit >= 0 ? 'bg-leaf-pale rounded-b-2xl' : 'bg-ember-pale rounded-b-2xl')}
      </div>
      <p className="text-sm font-bold">{p.netProfit >= 0 ? '▲' : '▼'} {Math.round(p.netMargin)}% · ⚖️ {tx(L.breakEvenDay, { n: Number.isFinite(be) ? be : '∞' })}</p>
    </div>
  );
}

function Debt({ params, onGoal }) {
  const { tx, money, t } = useT();
  const balance = params.balance ?? 1000;
  const apr = params.apr ?? 36;
  const [pay, setPay] = useState(40);
  const plan = S.payoffMonths(balance, apr, pay);
  const min = S.minimumPaymentPayoff(balance, apr, { minPct: 3, minFloor: 25 });
  const maxMonths = params.target?.maxMonths;
  const met = !!maxMonths && Number.isFinite(plan.months) && plan.months <= maxMonths;
  useEffect(() => {
    if (onGoal) onGoal(met);
  }, [met]); // eslint-disable-line react-hooks/exhaustive-deps
  const fmtMonths = (m) => (!Number.isFinite(m) ? tx(L.never) : m >= 24 ? `${m} (${tx(L.years, { n: (m / 12).toFixed(1) })})` : String(m));
  const maxBar = Math.max(Number.isFinite(min.months) ? min.months : 0, Number.isFinite(plan.months) ? plan.months : 0, 1);
  return (
    <div className="space-y-3">
      <Stat label={`🐉 ${tx(L.debtOwe, { apr })}`} value={money(balance)} tone="bg-ember-pale" />
      <Slider label={tx(L.monthlyPay)} value={pay} min={30} max={300} step={5} onChange={setPay} format={money} />
      {[[L.yourPlan, plan, 'bg-leaf'], [L.minPlan, min, 'bg-ember']].map(([label, r, color]) => (
        <div key={label.en} className="rounded-2xl border border-line bg-surface p-3">
          <p className="font-extrabold">{tx(label)}</p>
          <div className="h-3 rounded-full bg-soft/20 mt-1 overflow-hidden" aria-hidden>
            <motion.div className={`h-full ${color}`} animate={{ width: `${Number.isFinite(r.months) ? Math.max(4, (r.months / maxBar) * 100) : 100}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
            <span>📅 {tx(L.monthsFree)}: <b>{fmtMonths(r.months)}</b></span>
            <span>💸 {tx(L.interestTotal)}: <b>{Number.isFinite(r.interestPaid) ? money(r.interestPaid) : '∞'}</b></span>
          </div>
        </div>
      ))}
      {maxMonths && <p className="text-xs text-soft">🎯 ≤ {maxMonths} {t('common.months')}</p>}
    </div>
  );
}

export const SIMS = { savingsGoal: SavingsGoal, jars: Jars, compound: Compound, loan: Loan, bankSpread: BankSpread, profitShare: ProfitShare, payslip: Payslip, budget: Budget, atm: Atm, currency: Currency, stand: Stand, cheque: Cheque, cafe: Cafe, debt: Debt };
