export function presentationsFor(word) {
  const values=word?.pedagogy?.presentations;
  return values?.length ? values.map((item,index)=>({...item,label:item.label || `Imagem ${index+1}`,alt:item.alt || word.alt}))
    : [{id:'image-v1',asset:word.image,label:'Imagem original',alt:word.alt}];
}
const ROTATION_KEY = 'pequenas-girafas-last-illustrations';
let lastIllustrations = {};
let rotationStorageAvailable = true;

function readIllustrations() {
  if (!rotationStorageAvailable) return lastIllustrations;
  try {
    const saved = JSON.parse(localStorage.getItem(ROTATION_KEY));
    lastIllustrations = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch { rotationStorageAvailable = false; }
  return lastIllustrations;
}

export function rememberIllustration(wordId, imageId) {
  lastIllustrations = {...readIllustrations(), [wordId]:imageId};
  if (!rotationStorageAvailable) return;
  try { localStorage.setItem(ROTATION_KEY, JSON.stringify(lastIllustrations)); }
  catch { rotationStorageAvailable = false; }
}

export function illustrationOnVisit(word, requestedId) {
  const images = presentationsFor(word);
  if (images.length === 1) return images[0];
  const lastId = readIllustrations()[word.id];
  const last = images.findIndex(image => image.id === lastId);
  const image = images.find(image => image.id === requestedId) ?? images[(last + 1) % images.length];
  rememberIllustration(word.id, image.id);
  return image;
}

export function clearIllustrationRotation() {
  lastIllustrations = {};
  try {
    localStorage.removeItem(ROTATION_KEY);
    rotationStorageAvailable = true;
  } catch { rotationStorageAvailable = false; }
}
export function recordedVisualIds(event) {
  if(Array.isArray(event.visualIds) && event.visualIds.length) return [...new Set(event.visualIds.filter(id=>typeof id==='string' && /^image-v[1-9]\d?$/.test(id)))];
  const match=event.contextId?.match(/(?:^|:)(image-v[1-9]\d?)(?=:|$)/);
  return match?[match[1]]:[];
}
export function visualEvidence(events, word, activity) {
  const presentations=presentationsFor(word);
  const valid=new Set(presentations.map(p=>p.id));
  const rows=presentations.map(p=>({...p,completions:0,independent:0,assisted:0}));
  let mixed=0,unknown=0;
  for(const event of events.filter(e=>e.wordId===word.id && e.outcome==='completed' && (!activity || (e.activity || 'build')===activity))) {
    const recorded=recordedVisualIds(event);
    const ids=recorded.filter(id=>valid.has(id));
    if(recorded.length>1) {mixed++;continue;}
    if(!ids.length) {unknown++;continue;}
    const row=rows.find(p=>p.id===ids[0]);row.completions++;
    if(event.support==='independent') row.independent++;
    else if(event.support==='assisted') row.assisted++;
  }
  return {rows,mixed,unknown};
}
export function nextPresentation(word,currentId,events=[],activity) {
  const {rows}=visualEvidence(events,word,activity);
  const alternatives=rows.filter(row=>row.id!==currentId);
  return alternatives.find(row=>!row.completions) || alternatives[0] || null;
}
export function changeRoundVisual(ids,id,started) {return started?[...new Set([...ids,id])]:[id];}
