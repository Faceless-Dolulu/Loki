import { CommandKit } from "commandkit";
import {
	BaseGuildTextChannel,
	Client,
	EmbedBuilder,
	Message,
	MessageReaction,
	User,
} from "discord.js";
import ServerConfig from "../../models/ServerConfig.js";

export default async function (
	reaction: MessageReaction,
	user: User,
	client: Client,
	handler: CommandKit
) {
	try {
		const serverConfig = await ServerConfig.findOne({
			guildId: reaction.message.guildId,
		});

		if (!serverConfig?.starboardChannelId) return;

		if (
			reaction.emoji.name !== `${serverConfig.starboardReactionEmoji}` ||
			reaction.message.author?.bot
		)
			return;

		if (reaction.count >= serverConfig.starboardReactionCount) {
			const starboardChannel =
				(reaction.message.guild?.channels.cache.get(
					serverConfig.starboardChannelId
				) as BaseGuildTextChannel) ??
				((await reaction.message.guild?.channels.fetch(
					serverConfig.starboardChannelId
				)) as BaseGuildTextChannel);
			const fetchedStarboardEntries = starboardChannel.messages.fetch({
				limit: 100,
			});

			const stars = (await fetchedStarboardEntries).find(
				(m) =>
					m.embeds[0].footer?.text.startsWith(
						serverConfig.starboardReactionEmoji
					) && m.embeds[0].footer?.text.endsWith(reaction.message.id)
			) as Message;

			const starBoardEntry = new EmbedBuilder()
				.setColor("Gold")
				.setAuthor({
					name: reaction.message.author?.username as string,
					iconURL: reaction.message.author?.displayAvatarURL(),
				})
				.setTitle("Original Message")
				.setURL(reaction.message.url)
				.setDescription(reaction.message.content)
				.setFooter({
					text: `${reaction.emoji} ${reaction.count} | ID: ${reaction.message.id}`,
				})
				.setTimestamp(reaction.message.createdTimestamp);

			if (reaction.message.attachments) {
				const [images, nonImages] = reaction.message.attachments.partition(
					(a) => a.contentType?.includes(`image/`)
				);
				const image = images.first()?.proxyURL;

				console.log(image as string);
				starBoardEntry.setImage(image as string);
			}

			if (stars) {
				await stars.edit({ embeds: [starBoardEntry] });
				return true;
			}

			if (!stars) {
				await starboardChannel.send({ embeds: [starBoardEntry] });
				return true;
			}
		}
	} catch (error) {
		console.log(
			`An error occurred in the reactionAdd event (Starboard):\n`,
			error
		);
	}
}
