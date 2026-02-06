const { SlashCommandBuilder } = require('discord.js');
const { LOOP_OFF, LOOP_QUEUE, LOOP_TRACK } = require('../../utils/musicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Set loop mode')
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('Loop mode')
        .setRequired(true)
        .addChoices(
          { name: 'Off', value: LOOP_OFF },
          { name: 'Track', value: LOOP_TRACK },
          { name: 'Queue', value: LOOP_QUEUE }
        )
    ),
  async execute(interaction, { music }) {
    const mode = interaction.options.getString('mode', true);
    const changed = music.setLoop(interaction.guildId, mode);
    await interaction.reply({
      content: changed ? `🔁 Loop mode set to **${changed}**.` : '❌ Queue is empty.',
      ephemeral: true
    });
  }
};
