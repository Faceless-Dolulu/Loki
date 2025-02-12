import { SlashCommandProps } from "commandkit";
import {
	ActionRowBuilder,
	MessageFlags,
	ModalActionRowComponentBuilder,
	ModalBuilder,
	SlashCommandBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import ServerConfig from "../../models/ServerConfig.js";

export const data = new SlashCommandBuilder()
	.setName("suggest")
	.setDescription("Make a suggestion");

export async function run({ interaction, client, handler }: SlashCommandProps) {
	const serverConfig = await ServerConfig.findOne({
		guildId: interaction.guildId,
	});

	if (!serverConfig?.suggestionChannelId) {
		interaction.reply({
			content: `❌ Suggestions haven't been enbaled in this server!`,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const modal = new ModalBuilder()
		.setCustomId("Suggestion")
		.setTitle("Suggestion");

	const suggestionInput = new TextInputBuilder()
		.setCustomId(`suggestionInput`)
		.setLabel("Your Suggestion:")
		.setStyle(TextInputStyle.Paragraph)
		.setRequired(true)
		.setPlaceholder(`We should add...`);

	const suggestion =
		new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
			suggestionInput
		);

	modal.addComponents(suggestion);

	await interaction.showModal(modal);
}
