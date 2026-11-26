// Native buttons share one activation path for taps, clicks and keyboard input.
export function letterDrag(root, {canDrop, drop}) {
  let active, pointer, preview, target;
  let suppressClick = false;
  const tile = node => node.closest?.('[data-letter-key]');

  function clear(releaseCapture = true) {
    const gesture = pointer;
    pointer = undefined;
    active?.classList.remove('drag-source');
    active = undefined;
    target?.classList.remove('drop-target');
    target = undefined;
    preview?.remove();
    preview = undefined;
    root.classList.remove('letter-dragging');
    if (releaseCapture && gesture?.node.hasPointerCapture(gesture.id)) {
      gesture.node.releasePointerCapture(gesture.id);
    }
  }

  function start(node) {
    active = node;
    node.classList.add('drag-source');
    root.classList.add('letter-dragging');
  }

  function highlight(node) {
    const slot = node?.closest?.('[data-slot]');
    const index = slot ? Number(slot.dataset.slot) : -1;
    const next = active && slot && root.contains(slot) && canDrop(index) ? slot : undefined;
    if (next !== target) {
      target?.classList.remove('drop-target');
      next?.classList.add('drop-target');
      target = next;
    }
    return next ? index : -1;
  }

  function finish(index, releaseCapture = true) {
    const key = active?.dataset.letterKey;
    clear(releaseCapture);
    if (key !== undefined && index >= 0) drop(key, index);
  }

  root.addEventListener('dragstart', event => {
    const node = tile(event.target);
    if (pointer || !node || node.disabled) {
      event.preventDefault();
      return;
    }
    start(node);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-girafas-letter', node.dataset.letterKey);
  });
  root.addEventListener('dragover', event => {
    if (!pointer && highlight(event.target) >= 0) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }
  });
  root.addEventListener('dragleave', event => {
    if (!pointer && target && !target.contains(event.relatedTarget)) highlight(null);
  });
  root.addEventListener('drop', event => {
    if (!active || pointer) return;
    event.preventDefault();
    finish(highlight(event.target));
  });
  root.addEventListener('dragend', () => clear());

  root.addEventListener('pointerdown', event => {
    if (!event.isPrimary) return;
    suppressClick = false;
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    const node = tile(event.target);
    if (!node || node.disabled) return;
    clear();
    pointer = {id:event.pointerId, node, x:event.clientX, y:event.clientY};
    node.setPointerCapture(event.pointerId);
  });
  root.addEventListener('pointermove', event => {
    if (event.pointerId !== pointer?.id) return;
    if (!active) {
      if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < 8) return;
      start(pointer.node);
      preview = document.createElement('span');
      preview.className = 'letter-drag-preview';
      preview.textContent = active.textContent;
      preview.setAttribute('aria-hidden', 'true');
      root.append(preview);
    }
    preview.style.left = `${event.clientX}px`;
    preview.style.top = `${event.clientY}px`;
    highlight(document.elementFromPoint(event.clientX, event.clientY));
  });
  root.addEventListener('pointerup', event => {
    if (event.pointerId !== pointer?.id) return;
    suppressClick = true;
    const underPointer = document.elementFromPoint(event.clientX, event.clientY);
    if (active) {
      finish(highlight(underPointer), false);
      return;
    }
    const node = pointer.node;
    clear(false);
    if (node.contains(underPointer)) node.click();
  });
  for (const type of ['pointercancel', 'lostpointercapture']) {
    root.addEventListener(type, event => {
      if (event.pointerId === pointer?.id) clear();
    });
  }
  root.addEventListener('contextmenu', event => {
    if (pointer) event.preventDefault();
  });
  root.addEventListener('click', event => {
    if (!suppressClick || event.detail === 0) return;
    // Ignore the compatibility click after handling the touch gesture.
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressClick = false;
  }, true);
  return {cancel:clear};
}
