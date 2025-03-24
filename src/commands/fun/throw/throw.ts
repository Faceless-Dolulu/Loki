import { SlashCommandProps } from "commandkit";
import { SlashCommandBuilder } from "discord.js";
import { objects, randomObject } from "./throwable-objects.js";

export const data = new SlashCommandBuilder()
	.setName("throw")
	.setDescription(`Throwing things is fun`)
	.addUserOption((option) =>
		option
			.setName("target")
			.setDescription("The user you want to throw things at.")
			.setRequired(false)
	);

export async function run({ interaction, client, handler }: SlashCommandProps) {
	try {
		const target =
			interaction.options.getUser("target") ?? `a random person nearby`;

		const rng = Math.floor(Math.random() * 100);

		if (rng < 5) {
			await interaction.reply(
				`TRIPLE THROW!! Threw **${randomObject()}**, **${randomObject()}**, and **${randomObject()}** at **${target}**`
			);
			return;
		}
		if (rng < 15) {
			await interaction.reply(
				`DOUBLE THROW! Threw **${randomObject()}**, and **${randomObject()}** at **${target}**`
			);
			return;
		} else {
			await interaction.reply(`Threw **${randomObject()}** at **${target}**`);
			return;
		}
	} catch (error) {}
}
