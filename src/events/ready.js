const { Events, REST, Routes } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client, { config, logger }) {
    const rest = new REST({ version: '10' }).setToken(config.token);
    const payload = [...client.commands.values()].map((command) => command.data.toJSON());

    if (config.guildId) {
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: payload });
      logger.info(`Registered ${payload.length} guild slash commands.`, { guildId: config.guildId });
    } else {
      await rest.put(Routes.applicationCommands(config.clientId), { body: payload });
      logger.info(`Registered ${payload.length} global slash commands.`);
    }

    logger.info(`Logged in as ${client.user.tag}`);
  }
};
