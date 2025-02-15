import { SlashCommandProps } from "commandkit";
import {
	ActionRowBuilder,
	ChannelType,
	ModalActionRowComponentBuilder,
	ModalBuilder,
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
	);

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
	}
}
