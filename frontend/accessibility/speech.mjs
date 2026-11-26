let sequence = 0;
export function stop() { sequence++; globalThis.speechSynthesis?.cancel(); }
export function localPortugueseVoices() {
  return globalThis.speechSynthesis?.getVoices().filter(v => v.localService && /^pt(-|_)/i.test(v.lang))
    .sort((a,b) => Number(/^pt[-_]BR$/i.test(b.lang))-Number(/^pt[-_]BR$/i.test(a.lang))) || [];
}
export function speak(text, volume, report) {
  stop();
  const voice = localPortugueseVoices()[0];
  if (!voice || !globalThis.SpeechSynthesisUtterance) {
    report(`Leitura indisponível: não há voz local em português neste dispositivo. Palavra: ${text}. Nenhum serviço externo foi acionado.`);
    return;
  }
  const id = sequence;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = .8; utterance.volume = Number(volume);
  utterance.onerror = () => {if (id === sequence) report('Não foi possível reproduzir a voz local. Você pode continuar sem som.');};
  report(`Leitura com voz local: ${voice.name} (${voice.lang}).`);
  speechSynthesis.speak(utterance);
}
