const { Events } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, { client, music, logger }) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, { music, logger });
    } catch (error) {
      logger.error('Command execution failed', {
        command: interaction.commandName,
        message: error.message
      });

      const payload = { content: '❌ Command failed due to an internal error.', ephemeral: true };
      if (interaction.deferred || interaction.replied) await interaction.followUp(payload);
      else await interaction.reply(payload);
    }
  }
};
