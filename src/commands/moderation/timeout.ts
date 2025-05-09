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
import ModerationConfig from "../../models/ModerationConfig.js";
import { TimeoutSettings } from "../../Util/ServerConfigClasses.js";
import { TimeoutCase } from "../../Util/ModerationCaseClasses.js";
import { normalizeTimeUnit } from "../../Util/NormalizeTimeUnits.js";
import { getNextCaseId } from "../../Util/ModerationCaseCounter.js";
import ms from "ms";
import sharp from "sharp";
import { r2 } from "../../index.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import prettyMilliseconds from "pretty-ms";

export const data = new SlashCommandBuilder()
	.setContexts(InteractionContextType.Guild)
	.setName(`timeout`)
	.setDescription(`Timeout a user in this server`)
	.addUserOption((option) =>
		option
			.setName(`target`)
			.setDescription(`The user you want to timeout`)
			.setRequired(true)
	)
	.addStringOption((option) =>
		option
			.setName(`duration`)
			.setDescription(`The duration of the timeout (30m, 1h, etc.)`)
			.setRequired(true)
	)
	.addStringOption((option) =>
		option
			.setName(`reason`)
			.setDescription(`The reason for timing out this user`)
			.setMaxLength(128)
	)
	.addAttachmentOption((option) =>
		option
			.setName(`evidence`)
			.setDescription(
				`Upload images supporting your timeout reason. More can be uploaded through \`/cases edit\``
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
	const settings = new TimeoutSettings(
		config?.timeout.enabled as boolean,
		config?.timeout.reasonRequired as boolean,
		config?.timeout.evidenceRequired as boolean,
		config?.timeout.whitelistedRoles as string[],
		config?.timeout.defaultDuration as number,
		config?.timeout.logChannel as string
	);

	if ((await settings.checkRequirements(interaction, evidence)) === false) {
		return;
	}

	const durationInput = interaction.options.getString(`duration`);
	const matches = durationInput?.matchAll(
		/^((\d+)\s*(years|year|yr|y|months|month|mo|weeks|week|w|days|day|d|hours|hour|h|minutes|minute|min|m|seconds|second|sec|s)\s*)+$/g
	);

	const seenUnits = new Set<string>();
	let totalDuration: number = 0;
	for (const match of matches as RegExpStringIterator<RegExpExecArray>) {
		if (totalDuration > 2_419_200_000) {
			return await interaction.followUp({
				content: `❌ Timeout duration cannot exceed 28 days!`,
				flags: MessageFlags.Ephemeral,
			});
		}
		const rawUnit = match[3].toLowerCase();
		const normalizedUnit = normalizeTimeUnit(rawUnit);
		if (!normalizedUnit) {
			return await interaction.followUp({
				content: `⚠️ Invalid time unit detected.\nValid units: \`s\`, \`m\`, \`h\``,
			});
		}
		if (seenUnits.has(normalizedUnit as string)) {
			return await interaction.followUp({
				content: `⚠️ You've specified the ${
					"`" + normalizedUnit + "`"
				} unit multiple times. Please use each time unit only once.`,
				flags: MessageFlags.Ephemeral,
			});
		}

		seenUnits.add(normalizedUnit as string);
		const duration = ms(match[2] + normalizedUnit);
		totalDuration += duration;
	}
	const timeoutCase = new TimeoutCase(
		caseId,
		guildId,
		targetUser.id,
		interaction.user.id,
		reason!,
		totalDuration
	);

	const confirmationEmbed = new EmbedBuilder()
		.setTitle(`Case Created => ID: ${caseId}`)
		.setFooter({ text: `You can upload more evidence through \`/cases edit\`` })
		.setColor(0x00ff00);

	const fileName = `${Date.now()}-${crypto.randomUUID()}`;
	const supportedImageTypes = ["image/jpeg", "image/png", "image/webp"];
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

				timeoutCase.addEvidenceUrls(evidenceUrl);
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
		await timeoutCase.createCase();
		await targetUser.timeout(totalDuration, reason);
		confirmationEmbed.addFields({
			name: `Duration`,
			value: `${prettyMilliseconds(totalDuration, { verbose: true })}`,
		});
	} catch (error) {
		console.error(`Failed to create timeout case:`, error);
		return interaction.followUp({
			content: `❌ Failed to timeout ${userMention(
				targetUser.id
			)}. Process aborted. Please try again later.\nIf the issue persists, please make a bug report in the support server.`,
			flags: MessageFlags.Ephemeral,
		});
	}
	try {
		await targetUser.send({
			content: `You have been timed out in **${
				interaction.guild?.name
			}**\nDuration: ${prettyMilliseconds(totalDuration, {
				verbose: true,
			})}\n**Reason:** ${reason}`,
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

	const container = timeoutCase.createViewCaseContainer(false);
	const channelId =
		config?.timeout.logChannel ?? config?.fallbackActionLogChannel;
	if (channelId) {
		const channel = interaction.guild?.channels.cache.get(
			channelId as string
		) as TextChannel;

		if (!channel || channel.type !== ChannelType.GuildText) {
			// Log channel not found or is not a text channel
			console.warn(`Timeout log channel not found or is not a text channel`);
			confirmationEmbed.addFields({
				name: `⚠️ NO LOG CHANNEL`,
				value: `⚠️ **YOU HAVE NO LOG CHANNELS CONFIGURED IN THIS SERVER! CASES WILL NOT BE AUTOMATICALLY DISPLAYED FOR VIEW IN THIS SERVER!**\n**THIS CAN BE FIXED BY RUNNING \`/settings moderation\` AND CONFIGURING THE TIMEOUT COMMAND!**`,
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
	cooldownScope: "guild",
	botPermissions: [`ModerateMembers`],
};
