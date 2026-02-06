const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('pause').setDescription('Pause current playback'),
  async execute(interaction, { music }) {
    const ok = music.pause(interaction.guildId);
    await interaction.reply({ content: ok ? '⏸️ Paused.' : '❌ Nothing is playing.', ephemeral: true });
  }
};
