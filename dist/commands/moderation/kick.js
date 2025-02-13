import { EmbedBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, } from "discord.js";
import serverConfigSchema from "../../models/ServerConfig.js";
import { fileURLToPath } from "url";
export const data = new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kicks a user from this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((option) => option
    .setName("user")
    .setDescription("The user you want to kick")
    .setRequired(true))
    .addStringOption((option) => option
    .setName("reason")
    .setDescription("The reason for kicking this user from the server")
    .setMaxLength(512))
    .setContexts(InteractionContextType.Guild);
export async function run({ interaction, client, handler }) {
    try {
        const targetMember = interaction.options.getMember("user");
        const reason = interaction.options.getString("reason") ?? "No reason was provided";
        await interaction.deferReply();
        const executor = interaction.member;
        const executorRoles = executor?.roles;
        const targetRoles = targetMember?.roles;
        if (!targetMember) {
            await interaction.followUp(`❌ User is not in this server!`);
        }
        if (targetMember.id === executor.id) {
            await interaction.followUp(`❌ you cannot kick yourself!`);
            return;
        }
        if (targetRoles.highest.position >= executorRoles.highest.position) {
            await interaction.followUp(`❌ You can't kick a user with equal or higher roles!`);
            return;
        }
        if (!targetMember.kickable) {
            interaction.followUp(`❌ This user cannot be kicked!`);
            return;
        }
        const serverConfig = await serverConfigSchema.findOne({
            guildId: interaction.guildId,
        });
        const kickLogChannel = interaction.guild?.channels.cache.get(serverConfig?.kickLogsChannelId) ??
            (await interaction.guild?.channels.fetch(serverConfig?.kickLogsChannelId));
        const kickLogMessage = new EmbedBuilder()
            .setColor(0xffff00)
            .setAuthor({
            name: `${executor.user.username} (ID ${executor.id})`,
            iconURL: executor.displayAvatarURL(),
        })
            .setThumbnail(targetMember.displayAvatarURL())
            .addFields({
            name: "\u200b",
            value: `👢 **Kicked:**${targetMember} (ID ${targetMember.id})`,
        }, {
            name: "\u200b",
            value: `:page_facing_up: **Reason:** ${reason}`,
        })
            .setTimestamp();
        targetMember
            .send({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xffff00)
                    .setDescription(`⚠ You were **Kicked** from ${interaction.guild?.name}\n📄 **Reason:** ${reason} `)
                    .setTimestamp()
                    .setThumbnail(interaction.guild?.iconURL()),
            ],
        })
            .catch();
        await targetMember.kick(reason).then(async () => {
            if (kickLogChannel !== null) {
                kickLogChannel.send({ embeds: [kickLogMessage] });
            }
            await interaction.followUp(`👢 ${targetMember} has been kicked from the server!`);
        });
    }
    catch (error) {
        interaction.followUp(`An error occured running this command. Please try again in a moment.`);
        console.log(`An error occured in ${fileURLToPath(import.meta.url)}:\n`, error);
    }
}
export const options = {
    botPermissions: [`KickMembers`],
};
