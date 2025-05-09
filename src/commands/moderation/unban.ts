import { CommandOptions, SlashCommandProps } from "commandkit";
import {
	ChannelType,
	EmbedBuilder,
	GuildMember,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
	TextChannel,
	User,
	userMention,
} from "discord.js";
import ModerationConfig from "../../models/ModerationConfig.js";
import ModerationCase from "../../models/ModerationCase.js";
import { BanCase } from "../../Util/ModerationCaseClasses.js";

export const data = new SlashCommandBuilder()
	.setContexts(InteractionContextType.Guild)
	.setName(`unban`)
	.setDescription(`Unban a user from your server`)
	.addUserOption((option) =>
		option
			.setName(`user`)
			.setDescription(`The user you want to unban`)
			.setRequired(true)
	)
	.addStringOption((option) =>
		option
			.setName(`reason`)
			.setDescription(`The reason for unbanning the user`)
			.setMaxLength(128)
	);

export async function run({ interaction, client, handler }: SlashCommandProps) {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });
	const targetUser = interaction.options.getUser(`user`) as User;
	const targetInServer = interaction.options.getMember(`user`) as GuildMember;
	const executorRoles = (interaction.member as GuildMember).roles;
	let reason = interaction.options.getString(`reason`);
	const guildId = interaction.guildId as string;
	const config = await ModerationConfig.findOne({ guildId });
	if (config?.ban.reasonRequired === true && !reason) {
		return await interaction.followUp({
			content: `⚠️ A reason is required to unban the user.`,
			flags: MessageFlags.Ephemeral,
		});
	}

	reason = reason ?? "No reason was provided";
	const hasWhitelistedRoles = executorRoles.cache.some((role) =>
		config?.ban.whitelistedRoles?.includes(role.id)
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

	if (targetInServer) {
		return await interaction.followUp({
			content: `⚠️ User is still a member of this server`,
			flags: MessageFlags.Ephemeral,
		});
	}

	const banCase = await ModerationCase.findOne({
		guildId,
		action: `ban`,
		targetId: targetUser.id,
		$or: [
			{
				expiresAt: { $gt: Date.now() },
			},
			{ duration: null },
		],
	});

	const confirmationEmbed = new EmbedBuilder()
		.setTitle(`Case Updated => ID: ${banCase?.caseId}`)
		.setColor(0x00ff00);

	let isBanned: boolean = true;
	try {
		await interaction.guild?.bans.fetch(targetUser.id);
	} catch {
		isBanned = false;
	}
	if (!banCase || !isBanned) {
		return await interaction.followUp({
			content: `⚠️ ${userMention(
				targetUser.id
			)} is not currently banned or their ban has already expired.`,
			flags: MessageFlags.Ephemeral,
		});
	}

	banCase?.set(`active`, false);
	banCase?.set(`closingStaffId`, interaction.user.id);
	banCase?.set(`closeReason`, reason);
	try {
		await interaction.guild?.bans.remove(
			targetUser.id,
			`Manual unban by ${interaction.user.displayName} (ID ${interaction.user.id}): ${reason}`
		);
	} catch (error) {
		console.error(`Failed to unban user:`, error);
		return await interaction.followUp({
			content: `⚠️ Failed to unban ${userMention(
				targetUser.id
			)}. Please check my permissions or try again later.`,
			flags: MessageFlags.Ephemeral,
		});
	}
	await banCase?.save();

	confirmationEmbed.addFields({
		name: `\u200b`,
		value: `✅ ${userMention(
			targetUser.id
		)} has been unbanned.\nCase has been marked as completed.`,
	});

	const caseToUpdate = new BanCase(
		+banCase.caseId,
		banCase.guildId,
		banCase.targetId,
		banCase.moderatorId,
		banCase.reason,
		banCase.duration,
		false,
		interaction.user.id,
		reason
	);

	const container = caseToUpdate.createViewCaseContainer(true);

	const channelId = config?.ban.logChannel ?? config?.fallbackActionLogChannel;
	if (channelId) {
		const channel = interaction.guild?.channels.cache.get(
			channelId as string
		) as TextChannel;

		if (!channel || channel.type !== ChannelType.GuildText) {
			// Log channel not found or is not a text channel
			console.warn(`Ban log channel not found or is not a text channel`);
			confirmationEmbed.addFields({
				name: `⚠️ NO LOG CHANNEL`,
				value: `⚠️ **YOU HAVE NO LOG CHANNELS CONFIGURED IN THIS SERVER! CASES WILL NOT BE AUTOMATICALLY DISPLAYED FOR VIEW IN THIS SERVER!**\n**THIS CAN BE FIXED BY RUNNING \`/settings moderation\` AND CONFIGURING THE BAN COMMAND!**`,
			});
			// Potentially notify server admins that their logging config needs updating
		} else {
			try {
				await channel.send({
					components: [container],
					flags: MessageFlags.IsComponentsV2,
				});
			} catch (error) {
				console.error(`Failed to send unban log to channel:`, error);
			}
		}
	}
	return await interaction.followUp({
		embeds: [confirmationEmbed],
		flags: MessageFlags.Ephemeral,
	});
}

export const options: CommandOptions = {
	cooldown: 3000, // 3 seconds
	cooldownScope: `guild`,
	botPermissions: `BanMembers`,
};
