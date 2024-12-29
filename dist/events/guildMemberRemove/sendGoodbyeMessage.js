import goodbyeChannelSchema from "../../models/GoodbyeChannel.js";
export default async (guildMember) => {
    try {
        const goodbyeConfigs = await goodbyeChannelSchema.find({
            guildId: guildMember.guild.id,
        });
        if (!goodbyeConfigs.length)
            return;
        for (const goodbyeConfig of goodbyeConfigs) {
            const GoodbyeChannel = guildMember.guild.channels.cache.get(goodbyeConfig.channelId)
                ||
                    (await guildMember.guild.channels.fetch(goodbyeConfig.channelId));
            if (!GoodbyeChannel) {
                goodbyeChannelSchema.findOneAndDelete({
                    guildId: guildMember.guild.id,
                    channelId: goodbyeConfig.channelId,
                }).catch(() => { });
            }
            const customMessage = goodbyeConfig.customeMessage
                ||
                    `{mention-member} left the server...`;
            const goodbyeMessage = customMessage
                .replace('{mention-member}', `<@${guildMember.id}>`)
                .replace('{username}', guildMember.user.username);
        }
    }
    catch (error) {
    }
};
