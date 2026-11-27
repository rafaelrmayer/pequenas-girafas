const NAME = 'pequenas-girafas-v1';
const defaults = () => ({events: [], phraseEvents: [], storyDraft: null, settings: {adapt: true, reduced: false, dark: false, lowercase: false, volume: 0.7, onSuccessAudio: true, minIndependentSessions: 2, categoryInterest: 'all', exploration: 'balanced', preferredActivity: 'any', reviewAfterDays: 7}});
let db;
function open() {
  if (db) return Promise.resolve(db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('local');
    req.onerror = () => reject(new Error('Armazenamento indisponível'));
    req.onblocked = () => reject(new Error('Feche outras abas para abrir os registros'));
    req.onsuccess = () => { db = req.result; db.onversionchange = () => {db.close(); db = undefined;}; resolve(db); };
  });
}
export async function load() {
  const database = await open();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('local', 'readonly');
    const req = tx.objectStore('local').get('state');
    req.onsuccess = () => { const value = req.result || defaults(); resolve({...defaults(), ...value, settings: {...defaults().settings, ...value.settings}}); };
    req.onerror = () => reject(req.error);
  });
}
export async function mutate(update) {
  const database = await open();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('local', 'readwrite');
    const store = tx.objectStore('local');
    const req = store.get('state');
    let next;
    req.onsuccess = () => { next = update({...defaults(), ...req.result}); next.events = next.events.slice(-200); next.phraseEvents = (next.phraseEvents || []).slice(-200); store.put(next, 'state'); };
    tx.oncomplete = () => resolve(next);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Registro não salvo'));
  });
}
export function record(event) { return mutate(state => ({...state, events: [...state.events, event]})); }
export function recordPhrase(event) { return mutate(state => ({...state, phraseEvents: [...(state.phraseEvents || []), event]})); }
export function saveStory(draft) { return mutate(state => ({...state, storyDraft:structuredClone(draft)})); }
export function settings(patch) { return mutate(state => ({...state, settings: {...state.settings, ...patch}})); }
export function erase() { return mutate(() => defaults()); }
