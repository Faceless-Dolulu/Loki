import { CommandKit } from "commandkit";
import {
	Client,
	EmbedAssertions,
	EmbedBuilder,
	GuildTextBasedChannel,
	Message,
	ModalSubmitInteraction,
} from "discord.js";
import StickyMessages from "../../models/StickyMessages.js";

export default async (
	interaction: ModalSubmitInteraction,
	Client: Client,
	handler: CommandKit
) => {
	try {
		if (interaction.customId === "Sticky") {
			const stickyTitle =
				interaction.fields.getTextInputValue("stickyTitle") ?? "Sticky Message";
			const stickyContent =
				interaction.fields.getTextInputValue(`stickyContent`);
			const embed = new EmbedBuilder()
				.setTitle(stickyTitle ?? `Sticky Message`)
				.setDescription(stickyContent)
				.setColor(0xb45d00);
			const channel = interaction.channel as GuildTextBasedChannel;

			await interaction.reply({
				content: `Sending sticky message content...`,
				flags: "Ephemeral",
			});

			setTimeout(async () => {
				await interaction.editReply(
					`Saving sticky message content to database...`
				);

				const message = await channel.send({ embeds: [embed] });

				const stickyMessage = new StickyMessages({
					guildId: interaction.guildId,
					channelId: interaction.channelId,
					messageTitle: stickyTitle,
					messageContent: stickyContent,
					stickyMessageId: message.id,
				});

				await stickyMessage.save();

				interaction.editReply(`✅ Sticky message saved succesfully!`);

				setTimeout(() => {
					interaction.deleteReply();
				}, 3000);
			}, 3000);
			return true;
		} else return;
	} catch (error) {
		console.log(error);
	}
};
