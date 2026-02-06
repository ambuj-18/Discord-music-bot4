const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('nowplaying').setDescription('Show current song'),
  async execute(interaction, { music }) {
    const snapshot = music.getQueueSnapshot(interaction.guildId);
    if (!snapshot?.current) {
      await interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
      return;
    }

    const current = snapshot.current;
    await interaction.reply({
      content: `🎵 **${current.title}**\n⏱️ ${music.formatDuration(current.duration)} | 🙋 Requested by ${current.requestedBy}`,
      ephemeral: true
    });
  }
};
