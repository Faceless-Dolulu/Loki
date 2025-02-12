import { SlashCommandProps } from "commandkit";
import {
	Attachment,
	BaseGuildTextChannel,
	Channel,
	ChannelType,
	EmbedBuilder,
	GuildMember,
	GuildMemberRoleManager,
	InteractionContextType,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
	TextChannel,
} from "discord.js";
import ServerConfig from "../../models/ServerConfig.js";
import { randomInt } from "crypto";
import { fileURLToPath } from "url";
import discordTranscripts, { ExportReturnType } from "discord-html-transcripts";
import prettyMilliseconds from "pretty-ms";
import Tickets from "../../models/Tickets.js";

export const data = new SlashCommandBuilder()
	.setName("ticket")
	.setDescription(`Ticket`)
	.setContexts(InteractionContextType.Guild)
	.addSubcommand((command) =>
		command
			.setName("open")
			.setDescription("open a ticket with server staff")
			.addStringOption((option) =>
				option
					.setName("reason")
					.setDescription("The reason for opening a ticket")
					.setMaxLength(32)
					.setRequired(true)
			)
			.addBooleanOption((option) =>
				option
					.setName("admin-only")
					.setDescription(
						"Sets whether the ticket is only viewable to server Admins"
					)
					.setRequired(true)
			)
	)
	.addSubcommand((command) =>
		command
			.setName("close")
			.setDescription("Closes the current ticket")
			.addStringOption((option) =>
				option
					.setName("reason")
					.setDescription("The reason for closing the ticket")
					.setRequired(true)
			)
	)
	.addSubcommand((command) =>
		command
			.setName("add-user")
			.setDescription("Add a user to this ticket channel")
			.addUserOption((option) =>
				option
					.setName("user")
					.setDescription(`The user you want to add to this ticket discussion`)
					.setRequired(true)
			)
	)
	.addSubcommand((command) =>
		command
			.setName("remove-user")
			.setDescription("Remove a user from this ticket channel")
			.addUserOption((option) =>
				option
					.setName("user")
					.setDescription(
						`The user you want to remove from this ticket discussion`
					)
					.setRequired(true)
			)
	);
// .addSubcommand(command => command
// 	.setName('rename')
// 	.setDescription('Rename the ticket to better describe the purpose')
// 	.addStringOption(option=> option
// 		.setName('title')
// 		.setDescription('The new title for the ticket')
// 		.setMaxLength(25)
// 		.setRequired(true)
// 	)
// );

export async function run({ interaction, client, handler }: SlashCommandProps) {
	try {
		const command = interaction.options.getSubcommand();
		const serverConfig = await ServerConfig.findOne({
			guildId: interaction.guildId,
		});
		const reason = interaction.options.getString("reason");
		if (command === "open") {
			const adminOnly = interaction.options.getBoolean("admin-only");
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			const openingMessage =
				serverConfig?.ticketOpeningMessage ??
				"Please describe the reasoning for opening this ticket, include any information you think may be relevant such as proof, other third parties, and so on.";

			const openingEmbed = new EmbedBuilder()
				.setColor(0x3ea6ff)
				.setDescription(openingMessage)
				.addFields({
					name: "\u200b",
					value: `To close the ticket, use ${"`/ticket close`"}\nTo add a user, use ${"`/ticket add-user`"}`,
				});
			const category =
				(interaction.guild?.channels.cache.get(
					serverConfig?.ticketCategoryId as string
				) as Channel) ??
				((await interaction.guild?.channels.fetch(
					serverConfig?.ticketCategoryId as string
				)) as Channel);

			if (!category) {
				interaction.followUp(`❌ An error occured. Ticket Category not found.`);
				return;
			}
			const adminRoles = serverConfig?.adminRoles;
			const moderatorRoles = serverConfig?.moderatorRoles;

			const ticketChannel = (await interaction.guild?.channels.create({
				name: `${randomInt(9999).toLocaleString("en-us", {
					minimumIntegerDigits: 4,
				})} - ${reason?.substring(0, 21)}`,
				type: ChannelType.GuildText,
				parent: serverConfig?.ticketCategoryId,
				permissionOverwrites: [
					{
						id: interaction.guild.id,
						deny: [PermissionFlagsBits.ViewChannel],
					},
					{
						id: interaction.user.id,
						allow: [
							PermissionFlagsBits.ViewChannel,
							PermissionFlagsBits.SendMessages,
						],
					},
				],
			})) as BaseGuildTextChannel;

			const ticket = new Tickets({
				guildId: interaction.guildId,
				ticketUserId: interaction.user.id,
				ticketChannelId: ticketChannel.id,
				adminOnly: adminOnly,
			});

			if (adminOnly) {
				adminRoles?.forEach(async (role) => {
					await ticketChannel?.permissionOverwrites.create(role, {
						ViewChannel: true,
						SendMessages: true,
						ManageChannels: false,
						ManageMessages: false,
					});
				});
			}
			if (!adminOnly) {
				adminRoles?.forEach((role) => {
					ticketChannel?.permissionOverwrites.create(role, {
						ViewChannel: true,
						SendMessages: true,
						ManageChannels: false,
						ManageMessages: false,
					});
				});
				moderatorRoles?.forEach((role) => {
					ticketChannel?.permissionOverwrites.create(role, {
						ViewChannel: true,
						SendMessages: true,
						ManageChannels: false,
						ManageMessages: false,
					});
				});
			}
			await ticket.save();
			interaction.followUp(`🛠️ A ticket has been opened! ${ticketChannel}`);
			ticketChannel?.send({
				embeds: [openingEmbed],
				content: `Ticket Reason: ${reason}`,
			});
		}
		if (command == "close") {
			const channel = interaction.channel as TextChannel;
			const ticket = await Tickets.findOne({
				ticketChannelId: channel.id as string,
			});

			if (channel.parentId !== serverConfig?.ticketCategoryId) {
				interaction.reply({
					content: `❌ This channel is not a ticket channel!`,
					flags: "Ephemeral",
				});
				return;
			}
			if (
				!serverConfig?.ticketCategoryId ||
				!serverConfig?.ticketArchiveChannelId
			) {
				interaction.reply({
					content: `❌ Ticket system is currently disabled!`,
				});
				return;
			}
			let adminRoles = [] as string[];
			let moderatorRoles = [] as string[];
			serverConfig.adminRoles?.forEach((role) => {
				adminRoles.push(role);
			});

			serverConfig.moderatorRoles?.forEach((role) => {
				moderatorRoles?.push(role);
			});

			const userRoles = interaction.member?.roles as GuildMemberRoleManager;
			let userQualified = false;
			if (interaction.user.id !== ticket?.ticketUserId) userQualified = false;
			if (
				userRoles.cache.hasAny(...adminRoles) ||
				interaction.user.id == ticket?.ticketUserId ||
				userRoles.cache.hasAny(...moderatorRoles)
			)
				userQualified = true;

			if (!userQualified) {
				interaction.reply({
					content: `❌ You do not have the requirements needed to close this ticket`,
					flags: "Ephemeral",
				});
				return;
			}
			if (userQualified) {
				await channel.permissionOverwrites.edit(interaction.guildId as string, {
					SendMessages: false,
				});
				adminRoles?.forEach(async (role) => {
					await channel?.permissionOverwrites.create(role, {
						ViewChannel: true,
						SendMessages: false,
					});
				});
				moderatorRoles?.forEach(async (role) => {
					await channel?.permissionOverwrites.edit(role, {
						ViewChannel: true,
						SendMessages: false,
					});
				});

				await interaction.reply(`Ticket closure in progress... Please wait`);
				const archiveChannel =
					(interaction.guild?.channels.cache.get(
						serverConfig?.ticketArchiveChannelId as string
					) as BaseGuildTextChannel) ??
					((await interaction.guild?.channels.fetch(
						serverConfig?.ticketArchiveChannelId as string
					)) as BaseGuildTextChannel);

				const adminArchiveChannel =
					(interaction.guild?.channels.cache.get(
						serverConfig?.ticketAdminArchiveChannelId as string
					) as BaseGuildTextChannel) ??
					((await interaction.guild?.channels.fetch(
						serverConfig?.ticketAdminArchiveChannelId as string
					)) as BaseGuildTextChannel);

				const timestamp = Date.now();

				const date = new Date(timestamp);

				const yyyy = date.getFullYear();
				const mm = (date.getMonth() + 1).toLocaleString(`en-us`, {
					minimumIntegerDigits: 2,
					useGrouping: false,
				});
				const dd = date.getDate().toLocaleString(`en-us`, {
					minimumIntegerDigits: 2,
					useGrouping: false,
				});
				await interaction.editReply(
					`Generating transcript... Can take a few minutes if many messages were sent...`
				);
				const transcript = await discordTranscripts.createTranscript(channel, {
					filename: `${channel.name} - ${yyyy}-${mm}-${dd}.html`,
					hydrate: true,
					returnType: ExportReturnType.Attachment,
				});
				await interaction.editReply(
					`Transcript generated... Archiving transcript...`
				);
				if (ticket?.adminOnly === false) {
					await archiveChannel.send({
						files: [transcript],
						content: `The ticket was closed for: ${reason}`,
					});
					await interaction
						.editReply(
							`Transcript archived in ${archiveChannel}. This channel will be deleted shortly...`
						)
						.then(() => {
							setTimeout(() => {
								channel.delete();
							}, 5000);
						});
				}

				if (ticket?.adminOnly === true) {
					await adminArchiveChannel.send({
						files: [transcript],
						content: `The ticket was closed for: ${reason}`,
					});
					await interaction
						.editReply(
							`Transcript archived in ${adminArchiveChannel}. This channel will be deleted shortly...`
						)
						.then(() => {
							setTimeout(() => {
								channel.delete();
							}, 5000);
						});
				}
			}
		}
		if (command == "add-user") {
			const targetMember = interaction.options.getMember("user") as GuildMember;
			const channel = interaction.channel as TextChannel;

			if (!targetMember) {
				interaction.reply({
					content: `❌ That user is not a member of this server!`,
					flags: "Ephemeral",
				});
				return;
			}
			if (channel.parentId !== serverConfig?.ticketCategoryId) {
				interaction.reply({
					content: `❌ This channel is not a ticket channel!`,
					flags: "Ephemeral",
				});
				return;
			}
			const ticket = await Tickets.findOne({ ticketChannelId: channel.id });

			let adminRoles = [] as string[];
			let moderatorRoles = [] as string[];
			serverConfig.adminRoles?.forEach((role) => {
				adminRoles.push(role);
			});
			serverConfig.moderatorRoles?.forEach((role) => {
				moderatorRoles.push(role);
			});

			const userRoles = interaction.member?.roles as GuildMemberRoleManager;
			let userQualified = false;
			if (interaction.user.id !== ticket?.ticketUserId) userQualified = false;
			if (
				userRoles.cache.hasAny(...adminRoles) ||
				interaction.user.id == ticket?.ticketUserId ||
				userRoles.cache.hasAny(...moderatorRoles)
			)
				userQualified = true;

			if (!userQualified) {
				interaction.reply(
					`❌ You do not have the requirements needed to add a user to this channel`
				);
				return;
			}

			if (userQualified) {
				await channel.permissionOverwrites
					.create(targetMember.id, { ViewChannel: true, SendMessages: true })
					.catch((error) => {
						interaction.reply({
							content: `❌ An error has occurred. Please try again in a moment.`,
							flags: "Ephemeral",
						});
						console.log(
							`An error occurred in ${fileURLToPath(import.meta.url)}:\n`,
							error
						);
					});
				interaction.reply({
					content: `✅ ${targetMember} has been added to this ticket!`,
				});
				return;
			}
		}

		if (command == "remove-user") {
			const targetMember = interaction.options.getMember("user") as GuildMember;
			const channel = interaction.channel as TextChannel;

			if (!targetMember) {
				interaction.reply({
					content: `❌ This user has already left the server!`,
				});
				return;
			}

			if (channel.parentId !== serverConfig?.ticketCategoryId) {
				interaction.reply({
					content: `❌ This channel is not a ticket channel!`,
					flags: "Ephemeral",
				});
				return;
			}

			if (
				!targetMember
					.permissionsIn(channel)
					.has(PermissionFlagsBits.ViewChannel)
			) {
				interaction.reply({
					content: `❌ This member already doesn't have access to this channel!`,
					flags: "Ephemeral",
				});
				return;
			}
			const ticket = await Tickets.findOne({ ticketChannelId: channel.id });

			let adminRoles = [] as string[];
			let moderatorRoles = [] as string[];

			serverConfig.adminRoles?.forEach((role) => {
				adminRoles.push(role);
			});

			serverConfig.moderatorRoles?.forEach((role) => {
				moderatorRoles.push(role);
			});

			const userRoles = interaction.member?.roles as GuildMemberRoleManager;
			let userQualified = false;
			if (interaction.user.id !== ticket?.ticketUserId) userQualified = false;

			if (
				userRoles.cache.hasAny(...adminRoles, ...moderatorRoles) ||
				interaction.user.id === ticket?.ticketUserId
			)
				userQualified = true;

			if (!userQualified) {
				interaction.reply({
					content: `❌ You do not have the requirements need to remove a user from this channel!`,
					flags: "Ephemeral",
				});
				return;
			}

			if (userQualified) {
				if (
					targetMember.roles.cache.hasAny(...adminRoles, ...moderatorRoles) ||
					targetMember.id === ticket?.ticketUserId
				) {
					interaction.reply({
						content: `❌ You cannot remove the original ticket poster or any staff from tickets`,
					});
					return;
				}
				await channel.permissionOverwrites
					.edit(targetMember.id, { ViewChannel: false, SendMessages: false })
					.catch((error) => {
						interaction.reply({
							content: `❌ An error has occurred. please try again in a moment.`,
							flags: "Ephemeral",
						});

						console.log(
							`An error occurred in ${fileURLToPath(import.meta.url)}:\n`,
							error
						);
					});

				interaction.reply(
					`✅ ${targetMember} has been removed from this ticket!`
				);
				return;
			}
		}
	} catch (error) {
		interaction.followUp(`An error occurred, please try again later.`);
		console.log(
			`An error occurred in ${fileURLToPath(import.meta.url)}:\n`,
			error
		);
	}
}
