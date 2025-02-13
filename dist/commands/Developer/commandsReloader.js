import { SlashCommandBuilder } from "discord.js";
export const data = new SlashCommandBuilder()
    .setName(`reload`)
    .setDescription(`reloads all commands/events`);
export async function run({ interaction, client, handler }) {
    await handler.reloadCommands("global");
    await handler.reloadEvents();
    await handler.reloadValidations();
    await interaction.reply({
        content: `✅ All commands/events/validations have been reloaded!`,
        flags: "Ephemeral",
    });
}
export const options = {
    devOnly: true,
};
