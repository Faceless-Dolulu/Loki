import { SlashCommandProps } from "commandkit";
import {
	PermissionFlagsBits,
	SlashCommandBuilder,
	TextChannel,
} from "discord.js";

export const data = new SlashCommandBuilder()
	.setName(`clear`)
	.setDescription("Bulk deletes messages up to a limit of 100")
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
	.addIntegerOption((option) =>
		option
			.setName("messages")
			.setDescription(`The number of messages to delete.`)
			.setMinValue(2)
			.setMaxValue(100)
			.setRequired(true)
	);

export async function run({ interaction, client, handler }: SlashCommandProps) {
	const limit = interaction.options.getInteger("messages");
	const channel = interaction.channel as TextChannel;

	await channel.bulkDelete(limit as number);

	interaction.reply(`✅ Cleared ${limit} messages from this channel!`);
}
