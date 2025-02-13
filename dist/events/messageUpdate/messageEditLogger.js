import { EmbedBuilder, } from "discord.js";
import ServerConfig from "../../models/ServerConfig.js";
export default async function (oldMessage, newMessage, client, handler) {
    try {
        const serverConfig = await ServerConfig.findOne({
            guildId: oldMessage.guildId,
        });
        if (oldMessage.author?.bot) {
            return;
        }
        if (!serverConfig?.messageLogsChannelId)
            return;
        if (!oldMessage.author?.bot && !newMessage.author?.bot) {
            const embed = new EmbedBuilder()
                .setAuthor({
                name: `${newMessage.author?.username} (ID ${newMessage.author?.id})`,
                iconURL: newMessage.author?.displayAvatarURL(),
            })
                .setTitle("Message Edited")
                .addFields({ name: "Original Message", value: `${oldMessage.content}` }, { name: "Updated Message", value: `${newMessage.content}` })
                .setTimestamp()
                .setColor(0x33bbff);
            const logChannel = oldMessage.guild?.channels.cache.get(serverConfig?.messageLogsChannelId) ??
                (await oldMessage.guild?.channels.fetch(serverConfig?.messageLogsChannelId));
            logChannel.send({ embeds: [embed] });
            return true;
        }
    }
    catch (error) { }
}
