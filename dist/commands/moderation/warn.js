import { randomInt } from "crypto";
import { EmbedBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, } from "discord.js";
import Warns from "../../models/Warns.js";
import ServerConfig from "../../models/ServerConfig.js";
import { setTimeout } from "timers";
export const data = new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Add a warn to a user")
    .setContexts(InteractionContextType.Guild)
    .addUserOption((option) => option
    .setName("user")
    .setDescription("The user you want to warn")
    .setRequired(true))
    .addStringOption((option) => option
    .setName("reason")
    .setDescription(`The reason for warning the user`)
    .setMaxLength(512))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
export async function run({ interaction, client, handler }) {
    const targetMember = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") ?? "No reason was provided";
    const executor = interaction.member;
    const executorRolePosition = executor.roles.highest.position;
    const targetRolePosition = targetMember?.roles.highest.position;
    if (!targetMember) {
        interaction.reply(`❌ You can't issue a warn against yourself!`);
        return;
    }
    if (targetMember.id === executor.id) {
        interaction.reply(`❌ You can't issue a warn against yourself!`);
        return;
    }
    if (targetRolePosition >= executorRolePosition) {
        interaction.reply(`❌ You can't issue warns to user with equal or higher roles!`);
        return;
    }
    await interaction.deferReply();
    const warnLogMessage = new EmbedBuilder()
        .setColor(0xc8c800)
        .setAuthor({
        name: `${executor.user.username} (ID ${executor.id})`,
        iconURL: executor.displayAvatarURL(),
    })
        .setThumbnail(targetMember.displayAvatarURL())
        .addFields({
        name: `\u200b`,
        value: `:warning: **Warned:** ${targetMember.user.username} (ID ${targetMember.id})`,
    }, {
        name: `\u200b`,
        value: `:page_facing_up: **Reason:** ${reason}`,
    })
        .setTimestamp();
    let warnId = randomInt(1000000000).toLocaleString("en-us", {
        minimumIntegerDigits: 9,
        useGrouping: false,
    });
    let warnIdExists = await Warns.exists({
        warnId: warnId,
        guildId: interaction.guildId,
    });
    do {
        warnId = randomInt(1000000000).toLocaleString("en-us", {
            minimumIntegerDigits: 9,
            useGrouping: false,
        });
        warnIdExists = await Warns.exists({
            warnId: warnId,
            guildId: interaction.guildId,
        });
        if (!warnIdExists)
            break;
    } while (warnIdExists);
    const serverConfig = await ServerConfig.findOne({
        guildId: interaction.guildId,
    });
    if (!serverConfig?.warnLogsChannelId) {
        await interaction.followUp(`❌ This command hasn't been enabled yet!`);
        return;
    }
    const warnLogChannel = interaction.guild?.channels.cache.get(serverConfig?.warnLogsChannelId) ??
        (await interaction.guild?.channels.fetch(serverConfig?.warnLogsChannelId));
    const data = {
        warnId: warnId,
        guildId: interaction.guildId,
        userId: targetMember.id,
        reason: reason,
        ModeratorID: executor.id,
        ModeratorUsername: executor.user.username,
        TimeStamp: interaction.createdTimestamp,
    };
    const newWarn = new Warns({
        ...data,
    });
    newWarn.save();
    await warnLogChannel.send({ embeds: [warnLogMessage] });
    targetMember
        .send({
        embeds: [
            new EmbedBuilder()
                .setColor(0xc8c800)
                .addFields({
                name: "\u200b",
                value: `:warning: You were **warned** in ${interaction.guild?.name}`,
            }, {
                name: `\u200b`,
                value: `:page_facing_up: **Reason:** ${reason}`,
            })
                .setThumbnail(interaction.guild?.iconURL()),
        ],
    })
        .catch(() => { });
    interaction.followUp(`:tools: ${targetMember} has been warned`);
    setTimeout(() => {
        interaction.deleteReply();
    }, 5000);
}
export const options = {
    botPermissions: ["ModerateMembers"],
};
