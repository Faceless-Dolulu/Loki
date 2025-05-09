import { CommandOptions, SlashCommandProps } from "commandkit";
import * as crypto from "crypto";
import {
	ChannelType,
	EmbedBuilder,
	GuildMember,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
	TextChannel,
	userMention,
} from "discord.js";
import { getNextCaseId } from "../../Util/ModerationCaseCounter.js";
import { BanSettings } from "../../Util/ServerConfigClasses.js";
import ModerationConfig from "../../models/ModerationConfig.js";
import { normalizeTimeUnit } from "../../Util/NormalizeTimeUnits.js";
import ms from "ms";
import { BanCase } from "../../Util/ModerationCaseClasses.js";
import { r2 } from "../../index.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import prettyMilliseconds from "pretty-ms";
import { CommandOperationOptions } from "mongodb";
export const data = new SlashCommandBuilder()
	.setName(`ban`)
	.setDescription(`Ban a user from this server`)
	.setContexts(InteractionContextType.Guild)
	.addUserOption((option) =>
		option
			.setName(`target`)
			.setDescription(`The user you want to ban`)
			.setRequired(true)
	)
	.addStringOption((option) =>
		option
			.setName(`reason`)
			.setDescription(`The reason for banning this user`)
			.setMaxLength(128)
	)
	.addStringOption((option) =>
		option
			.setName(`duration`)
			.setDescription(`The duration of the ban (4d, 7w, 3mo, 1y)`)
	)
	.addStringOption((option) =>
		option
			.setName(`message-purge-age`)
			.setDescription(
				`The max age of messages sent by the banned user to be deleted`
			)
	)
	.addAttachmentOption((option) =>
		option
			.setName(`evidence`)
			.setDescription(
				`Upload images supporting your ban reason. More can be added through \`/cases edit\``
			)
	);

export async function run({ interaction, client, handler }: SlashCommandProps) {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });
	const targetUser = interaction.options.getMember(`target`) as GuildMember;
	const reason =
		interaction.options.getString(`reason`) ?? "No reason was provided";
	const guildId = interaction.guildId as string;
	let evidence = interaction.options.getAttachment(`evidence`) ?? null;
	const caseId = await getNextCaseId(guildId);
	const config = await ModerationConfig.findOne({ guildId });
	const settings = new BanSettings(
		config?.ban.enabled as boolean,
		config?.ban.reasonRequired as boolean,
		config?.ban.evidenceRequired as boolean,
		config?.ban.whitelistedRoles as string[],
		config?.ban.logChannel as string
	);

	if ((await settings.checkRequirements(interaction, evidence)) === false)
		return;

	const durationInput = interaction.options.getString(`duration`) ?? null;
	const messagePurgeInput =
		interaction.options.getString(`message-age-pruge`) ?? null;
	const matchKey =
		/^((\d+)\s*(years|year|yr|y|months|month|mo|weeks|week|w|days|day|d|hours|hour|h|minutes|minute|min|m|seconds|second|sec|s)\s*)+$/g;
	const durationMatches = durationInput?.matchAll(matchKey);
	const messagePurgeMatches = messagePurgeInput?.matchAll(matchKey);

	const seenDurationUnits = new Set<string>();
	const seenMessagePurgeUnits = new Set<string>();
	let totalBanDuration: number = 0;
	let maxMessagePurgeAge: number = 0;
	if (durationInput !== null) {
		for (const match of durationMatches as RegExpStringIterator<RegExpExecArray>) {
			const rawUnit = match[3].toLowerCase();
			const normalizedUnit = normalizeTimeUnit(rawUnit);
			if (!normalizedUnit) {
				return await interaction.followUp({
					content: `⚠️ Invalid time unit detected in the ban duration argument.\nValid units: \`d\`, \`w\`, \`mo\`, \`y\``,
				});
			}
			if (seenDurationUnits.has(normalizedUnit as string)) {
				return await interaction.followUp({
					content: `⚠️ You've specified the \`${normalizedUnit}\` unit multiple times in the ban duration argument. Please use each time unit only once.`,
					flags: MessageFlags.Ephemeral,
				});
			}

			seenDurationUnits.add(normalizedUnit as string);
			const duration = ms(match[2] + normalizedUnit);
			totalBanDuration += duration;
		}
	} else {
		totalBanDuration = 0;
	}

	if (messagePurgeInput !== null) {
		for (const match of messagePurgeMatches as RegExpStringIterator<RegExpExecArray>) {
			const rawUnit = match[3].toLowerCase();
			const normalizedUnit = normalizeTimeUnit(rawUnit);
			if (!normalizedUnit) {
				return await interaction.followUp({
					content: `⚠️ Invalid time unit detected in the message purge age argument.\nValid units: \`m\`, \`h\`, \`d\``,
					flags: MessageFlags.Ephemeral,
				});
			}
			if (seenMessagePurgeUnits.has(normalizedUnit as string)) {
				return await interaction.followUp({
					content: `⚠️ You've specified the \`${normalizedUnit}\` unit multiple times in the message purge age argument. Please use each time unit only once.`,
					flags: MessageFlags.Ephemeral,
				});
			}
			seenMessagePurgeUnits.add(normalizedUnit as string);
			const age = ms(match[2] + normalizedUnit);
			maxMessagePurgeAge += age;

			if (maxMessagePurgeAge > 604_800_000) {
				// Check if input message purge age exceeds the 7 day limit imposed by Discord API
				return await interaction.followUp({
					content: `⚠️ Message purge age cannot exceed 7 days.`,
					flags: MessageFlags.Ephemeral,
				});
			}
		}
	} else {
		maxMessagePurgeAge = 0;
	}

	const confirmationEmbed = new EmbedBuilder()
		.setTitle(`Case Created => ID: ${caseId}`)
		.setFooter({ text: `You can upload more evidence through \`/cases edit\`` })
		.setColor(0x00ff00);
	const fileName = `${Date.now()}-${crypto.randomUUID()}`;
	const supportedImageTypes = ["image/jpeg", "image/png", "image/webp"];

	const banCase = new BanCase(
		caseId,
		guildId,
		targetUser.id,
		interaction.user.id,
		reason!,
		totalBanDuration,
		true
	);

	if (evidence) {
		if (
			evidence.contentType &&
			supportedImageTypes.includes(evidence.contentType as string)
		) {
			try {
				const res = await fetch(evidence.url);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const buffer = await res.arrayBuffer();
				const processedImage = await sharp(buffer)
					.resize(1024, null, { fit: "inside", withoutEnlargement: true })
					.toFormat(`webp`, { quality: 85 })
					.toBuffer();

				const key = `cases/${guildId}/${caseId}/${fileName}.webp`;

				await r2.send(
					new PutObjectCommand({
						Bucket: process.env.CLOUDFLARE_IMAGE_BUCKET,
						Key: key,
						Body: processedImage,
						ContentType: "image/webp",
						Metadata: {
							caseId: caseId.toString(),
							uploaderId: interaction.user.id,
							uploadedAt: new Date().toISOString(),
							imageHash: crypto
								.createHash("MD5")
								.update(processedImage)
								.digest("hex"),
						},
					})
				);

				const evidenceUrl = `https://loki-moderation-evidence-proxy.andrei-anastasiu.workers.dev/cases/${guildId}/${caseId}/${fileName}.webp`;

				banCase.addEvidenceUrls(evidenceUrl);
				if (totalBanDuration > 0) {
					confirmationEmbed.addFields({
						name: `Duration`,
						value: prettyMilliseconds(totalBanDuration, { verbose: true }),
					});
				}
			} catch (error) {
				evidence = null;
				console.error(`Evidence upload failed:`, error);
				return await interaction.followUp({
					content: `⚠️ Image failed to process. Please try again.`,
					flags: MessageFlags.Ephemeral,
				});
			}
		} else {
			evidence = null;
			return await interaction.followUp({
				content: `⚠️ Uploaded file format is not supported. Please use JPEG, PNG, or WebP.`,
				flags: MessageFlags.Ephemeral,
			});
		}
	}
	try {
		const banNotificationMessage =
			totalBanDuration > 0
				? `You have been banned in **${
						interaction.guild?.name
				  }**\nDuration: ${prettyMilliseconds(totalBanDuration, {
						verbose: true,
				  })}\n**Reason:** ${reason}`
				: `You have been banned in **${interaction.guild?.name}**\n**Reason:** ${reason}`;
		await targetUser.send({
			content: banNotificationMessage,
		});

		confirmationEmbed.addFields({
			name: `User Notification`,
			value: `✅ User was notified via DM`,
		});
	} catch (error) {
		confirmationEmbed.addFields({
			name: `User Notification`,
			value: `❌ Could not send DM to user`,
		});
	}
	try {
		await targetUser.ban({
			deleteMessageSeconds: maxMessagePurgeAge / 1000,
			reason: reason,
		});
		await banCase.createCase();
		if (totalBanDuration > 0) {
			confirmationEmbed.addFields({
				name: `Duration`,
				value: prettyMilliseconds(totalBanDuration, { verbose: true }),
			});
		}
	} catch (error) {
		console.error(`Failed to create ban case:`, error);
		return interaction.followUp({
			content: `❌ Failed to ban ${userMention(
				targetUser.id
			)}. Process aborted. please try again later.\nIf the issure persists, please make a bug report in the support server.`,
			flags: MessageFlags.Ephemeral,
		});
	}

	const container = banCase.createViewCaseContainer(false);
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
			await channel.send({
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});
		}
	}
	await interaction.followUp({
		embeds: [confirmationEmbed],
		flags: MessageFlags.Ephemeral,
	});
	return;
}

export const options: CommandOptions = {
	cooldown: 3000, // 3 seconds
	cooldownScope: `guild`,
	botPermissions: `BanMembers`,
};
