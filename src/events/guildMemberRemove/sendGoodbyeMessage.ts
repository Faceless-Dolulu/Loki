import { BaseGuildTextChannel, GuildMember } from "discord.js";
import ServerConfig from "../../models/ServerConfig.js";

export default async (guildMember: GuildMember) => {
	try {
		const serverConfig = await ServerConfig.findOne({
			guildId: guildMember.guild.id,
		});

		if (!serverConfig?.goodbyeChannelId) return;

		const goodbyeChannel =
			(guildMember.guild.channels.cache.get(
				serverConfig.goodbyeChannelId
			) as BaseGuildTextChannel) ??
			((await guildMember.guild.channels.fetch(
				serverConfig.goodbyeChannelId
			)) as BaseGuildTextChannel);

		const customMessage =
			serverConfig.customGoodbyeMessage ??
			`{mention-member} left the server...`;

		const goodbyeMessage = customMessage
			.replace("{mention-member}", `<@${guildMember.id}>`)
			.replace("{username}", guildMember.user.username);
		goodbyeChannel.send(goodbyeMessage).catch(() => {});
	} catch (error) {}
};
