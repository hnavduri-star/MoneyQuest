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
  const voice = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith(lang.slice(0, 2)));
  if (voice) u.voice = voice;
  synth.speak(u);
}
export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}
