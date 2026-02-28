(function () {
  const roomKey = sessionStorage.getItem('virtualSofa_room');
  const nickname = sessionStorage.getItem('virtualSofa_nick');

  if (!roomKey || !nickname) {
    window.location.href = '/';
    return;
  }

  document.getElementById('room-badge').textContent = roomKey;
  document.getElementById('nick-badge').textContent = nickname;

  /* ---------- Invite link ---------- */
  var inviteBtn = document.getElementById('invite-btn');
  var inviteToast = document.createElement('div');
  inviteToast.className = 'invite-toast';
  inviteToast.textContent = 'Invite link copied!';
  document.body.appendChild(inviteToast);

  inviteBtn.addEventListener('click', function () {
    var url = window.location.origin + '/?room=' + encodeURIComponent(roomKey);
    navigator.clipboard.writeText(url).then(function () {
      inviteToast.classList.add('show');
      setTimeout(function () { inviteToast.classList.remove('show'); }, 2000);
    }).catch(function () {
      prompt('Copy this invite link:', url);
    });
  });

  const STORAGE_KEYS = { font: 'virtualSofa_fontSize', theme: 'virtualSofa_theme', volume: 'virtualSofa_volume', videoVolume: 'virtualSofa_videoVolume', clearInterval: 'virtualSofa_clearInterval' };
  const body = document.body;
  const IMAGE_THEMES = ['waterfront', 'buildings', 'apartments', 'fireflies', 'snowy-lot'];

  var pendingThemeImg = null;

  function setImageThemeBg(theme) {
    if (pendingThemeImg) { pendingThemeImg.onload = null; pendingThemeImg.onerror = null; pendingThemeImg.src = ''; pendingThemeImg = null; }
    var base = '/images/themes/' + theme;
    var gifUrl = base + '.gif';
    var pngUrl = base + '.png';
    var msgEl = document.getElementById('messages');
    var img = new Image();
    pendingThemeImg = img;
    img.onload = function () { if (pendingThemeImg === img) { msgEl.style.backgroundImage = 'url(' + gifUrl + ')'; pendingThemeImg = null; } };
    img.onerror = function () { if (pendingThemeImg === img) { msgEl.style.backgroundImage = 'url(' + pngUrl + ')'; pendingThemeImg = null; } };
    img.src = gifUrl;
  }

  function applyTheme(theme) {
    body.classList.remove('theme-amber', 'theme-slate', 'theme-gray', 'theme-blue',
      'theme-waterfront', 'theme-buildings', 'theme-apartments', 'theme-fireflies', 'theme-snowy-lot');
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
    var fontSize = parseInt(localStorage.getItem(STORAGE_KEYS.font), 10);
    if (isNaN(fontSize) || fontSize < 10 || fontSize > 28) fontSize = 16;
    var theme = localStorage.getItem(STORAGE_KEYS.theme) || 'default';

    body.style.setProperty('--chat-font-size', fontSize + 'px');

    applyTheme(theme);

    var slider = document.getElementById('font-size-slider');
    var valueEl = document.getElementById('font-size-value');
    var preview = document.getElementById('font-size-preview');
    if (slider) slider.value = fontSize;
    if (valueEl) valueEl.textContent = fontSize + 'px';
    if (preview) preview.style.fontSize = fontSize + 'px';
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

  var fontSizeSlider = document.getElementById('font-size-slider');
  var fontSizeValue = document.getElementById('font-size-value');
  var fontSizePreview = document.getElementById('font-size-preview');

  fontSizeSlider.addEventListener('input', function () {
    var v = parseInt(fontSizeSlider.value, 10);
    fontSizeValue.textContent = v + 'px';
    localStorage.setItem(STORAGE_KEYS.font, v);
    body.style.setProperty('--chat-font-size', v + 'px');
    if (fontSizePreview) fontSizePreview.style.fontSize = v + 'px';
  });

  /* ---------- Auto-clear messages ---------- */
  var clearTimerId = null;
  var DEFAULT_CLEAR_SECONDS = 300;

  function applyClearInterval(seconds) {
    if (clearTimerId) { clearInterval(clearTimerId); clearTimerId = null; }
    document.querySelectorAll('.clear-options .size-opt').forEach(function (el) {
      el.classList.toggle('active', el.dataset.clear === String(seconds));
    });
    localStorage.setItem(STORAGE_KEYS.clearInterval, seconds);
    if (seconds <= 0) return;
    clearTimerId = setInterval(function () {
      var cutoff = Date.now() - (seconds * 1000);
      messagesEl.querySelectorAll('.msg[data-ts]').forEach(function (msg) {
        if (parseInt(msg.dataset.ts, 10) < cutoff) msg.remove();
      });
    }, 1000);
  }

  (function initClear() {
    var saved = parseInt(localStorage.getItem(STORAGE_KEYS.clearInterval), 10);
    if (isNaN(saved)) saved = DEFAULT_CLEAR_SECONDS;
    applyClearInterval(saved);
  })();

  document.querySelectorAll('.clear-options .size-opt').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyClearInterval(parseInt(btn.dataset.clear, 10));
    });
  });

  /* Radio audio (declared early so volume slider can reference it) */
  var radioAudio = new Audio();
  var savedVolume = parseInt(localStorage.getItem(STORAGE_KEYS.volume), 10);
  if (isNaN(savedVolume)) savedVolume = 80;
  radioAudio.volume = savedVolume / 100;

  /* Volume slider */
  var volumeSlider = document.getElementById('volume-slider');
  var volumeValue = document.getElementById('volume-value');
  volumeSlider.value = savedVolume;
  volumeValue.textContent = savedVolume + '%';

  volumeSlider.addEventListener('input', function () {
    var v = parseInt(volumeSlider.value, 10);
    volumeValue.textContent = v + '%';
    localStorage.setItem(STORAGE_KEYS.volume, v);
    radioAudio.volume = v / 100;
  });

  /* Video volume slider */
  var savedVideoVol = parseInt(localStorage.getItem(STORAGE_KEYS.videoVolume), 10);
  if (isNaN(savedVideoVol)) savedVideoVol = 80;
  var videoVolumeSlider = document.getElementById('video-volume-slider');
  var videoVolumeValue = document.getElementById('video-volume-value');
  videoVolumeSlider.value = savedVideoVol;
  videoVolumeValue.textContent = savedVideoVol + '%';

  function applyVideoVolume(v) {
    localStorage.setItem(STORAGE_KEYS.videoVolume, v);
    if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
      if (v === 0) { ytPlayer.mute(); }
      else { ytPlayer.unMute(); ytPlayer.setVolume(v); }
    }
  }

  videoVolumeSlider.addEventListener('input', function () {
    var v = parseInt(videoVolumeSlider.value, 10);
    videoVolumeValue.textContent = v + '%';
    applyVideoVolume(v);
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

  function hexToHsl(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var r = parseInt(hex.substring(0, 2), 16) / 255;
    var g = parseInt(hex.substring(2, 4), 16) / 255;
    var b = parseInt(hex.substring(4, 6), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  function nickColor(name) {
    var accent = getComputedStyle(body).getPropertyValue('--chat-accent').trim();
    var baseHue = accent ? hexToHsl(accent)[0] : 222;
    var hash = 0;
    for (var i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
    var offset = ((Math.abs(hash) % 61) - 30);
    var hue = ((baseHue + offset) % 360 + 360) % 360;
    return 'hsl(' + hue + ', 35%, 25%)';
  }

  var MAX_MESSAGES = 300;
  var REACTION_EMOJIS = ['\u{1F44D}','\u{2764}\u{FE0F}','\u{1F602}','\u{1F62E}','\u{1F622}','\u{1F525}','\u{1F44F}','\u{1F4AF}'];
  var messageReactions = {};
  var activeReactionPicker = null;
  var userCountEl = document.getElementById('user-count');

  function renderReactions(msgId) {
    var div = document.querySelector('[data-msg-id="' + msgId + '"]');
    if (!div) return;
    var container = div.querySelector('.msg-reactions');
    if (!container) {
      container = document.createElement('div');
      container.className = 'msg-reactions';
      div.appendChild(container);
    }
    container.innerHTML = '';
    var reactions = messageReactions[msgId];
    if (!reactions) { container.remove(); return; }
    var emojis = Object.keys(reactions);
    if (!emojis.length) { container.remove(); delete messageReactions[msgId]; return; }
    emojis.forEach(function (emoji) {
      var users = reactions[emoji];
      var pill = document.createElement('button');
      pill.className = 'reaction-pill';
      pill.type = 'button';
      if (users.indexOf(nickname) >= 0) pill.classList.add('reacted');
      pill.textContent = emoji + ' ' + users.length;
      pill.title = users.join(', ');
      pill.addEventListener('click', function () {
        socket.emit('toggle-reaction', { msgId: msgId, emoji: emoji });
      });
      container.appendChild(pill);
    });
  }

  function showReactionPicker(msgDiv, msgId) {
    if (activeReactionPicker) { activeReactionPicker.remove(); activeReactionPicker = null; }
    var picker = document.createElement('div');
    picker.className = 'reaction-picker';
    REACTION_EMOJIS.forEach(function (em) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = em;
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        socket.emit('toggle-reaction', { msgId: msgId, emoji: em });
        picker.remove();
        activeReactionPicker = null;
      });
      picker.appendChild(btn);
    });
    msgDiv.appendChild(picker);
    activeReactionPicker = picker;
  }

  function appendMessage(type, data) {
    const div = document.createElement('div');
    div.className = 'msg ' + type;
    div.dataset.ts = Date.now();
    if (type === 'system') {
      div.textContent = data.text;
    } else {
      if (type === 'other' && data.nickname) {
        div.style.background = nickColor(data.nickname);
      }
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
      if (data.id) {
        div.dataset.msgId = data.id;
        var reactBtn = document.createElement('button');
        reactBtn.className = 'react-btn';
        reactBtn.type = 'button';
        reactBtn.textContent = '+';
        reactBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          showReactionPicker(div, data.id);
        });
        div.appendChild(reactBtn);
      }
    }
    messagesEl.appendChild(div);
    while (messagesEl.children.length > MAX_MESSAGES) {
      messagesEl.removeChild(messagesEl.firstChild);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  socket.emit('join-room', { roomKey: roomKey.trim().toLowerCase(), nickname });

  socket.on('user-count', function (count) {
    userCountEl.textContent = count;
  });

  socket.on('reaction-toggled', function (data) {
    var key = data.msgId;
    if (!messageReactions[key]) messageReactions[key] = {};
    if (!messageReactions[key][data.emoji]) messageReactions[key][data.emoji] = [];
    var arr = messageReactions[key][data.emoji];
    var idx = arr.indexOf(data.nickname);
    if (idx >= 0) {
      arr.splice(idx, 1);
      if (!arr.length) delete messageReactions[key][data.emoji];
    } else {
      arr.push(data.nickname);
    }
    renderReactions(key);
  });

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

  /* ---------- YouTube panel ---------- */
  var ytOverlay = document.getElementById('youtube-overlay');
  var ytOpenBtn = document.getElementById('youtube-btn');
  var ytCloseBtn = document.getElementById('youtube-close');
  var ytUrlInput = document.getElementById('yt-url-input');
  var ytUrlSubmit = document.getElementById('yt-url-submit');
  var ytBgContainer = document.getElementById('yt-bg-container');
  var messagesWrap = document.getElementById('messages-wrap');

  var ytPlayer = null;
  var ytApiReady = false;
  var ytPaused = false;
  var ytShouldPauseOnPlay = false;
  var ytPendingAction = null;
  var currentVideoId = '';
  var currentYtTitle = '';
  var currentRadioName = '';

  var npYtBar = document.getElementById('now-playing-yt');
  var npYtLabel = document.getElementById('now-playing-yt-label');
  var ytPauseBtn = document.getElementById('yt-pause-btn');
  var ytRewBtn = document.getElementById('yt-rew-btn');
  var ytFwdBtn = document.getElementById('yt-fwd-btn');
  var ytStopBtn = document.getElementById('yt-stop-btn');
  var npRadioBar = document.getElementById('now-playing-radio');
  var npRadioLabel = document.getElementById('now-playing-radio-label');

  function onYtApiReady() {
    if (ytApiReady) return;
    ytApiReady = true;
    if (ytPendingAction) { ytPendingAction(); ytPendingAction = null; }
  }

  if (window.YT && window.YT.Player) {
    onYtApiReady();
  } else {
    window.onYouTubeIframeAPIReady = onYtApiReady;
    var ytPoll = setInterval(function () {
      if (window.YT && window.YT.Player) { clearInterval(ytPoll); onYtApiReady(); }
    }, 200);
  }

  function updateNowPlayingYt() {
    if (currentVideoId) {
      npYtLabel.textContent = '\u{1F3AC} ' + (currentYtTitle || 'YouTube video');
      ytPauseBtn.textContent = ytPaused ? '\u25B6' : '\u23F8';
      npYtBar.hidden = false;
    } else {
      npYtBar.hidden = true;
    }
  }

  function updateNowPlayingRadio() {
    if (currentRadioName) {
      npRadioLabel.textContent = '\u{1F4FB} ' + currentRadioName;
      npRadioBar.hidden = false;
    } else {
      npRadioBar.hidden = true;
    }
  }

  ytOpenBtn.addEventListener('click', function () { openPanel(ytOverlay); });
  ytCloseBtn.addEventListener('click', function () { closePanel(ytOverlay); });
  ytOverlay.addEventListener('click', function (e) {
    if (e.target === ytOverlay) closePanel(ytOverlay);
  });

  function parseYouTubeId(url) {
    var m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function fetchYtTitle(videoId) {
    var ctrl = new AbortController();
    setTimeout(function () { ctrl.abort(); }, 8000);
    fetch('https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=' + videoId + '&format=json', { signal: ctrl.signal })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.title) {
          currentYtTitle = d.title;
          updateNowPlayingYt();
        }
      })
      .catch(function () {});
  }

  function showYouTube(videoId, startSeconds, paused) {
    currentVideoId = videoId;
    ytBgContainer.hidden = false;
    body.classList.add('yt-theater');
    messagesEl.style.backgroundImage = 'none';
    ytPaused = !!paused;
    currentYtTitle = '';

    var doIt = function () {
      if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
        ytPlayer.loadVideoById({ videoId: videoId, startSeconds: startSeconds || 0 });
        applyVideoVolume(parseInt(videoVolumeSlider.value, 10));
        if (paused) ytShouldPauseOnPlay = true;
      } else {
        ytShouldPauseOnPlay = !!paused;
        ytPlayer = new YT.Player('yt-player', {
          width: '100%',
          height: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            loop: 1,
            playlist: videoId,
            controls: 0,
            showinfo: 0,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            start: Math.floor(startSeconds || 0)
          },
          events: {
            onReady: function (e) {
              var vol = parseInt(videoVolumeSlider.value, 10);
              if (vol === 0) { e.target.mute(); } else { e.target.unMute(); e.target.setVolume(vol); }
            },
            onStateChange: function (e) {
              if (ytShouldPauseOnPlay && e.data === YT.PlayerState.PLAYING) {
                ytShouldPauseOnPlay = false;
                e.target.pauseVideo();
              }
            }
          }
        });
      }
    };

    if (ytApiReady) { doIt(); } else { ytPendingAction = doIt; }
    updateNowPlayingYt();
    fetchYtTitle(videoId);
  }

  function hideYouTube() {
    if (ytPlayer && typeof ytPlayer.stopVideo === 'function') ytPlayer.stopVideo();
    ytBgContainer.hidden = true;
    body.classList.remove('yt-theater');
    currentVideoId = '';
    currentYtTitle = '';
    ytPaused = false;
    var currentTheme = localStorage.getItem(STORAGE_KEYS.theme) || 'default';
    if (IMAGE_THEMES.includes(currentTheme)) {
      setImageThemeBg(currentTheme);
    } else {
      messagesEl.style.backgroundImage = '';
    }
    updateNowPlayingYt();
  }

  ytUrlSubmit.addEventListener('click', function () {
    var id = parseYouTubeId(ytUrlInput.value.trim());
    if (!id) {
      ytUrlInput.style.borderColor = '#f7768e';
      return;
    }
    ytUrlInput.style.borderColor = '';
    socket.emit('change-youtube', id);
    ytUrlInput.value = '';
    closePanel(ytOverlay);
  });

  ytUrlInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      ytUrlSubmit.click();
    }
  });

  socket.on('youtube-changed', function (data) {
    showYouTube(data.videoId, 0, false);
    var isOwn = data.nickname === nickname;
    appendMessage(isOwn ? 'own' : 'other', {
      nickname: data.nickname,
      text: 'set a YouTube video as the background'
    });
  });

  socket.on('youtube-stopped', function (data) {
    hideYouTube();
    var isOwn = data.nickname === nickname;
    appendMessage(isOwn ? 'own' : 'other', {
      nickname: data.nickname,
      text: 'stopped the YouTube background'
    });
  });

  socket.on('youtube-paused', function (data) {
    if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') ytPlayer.pauseVideo();
    ytPaused = true;
    updateNowPlayingYt();
    var isOwn = data.nickname === nickname;
    appendMessage(isOwn ? 'own' : 'other', { nickname: data.nickname, text: 'paused the video' });
  });

  socket.on('youtube-resumed', function (data) {
    if (ytPlayer && typeof ytPlayer.playVideo === 'function') ytPlayer.playVideo();
    ytPaused = false;
    updateNowPlayingYt();
    var isOwn = data.nickname === nickname;
    appendMessage(isOwn ? 'own' : 'other', { nickname: data.nickname, text: 'resumed the video' });
  });

  socket.on('youtube-seeked', function (data) {
    if (ytPlayer && typeof ytPlayer.seekTo === 'function') ytPlayer.seekTo(data.position, true);
    var isOwn = data.nickname === nickname;
    var dir = data.direction === 'back' ? 'rewound' : 'skipped forward in';
    appendMessage(isOwn ? 'own' : 'other', { nickname: data.nickname, text: dir + ' the video' });
  });

  ytPauseBtn.addEventListener('click', function () {
    if (!currentVideoId) return;
    socket.emit(ytPaused ? 'resume-youtube' : 'pause-youtube');
  });

  ytRewBtn.addEventListener('click', function () {
    if (!currentVideoId) return;
    socket.emit('seek-youtube', -10);
  });

  ytFwdBtn.addEventListener('click', function () {
    if (!currentVideoId) return;
    socket.emit('seek-youtube', 10);
  });

  ytStopBtn.addEventListener('click', function () {
    if (currentVideoId) socket.emit('stop-youtube');
  });

  /* ---------- Radio panel ---------- */
  var radioOverlay = document.getElementById('radio-overlay');
  var radioOpenBtn = document.getElementById('radio-btn');
  var radioCloseBtn = document.getElementById('radio-close');
  var radioSearchInput = document.getElementById('radio-search');
  var radioSearchBtn = document.getElementById('radio-search-btn');
  var radioResults = document.getElementById('radio-results');
  var radioStopBtn = document.getElementById('radio-stop');
  var RADIO_API = 'https://de1.api.radio-browser.info/json/stations/search';

  radioOpenBtn.addEventListener('click', function () { openPanel(radioOverlay); });
  radioCloseBtn.addEventListener('click', function () { closePanel(radioOverlay); });
  radioOverlay.addEventListener('click', function (e) {
    if (e.target === radioOverlay) closePanel(radioOverlay);
  });

  function searchStations(query) {
    radioResults.innerHTML = '<div class="radio-empty">Searching...</div>';
    var params = '?name=' + encodeURIComponent(query) + '&limit=25&order=votes&reverse=true&hidebroken=true';
    var ctrl = new AbortController();
    setTimeout(function () { ctrl.abort(); }, 10000);
    fetch(RADIO_API + params, { signal: ctrl.signal })
      .then(function (r) { return r.json(); })
      .then(function (stations) {
        radioResults.innerHTML = '';
        var secure = stations.filter(function (st) {
          var u = st.url_resolved || st.url;
          return u && u.startsWith('https');
        });
        if (!secure.length) {
          radioResults.innerHTML = '<div class="radio-empty">No stations found</div>';
          return;
        }
        secure.forEach(function (st) {
          var url = st.url_resolved || st.url;
          var row = document.createElement('div');
          row.className = 'radio-station';
          var icon = document.createElement('img');
          icon.className = 'radio-station-icon';
          icon.src = st.favicon || '';
          icon.alt = '';
          icon.onerror = function () { this.style.display = 'none'; };
          var info = document.createElement('div');
          info.className = 'radio-station-info';
          var name = document.createElement('div');
          name.className = 'radio-station-name';
          name.textContent = st.name;
          var meta = document.createElement('div');
          meta.className = 'radio-station-meta';
          meta.textContent = [st.country, st.tags].filter(Boolean).join(' \u00B7 ');
          info.appendChild(name);
          info.appendChild(meta);
          row.appendChild(icon);
          row.appendChild(info);
          row.addEventListener('click', function () {
            socket.emit('change-radio', { name: st.name, url: url });
            closePanel(radioOverlay);
          });
          radioResults.appendChild(row);
        });
      })
      .catch(function () {
        radioResults.innerHTML = '<div class="radio-empty">Search failed — try again</div>';
      });
  }

  radioSearchBtn.addEventListener('click', function () {
    var q = radioSearchInput.value.trim();
    if (q) searchStations(q);
  });
  radioSearchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      var q = radioSearchInput.value.trim();
      if (q) searchStations(q);
    }
  });

  function playRadio(station) {
    radioAudio.src = station.url;
    radioAudio.play().catch(function () {});
    currentRadioName = station.name;
    updateNowPlayingRadio();
  }

  function stopRadio() {
    radioAudio.pause();
    radioAudio.src = '';
    currentRadioName = '';
    updateNowPlayingRadio();
  }

  radioStopBtn.addEventListener('click', function () {
    if (currentRadioName) socket.emit('stop-radio');
  });

  socket.on('radio-changed', function (data) {
    playRadio(data.station);
    var isOwn = data.nickname === nickname;
    appendMessage(isOwn ? 'own' : 'other', {
      nickname: data.nickname,
      text: 'tuned the radio to ' + data.station.name
    });
  });

  socket.on('radio-stopped', function (data) {
    stopRadio();
    var isOwn = data.nickname === nickname;
    appendMessage(isOwn ? 'own' : 'other', {
      nickname: data.nickname,
      text: 'stopped the radio'
    });
  });

  /* ---------- Room state sync for new joiners ---------- */
  socket.on('room-state', function (state) {
    if (state.theme && state.theme !== 'default') applyTheme(state.theme);
    if (state.radio) playRadio(state.radio);
    if (state.youtube) showYouTube(state.youtube.videoId, state.youtube.position, state.youtube.paused);
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
    if (activeReactionPicker && !activeReactionPicker.contains(e.target)) {
      activeReactionPicker.remove();
      activeReactionPicker = null;
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
