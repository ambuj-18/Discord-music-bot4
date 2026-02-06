const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('queue').setDescription('Show queue'),
  async execute(interaction, { music }) {
    const snapshot = music.getQueueSnapshot(interaction.guildId);
    if (!snapshot || (!snapshot.current && snapshot.tracks.length === 0)) {
      await interaction.reply({ content: '📭 Queue is empty.', ephemeral: true });
      return;
    }

    const lines = [];
    if (snapshot.current) {
      lines.push(`🎵 **Now:** ${snapshot.current.title} [${music.formatDuration(snapshot.current.duration)}]`);
    }

    if (snapshot.tracks.length > 0) {
      const upcoming = snapshot.tracks.slice(0, 10).map((track, i) =>
        `${i + 1}. ${track.title} [${music.formatDuration(track.duration)}]`
      );
      lines.push(`📚 **Up next (${snapshot.tracks.length})**\n${upcoming.join('\n')}`);
    }

    lines.push(`🔁 Loop: **${snapshot.loopMode}** | 🔊 Volume: **${snapshot.volume}%**`);

    await interaction.reply({ content: lines.join('\n\n'), ephemeral: true });
  }
};
