import { SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with pong!');

async function execute(interaction) {
  await interaction.reply('Pong!');
}

export default { data, execute };
