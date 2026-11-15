/**
 * Turns raw JSON content into an indexed, ready-to-use content object.
 * Both the app and the tests call this, so content is validated the same way everywhere.
 */
function deepReplace(v, n) {
  if (v === '$n') return n;
  if (typeof v === 'string') return v.replaceAll('{n}', String(n));
  if (Array.isArray(v)) return v.map((x) => deepReplace(x, n));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepReplace(x, n)]));
  return v;
}

export function expandBadgeSeries(series) {
  const out = [];
  for (const s of series) {
    for (const tier of s.tiers) {
      out.push({
        id: `${s.id}-${tier.n}`,
        series: s.id,
        icon: s.icon,
        rarity: tier.rarity,
        category: s.category || 'progress',
        name: deepReplace(s.name, tier.n),
        desc: deepReplace(s.desc, tier.n),
        criteria: deepReplace(s.criteria, tier.n),
      });
    }
  }
  return out;
}

/** Concepts taught by a world's required (non-optional) levels. */
export function worldConcepts(world, { includeOptional = false } = {}) {
  const set = new Set();
  for (const node of world.nodes || []) {
    if (node.optional && !includeOptional) continue;
    for (const c of node.concepts || []) set.add(c);
    for (const st of node.steps || []) if (st.concept) set.add(st.concept);
    for (const it of node.config?.items || []) if (it.concept) set.add(it.concept);
  }
  return [...set];
}

/** Auto badges every playable world gets (finish + master), so a new world file needs no badge edits. */
function worldBadges(world) {
  const b = world.badge || {};
  return [
    { id: b.id || `world-${world.id}`, icon: b.icon || world.icon, rarity: b.rarity || 'rare', category: 'worlds', name: b.name || world.name, desc: b.desc || { en: 'Finish this world', ar: 'أكمل هذا العالم' }, criteria: { worldComplete: world.id } },
    { id: `master-${world.id}`, icon: '🎓', rarity: 'legendary', category: 'worlds', name: { en: `${world.name.en} Master`, ar: `خبير ${world.name.ar || world.name.en}` }, desc: { en: 'Master every skill in this world', ar: 'أتقن كل مهارات هذا العالم' }, criteria: { masteredWorld: world.id } },
  ];
}

export function buildContent(raw) {
  const worlds = {};
  for (const w of raw.worlds) {
    const nodes = w.nodes.map((n, i) => ({ ...n, index: i, required: !n.optional }));
    worlds[w.id] = { ...w, nodes, conceptNames: w.concepts || {}, concepts: worldConcepts(w), allConcepts: worldConcepts(w, { includeOptional: true }) };
  }
  const worldIndex = raw.worldIndex.worlds.map((meta) => ({ ...meta, playable: !!worlds[meta.id] && meta.available !== false }));
  const badges = [...(raw.badges.badges || []), ...expandBadgeSeries(raw.badges.series || [])];
  for (const meta of worldIndex) if (meta.playable) badges.push(...worldBadges(worlds[meta.id]));
  const badgeMap = Object.fromEntries(badges.map((b) => [b.id, b]));
  const items = Object.fromEntries((raw.shop.items || []).map((i) => [i.id, i]));
  // concept -> list of review questions drawn from every world step tagged with it
  const conceptQuestions = {};
  for (const w of Object.values(worlds))
    for (const n of w.nodes)
      for (const st of n.steps || [])
        if (st.concept && ['choice', 'number'].includes(st.type)) (conceptQuestions[st.concept] ||= []).push({ ...st, worldId: w.id });
  const cities = raw.cities || { defaultCity: 'dubai', cities: [] };
  const editions = raw.editions || { defaultEdition: 'standard', banks: {}, schools: {}, editions: [] };
  const cityMap = Object.fromEntries(cities.cities.map((c) => [c.id, c]));
  const editionMap = Object.fromEntries(editions.editions.map((e) => [e.id, e]));
  const conceptIndex = {};
  for (const w of Object.values(worlds)) for (const id of w.allConcepts) conceptIndex[id] = { id, worldId: w.id, name: w.conceptNames[id] || { en: id } };
  return {
    ...raw,
    conceptIndex,
    cities,
    editions,
    cityMap,
    editionMap,
    worlds,
    worldIndex,
    badges,
    badgeMap,
    items,
    conceptQuestions,
  };
}
