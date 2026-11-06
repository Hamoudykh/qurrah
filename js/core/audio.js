// Ayah-by-ayah audio player with repetition for memorization.
//  * repeat each ayah N times (or ∞), optional pause after each repetition so you can
//    recite it back ("echo" pause = as long as the ayah itself)
//  * loop a range of ayahs M times, playback speed, Media Session (lock-screen) controls
//  * plays from the offline cache when available, otherwise streams and (optionally) caches

import { cachedAudioBlobURL, cacheAudio } from './api.js';

export class AyahPlayer extends EventTarget {
  constructor() {
    super();
    this.el = new Audio();
    this.el.preload = 'auto';
    this.queue = [];
    this.index = -1;
    this.rep = 0;
    this.rangeRep = 0;
    this.opts = { repeat: 1, gap: 'off', rate: 1, autoAdvance: true, rangeRepeat: 1, cache: true };
    this.playing = false;
    this._gapTimer = null;
    this._blobURL = null;
    this.el.addEventListener('ended', () => this._onEnded());
    this.el.addEventListener('error', () => this._onError());
    this.el.addEventListener('play', () => this._emit('state'));
    this.el.addEventListener('pause', () => this._emit('state'));
    this._setupMediaSession();
  }

  _emit(type, detail = {}) { this.dispatchEvent(new CustomEvent(type, { detail: { ...detail, player: this } })); }

  setQueue(queue, meta = {}) {
    this.stop();
    this.queue = queue;
    this.meta = meta;
    this.index = -1;
  }

  setOptions(o) {
    Object.assign(this.opts, o);
    this.el.playbackRate = this.opts.rate;
    this._emit('state');
  }

  get current() { return this.queue[this.index] || null; }
  get isPlaying() { return this.playing; }

  async playIndex(i, { resetRange = true } = {}) {
    if (!this.queue[i]) return;
    clearTimeout(this._gapTimer);
    this.index = i;
    this.rep = 0;
    if (resetRange) this.rangeRep = 0;
    await this._load(this.queue[i]);
    this._play();
  }

  async _load(item) {
    if (this._blobURL) { URL.revokeObjectURL(this._blobURL); this._blobURL = null; }
    const blob = await cachedAudioBlobURL(item.url);
    if (blob) { this._blobURL = blob; this.el.src = blob; }
    else {
      this.el.src = item.url;
      if (this.opts.cache && navigator.onLine) cacheAudio([item.url]).catch(() => {});
    }
    this.el.playbackRate = this.opts.rate;
    this._usingFallback = false;
  }

  _play() {
    this.playing = true;
    const p = this.el.play();
    if (p?.catch) p.catch((e) => { if (e.name !== 'AbortError') { this.playing = false; this._emit('error', { error: e }); } });
    this._emit('ayah', { index: this.index, rep: this.rep });
    this._updateMediaSession();
  }

  toggle() {
    if (this.playing) this.pause();
    else if (this.index < 0) this.playIndex(0);
    else { this.playing = true; this.el.play().catch(() => {}); this._emit('state'); }
  }

  pause() {
    clearTimeout(this._gapTimer);
    this.playing = false;
    this.el.pause();
    this._emit('state');
  }

  stop() {
    clearTimeout(this._gapTimer);
    this.playing = false;
    this.el.pause();
    this._emit('state');
  }

  next() { if (this.index + 1 < this.queue.length) this.playIndex(this.index + 1, { resetRange: false }); }
  prev() { if (this.index > 0) this.playIndex(this.index - 1, { resetRange: false }); }

  _gapMs() {
    const g = this.opts.gap;
    if (g === 'short') return 1500;
    if (g === 'echo') return Math.min(30000, Math.max(1500, (this.el.duration || 3) * 1000 / (this.opts.rate || 1) * 1.1));
    return 0;
  }

  _onEnded() {
    if (!this.playing) return;
    this.rep++;
    const target = this.opts.repeat === Infinity ? Infinity : Math.max(1, this.opts.repeat);
    const wait = this._gapMs();
    this._emit('repeat', { index: this.index, rep: this.rep, target, waiting: wait > 0 });
    const go = () => {
      if (!this.playing) return;
      if (this.rep < target) { this.el.currentTime = 0; this._play(); return; }
      if (this.opts.autoAdvance && this.index + 1 < this.queue.length) { this.playIndex(this.index + 1, { resetRange: false }); return; }
      if (this.opts.autoAdvance && this.index + 1 >= this.queue.length) {
        this.rangeRep++;
        const rt = this.opts.rangeRepeat === Infinity ? Infinity : Math.max(1, this.opts.rangeRepeat);
        if (this.rangeRep < rt) { this.playIndex(0, { resetRange: false }); return; }
      }
      this.playing = false;
      this._emit('done');
      this._emit('state');
    };
    if (wait) this._gapTimer = setTimeout(go, wait); else go();
  }

  async _onError() {
    const item = this.current;
    if (!item) return;
    // Primary URL failed: try the fallback CDN once.
    if (!this._usingFallback && item.fallback && this.el.src !== item.fallback) {
      this._usingFallback = true;
      this.el.src = item.fallback;
      if (this.playing) this.el.play().catch(() => {});
      return;
    }
    this.playing = false;
    this._emit('error', { error: new Error('audio failed') });
    this._emit('state');
  }

  _setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    try {
      ms.setActionHandler('play', () => this.toggle());
      ms.setActionHandler('pause', () => this.pause());
      ms.setActionHandler('previoustrack', () => this.prev());
      ms.setActionHandler('nexttrack', () => this.next());
    } catch { /* unsupported action */ }
  }

  _updateMediaSession() {
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    const c = this.current;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${this.meta?.title || ''} ${c ? c.key : ''}`.trim(),
      artist: this.meta?.artist || '',
      album: 'Qurrah',
    });
  }
}

// One shared player for the whole app.
export const player = new AyahPlayer();
