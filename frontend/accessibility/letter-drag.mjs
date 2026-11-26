// Optional enhancement. Native buttons remain the click/keyboard interaction.
export function letterDrag(root, {canDrop, drop, announce}) {
  let active, pending, timer, suppress;
  const tile = target => target.closest?.('[data-letter-key]');
  function clear() {
    clearTimeout(timer); pending = undefined; active = undefined;
    root.classList.remove('letter-dragging');
    root.querySelectorAll('.drag-source,.drop-target').forEach(node=>node.classList.remove('drag-source','drop-target'));
  }
  function start(node) {
    if (!node || node.disabled) return false;
    active = {key:node.dataset.letterKey, node};
    node.classList.add('drag-source');root.classList.add('letter-dragging');
    announce(`Arrastando ${node.textContent}. Solte em um espaço da palavra.`);
    return true;
  }
  function destination(target) {
    const node = target?.closest?.('[data-slot]');
    const index = node ? Number(node.dataset.slot) : -1;
    return active && node && root.contains(node) && canDrop(index) ? {node,index} : null;
  }
  function highlight(target) {
    root.querySelectorAll('.drop-target').forEach(node=>node.classList.remove('drop-target'));
    const position = destination(target); position?.node.classList.add('drop-target'); return position;
  }
  root.addEventListener('dragstart', event=>{
    if (!start(tile(event.target))) {event.preventDefault();return;}
    event.dataTransfer.effectAllowed='move';
    event.dataTransfer.setData('application/x-girafas-letter',active.key);
  });
  root.addEventListener('dragover',event=>{if (highlight(event.target)) {event.preventDefault();event.dataTransfer.dropEffect='move';}});
  root.addEventListener('drop',event=>{
    const position = destination(event.target);
    if (position) {event.preventDefault();const key=active.key;clear();drop(key,position.index);} else clear();
  });
  root.addEventListener('dragend',clear);
  root.addEventListener('pointerdown',event=>{
    if (!['touch','pen'].includes(event.pointerType)) return;
    const node = tile(event.target);if (!node || node.disabled) return;
    clear(); pending={id:event.pointerId,node,x:event.clientX,y:event.clientY};
    timer=setTimeout(()=>{if (pending) start(node);},250);
  });
  root.addEventListener('pointermove',event=>{
    if (!pending || event.pointerId!==pending.id) return;
    if (active) {event.preventDefault();highlight(document.elementFromPoint(event.clientX,event.clientY));}
    else if (Math.hypot(event.clientX-pending.x,event.clientY-pending.y)>12) clear();
  });
  root.addEventListener('pointerup',event=>{
    if (!pending || event.pointerId!==pending.id) return;
    if (active) {
      event.preventDefault();const key=active.key;
      const position=destination(document.elementFromPoint(event.clientX,event.clientY));
      suppress={node:pending.node,until:performance.now()+700};
      clear();if(position) drop(key,position.index);
    } else clear();
  });
  root.addEventListener('pointercancel',clear);
  root.addEventListener('contextmenu',event=>{if(active) event.preventDefault();});
  root.addEventListener('click',event=>{
    if(suppress && performance.now()<suppress.until && (event.target===suppress.node || suppress.node.contains(event.target))) {
      event.preventDefault();event.stopImmediatePropagation();suppress=undefined;
    }
  },true);
  return {cancel:clear};
}
