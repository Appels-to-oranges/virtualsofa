# Virtual Sofa

A real-time, room-based chat app where everyone on the same room key shares the same vibe — background, music, and video all stay in sync.

Watch YouTube. Listen to the radio. Share photos. All at the same time if you want.

**Live at [virtualsofa.space](https://virtualsofa.space)**

## Features

- **Room-based chat** — Create or join a room with any key. Everyone with the same key lands in the same space. No sign-up required, just pick a nickname.
- **Synced YouTube backgrounds** — Paste a YouTube link and it becomes the room's video wallpaper. Play, pause, rewind, and skip — all synced for everyone.
- **Live radio** — Search thousands of stations and stream one for the whole room. Powered by the Radio Browser API.
- **Photo sharing** — Drop images directly into the chat (up to 4 MB).
- **Reactions** — React to any message with emoji. Reactions are visible to the entire room.
- **Emoji picker** — Quick-access emoji tray built into the message input.
- **Themed backgrounds** — Choose from color themes (Amber, Slate, Gray, Blue) or animated scenes (Waterfront, Buildings, Apartments, Fireflies, Snowy Lot). Changes apply to everyone in the room.
- **Per-user settings** — Adjust font size, radio volume, and video volume independently.
- **Ephemeral by design** — No messages are stored. When the last person leaves, the room is gone.

## Tech

- **Node.js** + **Express** for serving and routing
- **Socket.io** for real-time communication and room management
- **YouTube IFrame API** for embedded synced video
- **Radio Browser API** for live station search and streaming
