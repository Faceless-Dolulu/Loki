import { SlashCommandProps } from "commandkit";
import {
	ActionRowBuilder,
	ChannelType,
	Message,
	ModalActionRowComponentBuilder,
	ModalBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import StickyMessages from "../../models/StickyMessages.js";

export const data = new SlashCommandBuilder()
	.setName("sticky")
	.setDescription("null")
	.addSubcommand((command) =>
		command.setName("create").setDescription("Create a sticky message")
	)
	.addSubcommand((command) =>
		command
			.setName("delete")
			.setDescription("Deletes the sticky message configured for this channel!")
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function run({ interaction, client, handler }: SlashCommandProps) {
	const command = interaction.options.getSubcommand();
	const stickies = await StickyMessages.findOne({
		channelId: interaction.channelId,
	});

	switch (command) {
		case "create":
			if (stickies) {
				return await interaction.reply({
					content: `❌ You can't have more than one sticky per channel!`,
				});
			}

			const modal = new ModalBuilder()
				.setCustomId(`Sticky`)
				.setTitle(`Sticky Message Creation`);

			const stickyTitle = new TextInputBuilder()
				.setCustomId(`stickyTitle`)
				.setLabel(`Sticky Message Title`)
				.setStyle(TextInputStyle.Short)
				.setPlaceholder(`Default title is "Sticky Message"`)
				.setRequired(false);

			const stickyContent = new TextInputBuilder()
				.setCustomId(`stickyContent`)
				.setLabel(`Message Content`)
				.setStyle(TextInputStyle.Paragraph)
				.setPlaceholder(`The message you want stickied`)
				.setRequired(true);

			const title =
				new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
					stickyTitle
				);
			const description =
				new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
					stickyContent
				);

			modal.addComponents(title, description);

			await interaction.showModal(modal);

			return;
		case "delete":
			if (!stickies) {
				return await interaction.reply({
					content: `❌ A sticky message hasn't been configured in this channel!`,
				});
			}

			const sticky =
				(interaction.channel?.messages.cache.get(
					stickies.stickyMessageId as string
				) as Message) ??
				((await interaction.channel?.messages.fetch(
					stickies.stickyMessageId as string
				)) as Message);

			await interaction.reply(`Deleting Sticky Message from Database...`);

			await stickies.deleteOne();

			await interaction.editReply(`Deleting Sticky Message from Channel...`);

			await sticky.delete();

			await interaction.editReply(
				`✅ Sticky Messages for this channel have been succesfully disabled!`
			);

			setTimeout(() => {
				interaction.deleteReply().catch();
			}, 5000);

			return;
	}
}
