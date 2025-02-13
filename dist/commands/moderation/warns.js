import { EmbedBuilder, InteractionContextType, SlashCommandBuilder, } from "discord.js";
import Warns from "../../models/Warns.js";
import { Pagination } from "pagination.djs";
import ServerConfig from "../../models/ServerConfig.js";
import { fileURLToPath } from "url";
export const data = new SlashCommandBuilder()
    .setName("warns")
    .setDescription("View warns of a particular user in this server")
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((command) => command
    .setName("view")
    .setDescription("View warns of a particular user in this server")
    .addUserOption((option) => option
    .setName("user")
    .setDescription("The user you want to check")
    .setRequired(true)))
    .addSubcommand((command) => command
    .setName("edit")
    .setDescription("Edit the reason of an existing warning")
    .addStringOption((option) => option
    .setName(`warn-id`)
    .setDescription("The warn ID")
    .setRequired(true)
    .setMinLength(9)
    .setMaxLength(9))
    .addStringOption((option) => option
    .setName("new-reason")
    .setDescription("The updated reason for the warning")
    .setRequired(true)
    .setMaxLength(512)))
    .addSubcommand((command) => command
    .setName("delete")
    .setDescription("Deletes a warning")
    .addStringOption((option) => option
    .setName(`warn-id`)
    .setDescription("The warn ID")
    .setRequired(true)
    .setMinLength(9)
    .setMaxLength(9))
    .addStringOption((option) => option
    .setName("reason")
    .setDescription("The reason for deleting the warning")
    .setMaxLength(512)))
    .addSubcommand((command) => command
    .setName("clear")
    .setDescription("Clears all warnings issued to the target user")
    .addUserOption((option) => option
    .setName("user")
    .setDescription("The target user")
    .setRequired(true))
    .addStringOption((option) => option
    .setName("reason")
    .setDescription(`The reason for clearing all fo the user's warnings`)
    .setMaxLength(512)));
export async function run({ interaction, client, handler }) {
    await interaction.deferReply();
    let targetUser = undefined;
    const reason = interaction.options.getString("reason") ?? "No reason was provided";
    const serverConfig = await ServerConfig.findOne({
        guildId: interaction.guildId,
    });
    const warnId = await interaction.options.getString("warn-id");
    const subCommand = interaction.options.getSubcommand();
    switch (subCommand) {
        case "view":
            targetUser = interaction.options.getUser("user");
            const warnsArray = [];
            (await Warns.find({
                guildId: interaction.guildId,
                userId: targetUser.id,
            }).lean()).forEach((warn) => {
                const warnId = warn.warnId;
                const reason = warn.reason;
                const moderatorId = warn.ModeratorID;
                const moderatorUsername = warn.ModeratorUsername;
                const timestamp = warn.TimeStamp;
                warnsArray.push({
                    name: `\u200b`,
                    value: `#${warnId}: <t:${Math.floor(timestamp / 1000)}:f> - By: **${moderatorUsername}** (${moderatorId})\n**Reason:** ${reason}`,
                });
            });
            if (warnsArray.length === 0) {
                interaction.followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setTimestamp()
                            .setTitle(`Warnings - User: ${targetUser.username} (ID ${targetUser.id})`)
                            .setDescription(`**Total:** 0`)
                            .addFields({ name: "\u200b", value: `No Warnings` })
                            .setColor(0x599bb2),
                    ],
                });
                return;
            }
            const pagination = new Pagination(interaction, { limit: 5, idle: 30000 })
                .setTitle(`Warnings - User: ${targetUser.username} (ID ${targetUser.id})`)
                .setDescription(`**Total:** ${warnsArray.length}`)
                .setColor(0x599bb2)
                .setFields(warnsArray);
            pagination.paginateFields();
            pagination.render();
            return;
        case "delete":
            const warnConfig = await Warns.findOne({
                guildId: interaction.guildId,
                warnId: warnId,
            });
            if (!warnConfig) {
                await interaction.followUp(`❌ Warning ID is invalid. Please try again.`);
                return;
            }
            const embed = new EmbedBuilder()
                .setAuthor({
                name: `${interaction.user.username} (ID ${interaction.user.id})`,
                iconURL: interaction.user.displayAvatarURL(),
            })
                .setTimestamp()
                .setFields({
                name: "Warned User",
                value: `<@${warnConfig.userId}>`,
            }, {
                name: "Warning Reason",
                value: `${warnConfig.reason}`,
            }, {
                name: `Reason for Warning Deletion`,
                value: reason,
            })
                .setColor(0x599bb2)
                .setTitle("Warning Deleted");
            const logChannel = interaction.guild?.channels.cache.get(serverConfig?.warnLogsChannelId) ??
                (await interaction.guild?.channels.fetch(serverConfig?.warnLogsChannelId));
            logChannel.send({ embeds: [embed] });
            Warns.findOneAndDelete({ warnId: warnId, guildId: interaction.guildId })
                .then(() => {
                interaction.followUp(`✅ Warning deleted`);
                return;
            })
                .catch((error) => {
                interaction.followUp(`An error has occurred. Please try again in a moment.`);
                console.log(`Error in ${fileURLToPath(import.meta.url)}:\n`, error);
            });
            return;
        case "clear":
            targetUser = interaction.options.getUser("user");
            const warns = await Warns.find({
                guildId: interaction.guildId,
                userId: targetUser?.id,
            });
            const warnLogChannel = interaction.guild?.channels.cache.get(serverConfig?.warnLogsChannelId) ??
                (await interaction.guild?.channels.fetch(serverConfig?.warnLogsChannelId));
            if (warns.length == 0 || !warns) {
                interaction.followUp(`❌ This user does not have a warn history!`);
                return;
            }
            const clearEmbed = new EmbedBuilder()
                .setAuthor({
                name: `${interaction.user.username} (ID ${interaction.user.id})`,
                iconURL: interaction.user.displayAvatarURL(),
            })
                .setTimestamp()
                .addFields({
                name: `\u200b`,
                value: `🧼 **Cleared Warnings of** ${targetUser.username} *(ID ${targetUser.id})*`,
            }, {
                name: `\u200b`,
                value: `:page_facing_up: **Reason:** ${reason}`,
            })
                .setColor(0x9dd2ff);
            await Warns.deleteMany({
                guildId: interaction.guildId,
                userId: targetUser.id,
            });
            await interaction.followUp(`All warns for ${targetUser} have been deleted!`);
            warnLogChannel.send({ embeds: [clearEmbed] });
    }
}
