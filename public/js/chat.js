(function () {
  const roomKey = sessionStorage.getItem('messageMaye_room');
  const nickname = sessionStorage.getItem('messageMaye_nick');

  if (!roomKey || !nickname) {
    window.location.href = '/';
    return;
  }

  document.getElementById('room-badge').textContent = roomKey;
  document.getElementById('nick-badge').textContent = nickname;

  const STORAGE_KEYS = { font: 'messageMaye_fontSize', theme: 'messageMaye_theme' };
  const body = document.body;
  const IMAGE_THEMES = ['winter-night', 'sunny-sky', 'waterfront', 'space-needle', 'sunset-harbor', 'buildings'];

  function setImageThemeBg(theme) {
    const base = '/images/themes/' + theme;
    const gifUrl = base + '.gif';
    const pngUrl = base + '.png';
    var cacheBust = '?v=' + (window.__themeCacheBust || (window.__themeCacheBust = Date.now()));
    var msgEl = document.getElementById('messages');
    msgEl.style.backgroundImage = 'url(' + gifUrl + cacheBust + ')';
    var img = new Image();
    img.onerror = function () { msgEl.style.backgroundImage = 'url(' + pngUrl + ')'; };
    img.src = gifUrl + cacheBust;
  }

  function applyTheme(theme) {
    body.classList.remove('theme-warm', 'theme-cool', 'theme-soft', 'theme-ocean',
      'theme-winter-night', 'theme-sunny-sky', 'theme-waterfront', 'theme-space-needle', 'theme-sunset-harbor', 'theme-buildings');
    if (theme !== 'default') body.classList.add('theme-' + theme);
    var msgEl = document.getElementById('messages');
    if (IMAGE_THEMES.includes(theme)) {
      setImageThemeBg(theme);
    } else {
      msgEl.style.backgroundImage = '';
    }
    document.querySelectorAll('.theme-opt').forEach(function (el) {
      el.classList.toggle('active', el.dataset.theme === theme);
    });
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }

  function applySettings() {
    const font = localStorage.getItem(STORAGE_KEYS.font) || 'medium';
    const theme = localStorage.getItem(STORAGE_KEYS.theme) || 'default';
    body.classList.remove('font-small', 'font-medium', 'font-large');
    body.classList.add('font-' + font);
    applyTheme(theme);
    document.querySelectorAll('.size-opt').forEach(function (el) {
      el.classList.toggle('active', el.dataset.size === font);
    });
  }

  applySettings();

  /* ---------- Settings panel (font size only) ---------- */
  const settingsOverlay = document.getElementById('settings-overlay');
  const settingsOpenBtn = document.getElementById('settings-btn');
  const settingsCloseBtn = document.getElementById('settings-close');

  function openPanel(overlay) {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  }
  function closePanel(overlay) {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  settingsOpenBtn.addEventListener('click', function () { openPanel(settingsOverlay); });
  settingsCloseBtn.addEventListener('click', function () { closePanel(settingsOverlay); });
  settingsOverlay.addEventListener('click', function (e) {
    if (e.target === settingsOverlay) closePanel(settingsOverlay);
  });

  document.querySelectorAll('.size-opt').forEach(function (btn) {
    btn.addEventListener('click', function () {
      localStorage.setItem(STORAGE_KEYS.font, btn.dataset.size);
      applySettings();
    });
  });

  /* ---------- Backgrounds panel ---------- */
  const bgOverlay = document.getElementById('backgrounds-overlay');
  const bgOpenBtn = document.getElementById('backgrounds-btn');
  const bgCloseBtn = document.getElementById('backgrounds-close');

  bgOpenBtn.addEventListener('click', function () { openPanel(bgOverlay); });
  bgCloseBtn.addEventListener('click', function () { closePanel(bgOverlay); });
  bgOverlay.addEventListener('click', function (e) {
    if (e.target === bgOverlay) closePanel(bgOverlay);
  });

  /* ---------- Socket ---------- */
  const socket = io();
  const messagesEl = document.getElementById('messages');
  const form = document.getElementById('send-form');
  const input = document.getElementById('message-input');

  function appendMessage(type, data) {
    const div = document.createElement('div');
    div.className = 'msg ' + type;
    if (type === 'system') {
      div.textContent = data.text;
    } else {
      const sender = document.createElement('div');
      sender.className = 'sender';
      sender.textContent = data.nickname;
      div.appendChild(sender);
      if (data.src) {
        var img = document.createElement('img');
        img.className = 'chat-photo';
        img.src = data.src;
        img.alt = 'Photo from ' + data.nickname;
        img.addEventListener('click', function () {
          var overlay = document.createElement('div');
          overlay.className = 'photo-overlay';
          var full = document.createElement('img');
          full.src = data.src;
          overlay.appendChild(full);
          overlay.addEventListener('click', function () { overlay.remove(); });
          document.body.appendChild(overlay);
        });
        div.appendChild(img);
      } else {
        div.appendChild(document.createTextNode(data.text));
      }
    }
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  socket.emit('join-room', { roomKey: roomKey.trim().toLowerCase(), nickname });

  socket.on('user-joined', function (data) {
    const isOwn = data.nickname === nickname;
    appendMessage(isOwn ? 'own' : 'other', { nickname: data.nickname, text: 'joined the room' });
  });

  socket.on('user-left', function (data) {
    appendMessage('other', { nickname: data.nickname, text: 'left the room' });
  });

  socket.on('new-message', function (data) {
    const isOwn = data.nickname === nickname;
    appendMessage(isOwn ? 'own' : 'other', data);
  });

  socket.on('new-image', function (data) {
    var isOwn = data.nickname === nickname;
    appendMessage(isOwn ? 'own' : 'other', data);
  });

  socket.on('background-changed', function (data) {
    applyTheme(data.theme);
    var isOwn = data.nickname === nickname;
    appendMessage(isOwn ? 'own' : 'other', { nickname: data.nickname, text: 'changed the background' });
  });

  /* When a theme button in the backgrounds panel is clicked, broadcast to room */
  document.querySelectorAll('.theme-opt').forEach(function (btn) {
    btn.addEventListener('click', function () {
      socket.emit('change-background', btn.dataset.theme);
    });
  });

  /* ---------- Photo upload ---------- */
  var photoBtn = document.getElementById('photo-btn');
  var photoInput = document.getElementById('photo-input');
  var MAX_IMAGE_SIZE = 4 * 1024 * 1024;

  photoBtn.addEventListener('click', function () { photoInput.click(); });

  photoInput.addEventListener('change', function () {
    var file = photoInput.files[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      appendMessage('system', { text: 'Image too large (max 4 MB)' });
      photoInput.value = '';
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      socket.emit('send-image', reader.result);
    };
    reader.readAsDataURL(file);
    photoInput.value = '';
  });

  /* ---------- Emoji picker ---------- */
  var EMOJIS = [
    '\u{1F600}','\u{1F602}','\u{1F605}','\u{1F606}','\u{1F609}','\u{1F60A}','\u{1F60D}','\u{1F618}',
    '\u{1F61C}','\u{1F61D}','\u{1F60E}','\u{1F917}','\u{1F914}','\u{1F644}','\u{1F612}','\u{1F62D}',
    '\u{1F621}','\u{1F631}','\u{1F4A9}','\u{1F44D}','\u{1F44E}','\u{1F44F}','\u{1F64C}','\u{1F64F}',
    '\u{1F4AA}','\u{2764}\u{FE0F}','\u{1F494}','\u{1F525}','\u{2728}','\u{1F389}','\u{1F381}','\u{1F4AF}',
    '\u{1F440}','\u{1F62E}','\u{1F615}','\u{1F634}','\u{1F637}','\u{1F913}','\u{1F60F}','\u{1F643}',
    '\u{1F973}','\u{1F929}','\u{1F970}','\u{1F974}','\u{1F976}','\u{1F975}','\u{1F92F}','\u{1F47B}',
    '\u{1F480}','\u{1F47D}','\u{1F916}','\u{1F63A}','\u{1F44B}','\u{270C}\u{FE0F}','\u{1F918}','\u{1F919}',
    '\u{1F91E}','\u{1F91F}','\u{1F90C}','\u{1F91D}','\u{1F590}\u{FE0F}','\u{270A}','\u{1F4A5}','\u{1F4AB}'
  ];
  var emojiPicker = document.getElementById('emoji-picker');
  var emojiBtn = document.getElementById('emoji-btn');

  EMOJIS.forEach(function (em) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = em;
    btn.addEventListener('click', function () {
      input.value += em;
      input.focus();
    });
    emojiPicker.appendChild(btn);
  });

  emojiBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    emojiPicker.classList.toggle('open');
    emojiPicker.setAttribute('aria-hidden', emojiPicker.classList.contains('open') ? 'false' : 'true');
  });

  document.addEventListener('click', function (e) {
    if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
      emojiPicker.classList.remove('open');
      emojiPicker.setAttribute('aria-hidden', 'true');
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    socket.emit('send-message', text);
    input.value = '';
    emojiPicker.classList.remove('open');
    emojiPicker.setAttribute('aria-hidden', 'true');
  });
})();
