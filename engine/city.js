/**
 * Cities and partner editions turn generic lessons into local ones.
 * Lesson text may contain {placeholders}; contentVars() fills them for the chosen city, edition and language.
 */
import { tr } from './text.js';

export function getCity(content, cityId) {
  return content.cityMap[cityId] || content.cityMap[content.cities.defaultCity];
}
export function getEdition(content, editionId) {
  return content.editionMap[editionId] || content.editionMap[content.editions.defaultEdition];
}
export function getBank(content, edition) {
  return content.editions.banks[edition.bank] || content.editions.banks.town;
}
export function getSchool(content, edition) {
  return edition.school ? content.editions.schools[edition.school] || null : null;
}
/** Cities a given edition offers (an edition may limit itself to, say, Dubai and Abu Dhabi). */
export function editionCities(content, edition) {
  const all = content.cities.cities;
  return edition.cities ? all.filter((c) => edition.cities.includes(c.id)) : all;
}

/** Flat map of placeholder -> text for one city + edition + language (+ the current journey stop). */
export function contentVars(content, { cityId, editionId, lang = 'en', worldId } = {}) {
  const city = getCity(content, cityId);
  const edition = getEdition(content, editionId);
  const bank = getBank(content, edition);
  const school = getSchool(content, edition);
  const out = {};
  for (const [k, v] of Object.entries(city.vars)) out[k] = tr(v, lang);
  out.city = tr(city.name, lang);
  out.bank = tr(bank.name, lang);
  out.bankShort = tr(bank.short, lang);
  for (const [k, v] of Object.entries(bank.products)) out[k] = tr(v, lang);
  out.school = school ? tr(school.name, lang) : lang === 'ar' ? 'مدرستك' : 'your school';
  const stopWorld = worldId && city.stops[worldId];
  if (stopWorld) out.stop = tr(stopWorld.location, lang);
  return out;
}

/** Numbers a city provides for answers such as "{fxTen}", plus its region for region-only steps. */
export function cityContext(content, cityId) {
  const city = getCity(content, cityId);
  return { cityId: city.id, region: city.region, nums: city.nums, places: city.places, priceScale: city.priceScale || 1 };
}
