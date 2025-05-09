import { CommandOptions, SlashCommandProps } from "commandkit";
import * as crypto from "crypto";
import {
	ChannelType,
	EmbedBuilder,
	GuildMember,
	InteractionContextType,
	MessageFlags,
	Role,
	SlashCommandBuilder,
	TextChannel,
	userMention,
} from "discord.js";
import { getNextCaseId } from "../../Util/ModerationCaseCounter.js";
import ModerationConfig from "../../models/ModerationConfig.js";
import { MuteSettings } from "../../Util/ServerConfigClasses.js";
import { normalizeTimeUnit } from "../../Util/NormalizeTimeUnits.js";
import ms from "ms";
import { MuteCase } from "../../Util/ModerationCaseClasses.js";
import { r2 } from "../../index.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import prettyMilliseconds from "pretty-ms";

export const data = new SlashCommandBuilder()
	.setContexts(InteractionContextType.Guild)
	.setName(`mute`)
	.setDescription(`Mute a user in this server`)
	.addUserOption((option) =>
		option
			.setName(`target`)
			.setDescription(`The user you want to mute`)
			.setRequired(true)
	)
	.addStringOption((option) =>
		option
			.setName(`duration`)
			.setDescription(`The duration of the mute (30m, 1h, etc.)`)
			.setRequired(false)
	)
	.addStringOption((option) =>
		option
			.setName(`reason`)
			.setDescription(`The reason for muting this user`)
			.setMaxLength(128)
	)
	.addAttachmentOption((option) =>
		option
			.setName(`evidence`)
			.setDescription(
				`Upload images support your mute reason. More can be uploaded through \`/cases edit\``
			)
	);

export async function run({ interaction, client, handler }: SlashCommandProps) {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });
	const targetUser = interaction.options.getMember(`target`) as GuildMember;
	const reason =
		interaction.options.getString(`reason`) ?? `No reason was provided`;
	const guildId = interaction.guildId as string;
	let evidence = interaction.options.getAttachment(`evidence`) ?? null;
	const caseId = await getNextCaseId(guildId);
	const config = await ModerationConfig.findOne({ guildId });
	const settings = new MuteSettings(
		config?.mute.enabled as boolean,
		config?.mute.reasonRequired as boolean,
		config?.mute.evidenceRequired as boolean,
		config?.mute.whitelistedRoles as string[],
		config?.mute.defaultDuration as number,
		config?.mute.logChannel as string,
		config?.mute.muteRoleId as string
	);

	if ((await settings.checkRequirements(interaction, evidence)) === false)
		return;

	const durationInput = interaction.options.getString(`duration`);
	const matches = durationInput?.matchAll(
		/^((\d+)\s*(years|year|yr|y|months|month|mo|weeks|week|w|days|day|d|hours|hour|h|minutes|minute|min|m|seconds|second|sec|s)\s*)+$/g
	);

	const seenUnits = new Set<string>();
	let totalDuration: number = 0;

	if (durationInput) {
		for (const match of matches as RegExpStringIterator<RegExpExecArray>) {
			const rawUnit = match[3].toLowerCase();
			const normalizedUnit = normalizeTimeUnit(rawUnit);
			if (!normalizedUnit) {
				return await interaction.followUp({
					content: `⚠️ Invalid time unit detected.\nValid units: \`m\`, \`h\`, \`d\``,
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
	} else {
		totalDuration = config?.mute.defaultDuration as number;
	}

	const confirmationEmbed = new EmbedBuilder()
		.setTitle(`Case Created => ID: ${caseId}`)
		.setFooter({ text: `You can upload more evidence through \`/cases edit\`` })
		.setColor(0x00ff00);
	const fileName = `${Date.now()}-${crypto.randomUUID()}`;
	const supportedImageTypes = ["image/jpeg", "image/png", "image/webp"];
	let muted!: string | Role;
	if (config?.mute.muteRoleId) {
		muted = config.mute.muteRoleId as string;
	}
	if (!config?.mute.muteRoleId) {
		muted = (await interaction.guild?.roles.create({
			name: `Muted`,
			color: 0x6e6e6e,
			reason: `Auto-created muted role for mute command`,
		})) as Role;

		const deniedPermissions = {
			ViewChannel: false,
			ReadMessageHistory: false,
			SendMessages: false,
			AddReactions: false,
			AttachFiles: false,
			EmbedLinks: false,
			Connect: false,
			Speak: false,
		};

		interaction.guild?.channels.cache
			.filter((c) => c.type === ChannelType.GuildCategory)
			.forEach((category) =>
				category.permissionOverwrites.edit(muted as Role, deniedPermissions)
			);

		(await interaction.guild?.channels.fetch(undefined, { cache: true }))
			?.filter((c) => c?.parent === null)
			.forEach((channel) =>
				channel?.permissionOverwrites.edit(muted as Role, deniedPermissions)
			);
		confirmationEmbed.addFields({
			name: `⚠️ Mute Role Auto-Generated`,
			value: `⚠️ Mute Role was not configured, a mute role was auto-generated. Please configure role permissions in each channel`,
		});
	}
	let muteRole!: string;
	if (typeof muted === "string") {
		muteRole = muted;
	} else if (muted instanceof Role) {
		muteRole = muted.id;
	}
	const muteCase = new MuteCase(
		caseId,
		guildId,
		targetUser.id,
		interaction.user.id,
		reason!,
		totalDuration,
		true,
		muteRole as string
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

				muteCase.addEvidenceUrls(evidenceUrl);
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
		await targetUser.roles.add(
			muted,
			`User was muted by ${interaction.user.globalName} (ID ${interaction.user.id})`
		);
		await muteCase.createCase();
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
			content: `You have been muted in **${
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
	const container = muteCase.createViewCaseContainer(false);
	const channelId = config?.mute.logChannel ?? config?.fallbackActionLogChannel;
	if (channelId) {
		const channel = interaction.guild?.channels.cache.get(
			channelId as string
		) as TextChannel;

		if (!channel || channel.type !== ChannelType.GuildText) {
			// Log channel not found or is not a text channel
			console.warn(`Mute log channel not found or is not a text channel`);
			confirmationEmbed.addFields({
				name: `⚠️ NO LOG CHANNEL`,
				value: `⚠️ **YOU HAVE NO LOG CHANNELS CONFIGURED IN THIS SERVER! CASES WILL NOT BE AUTOMATICALLY DISPLAYED FOR VIEW IN THIS SERVER!**\n**THIS CAN BE FIXED BY RUNNING \`/settings moderation\` AND CONFIGURING THE MUTE COMMAND!**`,
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
	botPermissions: [`ManageRoles`],
};
