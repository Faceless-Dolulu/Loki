import ServerConfig from "../../models/ServerConfig.js";
export default async (guildMember) => {
    try {
        const serverConfig = await ServerConfig.findOne({
            guildId: guildMember.guild.id,
        });
        if (!serverConfig?.goodbyeChannelId)
            return;
        const goodbyeChannel = guildMember.guild.channels.cache.get(serverConfig.goodbyeChannelId) ??
            (await guildMember.guild.channels.fetch(serverConfig.goodbyeChannelId));
        const customMessage = serverConfig.customGoodbyeMessage ??
            `{mention-member} left the server...`;
        const goodbyeMessage = customMessage
            .replace("{mention-member}", `<@${guildMember.id}>`)
            .replace("{username}", guildMember.user.username);
        goodbyeChannel.send(goodbyeMessage).catch(() => { });
    }
    catch (error) { }
};
