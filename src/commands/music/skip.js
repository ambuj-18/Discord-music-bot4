const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('skip').setDescription('Skip current song'),
  async execute(interaction, { music }) {
    const ok = music.skip(interaction.guildId);
    await interaction.reply({ content: ok ? '⏭️ Skipped.' : '❌ Queue is empty.', ephemeral: true });
  }
};
