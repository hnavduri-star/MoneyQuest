/** Content checks. Returns a list of human-readable problems ([] means OK). */
const STEP_TYPES = ['story', 'choice', 'sort', 'number', 'sim'];
const NODE_KINDS = ['lesson', 'quiz', 'minigame', 'boss'];
const RARITIES = ['common', 'rare', 'epic', 'legendary'];
const ITEM_TYPES = ['outfit', 'pet', 'decoration', 'mascotSkin', 'hat'];

export function validateContent(c, { sims = [], games = [] } = {}) {
  const errs = [];
  const need = (cond, msg) => cond || errs.push(msg);
  const hasEn = (v, where) => need(v && (typeof v === 'string' || v.en || v.default || v['7-9'] || v['10-12']), `${where}: missing English text`);

  const seenWorld = new Set();
  for (const meta of c.worldIndex) {
    need(!seenWorld.has(meta.id), `worlds/index.json: duplicate world id "${meta.id}"`);
    seenWorld.add(meta.id);
    for (const r of meta.requires || []) need(c.worldIndex.some((w) => w.id === r), `world ${meta.id}: requires unknown world "${r}"`);
  }
  for (const w of Object.values(c.worlds)) {
    need(seenWorld.has(w.id), `world ${w.id}: not listed in worlds/index.json`);
    hasEn(w.name, `world ${w.id} name`);
    need(w.nodes.length >= 1, `world ${w.id}: has no levels`);
    const ids = new Set();
    for (const n of w.nodes) {
      const where = `world ${w.id} / ${n.id}`;
      need(!ids.has(n.id), `${where}: duplicate node id`);
      ids.add(n.id);
      need(NODE_KINDS.includes(n.kind), `${where}: kind must be one of ${NODE_KINDS.join(', ')}`);
      hasEn(n.title, `${where} title`);
      if (n.kind === 'minigame') {
        need(!games.length || games.includes(n.game), `${where}: unknown mini-game "${n.game}"`);
        need((n.config?.items || []).length >= 4, `${where}: mini-game needs at least 4 items`);
        for (const it of n.config?.items || []) need((n.config.bins || []).some((b) => b.id === it.bin), `${where}: item "${it.text?.en}" has unknown bin "${it.bin}"`);
      } else {
        need((n.steps || []).length > 0, `${where}: has no steps`);
        if (n.kind === 'lesson') need(n.steps?.[0]?.type === 'story', `${where}: a lesson must start with an explanation (story step)`);
      }
      (n.steps || []).forEach((st, i) => {
        const sw = `${where} step ${i + 1}`;
        need(STEP_TYPES.includes(st.type), `${sw}: unknown step type "${st.type}"`);
        if (st.type === 'story') hasEn(st.text, sw);
        if (st.type === 'choice') {
          hasEn(st.prompt, sw);
          need((st.options || []).length >= 2, `${sw}: needs 2+ options`);
          need((st.options || []).some((o) => o.correct), `${sw}: no correct option`);
        }
        if (st.type === 'number') need(st.answer !== undefined, `${sw}: number step needs "answer"`);
        if (st.type === 'sort') for (const it of st.items || []) need((st.bins || []).some((b) => b.id === it.bin), `${sw}: item has unknown bin "${it.bin}"`);
        if (st.type === 'sim') need(!sims.length || sims.includes(st.sim), `${sw}: unknown sim "${st.sim}"`);
        if (st.type === 'sim' && st.params?.target) need(!!st.concept && !!st.explain && !!st.goalText, `${sw}: a goal sim needs "concept", "goalText" and "explain"`);
        // "Everything is explained": every answer comes with a why.
        if (['choice', 'number'].includes(st.type)) need(!!st.explain, `${sw}: question needs an "explain" (shown after answering)`);
        if (['choice', 'number', 'sort'].includes(st.type)) need(!!st.concept, `${sw}: question needs a "concept" for mastery tracking`);
        if (st.concept) need(!!w.conceptNames?.[st.concept], `${sw}: concept "${st.concept}" has no name in the world's "concepts" map`);
      });
    }
  }
  const seenBadge = new Set();
  for (const b of c.badges) {
    need(!seenBadge.has(b.id), `badges: duplicate id "${b.id}"`);
    seenBadge.add(b.id);
    need(RARITIES.includes(b.rarity), `badge ${b.id}: rarity must be ${RARITIES.join('/')}`);
    need(b.criteria && typeof b.criteria === 'object', `badge ${b.id}: missing criteria`);
    hasEn(b.name, `badge ${b.id} name`);
  }
  for (const it of Object.values(c.items)) {
    need(ITEM_TYPES.includes(it.type), `shop item ${it.id}: type must be ${ITEM_TYPES.join('/')}`);
    need(!it.price?.real, `shop item ${it.id}: real-money prices are not allowed`);
    hasEn(it.name, `shop item ${it.id} name`);
  }
  for (const q of [...(c.quests.daily || []), ...(c.quests.weekly || [])]) {
    need(q.target > 0 && q.event, `quest ${q.id}: needs "event" and a positive "target"`);
    hasEn(q.text, `quest ${q.id} text`);
  }
  need((c.rewards.chestCalendar || []).length === 7, 'rewards.json: chestCalendar must have 7 days');
  return errs;
}
