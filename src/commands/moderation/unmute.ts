import { CommandOptions, SlashCommandProps } from "commandkit";
import {
	EmbedBuilder,
	GuildMember,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
	userMention,
} from "discord.js";
import ModerationCase from "../../models/ModerationCase.js";
import ModerationConfig from "../../models/ModerationConfig.js";

export const data = new SlashCommandBuilder()
	.setContexts(InteractionContextType.Guild)
	.setName(`unmute`)
	.setDescription(`Unmute a muted user`)
	.addUserOption((option) =>
		option
			.setName(`target`)
			.setDescription(`The user you want to unmute`)
			.setRequired(true)
	)
	.addStringOption((option) =>
		option
			.setName(`reason`)
			.setDescription(`The reason for unmuting this user`)
			.setMaxLength(128)
	);

export async function run({ interaction, client, handler }: SlashCommandProps) {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });
	const executorRoles = (interaction.member as GuildMember).roles;
	const targetUser = interaction.options.getMember(`target`) as GuildMember;
	const reason =
		interaction.options.getString(`reason`) ?? "No reason was provided";
	const guildId = interaction.guildId as string;
	const config = await ModerationConfig.findOne({ guildId });
	if (config?.mute.reasonRequired === true && !reason) {
		return await interaction.followUp({
			content: `⚠️ A reason is required to unmute the user.`,
			flags: MessageFlags.Ephemeral,
		});
	}
	if (!targetUser) {
		return await interaction.followUp({
			content: `⚠️ This user is not a member of this server.`,
		});
	}
	const hasWhitelistedRoles = executorRoles.cache.some((role) =>
		config?.mute.whitelistedRoles?.includes(role.id)
	);

	if (
		!hasWhitelistedRoles &&
		interaction.user.id !== interaction.guild?.ownerId
	) {
		return await interaction.followUp({
			content: `⚠️ You do not have the necessary roles to run this command.`,
			flags: MessageFlags.Ephemeral,
		});
	}
	if (
		targetUser.roles.highest.position >= executorRoles.highest.position &&
		interaction.user.id !== interaction.guild?.ownerId
	) {
		return await interaction.followUp({
			content: `⚠️ You cannot unmute this user due to role hierarchy.`,
			flags: MessageFlags.Ephemeral,
		});
	}
	const muteCase = await ModerationCase.findOne({
		guildId,
		action: `mute`,
		targetId: targetUser.id,
		expiresAt: { $gt: new Date() },
	});
	const confirmationEmbed = new EmbedBuilder()
		.setTitle(`Case Updated => ID: ${muteCase?.caseId}`)
		.setColor(0x00ff00);
	if (!muteCase || !targetUser.roles.cache.has(muteCase.mutedRoleId)) {
		return await interaction.followUp({
			content: `⚠️ ${userMention(
				targetUser.id
			)} is not currently muted or their mute has already expired.`,
			flags: MessageFlags.Ephemeral,
		});
	}
	if (!muteCase.mutedRoleId) {
		return await interaction.followUp({
			content: `⚠️ Mute role has mysteriously vanished from the DB, please reconfigure the mute role in \`/settings moderation\` under the mute settings menu.`,
		});
	}
	muteCase.set(`active`, false);
	muteCase.set(`closingStaffId`, interaction.user.id);
	muteCase.set(`closeReason`, reason);

	await targetUser.roles
		.remove(
			muteCase.mutedRoleId,
			`Manual unmute by ${interaction.user.displayName} (ID ${interaction.user.id}): ${reason}`
		)
		.catch(async (error) => {
			console.error(`Failed to remove mute role:`, error);
			return await interaction.followUp({
				content: `⚠️ An error occurred when removing the mute role. Please try again or remove the role manually.\nThe case has been updated as completed.`,
				flags: MessageFlags.Ephemeral,
			});
		});
	await muteCase.save();
	confirmationEmbed.addFields({
		name: `\u200b`,
		value: `✅ ${userMention(
			targetUser.id
		)} has been unmuted.\nCase has been marked as completed.`,
	});
	return await interaction.followUp({
		embeds: [confirmationEmbed],
		flags: MessageFlags.Ephemeral,
	});
}
export const options: CommandOptions = {
	botPermissions: [`ManageRoles`],
	cooldown: 3000, // 3 seconds
	cooldownScope: "guild",
};
