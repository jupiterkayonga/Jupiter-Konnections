// Use an existing optimized variant; do not fetch the original camera file.
export function largestPhotoSource(image: HTMLImageElement): string {
  const sources = image.srcset.split(',').map(part => {
    const match = part.trim().match(/^(.*)\s+(\d+)w$/);
    return match ? { url: match[1], width: Number(match[2]) } : null;
  }).filter((item): item is { url: string; width: number } => item !== null);
  return sources.sort((a, b) => b.width - a.width)[0]?.url || image.currentSrc || image.src;
}

export function setupPhotoViewer(scope: HTMLElement): void {
  const dialog = scope.querySelector<HTMLDialogElement>('[data-photo-viewer]');
  if (!dialog || typeof dialog.showModal !== 'function' || scope.dataset.viewerReady) return;
  const stage = dialog.querySelector<HTMLElement>('[data-photo-stage]')!;
  const status = dialog.querySelector<HTMLElement>('[data-photo-status]')!;
  const caption = dialog.querySelector<HTMLElement>('[data-photo-caption]')!;
  const counter = dialog.querySelector<HTMLElement>('[data-photo-counter]')!;
  const close = dialog.querySelector<HTMLButtonElement>('[data-photo-close]')!;
  const previous = dialog.querySelector<HTMLButtonElement>('[data-photo-prev]')!;
  const next = dialog.querySelector<HTMLButtonElement>('[data-photo-next]')!;
  const photos = [...scope.querySelectorAll<HTMLImageElement>('.entry-cover img, .entry-layout .prose img')]
    .filter(image => !image.closest('a, button'));
  if (!photos.length) return;
  scope.dataset.viewerReady = 'true';
  let index = 0;
  let request = 0;
  let opener: HTMLButtonElement | null = null;
  let swipedAt = 0;

  function showPhoto(position: number) {
    index = (position + photos.length) % photos.length;
    const token = ++request;
    const source = photos[index];
    const description = source.alt || 'Travel photograph';
    caption.textContent = description;
    counter.textContent = `Photograph ${index + 1} of ${photos.length}`;
    stage.setAttribute('aria-busy', 'true');
    stage.dataset.loading = 'true';
    status.textContent = 'Loading photograph…';
    status.hidden = false;
    const enlarged = new Image();
    enlarged.alt = description;
    enlarged.decoding = 'async';
    enlarged.draggable = false;
    enlarged.addEventListener('load', () => {
      if (!dialog!.open || token !== request) return;
      stage.querySelector('img')?.remove();
      stage.append(enlarged);
      stage.setAttribute('aria-busy', 'false');
      delete stage.dataset.loading;
      status.hidden = true;
    });
    enlarged.addEventListener('error', () => {
      if (!dialog!.open || token !== request) return;
      stage.querySelector('img')?.remove();
      stage.setAttribute('aria-busy', 'false');
      delete stage.dataset.loading;
      status.textContent = 'This photograph could not load. Try the next image or close the viewer.';
      status.hidden = false;
    });
    // This is the first request for the larger version: opening/navigation only.
    enlarged.src = largestPhotoSource(source);
  }

  photos.forEach((image, position) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'photo-trigger';
    button.setAttribute('aria-label', `Enlarge photograph: ${image.alt || 'Travel photograph'}`);
    button.setAttribute('aria-haspopup', 'dialog');
    button.title = 'Enlarge photograph';
    const cue = document.createElement('span');
    cue.className = 'photo-zoom-cue';
    cue.setAttribute('aria-hidden', 'true');
    cue.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5M10 7v6m-3-3h6"/></svg>';
    image.replaceWith(button);
    button.append(image, cue);
    button.addEventListener('click', () => {
      opener = button;
      dialog.showModal();
      document.documentElement.classList.add('photo-viewer-open');
      close.focus({ preventScroll: true });
      showPhoto(position);
    });
  });
  previous.hidden = next.hidden = photos.length < 2;
  previous.addEventListener('click', () => showPhoto(index - 1));
  next.addEventListener('click', () => showPhoto(index + 1));
  close.addEventListener('click', () => dialog.close());
  // Native dialog handles Escape, focus trapping, and making the page inert.
  dialog.addEventListener('close', () => {
    request++;
    document.documentElement.classList.remove('photo-viewer-open');
    stage.querySelector('img')?.remove();
    opener?.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', event => {
    if ((event.target === dialog || event.target === stage) && Date.now() - swipedAt > 400) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (!dialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(index + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  let touch: { x: number; y: number } | null = null;
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') return;
    touch = event.isPrimary ? { x: event.clientX, y: event.clientY } : null;
  });
  stage.addEventListener('pointercancel', () => { touch = null; });
  stage.addEventListener('pointerup', event => {
    if (!touch || event.pointerType !== 'touch') return;
    const dx = event.clientX - touch.x;
    const dy = event.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swipedAt = Date.now();
      showPhoto(index + (dx < 0 ? 1 : -1));
    }
  });
}
