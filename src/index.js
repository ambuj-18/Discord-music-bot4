const { Collection, GatewayIntentBits, Client } = require('discord.js');
const config = require('./config');
const Logger = require('./utils/logger');
const { MusicManager } = require('./utils/musicManager');
const loadCommands = require('./handlers/loadCommands');
const loadEvents = require('./handlers/loadEvents');

if (!config.token || !config.clientId) {
  // eslint-disable-next-line no-console
  console.error('Missing DISCORD_TOKEN or CLIENT_ID in environment.');
  process.exit(1);
}

const logger = new Logger(config.logLevel);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});
client.commands = new Collection();

const music = new MusicManager(client, logger, config);

loadCommands(client, logger);
loadEvents(client, { client, config, logger, music }, logger);

process.on('unhandledRejection', (error) => logger.error('Unhandled rejection', { message: error?.message }));
process.on('uncaughtException', (error) => logger.error('Uncaught exception', { message: error?.message }));

client.login(config.token).catch((error) => {
  logger.error('Login failed', { message: error.message });
  process.exit(1);
});
