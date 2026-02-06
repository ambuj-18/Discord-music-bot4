# Discord Music Bot (Low RAM / Free Hosting Ready)

## Project Structure

```
.
├── .env.example
├── package.json
├── README.md
└── src
    ├── commands
    │   └── music
    │       ├── loop.js
    │       ├── nowplaying.js
    │       ├── pause.js
    │       ├── play.js
    │       ├── queue.js
    │       ├── resume.js
    │       ├── skip.js
    │       ├── stop.js
    │       └── volume.js
    ├── config.js
    ├── events
    │   ├── error.js
    │   ├── interactionCreate.js
    │   ├── ready.js
    │   └── voiceStateUpdate.js
    ├── handlers
    │   ├── loadCommands.js
    │   └── loadEvents.js
    ├── index.js
    └── utils
        ├── logger.js
        └── musicManager.js
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` from `.env.example` and fill values.
3. Start bot:
   ```bash
   npm start
   ```

## Environment Variables

- `DISCORD_TOKEN` (required)
- `CLIENT_ID` (required)
- `GUILD_ID` (optional, faster slash command updates during development)
- `AUTO_DISCONNECT_SECONDS` (optional, default: `60`)
- `DEFAULT_VOLUME` (optional, default: `80`)
- `LOG_LEVEL` (optional: `debug|info|warn|error`, default: `info`)
- `SPOTIFY_CLIENT_ID` (optional)
- `SPOTIFY_CLIENT_SECRET` (optional)
- `SPOTIFY_MARKET` (optional, default: `US`)

## Deployment Guide

### Render

1. Push this project to GitHub.
2. In Render, create **New > Web Service**.
3. Connect repo and set:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add environment variables from `.env.example`.
5. Deploy.

### Railway

1. Create a new Railway project from GitHub repo.
2. Add environment variables from `.env.example`.
3. Ensure start command is `npm start`.
4. Deploy.

### Koyeb

1. Create **Web Service** from GitHub repo.
2. Runtime: Node.js.
3. Build command: `npm install`.
4. Run command: `npm start`.
5. Add environment variables from `.env.example`.
6. Deploy.

