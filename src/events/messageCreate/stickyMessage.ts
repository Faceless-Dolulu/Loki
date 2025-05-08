import { CommandKit } from "commandkit";
import {
	Client,
	ColorResolvable,
	EmbedBuilder,
	Message,
	TextChannel,
} from "discord.js";
import ServerConfigs from "../../models/ServerConfigs.js";

export default async function (
	message: Message,
	client: Client,
	handler: CommandKit
) {
	try {
		const serverConfig = await ServerConfigs.findOne({
			guildId: message.guildId,
		});
		const stickyMessages = serverConfig?.stickyMessages.filter(
			(entry) => entry.channelId === message.channelId
		);
		if (message.author.bot || stickyMessages?.length == 0 || !stickyMessages)
			return;

		const embeds = [] as EmbedBuilder[];
		stickyMessages.forEach((entry) => {
			const embed = new EmbedBuilder()
				.setTitle(entry.messageTitle ?? null)
				.setDescription(entry.messageContent as string)
				.setColor((entry.stickyColour as ColorResolvable) ?? null)
				.setImage((entry.stickyAttachment as string) ?? null);
			embeds.push(embed);
		});
		const channel = message.channel as TextChannel;
		if (stickyMessages[0].stickyMessageId) {
			const prevStickyMessage =
				message.channel.messages.cache.get(
					stickyMessages[0].stickyMessageId as string
				) ??
				(await message.channel.messages.fetch(
					stickyMessages[0].stickyMessageId as string
				));
			prevStickyMessage.delete();
		}

		const newMessage = await channel.send({ embeds: embeds });

		stickyMessages.forEach((entry) => {
			entry.set({ stickyMessageId: newMessage.id });
		});
		await serverConfig?.save();
	} catch (error) {
		console.log(error);
	}
}
