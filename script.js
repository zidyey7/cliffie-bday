(() => {
  // Midnight in Manila on November 26, 2026 (UTC+08:00).
  const UNLOCK_AT = new Date('2026-11-26T00:00:00+08:00').getTime();
  // The gifts (letter, photos, notes) are encrypted inside content.enc.js.
  // The key is NOT in this site. It is only fetched from KEY_URL once it exists:
  //   default  -> a file named unlock-key.js that you upload on the birthday
  //   optional -> your Cloudflare Worker URL, which only releases the key at UNLOCK_AT
  const KEY_URL = 'https://zidyey7key.christinejoyjugo03.workers.dev/';

  const $ = (id) => document.getElementById(id);
  const landing = $('landing'), gifts = $('gifts'), modal = $('lock-modal');
  const pages = ['landing', 'gifts', 'message-page', 'flowers-page', 'cake-page'];
  let letterTimer = null;


  let content = null;                 // decrypted gifts (only after the key is found)
  let unlocking = null;
  const isUnlocked = () => !!content || Date.now() >= UNLOCK_AT;   // label only; real lock = the key
  const showLockModal = () => { modal.hidden = false; $('okay-button').focus(); };
  const closeModal = () => { modal.hidden = true; };

  function updateCountdown() {
    const remaining = Math.max(0, UNLOCK_AT - Date.now());
    const total = Math.floor(remaining / 1000);
    const pad = (v) => String(v).padStart(2, '0');
    $('days').textContent = pad(Math.floor(total / 86400));
    $('hours').textContent = pad(Math.floor((total % 86400) / 3600));
    $('minutes').textContent = pad(Math.floor((total % 3600) / 60));
    $('seconds').textContent = pad(total % 60);
    if (isUnlocked()) {
      $('lock-label').textContent = 'Open your birthday gifts';
      $('lock-icon').innerHTML = '<rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 7.6-1.7"/>';
    }
  }

  function showOnly(pageId) {
    pages.forEach((id) => $(id).classList.add('hidden'));
    $(pageId).classList.remove('hidden');
    window.scrollTo({ top: 0 });
  }

  // ---- unlock: fetch key -> decrypt -> build the gift pages
  const b64 = (str) => {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    const bin = atob(str), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  };
  const waitFor = (fn, ms) => new Promise((resolve) => {
    const t0 = Date.now();
    (function check() {
      const v = fn();
      if (v) return resolve(v);
      if (Date.now() - t0 > ms) return resolve(null);
      setTimeout(check, 150);
    })();
  });
  function getKey() {
    const m = /[#&]k=([A-Za-z0-9_-]+)/.exec(location.hash);   // private test link
    if (m) return Promise.resolve(m[1]);
    return new Promise((resolve) => {
      delete window.__UNLOCK_KEY;
      const sc = document.createElement('script');
      sc.src = KEY_URL + (KEY_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
      sc.onload = () => { sc.remove(); resolve(window.__UNLOCK_KEY || null); };
      sc.onerror = () => { sc.remove(); resolve(null); };
      document.head.appendChild(sc);
    });
  }
  function mount(data) {
    const withPhotos = (html) => html.replace(/assets\/img\/(photo\d)\.jpg/g,
      (m, name) => 'data:image/jpeg;base64,' + data.images[name]);
    Object.keys(data.sections).forEach((id) => { $(id).innerHTML = withPhotos(data.sections[id]); });
  }
  function unlock() {
    if (content) return Promise.resolve(true);
    if (unlocking) return unlocking;
    unlocking = (async () => {
      try {
        const key = await getKey();
        if (!key) return false;
        const enc = await waitFor(() => window.__ENC, 25000);
        if (!enc) return false;
        const raw = b64(enc);
        const cryptoKey = await crypto.subtle.importKey('raw', b64(key), 'AES-GCM', false, ['decrypt']);
        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(0, 12) }, cryptoKey, raw.slice(12));
        const data = JSON.parse(new TextDecoder().decode(plain));
        mount(data);
        content = data;
        updateCountdown();
        return true;
      } catch (err) { return false; }
    })();
    unlocking.finally(() => { unlocking = null; });
    return unlocking;
  }

  $('lock-button').addEventListener('click', async () => { (await unlock()) ? showOnly('gifts') : showLockModal(); });
  $('okay-button').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // gift pages are created after unlock, so listen on the document
  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-gift]');
    if (card) {
      if (!content) { showLockModal(); return; }
      const gift = card.dataset.gift;
      showOnly(gift === 'message' ? 'message-page' : gift === 'flowers' ? 'flowers-page' : 'cake-page');
      if (gift === 'message') startLetter(); else clearInterval(letterTimer);
      return;
    }
    if (e.target.closest('[data-back]')) { clearInterval(letterTimer); showOnly('gifts'); return; }
    if (e.target.closest('#wish-button')) toggleCandles();
  });

  // typing letter
  function startLetter() {
    clearInterval(letterTimer);
    const target = $('typed-letter');
    target.textContent = '';
    let i = 0;
    letterTimer = setInterval(() => {
      if (i >= content.letter.length) {
        clearInterval(letterTimer);
        target.insertAdjacentHTML('beforeend', ' <i class="hrt"></i>');
        return;
      }
      target.textContent += content.letter[i++];
      // keep the cursor in view while typing (desktop page scrolls down with the letter)
      if (i % 12 === 0) {
        const r = $('letter-cursor').getBoundingClientRect();
        if (r.bottom > window.innerHeight - 60) window.scrollBy({ top: r.bottom - window.innerHeight + 140, behavior: 'smooth' });
      }
    }, 38);
  }

  // cake candles
  let blown = false;
  function toggleCandles() {
    const candles = $('candles');
    if (!blown) {
      candles.classList.add('blown'); blown = true;
      $('wish-copy').textContent = content.strings.wishMade;
      $('wish-button').innerHTML = content.strings.relight;
      burstSparkles();
    } else {
      candles.classList.remove('blown'); blown = false;
      $('wish-copy').textContent = content.strings.wishAgain;
      $('wish-button').innerHTML = content.strings.wishBtn;
    }
  }
  function burstSparkles() {
    const scene = $('cake-scene');
    for (let i = 0; i < 20; i++) {
      const s = document.createElement('span');
      s.textContent = Math.random() > .5 ? '✦' : '✧';
      s.style.cssText = `position:absolute;z-index:6;left:${25 + Math.random() * 50}%;top:${8 + Math.random() * 40}%;color:#ffe4a7;font-size:${12 + Math.random() * 16}px;pointer-events:none;animation:spark 1.6s ease-out forwards;animation-delay:${Math.random() * .3}s;opacity:0`;
      scene.appendChild(s); setTimeout(() => s.remove(), 2200);
    }
  }

  // falling petals
  function makePetal() {
    const petal = document.createElement('i');
    petal.className = 'petal';
    const size = 9 + Math.random() * 10;
    petal.style.cssText = `left:${Math.random() * 100}vw;width:${size}px;height:${size * 1.45}px;--drift:${Math.random() * 180 - 90}px;animation-duration:${7 + Math.random() * 9}s`;
    $('petals').appendChild(petal);
    setTimeout(() => petal.remove(), 17000);
  }
  for (let i = 0; i < 12; i++) setTimeout(makePetal, i * 380);
  setInterval(makePetal, 800);

  // background music: plays on the whole site, loops forever
  const bgm = $('bgm'), musicBtn = $('music-btn');
  bgm.volume = 0.6;
  let userPaused = false;
  const setMusicUI = () => {
    const on = !bgm.paused;
    musicBtn.classList.toggle('muted', !on);
    musicBtn.classList.toggle('playing', on);
  };
  const tryPlay = () => { if (userPaused) return; bgm.play().then(setMusicUI).catch(() => {}); };
  const unlockAudio = () => {
    tryPlay();
    ['pointerdown', 'touchstart', 'keydown', 'click'].forEach((ev) => document.removeEventListener(ev, unlockAudio, true));
  };
  ['pointerdown', 'touchstart', 'keydown', 'click'].forEach((ev) => document.addEventListener(ev, unlockAudio, true));
  tryPlay();
  musicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (bgm.paused) { userPaused = false; bgm.play().then(setMusicUI).catch(() => {}); }
    else { userPaused = true; bgm.pause(); setMusicUI(); }
  });
  bgm.addEventListener('play', setMusicUI); bgm.addEventListener('pause', setMusicUI);
  bgm.addEventListener('error', () => { musicBtn.hidden = true; });
  // if the song ever stops by itself, start it again
  bgm.addEventListener('ended', () => { bgm.currentTime = 0; tryPlay(); });

  // first-page photos are encrypted too; their key travels only in the link you send (?p=...)
  async function loadLanding() {
    const re = /[?#&]p=([A-Za-z0-9_-]+)/;
    let k = (re.exec(location.search) || re.exec(location.hash) || [])[1];
    if (!k) { try { k = localStorage.getItem('cf_p'); } catch (e) {} }
    if (!k) return;
    const enc = await waitFor(() => window.__LANDING, 25000);
    if (!enc) return;
    try {
      const raw = b64(enc);
      const ck = await crypto.subtle.importKey('raw', b64(k), 'AES-GCM', false, ['decrypt']);
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(0, 12) }, ck, raw.slice(12));
      const photos = JSON.parse(new TextDecoder().decode(plain));
      document.querySelectorAll('img[data-landing]').forEach((img) => { img.src = 'data:image/jpeg;base64,' + photos[img.dataset.landing]; });
      try { localStorage.setItem('cf_p', k); } catch (e) {}
    } catch (e) {}
  }
  loadLanding();

  updateCountdown();
  setInterval(updateCountdown, 1000);
})();
