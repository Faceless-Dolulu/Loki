import { EmbedBuilder, } from "discord.js";
import ServerConfig from "../../models/ServerConfig.js";
export default async function (reaction, user, client, handler) {
    try {
        const serverConfig = await ServerConfig.findOne({
            guildId: reaction.message.guildId,
        });
        if (!serverConfig?.starboardChannelId)
            return;
        if (reaction.emoji.name !== `${serverConfig.starboardReactionEmoji}` ||
            reaction.message.author?.bot)
            return;
        if (reaction.count >= serverConfig.starboardReactionCount) {
            const starboardChannel = reaction.message.guild?.channels.cache.get(serverConfig.starboardChannelId) ??
                (await reaction.message.guild?.channels.fetch(serverConfig.starboardChannelId));
            const fetchedStarboardEntries = starboardChannel.messages.fetch({
                limit: 100,
            });
            const stars = (await fetchedStarboardEntries).find((m) => m.embeds[0].footer?.text.startsWith(serverConfig.starboardReactionEmoji) && m.embeds[0].footer?.text.endsWith(reaction.message.id));
            const starBoardEntry = new EmbedBuilder()
                .setColor("Gold")
                .setAuthor({
                name: reaction.message.author?.username,
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
                const [images, nonImages] = reaction.message.attachments.partition((a) => a.contentType?.includes(`image/`));
                const image = images.first()?.proxyURL;
                console.log(image);
                starBoardEntry.setImage(image);
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
    }
    catch (error) {
        console.log(`An error occurred in the reactionAdd event (Starboard):\n`, error);
    }
}
