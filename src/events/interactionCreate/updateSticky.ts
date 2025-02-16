import { CommandKit } from "commandkit";
import {
	Client,
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
	if (interaction.customId === `StickyUpdate`) {
		const Sticky = await StickyMessages.findOne({
			channelId: interaction.channelId,
		});
		const stickyTitle =
			interaction.fields.getTextInputValue("stickyTitle") ?? "Sticky Message";
		const stickyContent = interaction.fields.getTextInputValue(`stickyContent`);
		const embed = new EmbedBuilder()
			.setTitle(stickyTitle ?? `Sticky Message`)
			.setDescription(stickyContent)
			.setColor(0xb45d00);
		const channel = interaction.channel as GuildTextBasedChannel;

		const prevSticky =
			(channel.messages.cache.get(
				Sticky?.stickyMessageId as string
			) as Message) ??
			((await channel.messages.fetch(
				Sticky?.stickyMessageId as string
			)) as Message);
		await interaction.reply({
			content: `Uploading edits to database...`,
			flags: "Ephemeral",
		});
		setTimeout(async () => {
			await Sticky?.updateOne({
				messageTitle: stickyTitle ?? `Sticky Message`,
				messageContent: stickyContent,
			});
			await interaction.editReply(`Editing previous sticky...`);
			await prevSticky.edit({ embeds: [embed] });
			await interaction.editReply(`✅ Sticky message sucesfully updated!`);
			setTimeout(() => {
				interaction.deleteReply();
			}, 3000);
		}, 3000);

		return true;
	}
};
