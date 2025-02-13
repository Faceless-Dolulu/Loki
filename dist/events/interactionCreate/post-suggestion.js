import { EmbedBuilder, } from "discord.js";
import serverConfigSchema from "../../models/ServerConfig.js";
export default async (interaction, Client, handler) => {
    try {
        if (!interaction.isFromMessage)
            return;
        if (interaction.customId === "Suggestion") {
            const suggestion = interaction.fields.getTextInputValue("suggestionInput");
            const serverConfig = await serverConfigSchema.findOne({
                guildId: interaction.guildId,
            });
            const suggestionChannel = interaction.guild?.channels.cache.get(serverConfig?.suggestionChannelId) ||
                (await interaction.guild?.channels.fetch(serverConfig?.suggestionChannelId));
            const embed = new EmbedBuilder()
                .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL(),
            })
                .setDescription(suggestion)
                .setTimestamp()
                .setColor("DarkBlue")
                .setFooter({ text: `Suggestion Author ID: ${interaction.user.id}` });
            await suggestionChannel.send({ embeds: [embed] });
            await suggestionChannel.lastMessage?.react(`✅`);
            await suggestionChannel.lastMessage?.react("❌");
            interaction.reply({
                content: `Your submission has been received!`,
                flags: "Ephemeral",
            });
            return true;
        }
    }
    catch (error) {
        console.log(error);
    }
};
