import { BaseGuildTextChannel, GuildMember } from "discord.js";
import ServerConfig from "../../models/ServerConfig.js";

export default async (guildMember: GuildMember) => {
	try {
		const serverConfig = await ServerConfig.findOne({
			guildId: guildMember.guild.id,
		});

		if (!serverConfig?.welcomeChannelId) return;

		const welcomeChannel =
			(guildMember.guild.channels.cache.get(
				serverConfig.welcomeChannelId
			) as BaseGuildTextChannel) ??
			((await guildMember.guild.channels.fetch(
				serverConfig.welcomeChannelId
			)) as BaseGuildTextChannel);

		const customMessage =
			serverConfig.customWelcomeMessage ??
			`👋 Hey {mention-member}! Welcome to {server-name}!`;

		const welcomeMessage = customMessage
			.replace("{mention-member}", `<@${guildMember.id}>`)
			.replace("{username}", guildMember.user.username)
			.replace("{server-name}", guildMember.guild.name);

		welcomeChannel.send(welcomeMessage).catch((error) => {
			console.log(error);
		});
	} catch (error) {
		console.log(error);
	}
};
