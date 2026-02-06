const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube/Spotify link or search query')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('YouTube URL, Spotify track URL, or search query')
        .setRequired(true)
    ),
  async execute(interaction, { music }) {
    const query = interaction.options.getString('query', true);
    await interaction.deferReply();

    try {
      const { track, started } = await music.enqueue(interaction, query);
      await interaction.editReply(
        started
          ? `▶️ Now playing: **${track.title}**`
          : `➕ Added to queue: **${track.title}**`
      );
    } catch (error) {
      await interaction.editReply(`❌ ${error.message}`);
    }
  }
};
