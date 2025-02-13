import { EmbedBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, } from "discord.js";
import ms from "ms";
import prettyMilliseconds from "pretty-ms";
import ServerConfig from "../../models/ServerConfig.js";
import { fileURLToPath } from "url";
export const data = new SlashCommandBuilder()
    .setName("timeout")
    .setDescription(`Timeouts a user`)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) => option
    .setName("user")
    .setDescription("The user you want to timeout")
    .setRequired(true))
    .addStringOption((option) => option
    .setName("reason")
    .setDescription("The reason for issuing a timeout to the target user")
    .setMaxLength(512))
    .addStringOption((option) => option.setName("duration").setDescription("Timeout duration (30m, 1h, 1d)"))
    .setContexts(InteractionContextType.Guild);
export async function run({ interaction, client, handler }) {
    try {
        const targetMember = interaction.options.getMember("user");
        const reason = interaction.options.getString("reason") ?? "No reason was provided";
        const durationInput = interaction.options.getString("duration") ?? `30m`;
        const timeoutDuration = ms(durationInput);
        const executor = interaction.member;
        const executorRoles = executor?.roles;
        const targetRoles = targetMember?.roles;
        interaction.deferReply();
        if (!interaction.guild?.members.me?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            interaction.followUp(`❌ I do not have the necessary permissions to execute this command!`);
            return;
        }
        if (isNaN(timeoutDuration)) {
            await interaction.followUp(`❌ Please provide a valid duration!`);
            return;
        }
        if (targetMember.id === executor.id) {
            await interaction.followUp(`❌ You can't time yourself out!`);
            return;
        }
        if (timeoutDuration < 5000 || timeoutDuration > 2.519e9) {
            await interaction.followUp(`❌ Timeout duration cannot be less than 5 seconds or more than 28 days!`);
            return;
        }
        if (!targetMember) {
            await interaction.followUp(`❌ user is not in this server!`);
            return;
        }
        if (targetMember.user.bot) {
            await interaction.followUp(`❌ I cannot time out a bot!`);
            return;
        }
        if (targetRoles.highest.position >= executorRoles.highest.position) {
            await interaction.followUp(`❌ you can't timeout a user with equal or higher roles than you!`);
            return;
        }
        const timeoutLogMessage = new EmbedBuilder()
            .setColor(0xe9e212)
            .setAuthor({
            name: `${executor.user.username} (ID ${executor.id})`,
            iconURL: executor.displayAvatarURL(),
        })
            .setThumbnail(targetMember.displayAvatarURL())
            .setFields({
            name: `\u200b`,
            value: `:mute: **Timed Out:** ${targetMember.user.username} (ID ${targetMember.id})`,
        }, { name: `\u200b`, value: `:page_facing_up: **Reason:** ${reason}` }, {
            name: `\u200b`,
            value: `:stopwatch: **Duration:** ${prettyMilliseconds(timeoutDuration, { verbose: true })}`,
        })
            .setTimestamp();
        const serverConfig = await ServerConfig.findOne({
            guildId: interaction.guildId,
        });
        const timeoutLogChannel = interaction.guild?.channels.cache.get(serverConfig?.timeoutLogsChannelId) ??
            (await interaction.guild?.channels.fetch(serverConfig?.timeoutLogsChannelId));
        if (targetMember.isCommunicationDisabled()) {
            await targetMember.send(`**${interaction.guild.name}:** ${targetMember}, your timeout duration has been updated to ${prettyMilliseconds(timeoutDuration, { verbose: true })}\n**Reason:** ${reason}`);
            await targetMember.timeout(timeoutDuration, reason);
            await interaction.followUp(`✅ ${targetMember}'s timeout has been updated to ${prettyMilliseconds(timeoutDuration, { verbose: true })}`);
            timeoutLogMessage.setFields({
                name: "\u200b",
                value: `:mute: **Timeout Updated For:** ${targetMember} (ID ${targetMember.id})`,
            }, {
                name: "\u200b",
                value: `📄 **Reason:** ${reason}`,
            }, {
                name: "\u200b",
                value: `:stopwatch: **Duration:** ${prettyMilliseconds(timeoutDuration, { verbose: true })}`,
            });
            timeoutLogChannel.send({ embeds: [timeoutLogMessage] });
            return;
        }
        timeoutLogChannel.send({ embeds: [timeoutLogMessage] });
        await targetMember
            .send(`**${interaction.guild.name}:** ${targetMember}, you have been timed out for ${prettyMilliseconds(timeoutDuration, { verbose: true })}\n**Reason:** ${reason}`)
            .catch();
        await targetMember.timeout(timeoutDuration, reason);
        await interaction.followUp(`✅ ${targetMember} has been timed out for ${prettyMilliseconds(timeoutDuration, { verbose: true })}`);
    }
    catch (error) {
        console.log(`an error occured in ${fileURLToPath(import.meta.url)}:\n`, error);
    }
}
export const options = {
    botPermissions: [`MuteMembers`],
};
