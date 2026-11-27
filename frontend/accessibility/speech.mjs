let sequence = 0, player, utterance;
function releaseAudio(audio) {
  audio.pause();audio.removeAttribute?.('src');audio.load?.();
}
export function stop() {
  sequence++;
  if (player) {releaseAudio(player); player = undefined;}
  utterance = undefined;
  globalThis.speechSynthesis?.cancel();
}
export function localPortugueseVoices() {
  return globalThis.speechSynthesis?.getVoices().filter(v => v.localService && /^pt(?:[-_]|$)/i.test(v.lang))
    .sort((a,b) => Number(/^pt[-_]BR$/i.test(b.lang))-Number(/^pt[-_]BR$/i.test(a.lang))) || [];
}
function localVoice(text, volume, report, id) {
  if (id !== sequence) return;
  const voice = localPortugueseVoices()[0];
  if (!voice || !globalThis.SpeechSynthesisUtterance) {
    report(`Não foi possível reproduzir o áudio. Não há voz local em português disponível. Palavra: ${text}. Confira o volume e tente novamente.`);
    return;
  }
  utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = .8; utterance.volume = volume;
  utterance.onstart = () => {if (id === sequence) report('Reproduzindo com voz local em português.');};
  utterance.onend = () => {if (id === sequence) {report('Leitura concluída.'); utterance = undefined;}};
  utterance.onerror = () => {if (id === sequence) report('A voz local não conseguiu reproduzir. Confira o volume do computador e tente novamente.');};
  report('Preparando a voz local…');
  globalThis.speechSynthesis.speak(utterance);
}
export function speak(text, volume, report, source) {
  stop();
  const id = sequence;
  const level = Math.max(0,Math.min(1,Number(volume) || 0));
  if (!level) {report('O volume da leitura está em zero. Aumente-o em Apoios e preferências.'); return;}
  if (source && /^\/assets\/audio\/(?:peixe|mar|agua|polvo|concha|praia|caranguejo|lua|sol|estrela|ceu|planeta|flor|grama|folha|arvore|semente|jardim|maca|pera|laranja|abacaxi|manga|pessego|letra-[a-z])\.mp3$/.test(source) && globalThis.Audio) {
    const audio = new Audio(source); player = audio; audio.volume = level;
    let failed = false;
    const fallback = () => {
      if (failed || id !== sequence) return;
      failed = true; releaseAudio(audio); player = undefined;
      localVoice(text, level, report, id);
    };
    audio.onplaying = () => {if (id === sequence) report(`Reproduzindo ${text} com áudio do aplicativo.`);};
    audio.onended = () => {if (id === sequence) {failed = true;releaseAudio(audio);player = undefined;report('Leitura concluída.');}};
    audio.onerror = fallback;
    report('Preparando áudio…');
    try {Promise.resolve(audio.play()).catch(fallback);} catch {fallback();}
    return;
  }
  // Local speech is optional fallback; Chrome may populate voices asynchronously.
  if (localPortugueseVoices().length || !globalThis.speechSynthesis?.addEventListener) {localVoice(text,level,report,id); return;}
  report('Procurando voz local em português…');
  const engine = globalThis.speechSynthesis;
  let timer, finished = false;
  const ready = () => {
    if (finished) return;
    finished = true; clearTimeout(timer); engine.removeEventListener('voiceschanged', ready);
    localVoice(text,level,report,id);
  };
  engine.addEventListener('voiceschanged', ready);
  timer = setTimeout(ready, 1200);
}
