/** Read text aloud with the device's own speech engine (nothing leaves the device). */
let enabled = false;
export const setVoiceEnabled = (v) => {
  enabled = v;
  if (!v) stopSpeaking();
};
export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text, { lang = 'en-US', pitch = 1.1, rate = 0.95, force = false } = {}) {
  if ((!enabled && !force) || !canSpeak() || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ''));
  u.lang = lang;
  u.pitch = pitch;
  u.rate = rate;
  // Prefer the most natural-sounding voice the device offers (neural/enhanced voices first).
  const voices = synth.getVoices().filter((v) => v.lang?.toLowerCase().startsWith(lang.slice(0, 2)));
  const score = (v) => (/(natural|neural|enhanced|premium)/i.test(v.name) ? 3 : 0) + (/(google|samantha|daniel|karen|moira|tessa|maged|laila)/i.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1);
  const voice = voices.sort((a, b) => score(b) - score(a))[0];
  if (voice) u.voice = voice;
  synth.speak(u);
}
export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}
