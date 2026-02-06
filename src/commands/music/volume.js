const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set playback volume')
    .addIntegerOption((option) =>
      option
        .setName('percent')
        .setDescription('1 to 200')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(200)
    ),
  async execute(interaction, { music }) {
    const percent = interaction.options.getInteger('percent', true);
    const ok = music.setVolume(interaction.guildId, percent);
    await interaction.reply({
      content: ok ? `🔊 Volume set to **${percent}%**.` : '❌ Nothing is playing.',
      ephemeral: true
    });
  }
};
