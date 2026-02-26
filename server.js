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

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomKey, nickname }) => {
    const safeRoom = String(roomKey).trim().toLowerCase() || 'default';
    const safeNick = String(nickname).trim() || 'Anonymous';
    socket.roomKey = safeRoom;
    socket.nickname = safeNick;
    socket.join(safeRoom);
    io.to(safeRoom).emit('user-joined', { nickname: safeNick });
  });

  socket.on('send-message', (text) => {
    const roomKey = socket.roomKey;
    const nickname = socket.nickname;
    if (!roomKey || !nickname) return;
    const payload = { nickname, text: String(text).trim(), time: new Date().toISOString() };
    io.to(roomKey).emit('new-message', payload);
  });

  socket.on('send-image', (dataUrl) => {
    if (!socket.roomKey || !socket.nickname) return;
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return;
    io.to(socket.roomKey).emit('new-image', {
      nickname: socket.nickname,
      src: dataUrl,
      time: new Date().toISOString()
    });
  });

  socket.on('change-radio', (station) => {
    if (!socket.roomKey || !socket.nickname) return;
    if (!station || typeof station.name !== 'string' || typeof station.url !== 'string') return;
    io.to(socket.roomKey).emit('radio-changed', {
      nickname: socket.nickname,
      station: { name: station.name.slice(0, 200), url: station.url }
    });
  });

  socket.on('stop-radio', () => {
    if (!socket.roomKey || !socket.nickname) return;
    io.to(socket.roomKey).emit('radio-stopped', { nickname: socket.nickname });
  });

  socket.on('change-youtube', (videoId) => {
    if (!socket.roomKey || !socket.nickname) return;
    const safe = String(videoId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20);
    if (!safe) return;
    io.to(socket.roomKey).emit('youtube-changed', {
      nickname: socket.nickname,
      videoId: safe
    });
  });

  socket.on('stop-youtube', () => {
    if (!socket.roomKey || !socket.nickname) return;
    io.to(socket.roomKey).emit('youtube-stopped', { nickname: socket.nickname });
  });

  socket.on('change-background', (theme) => {
    if (!socket.roomKey || !socket.nickname) return;
    const safeTheme = String(theme).trim().toLowerCase();
    io.to(socket.roomKey).emit('background-changed', {
      nickname: socket.nickname,
      theme: safeTheme
    });
  });

  socket.on('disconnect', () => {
    if (socket.nickname && socket.roomKey) {
      io.to(socket.roomKey).emit('user-left', { nickname: socket.nickname });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`MessageMaye running at http://localhost:${PORT}`);
});
