import { lookupDemo } from '../data/demo-lexicon';

const TOUR_KEYS = [
  'sesquipedalian',
  'wiktionary',
  'firefox',
  'chrome',
  'recalcitrant',
  'indexeddb',
  'lemma',
  'telemetry',
  'vacuous',
];

const IDLE_MIN = 10_000;
const IDLE_MAX = 15_000;

function idleDelay() {
  return IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN);
}

function prefersLessMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function placeBubble(container: HTMLElement, slot: HTMLElement, word: HTMLElement) {
  const box = container.getBoundingClientRect();
  const rect = word.getBoundingClientRect();
  const pad = 12;
  const gap = 6;
  const width = slot.offsetWidth;
  const height = slot.offsetHeight;

  let left = rect.left - box.left + rect.width / 2 - width / 2;
  if (left + width > box.width - pad) {
    left = box.width - width - pad;
  }
  if (left < pad) left = pad;

  let top = rect.bottom - box.top + gap;
  if (top + height > box.height - pad) {
    top = rect.top - box.top - height - gap;
  }
  if (top < pad) top = pad;

  slot.style.left = `${left}px`;
  slot.style.top = `${top}px`;
}

function fillBubble(slot: HTMLElement, key: string) {
  const entry = lookupDemo(key);
  const lemma = slot.querySelector('.lemma');
  const ipa = slot.querySelector('.ipa');
  const senses = slot.querySelector('.senses');
  if (!(lemma instanceof HTMLElement) || !(ipa instanceof HTMLElement) || !(senses instanceof HTMLElement)) {
    return;
  }

  lemma.textContent = entry.lemma;
  ipa.textContent = entry.ipa;
  ipa.hidden = !entry.ipa;
  slot.setAttribute('aria-label', `Definition of ${entry.lemma}`);

  senses.replaceChildren(
    ...entry.senses.map((sense) => {
      const li = document.createElement('li');
      const pos = document.createElement('span');
      pos.className = `pos pos-${sense.posKey}`;
      pos.textContent = sense.pos;
      const gloss = document.createElement('span');
      gloss.className = 'gloss';
      gloss.textContent = sense.gloss;
      li.append(pos, gloss);
      return li;
    }),
  );
}

function selectWord(word: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(word);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function tapWord(word: HTMLElement) {
  word.classList.add('is-press');
  window.setTimeout(() => word.classList.remove('is-press'), 80);
}

function fakeDoubleClick(word: HTMLElement, done: () => void) {
  if (prefersLessMotion()) {
    done();
    return;
  }
  tapWord(word);
  window.setTimeout(() => {
    tapWord(word);
    window.setTimeout(done, 90);
  }, 140);
}

function closeDemo(root: HTMLElement) {
  const slot = root.querySelector<HTMLElement>('[data-demo-slot]');
  if (!slot) return;
  slot.hidden = true;
  slot.setAttribute('inert', '');
  root.querySelectorAll('.demo-word.is-active').forEach((el) => el.classList.remove('is-active'));
  window.getSelection()?.removeAllRanges();
}

function openWord(root: HTMLElement, word: HTMLElement) {
  const slot = root.querySelector<HTMLElement>('[data-demo-slot]');
  const key = word.dataset.word;
  if (!slot || !key) return;

  root.querySelectorAll('.demo-word.is-active').forEach((el) => el.classList.remove('is-active'));
  word.classList.add('is-active');
  selectWord(word);
  fillBubble(slot, key);
  slot.hidden = false;
  slot.removeAttribute('inert');
  placeBubble(root, slot, word);
}

function wordForKey(root: HTMLElement, key: string) {
  return root.querySelector<HTMLElement>(`.demo-word[data-word="${key}"]`);
}

function bindRoot(root: HTMLElement) {
  let tourIndex = 0;
  let timer = 0;

  const stop = () => window.clearTimeout(timer);

  const playNext = () => {
    const key = TOUR_KEYS[tourIndex % TOUR_KEYS.length];
    tourIndex += 1;
    const word = wordForKey(root, key);
    if (!word) return;
    fakeDoubleClick(word, () => openWord(root, word));
  };

  const scheduleTour = (delay: number) => {
    stop();
    if (prefersLessMotion()) return;
    timer = window.setTimeout(() => {
      if (document.hidden) {
        scheduleTour(idleDelay());
        return;
      }
      playNext();
      scheduleTour(idleDelay());
    }, delay);
  };

  root.addEventListener('dblclick', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const word = target.closest<HTMLElement>('.demo-word');
    if (!word || !root.contains(word)) return;

    openWord(root, word);
    scheduleTour(idleDelay());
  });

  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('.demo-word') || target.closest('[data-demo-slot]')) return;
    closeDemo(root);
    scheduleTour(idleDelay());
  });

  window.addEventListener('resize', () => {
    const active = root.querySelector<HTMLElement>('.demo-word.is-active');
    const slot = root.querySelector<HTMLElement>('[data-demo-slot]');
    if (active && slot && !slot.hidden) placeBubble(root, slot, active);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else scheduleTour(idleDelay());
  });

  if (prefersLessMotion()) {
    playNext();
    return;
  }

  scheduleTour(800);
}

function bindProductDemos() {
  const roots = document.querySelectorAll<HTMLElement>('[data-product-demo]');
  roots.forEach(bindRoot);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    roots.forEach((root) => closeDemo(root));
  });
}

bindProductDemos();
