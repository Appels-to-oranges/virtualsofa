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

  function applySettings() {
    const font = localStorage.getItem(STORAGE_KEYS.font) || 'medium';
    const theme = localStorage.getItem(STORAGE_KEYS.theme) || 'default';
    body.classList.remove('font-small', 'font-medium', 'font-large');
    body.classList.add('font-' + font);
    body.classList.remove('theme-warm', 'theme-cool', 'theme-soft', 'theme-ocean',
      'theme-winter-night', 'theme-sunny-sky', 'theme-waterfront', 'theme-space-needle', 'theme-sunset-harbor');
    if (theme !== 'default') body.classList.add('theme-' + theme);
    document.querySelectorAll('.size-opt').forEach((el) => {
      el.classList.toggle('active', el.dataset.size === font);
    });
    document.querySelectorAll('.theme-opt').forEach((el) => {
      el.classList.toggle('active', el.dataset.theme === theme);
    });
  }

  applySettings();

  const overlay = document.getElementById('settings-overlay');
  const openBtn = document.getElementById('settings-btn');
  const closeBtn = document.getElementById('settings-close');

  function openSettings() {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  }
  function closeSettings() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  openBtn.addEventListener('click', openSettings);
  closeBtn.addEventListener('click', closeSettings);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSettings();
  });

  document.querySelectorAll('.size-opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.size;
      localStorage.setItem(STORAGE_KEYS.font, size);
      applySettings();
    });
  });
  document.querySelectorAll('.theme-opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      localStorage.setItem(STORAGE_KEYS.theme, theme);
      applySettings();
    });
  });

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
      div.appendChild(document.createTextNode(data.text));
    }
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  socket.emit('join-room', { roomKey: roomKey.trim().toLowerCase(), nickname });

  socket.on('user-joined', (data) => {
    appendMessage('system', { text: data.nickname + ' joined the room' });
  });

  socket.on('user-left', (data) => {
    appendMessage('system', { text: data.nickname + ' left the room' });
  });

  socket.on('new-message', (data) => {
    const isOwn = data.nickname === nickname;
    appendMessage(isOwn ? 'own' : 'other', data);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    socket.emit('send-message', text);
    input.value = '';
  });
})();
