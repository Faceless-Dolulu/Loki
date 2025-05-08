import { CommandOptions, SlashCommandProps } from "commandkit";
import { SlashCommandAssertions, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
	.setName(`memory`)
	.setDescription(`Check the memory usage.`);
export async function run({ interaction, client, handler }: SlashCommandProps) {
	const processMemory = process.memoryUsage().heapUsed;
	const availableMemory = process.availableMemory();
	const getPercentage =
		((processMemory / availableMemory) * 100).toFixed(2) + "%";
	await interaction.reply(
		`Memory used in MB: ${(processMemory / Math.pow(1024, 2)).toFixed(
			2
		)}\nUsed Memory ${getPercentage}`
	);
	return;
}
export const options: CommandOptions = {
	devOnly: true,
};
