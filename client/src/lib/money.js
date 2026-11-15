/** Display amounts in the child's chosen currency. All in-lesson numbers are plain amounts. */
export const CURRENCIES = [
  { id: 'AED', name: { en: 'UAE dirham', ar: 'درهم إماراتي' } },
  { id: 'SAR', name: { en: 'Saudi riyal', ar: 'ريال سعودي' } },
  { id: 'USD', name: { en: 'US dollar', ar: 'دولار أمريكي' } },
  { id: 'EUR', name: { en: 'Euro', ar: 'يورو' } },
  { id: 'INR', name: { en: 'Indian rupee', ar: 'روبية هندية' } },
  { id: 'GEMS', name: { en: 'Pretend Gems ✦', ar: 'جواهر خيالية ✦' } },
];
const LOCALE = { en: { INR: 'en-IN', default: 'en-GB' }, ar: { default: 'ar-AE-u-nu-latn' } };

/** `scale` multiplies lesson amounts so prices feel local (e.g. ×10 in rupees). */
export function makeMoney(currency = 'AED', lang = 'en', scale = 1) {
  const locale = LOCALE[lang]?.[currency] || LOCALE[lang]?.default || 'en-GB';
  if (currency === 'GEMS') {
    const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    return (n) => `${nf.format(n * scale)} ✦`;
  }
  const nf = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2, minimumFractionDigits: 0 });
  return (n) => nf.format(n * scale);
}
export function currencySymbol(currency, lang) {
  if (currency === 'GEMS') return '✦';
  return makeMoney(currency, lang)(0).replace(/[\d.,\s٠]/g, '').trim();
}
/** Parse a typed number, accepting Arabic-Indic digits and either decimal mark. */
export function parseNumber(s) {
  const western = String(s)
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/٫/g, '.')
    .replace(/,/g, '.')
    .replace(/[^\d.-]/g, '');
  return western === '' ? NaN : Number(western);
}
