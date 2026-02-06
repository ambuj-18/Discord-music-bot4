const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('stop').setDescription('Stop playback and clear queue'),
  async execute(interaction, { music }) {
    const ok = music.stop(interaction.guildId);
    await interaction.reply({ content: ok ? '⏹️ Stopped and cleared queue.' : '❌ Nothing to stop.', ephemeral: true });
  }
};
