import { Client, EmbedBuilder, Guild, TextChannel } from "discord.js";

export default async (guild: Guild, client: Client) => {
	try {
		const channel =
			(client.channels.cache.get(`1338574057909653605`) as TextChannel) ??
			((await client.channels.fetch(`1338574057909653605`)) as TextChannel);

		const embed = new EmbedBuilder()
			.setTitle(`Left a Server`)
			.setColor(0xaf0000)
			.addFields(
				{
					name: `Server Name`,
					value: guild.name,
					inline: true,
				},
				{
					name: `Server ID`,
					value: guild.id,
					inline: true,
				},
				{
					name: `Date left`,
					value: Date.now().toString(),
					inline: true,
				}
			);

		channel.send({ embeds: [embed] });
	} catch (error) {}
};
