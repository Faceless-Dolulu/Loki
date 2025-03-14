import { CommandKit } from "commandkit";
import {
	AuditLogEvent,
	BaseGuildTextChannel,
	Client,
	EmbedBuilder,
	Message,
	PartialMessage,
	User,
} from "discord.js";
import ServerConfig from "../../models/ServerConfig.js";

export default async function (
	message: Message<boolean> | PartialMessage,
	client: Client,
	handler: CommandKit
) {
	try {
		const serverConfig = await ServerConfig.findOne({
			guildId: message.guildId,
		});

		if (
			!serverConfig?.messageLogsChannelId ||
			message.partial ||
			message.author.bot
		)
			return;

		const logs = await message.guild?.fetchAuditLogs({
			type: AuditLogEvent.MessageDelete,
			limit: 1,
		});

		const firstEntry = logs?.entries.first();
		const messageAuthor = message.author;
		const executor = firstEntry?.executor as User;

		const embed = new EmbedBuilder()
			.setAuthor({
				name: `${executor.username} (ID ${executor.id})`,
				iconURL: executor.displayAvatarURL(),
			})
			.addFields({
				name: "\u200b",
				value: `**Message sent by ${messageAuthor} deleted in ${message.channel}**\n${message.content}`,
			})
			.setFooter({
				text: `Author: ${message.author?.id} | Message ID: ${message.id}`,
			})
			.setTimestamp()
			.setColor(0x33bbff);

		const logChannel =
			(message.guild?.channels.cache.get(
				serverConfig?.messageLogsChannelId as string
			) as BaseGuildTextChannel) ??
			((await message.guild?.channels.fetch(
				serverConfig?.messageLogsChannelId as string
			)) as BaseGuildTextChannel);
		logChannel.send({ embeds: [embed] });
	} catch (error) {}
}
