import { CommandKit } from "commandkit";
import { Client, EmbedBuilder, Message, TextChannel } from "discord.js";
import StickyMessages from "../../models/StickyMessages.js";

export default async function (
	message: Message,
	client: Client,
	handler: CommandKit
) {
	try {
		const sticky = await StickyMessages.findOne({
			guildId: message.guildId,
			channelId: message.channelId,
		});
		if (message.author.bot) return;
		if (!sticky) return;
		const channel = message.channel as TextChannel;

		const prevSticky =
			(message.channel.messages.cache.get(
				sticky.stickyMessageId as string
			) as Message) ??
			((await message.channel.messages.fetch(
				sticky.stickyMessageId as string
			)) as Message);

		const embed = new EmbedBuilder()
			.setTitle(sticky.messageTitle)
			.setDescription(sticky.messageContent)
			.setColor(0xb45d00);

		await prevSticky.delete();

		const newMessage = await channel.send({ embeds: [embed] });

		await sticky.updateOne({ stickyMessageId: newMessage.id });
		await sticky.save();
		return true;
	} catch {}
}
