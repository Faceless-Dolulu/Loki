import { SlashCommandProps } from "commandkit";
import {
	BaseGuildTextChannel,
	Message,
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
			.setMinValue(1)
			.setMaxValue(100)
			.setRequired(true)
	);

export async function run({ interaction, client, handler }: SlashCommandProps) {
	const limit = interaction.options.getInteger("messages") as number;
	const channel = interaction.channel as BaseGuildTextChannel;
	const messagesToDelete = [] as Message[];
	const messages = (await channel.messages.fetch({ limit: limit })).forEach(
		(m) => {
			if (Date.now() - m.createdTimestamp < 1.21e9) {
				// 14 days old
				messagesToDelete.push(m);
			}
		}
	);

	await channel.bulkDelete(messagesToDelete.length);

	await interaction.reply(
		`✅ Cleared ${messagesToDelete.length} messages from this channel!`
	);

	setTimeout(async () => {
		await interaction.deleteReply();
	}, 3000);
}
