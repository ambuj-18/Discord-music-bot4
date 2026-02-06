const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('resume').setDescription('Resume playback'),
  async execute(interaction, { music }) {
    const ok = music.resume(interaction.guildId);
    await interaction.reply({ content: ok ? '▶️ Resumed.' : '❌ Nothing to resume.', ephemeral: true });
  }
};
