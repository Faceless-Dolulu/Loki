import { SlashCommandProps } from "commandkit";
import { ChannelType, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
	.setName("sticky")
	.setDescription("null")
	.addSubcommand((command) =>
		command
			.setName("create")
			.setDescription("Create a sticky message")
			.addStringOption((option) =>
				option
					.setName("message-id")
					.setDescription(
						"The message id containing the message you want to sticky (Message must be posted in the same channel you run this commad in)"
					)
					.setMinLength(18)
					.setMaxLength(19)
					.setRequired(true)
			)
			.addChannelOption((option) =>
				option
					.setName("channel")
					.setDescription(
						"The channel you want your sticky message to be posted in (Default is the channel this command is ran in)"
					)
					.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
			)
	);

export async function run({ interaction, client, handler }: SlashCommandProps) {
	const command = interaction.options.getSubcommand();

	switch (command) {
		case "create":
			const messageId = interaction.options.getString(`message-id`) as string;
			const channel =
				interaction.options.getChannel("channel") ?? interaction.channel;

			const message = await interaction.channel?.messages.fetch(messageId);
			const messageContent = message?.content;
	}
}
