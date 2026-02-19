# MessageMaye

Real-time room-based messaging. Enter a room key and nickname, then chat with everyone in the same room.

**Live:** [www.simplemessager.com](https://www.simplemessager.com) — hosted on [Railway](https://railway.app).

## Run locally

1. Install dependencies:
   ```bash
   cd MessageMaye
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open **http://localhost:3000** in your browser.

4. Enter a room key (e.g. `lobby`) and a nickname, then click **Join room**. Open another tab or browser with the same room key and a different nickname to test chatting.

## Deploy (Railway)

- Connect this repo to Railway; the app uses `PORT` from the environment.
- Add your custom domain (e.g. **www.simplemessager.com**) in the Railway project settings and point DNS as instructed.

## Tech

- **Node.js** + **Express** (static files + routes)
- **Socket.io** (real-time messages and room membership)
- No chat history; messages are in-memory only.
