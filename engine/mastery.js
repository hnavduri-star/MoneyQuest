import { addDays } from './dates.js';

/** Leitner boxes -> days until next review. */
export const INTERVALS = [0, 1, 2, 4, 7, 15, 30];
export const MAX_BOX = INTERVALS.length - 1;

export function blankConcept() {
  return { score: 0, box: 0, due: null, seen: 0, correct: 0, lastBoxDay: null };
}

/**
 * Update a concept after an answer. Lessons can raise the score to at most `lessonCap`;
 * reaching "Mastered" needs spaced reviews on separate days (box moves at most once a day).
 */
export function updateConcept(c, correct, day, { review = false, lessonCap = 70 } = {}) {
  const n = { ...blankConcept(), ...c };
  n.seen += 1;
  if (correct) {
    n.correct += 1;
    const gain = review ? 20 : 10;
    const cap = review ? 100 : Math.max(lessonCap, n.score);
    n.score = Math.min(cap, n.score + gain);
    if (n.lastBoxDay !== day) {
      n.box = Math.min(MAX_BOX, n.box + 1);
      n.lastBoxDay = day;
    }
  } else {
    n.score = Math.max(0, n.score - 5);
    if (review) n.box = Math.max(1, n.box - 1);
  }
  n.due = addDays(day, INTERVALS[Math.max(1, n.box)]);
  return n;
}

export function masteryLevel(c) {
  if (!c) return 'new';
  if (c.score >= 80 && c.box >= 3) return 'mastered';
  if (c.score >= 40) return 'practising';
  return 'learning';
}

export function dueConcepts(mastery, day) {
  return Object.entries(mastery || {})
    .filter(([, c]) => c.due && c.due <= day && c.lastBoxDay !== day)
    .sort((a, b) => (a[1].due < b[1].due ? -1 : 1))
    .map(([id]) => id);
}

export function countMastered(mastery, ids) {
  const list = ids || Object.keys(mastery || {});
  return list.filter((id) => masteryLevel(mastery?.[id]) === 'mastered').length;
}

export function averageScore(mastery, ids) {
  if (!ids.length) return 0;
  return ids.reduce((s, id) => s + (mastery?.[id]?.score || 0), 0) / ids.length;
}
