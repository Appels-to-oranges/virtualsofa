const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 5e6 });

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

const roomState = {};
let msgIdCounter = 0;

function getRoom(key) {
  if (!roomState[key]) roomState[key] = { radio: null, youtube: null, theme: null };
  return roomState[key];
}

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomKey, nickname }) => {
    const safeRoom = String(roomKey).trim().toLowerCase() || 'default';
    const safeNick = String(nickname).trim() || 'Anonymous';
    socket.roomKey = safeRoom;
    socket.nickname = safeNick;
    socket.join(safeRoom);

    const state = getRoom(safeRoom);
    const ytForClient = state.youtube ? {
      videoId: state.youtube.videoId,
      position: state.youtube.paused
        ? state.youtube.pausedElapsed
        : (Date.now() - state.youtube.startedAt) / 1000,
      paused: state.youtube.paused
    } : null;
    socket.emit('room-state', { radio: state.radio, youtube: ytForClient, theme: state.theme });

    io.to(safeRoom).emit('user-joined', { nickname: safeNick });
    const count = io.sockets.adapter.rooms.get(safeRoom)?.size || 0;
    io.to(safeRoom).emit('user-count', count);
  });

  socket.on('send-message', (text) => {
    const roomKey = socket.roomKey;
    const nickname = socket.nickname;
    if (!roomKey || !nickname) return;
    const payload = { id: ++msgIdCounter, nickname, text: String(text).trim(), time: new Date().toISOString() };
    io.to(roomKey).emit('new-message', payload);
  });

  socket.on('send-image', (dataUrl) => {
    if (!socket.roomKey || !socket.nickname) return;
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return;
    io.to(socket.roomKey).emit('new-image', {
      id: ++msgIdCounter,
      nickname: socket.nickname,
      src: dataUrl,
      time: new Date().toISOString()
    });
  });

  socket.on('change-radio', (station) => {
    if (!socket.roomKey || !socket.nickname) return;
    if (!station || typeof station.name !== 'string' || typeof station.url !== 'string') return;
    const s = { name: station.name.slice(0, 200), url: station.url };
    getRoom(socket.roomKey).radio = s;
    io.to(socket.roomKey).emit('radio-changed', { nickname: socket.nickname, station: s });
  });

  socket.on('stop-radio', () => {
    if (!socket.roomKey || !socket.nickname) return;
    getRoom(socket.roomKey).radio = null;
    io.to(socket.roomKey).emit('radio-stopped', { nickname: socket.nickname });
  });

  socket.on('change-youtube', (videoId) => {
    if (!socket.roomKey || !socket.nickname) return;
    const safe = String(videoId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20);
    if (!safe) return;
    getRoom(socket.roomKey).youtube = {
      videoId: safe,
      startedAt: Date.now(),
      pausedElapsed: null,
      paused: false
    };
    io.to(socket.roomKey).emit('youtube-changed', { nickname: socket.nickname, videoId: safe });
  });

  socket.on('stop-youtube', () => {
    if (!socket.roomKey || !socket.nickname) return;
    getRoom(socket.roomKey).youtube = null;
    io.to(socket.roomKey).emit('youtube-stopped', { nickname: socket.nickname });
  });

  socket.on('pause-youtube', () => {
    if (!socket.roomKey || !socket.nickname) return;
    const room = getRoom(socket.roomKey);
    if (!room.youtube || room.youtube.paused) return;
    room.youtube.pausedElapsed = (Date.now() - room.youtube.startedAt) / 1000;
    room.youtube.paused = true;
    io.to(socket.roomKey).emit('youtube-paused', { nickname: socket.nickname });
  });

  socket.on('resume-youtube', () => {
    if (!socket.roomKey || !socket.nickname) return;
    const room = getRoom(socket.roomKey);
    if (!room.youtube || !room.youtube.paused) return;
    room.youtube.startedAt = Date.now() - (room.youtube.pausedElapsed * 1000);
    room.youtube.paused = false;
    room.youtube.pausedElapsed = null;
    io.to(socket.roomKey).emit('youtube-resumed', { nickname: socket.nickname });
  });

  socket.on('seek-youtube', (seconds) => {
    if (!socket.roomKey || !socket.nickname) return;
    const room = getRoom(socket.roomKey);
    if (!room.youtube) return;
    const secs = Number(seconds) || 10;
    if (room.youtube.paused) {
      room.youtube.pausedElapsed = Math.max(0, room.youtube.pausedElapsed + secs);
    } else {
      room.youtube.startedAt -= secs * 1000;
      const elapsed = (Date.now() - room.youtube.startedAt) / 1000;
      if (elapsed < 0) room.youtube.startedAt = Date.now();
    }
    const pos = room.youtube.paused
      ? room.youtube.pausedElapsed
      : Math.max(0, (Date.now() - room.youtube.startedAt) / 1000);
    io.to(socket.roomKey).emit('youtube-seeked', { nickname: socket.nickname, position: pos, direction: secs >= 0 ? 'forward' : 'back' });
  });

  socket.on('change-background', (theme) => {
    if (!socket.roomKey || !socket.nickname) return;
    const safeTheme = String(theme).trim().toLowerCase();
    getRoom(socket.roomKey).theme = safeTheme;
    io.to(socket.roomKey).emit('background-changed', { nickname: socket.nickname, theme: safeTheme });
  });

  socket.on('toggle-reaction', (data) => {
    if (!socket.roomKey || !socket.nickname) return;
    if (!data || typeof data.msgId !== 'number' || typeof data.emoji !== 'string') return;
    io.to(socket.roomKey).emit('reaction-toggled', {
      msgId: data.msgId,
      emoji: data.emoji.slice(0, 8),
      nickname: socket.nickname
    });
  });

  socket.on('disconnect', () => {
    if (socket.nickname && socket.roomKey) {
      io.to(socket.roomKey).emit('user-left', { nickname: socket.nickname });
      const count = io.sockets.adapter.rooms.get(socket.roomKey)?.size || 0;
      io.to(socket.roomKey).emit('user-count', count);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`MessageMaye running at http://localhost:${PORT}`);
});
