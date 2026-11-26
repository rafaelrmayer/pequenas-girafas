export function relatedWords(catalog, wordId, events = []) {
  const start = catalog.words.find(w => w.id === wordId);
  if (!start) return [];
  const direct = new Map();
  for (const edge of catalog.relations) {
    if (edge.from === wordId) direct.set(edge.to, edge.label);
    if (edge.to === wordId) direct.set(edge.from, `ligação no tema: ${edge.label}`);
  }
  const visited = new Set(events.filter(e => e.outcome === 'completed').map(e => e.wordId));
  return catalog.words.filter(w => w.id !== wordId).map(w => ({...w,
    reason: direct.has(w.id) ? `Relação com ${start.text}: ${direct.get(w.id)}.` : 'Outra palavra do mesmo tema.',
    direct: direct.has(w.id), explored: visited.has(w.id)
  })).sort((a,b) => Number(b.direct)-Number(a.direct) || Number(a.explored)-Number(b.explored) || a.complexity-b.complexity || a.text.localeCompare(b.text, 'pt-BR'));
}
