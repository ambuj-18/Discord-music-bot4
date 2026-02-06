const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : fallback;
};

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID || null,
  autoDisconnectMs: Math.max(15, toInt(process.env.AUTO_DISCONNECT_SECONDS, 60)) * 1000,
  defaultVolume: Math.min(Math.max(toInt(process.env.DEFAULT_VOLUME, 80), 1), 200),
  logLevel: (process.env.LOG_LEVEL || 'info').toLowerCase(),
  ffmpegPath: require('ffmpeg-static') || path.join(process.cwd(), 'ffmpeg')
};
