import { CommandOptions, SlashCommandProps } from "commandkit";
import {
	channelMention,
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
import { getNextCaseId } from "../../Util/ModerationCaseCounter.js";
import ModerationConfig from "../../models/ModerationConfig.js";
import { KickSettings } from "../../Util/ServerConfigClasses.js";
import { KickCase } from "../../Util/ModerationCaseClasses.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "../../index.js";
import * as crypto from "crypto";
import sharp from "sharp";

export const data = new SlashCommandBuilder()
	.setContexts(InteractionContextType.Guild)
	.setName(`kick`)
	.setDescription(`Kick a user from this server`)
	.addUserOption((option) =>
		option
			.setName(`target`)
			.setDescription(`The user you want to kick`)
			.setRequired(true)
	)
	.addStringOption((option) =>
		option
			.setName(`reason`)
			.setDescription(`The reason for kicking this user`)
			.setMaxLength(128)
	)
	.addAttachmentOption((option) =>
		option
			.setName(`evidence`)
			.setDescription(
				`Upload images supporting your kick reason. More can be uploaded through\`/cases edit\``
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

	const settings = new KickSettings(
		config?.kick.enabled as boolean,
		config?.kick.reasonRequired as boolean,
		config?.kick.evidenceRequired as boolean,
		config?.kick.whitelistedRoles as string[],
		config?.kick.logChannel as string
	);

	if ((await settings.checkRequirements(interaction, evidence)) === false) {
		return;
	}

	const kickCase = new KickCase(
		caseId,
		guildId,
		targetUser.id,
		interaction.user.id,
		reason!
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

				kickCase.addEvidenceUrls(evidenceUrl);
			} catch (error) {
				evidence = null;
				console.error(`Evidence upload failed:`, error);
				confirmationEmbed.addFields({
					name: `\u200b`,
					value: `⚠️ Failed to process uploaded file, skipping it. You can try again later through \`/cases edit\``,
				});
			}
		} else {
			evidence = null;
			confirmationEmbed.addFields({
				name: `\u200b`,
				value: `⚠️ Uploaded file format not supported. Please use JPEG, PNG, or WebP. You can try again later through \`/cases edit\``,
			});
		}
	}
	try {
		await kickCase.createCase();
		await targetUser.kick(reason);
	} catch (error) {
		console.error(`Failed to create kick case:`, error);
		return interaction.followUp({
			content: `❌ Failed to kick ${userMention(
				targetUser.id
			)}. Process aborted. Pease try again later.\nIf the issue persists, please make a bug report in the support server.`,
			flags: MessageFlags.Ephemeral,
		});
	}
	try {
		await targetUser.send({
			content: `You have been kicked from **${interaction.guild?.name}**\n**Reason:** ${reason}`,
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

	const container = kickCase.createViewCaseContainer(false);

	const channelId = config?.kick.logChannel ?? config?.fallbackActionLogChannel;
	if (channelId) {
		const channel = interaction.guild?.channels.cache.get(
			channelId as string
		) as TextChannel;

		if (!channel || channel.type !== ChannelType.GuildText) {
			// Log channel not found or is not a text channel
			console.warn(`Kick log channel not found or is not a text channel`);
			confirmationEmbed.addFields({
				name: `⚠️ NO LOG CHANNEL`,
				value: `⚠️ **YOU HAVE NO LOG CHANNELS CONFIGURED IN THIS SERVER! CASES WILL NOT BE AUTOMATICALLY DISPLAYED FOR VIEW IN THIS SERVER!**\n**THIS CAN BE FIXED BY RUNNING \`/settings moderation\` AND CONFIGURING THE KICK COMMAND!**`,
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
	botPermissions: [`KickMembers`],
};
