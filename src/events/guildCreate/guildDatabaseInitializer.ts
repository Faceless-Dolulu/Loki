import {
	ChannelType,
	Client,
	Guild,
	PermissionFlagsBits,
	User,
} from "discord.js";
import ServerConfigs from "../../models/ServerConfigs_new.js";

export default async (guild: Guild, client: Client) => {
	try {
		let found = 0;
		const bot = client.user as User;
		const config = new ServerConfigs({ guildId: guild.id });
		config.save();
		guild.channels.cache.forEach((c) => {
			if (found == 0) {
				if (
					c.type == ChannelType.GuildText &&
					c
						.permissionsFor(bot.id)
						?.has(
							PermissionFlagsBits.ViewChannel &&
								PermissionFlagsBits.SendMessages
						)
				) {
					found = 1;

					setTimeout(() => {
						c.send(`Thank you for inviting me to your server! {Place Holder}`);
					}, 1000);
					console.log(
						`Database document for ${guild.name} successfully initialized!`
					);

					return;
				}
			}
		});
	} catch (error) {
		let found = 0;
		const bot = client.user as User;
		guild.channels.cache.forEach((c) => {
			if (found == 0) {
				if (
					c.type == ChannelType.GuildText &&
					c
						.permissionsFor(bot.id)
						?.has(
							PermissionFlagsBits.ViewChannel &&
								PermissionFlagsBits.SendMessages
						)
				) {
					found = 1;
					c.send(
						`Thank you for inviting me to your server, but an error occurred when automatically initializing an entry for this server in my database. Please remove me from this server and invite me back so I can try again.`
					);
					console.log(
						`Error initializing database entry for guild: ${guild.name}\n`,
						error
					);
					return;
				}
			}
		});
	}
};
