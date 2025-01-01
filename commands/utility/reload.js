import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import fs from 'node:fs';
import path from 'node:path';

import { SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName('reload')
  .setDescription('Hot-Reloads the cached data for the given command')
  .addStringOption(option =>
    option
      .setName('command')
      .setDescription('Command to be reloaded')
      .setRequired(true)
  );

async function execute(interaction) {
  const commandName = interaction.options.getString('command', true).toLowerCase();
  const command = interaction.client.commands.get(commandName);

  if (!command) return await interaction.reply(`There is no command with name \`${commandName}\`!`);

  // Ensuring correct path is created and allows access to all command folders
  const __filename = path.resolve(fileURLToPath(import.meta.url) + "/../");
  const __dirname = dirname(__filename);

  // Filters used during file checks
  const isCommandFile = f => f.endsWith('.js');
  const isSelectedCommand = f => f.split('.')[0] === commandName;
  const isCommandMatch = f => {
    return isCommandFile(f) && isSelectedCommand(f);
  };

  // Default empty results in location failure if never filled
  let commandMatchPath = '';
  const commandFolders = fs.readdirSync(__dirname);
  for (const folder of commandFolders) {
    const commandsPath = path.join(__dirname, folder);
    const fileMatch = fs.readdirSync(commandsPath).find(file => isCommandMatch(file));
    if (!fileMatch) continue;

    // Construct file path if matching command file is located
    commandMatchPath = path.join('file://', commandsPath, fileMatch);
    break;
  }

  if (commandMatchPath === '') return await interaction.reply(`Command File Location failed!`);

  // Retrieve actual command info from cache
  // TODO: Update export method on next repo push to match current import/export structure
  const { default: loadedCommand } = await import(commandMatchPath);

  try {
    interaction.client.commands.delete(loadedCommand.data.name);

    const { default: newCommand } = await import(commandMatchPath + `?=${Date.now()}`);

    interaction.client.commands.set(newCommand.data.name, newCommand);

    return await interaction.reply(`Command \`${newCommand.data.name}\` has been reloaded!`);
  } catch (e) {
    console.error(e);
    return await interaction.reply(`There was an error while reloading a command \`${command.data.name}\`:\n\`${e.message}\``);
  }
}

export default { data, execute };