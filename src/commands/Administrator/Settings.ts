import {
	ActionRowBuilder,
	ChannelType,
	GuildChannel,
	InteractionContextType,
	MessageFlags,
	ModalActionRowComponentBuilder,
	ModalBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import serverConfigSchema from "../../models/ServerConfig.js";
import { SlashCommandProps } from "commandkit";
import { fileURLToPath } from "url";
import consoleLog from "../../events/ready/console-log.js";
import ServerConfig from "../../models/ServerConfig.js";

export const data = new SlashCommandBuilder()
	.setName(`settings`)
	.setDescription("Configure my settings for this server!")
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.setContexts(InteractionContextType.Guild)
	.addSubcommandGroup((commandGroup) =>
		commandGroup
			.setName("logging")
			.setDescription("Configure logging")
			.addSubcommand((command) =>
				command
					.setName("enable")
					.setDescription("Enables logging of selected actions!")
					.addStringOption((option) =>
						option
							.setName("type")
							.setDescription("The type of logs you want to enable!")
							.addChoices(
								{ name: "Bans", value: "bans" },
								{ name: "Kicks", value: "kick" },
								{ name: "Timeouts", value: "timeout" },
								{ name: "Messages", value: "message" },
								{ name: "Warns", value: "warn" },
								{ name: "Suggestions", value: "suggestion" }
							)
							.setRequired(true)
					)
					.addChannelOption((option) =>
						option
							.setName("channel")
							.setDescription("The channel to send the logs to!")
							.addChannelTypes(ChannelType.GuildText)
							.setRequired(true)
					)
			)
			.addSubcommand((command) =>
				command
					.setName("disable")
					.setDescription("Disables logging of selected actions!")
					.addStringOption((option) =>
						option
							.setName("type")
							.setDescription("The type of logs you want to disable!")
							.addChoices(
								{ name: "Bans", value: "bans" },
								{ name: "Kicks", value: "kick" },
								{ name: "Timeouts", value: "timeout" },
								{ name: "Messages", value: "message" },
								{ name: "Warns", value: "warn" },
								{ name: "Suggestions", value: "suggestion" }
							)
							.setRequired(true)
					)
			)
	)
	.addSubcommandGroup((commandGroup) =>
		commandGroup
			.setName("welcomer-goodbyes")
			.setDescription(
				`Enable/disable sending messages when a member joins/leaves the server!`
			)
			.addSubcommand((command) =>
				command
					.setName("enable")
					.setDescription("Enables sending welcome/goodbye messages!")
					.addStringOption((option) =>
						option
							.setName("type")
							.setDescription(
								"The type of automated message you want to enable!"
							)
							.addChoices(
								{ name: "Member join", value: "welcomer" },
								{ name: "Member leaves", value: "goodbye" }
							)
							.setRequired(true)
					)
					.addChannelOption((option) =>
						option
							.setName("channel")
							.setDescription("The channel to send the messages to!")
							.addChannelTypes(
								ChannelType.GuildText,
								ChannelType.GuildAnnouncement
							)
							.setRequired(true)
					)
					.addStringOption((option) =>
						option
							.setName("custom-message")
							.setDescription(
								"TEMPLATES {mention-member} {username} {server-name}"
							)
					)
			)
			.addSubcommand((command) =>
				command
					.setName("disable")
					.setDescription("Disables the welcomer/goodbyes")
					.addStringOption((option) =>
						option
							.setName("type")
							.setDescription(
								"The type of automated message you want to disable!"
							)
							.addChoices(
								{ name: "Member Join", value: "welcomer" },
								{ name: "Member leave", value: "goodbye" }
							)
							.setRequired(true)
					)
			)
			.addSubcommand((command) =>
				command
					.setName(`edit`)
					.setDescription("Edit the custom message")
					.addStringOption((option) =>
						option
							.setName("type")
							.setDescription(
								"The automated message type the updated custom-message will belong to."
							)
							.addChoices(
								{ name: "Member Join", value: "welcomer" },
								{ name: "Member Leave", value: "goodbye" }
							)
							.setRequired(true)
					)
					.addStringOption((option) =>
						option
							.setName("custom-message")
							.setDescription("The new custom-message")
							.setRequired(true)
					)
			)
	)
	.addSubcommandGroup((commandGroup) =>
		commandGroup
			.setName("starboard")
			.setDescription("Enable/disable the starboard in your server!")
			.addSubcommand((command) =>
				command
					.setName("enable")
					.setDescription("Enable the starboard in youre server!")
					.addChannelOption((option) =>
						option
							.setName("channel")
							.setDescription(`The channel the starboard will be hosted in!`)
							.addChannelTypes(
								ChannelType.GuildText,
								ChannelType.GuildAnnouncement
							)
							.setRequired(true)
					)
					.addIntegerOption((option) =>
						option
							.setName("reaction-count")
							.setDescription(
								"The minimum required reactions needed for a message to be added to the starboard. Default is 5"
							)
					)
					.addStringOption((option) =>
						option
							.setName("emoji")
							.setDescription(
								"Set the reaction emoji that you want to use for your starboard. Default is ⭐"
							)
					)
			)
			.addSubcommand((command) =>
				command
					.setName("disable")
					.setDescription(`Disables the starboard in your server!`)
			)
	)
	.addSubcommandGroup((commandGroup) =>
		commandGroup
			.setName("admin-roles")
			.setDescription("Add/remove admin roles")
			.addSubcommand((command) =>
				command
					.setName("add")
					.setDescription("Add roles that are considered Admins")
					.addRoleOption((option) =>
						option
							.setName("role")
							.setDescription("The role you want to be considered as an admin")
							.setRequired(true)
					)
			)
			.addSubcommand((command) =>
				command
					.setName("remove")
					.setDescription(
						"Remove existing admin roles from being considered as such."
					)
					.addRoleOption((option) =>
						option
							.setName("role")
							.setDescription("The role you want to be considered as an admin")
							.setRequired(true)
					)
			)
	)
	.addSubcommandGroup((commandGroup) =>
		commandGroup
			.setName("moderator-roles")
			.setDescription("Add/remove moderator roles")
			.addSubcommand((command) =>
				command
					.setName("add")
					.setDescription("Add roles that are considered Moderators")
					.addRoleOption((option) =>
						option
							.setName("role")
							.setDescription(
								"The role you want to be considered as a moderator"
							)
							.setRequired(true)
					)
			)
			.addSubcommand((command) =>
				command
					.setName("remove")
					.setDescription(
						"Remove existing moderator roles from being considered as such."
					)
					.addRoleOption((option) =>
						option
							.setName("role")
							.setDescription(
								"The role you no longer want to be considered as a moderator"
							)
							.setRequired(true)
					)
			)
	)
	.addSubcommandGroup((commandGroup) =>
		commandGroup
			.setName("tickets")
			.setDescription("tickets")
			.addSubcommand((command) =>
				command
					.setName("enable")
					.setDescription("Enable the ticket system within your server")
					.addChannelOption((option) =>
						option
							.setName("category")
							.setDescription(
								"The channel category that tickets will be created in"
							)
							.setRequired(true)
							.addChannelTypes(ChannelType.GuildCategory)
					)
					.addChannelOption((option) =>
						option
							.setName("archive-channel")
							.setDescription(
								"The channel that will archive all closed tickets"
							)
							.setRequired(true)
							.addChannelTypes(ChannelType.GuildText)
					)
					.addChannelOption((option) =>
						option
							.setName(`admin-archive-channel`)
							.setDescription(
								`The channel that will archive all closed admin-only tickets`
							)
							.addChannelTypes(ChannelType.GuildText)
							.setRequired(true)
					)
			)
			.addSubcommand((command) =>
				command
					.setName("disable")
					.setDescription("Disables the ticket system within your server")
			)
			.addSubcommand((command) =>
				command
					.setName("edit-opener")
					.setDescription(
						"Set a custom opening message whenever a ticket is opened in your server"
					)
			)
	);

export async function run({ interaction, client, handler }: SlashCommandProps) {
	try {
		const commandGroup = interaction.options.getSubcommandGroup();
		const command = interaction.options.getSubcommand();
		switch (commandGroup) {
			case "logging":
				await interaction.deferReply({ flags: MessageFlags.Ephemeral });
				if (command === "enable") {
					const serverConfig = await serverConfigSchema.findOne({
						guildId: interaction.guildId,
					});
					const channel = await interaction.options.getChannel("channel");
					const type = await interaction.options.getString("type");
					switch (type) {
						case "bans":
							if (serverConfig === null) {
								const newBanChannel = new serverConfigSchema({
									guildId: interaction.guildId,
									banLogsChannelId: channel?.id,
								});
								newBanChannel
									.save()
									.then(() => {
										interaction.followUp(
											`✅ Bans will now be logged in ${channel}!`
										);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							if (serverConfig?.banLogsChannelId !== null) {
								interaction.followUp(
									`❌ Ban logs have already been configured in this server!`
								);
								return;
							}
							if (serverConfig.banLogsChannelId === null) {
								await serverConfig
									.updateOne({ banLogsChannelId: channel?.id })
									.then(() => {
										interaction.followUp(
											`✅ Bans will be logged in ${channel}!`
										);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							break;
						case "kick":
							if (serverConfig === null) {
								const newKickChannel = new serverConfigSchema({
									guildId: interaction.guildId,
									kickLogsChannelId: channel?.id,
								});
								newKickChannel
									.save()
									.then(() => {
										interaction.followUp(
											`✅ Kicks will now be logged in ${channel}!`
										);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							if (serverConfig?.kickLogsChannelId !== null) {
								interaction.followUp(
									`❌ Kick logs have already been configured in this server!`
								);
								return;
							}
							if (serverConfig.kickLogsChannelId === null) {
								await serverConfig
									.updateOne({ kickLogsChannelId: channel?.id })
									.then(() => {
										interaction.followUp(
											`✅ Kicks will be logged in ${channel}!`
										);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							break;
						case "timeout":
							if (serverConfig === null) {
								const newTimeoutChannel = new serverConfigSchema({
									guildId: interaction.guildId,
									timeoutLogsChannelId: channel?.id,
								});
								newTimeoutChannel
									.save()
									.then(() => {
										interaction.followUp(
											`✅ Timeouts will now be logged in ${channel}!`
										);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							if (serverConfig?.timeoutLogsChannelId !== null) {
								interaction.followUp(
									`❌ Timeout logs have already been configured in this server!`
								);
								return;
							}
							if (serverConfig.timeoutLogsChannelId === null) {
								await serverConfig
									.updateOne({ timeoutLogsChannelId: channel?.id })
									.then(() => {
										interaction.followUp(
											`✅ Timeout will now be logged in ${channel}!`
										);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							break;
						case "message":
							if (serverConfig === null) {
								const newMessageChannel = new serverConfigSchema({
									guildId: interaction.guildId,
									messageLogsChannelId: channel?.id,
								});
								newMessageChannel
									.save()
									.then(() => {
										interaction.followUp(
											`✅ Message updates/deletions will now be logged in ${channel}!`
										);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							if (serverConfig?.messageLogsChannelId !== null) {
								interaction.followUp(
									`❌ Message logs have already been configured in this server!`
								);
								return;
							}
							if (serverConfig.messageLogsChannelId === null) {
								await serverConfig
									.updateOne({ messageLogsChannelId: channel?.id })
									.then(() => {
										interaction.followUp(
											`✅ Message updates/deletions will now be logged in ${channel}!`
										);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							break;
						case "warn":
							if (serverConfig === null) {
								const newWarnChannel = new serverConfigSchema({
									guildId: interaction.guildId,
									warnLogsChannelId: channel?.id,
								});
								newWarnChannel
									.save()
									.then(() => {
										interaction.followUp(
											`✅ Warns will now be logged in ${channel}!`
										);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							if (serverConfig?.warnLogsChannelId !== null) {
								interaction.followUp(
									`❌ Warn logs have already been configured in this server!`
								);
								return;
							}
							if (serverConfig.warnLogsChannelId === null) {
								await serverConfig
									.updateOne({ warnLogsChannelId: channel?.id })
									.then(() => {
										interaction.followUp(
											`✅ Warns will now be logged in ${channel}!`
										);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							break;
						case "suggestion":
							if (serverConfig === null) {
								const newSuggestionChannel = new serverConfigSchema({
									guildId: interaction.guildId,
									suggestionChannelId: channel?.id,
								});
								newSuggestionChannel
									.save()
									.then(() => {
										interaction.followUp(
											`✅ Submitted suggestions will now be logged in ${channel}!`
										);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							if (serverConfig?.suggestionChannelId !== null) {
								interaction.followUp(
									`❌ Suggestions have already been configured in this server!`
								);
								return;
							}
							if (serverConfig.suggestionChannelId === null) {
								await serverConfig
									.updateOne({ suggestionChannelId: channel?.id })
									.then(() => {
										interaction.followUp(
											`✅ Submitted suggestions will now be logged in ${channel}!`
										);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							break;
					}
				}
				if (command === "disable") {
					const serverConfig = await serverConfigSchema.findOne({
						guildId: interaction.guildId,
					});
					const type = await interaction.options.getString("type");
					switch (type) {
						case "bans":
							if (serverConfig === null) {
								const config = new serverConfigSchema({
									guildId: interaction.guildId,
								});
								config
									.save()
									.then(() => {
										interaction.followUp(
											`❌ This server hasn't enabled ban logging!`
										);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							if (serverConfig.banLogsChannelId === null) {
								interaction.followUp(
									`❌ This server hasn't enabled ban logging!`
								);
								return;
							}
							if (serverConfig.banLogsChannelId !== null) {
								serverConfig
									.updateOne({ banLogsChannelId: null })
									.then(() => {
										interaction.followUp(`✅ Ban logging is now disabled!`);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							break;
						case "kick":
							if (serverConfig === null) {
								const config = new serverConfigSchema({
									guildId: interaction.guildId,
								});
								config
									.save()
									.then(() => {
										interaction.followUp(
											`❌ This server hasn't enabled kick logging!`
										);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							if (serverConfig.kickLogsChannelId === null) {
								interaction.followUp(
									`❌ This server hasn't enabled kick logging!`
								);
								return;
							}
							if (serverConfig.kickLogsChannelId !== null) {
								serverConfig
									.updateOne({ kickLogsChannelId: null })
									.then(() => {
										interaction.followUp(`✅ Kick logging is now disabled!`);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							break;
						case "timeout":
							if (serverConfig === null) {
								const config = new serverConfigSchema({
									guildId: interaction.guildId,
								});
								config
									.save()
									.then(() => {
										interaction.followUp(
											`❌ This server hasn't enabled timeout logging!`
										);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							if (serverConfig.timeoutLogsChannelId === null) {
								interaction.followUp(
									`❌ This server hasn't enabled timeout logging!`
								);
								return;
							}
							if (serverConfig.timeoutLogsChannelId !== null) {
								serverConfig
									.updateOne({ timeoutLogsChannelId: null })
									.then(() => {
										interaction.followUp(`✅ Timeout logging is now disabled!`);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							break;
						case "message":
							if (serverConfig === null) {
								const config = new serverConfigSchema({
									guildId: interaction.guildId,
								});
								config
									.save()
									.then(() => {
										interaction.followUp(
											`❌ This server hasn't enabled message update/deletion logging!`
										);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							if (serverConfig.messageLogsChannelId === null) {
								interaction.followUp(
									`❌ This server hasn't enabled message update/deletion logging!`
								);
								return;
							}
							if (serverConfig.messageLogsChannelId !== null) {
								serverConfig
									.updateOne({ messageLogsChannelId: null })
									.then(() => {
										interaction.followUp(
											`✅ Message update/deletion logging is now disabled!`
										);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							break;
						case "warn":
							if (serverConfig === null) {
								const config = new serverConfigSchema({
									guildId: interaction.guildId,
								});
								config
									.save()
									.then(() => {
										interaction.followUp(
											`❌ This server hasn't enabled warn logging!`
										);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							if (serverConfig.warnLogsChannelId === null) {
								interaction.followUp(
									`❌ This server hasn't enabled warn logging!`
								);
								return;
							}
							if (serverConfig.warnLogsChannelId !== null) {
								serverConfig
									.updateOne({ warnLogsChannelId: null })
									.then(() => {
										interaction.followUp(`✅ Warn logging is now disabled!`);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							break;
						case "suggestion":
							if (serverConfig === null) {
								const config = new serverConfigSchema({
									guildId: interaction.guildId,
								});
								config
									.save()
									.then(() => {
										interaction.followUp(
											`❌ This server hasn't enabled the suggestions feature!`
										);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							if (serverConfig.suggestionChannelId === null) {
								interaction.followUp(
									`❌ This server hasn't enabled suggestions feature!`
								);
								return;
							}
							if (serverConfig.suggestionChannelId !== null) {
								serverConfig
									.updateOne({ suggestionChannelId: null })
									.then(() => {
										interaction.followUp(`✅ Suggestions are now disabled!`);
									})
									.catch((error) => {
										interaction.followUp(
											`Database error. Please try again in a moment.`
										);
										console.log(
											`DB error in ${fileURLToPath(import.meta.url)}:\n`,
											error
										);
									});
								return;
							}
							break;
					}
				}
				break;
			case "welcomer-goodbyes":
				await interaction.deferReply({ flags: MessageFlags.Ephemeral });
				if (command === "enable") {
					const type = interaction.options.getString("type");
					const serverConfig = await serverConfigSchema.findOne({
						guildId: interaction.guildId,
					});
					const channel = interaction.options.getChannel("channel");
					const customMessage =
						interaction.options.getString("custom-message") ?? null;

					if (type === "welcomer") {
						if (serverConfig === null) {
							const welcomerChannel = new serverConfigSchema({
								guildId: interaction.guildId,
								welcomeChannelId: interaction.guildId,
								customWelcomeMessage: customMessage ?? null,
							});
							welcomerChannel
								.save()
								.then(() => {
									interaction.followUp(
										`✅ Automated join messages will now be sent to ${channel} when a new member joins the server!`
									);
								})
								.catch((error) => {
									interaction.followUp(
										`Database error. Please try again in a moment.`
									);
									console.log(
										`DB error in ${fileURLToPath(import.meta.url)}:\n`,
										error
									);
								});
							return;
						}
						if (serverConfig.welcomeChannelId !== null) {
							interaction.followUp(
								`❌ A channel has already been configured to send a message when a new member joins! \nTo edit the custom message, use the edit subcommand instead.`
							);
							return;
						}
						if (serverConfig.welcomeChannelId === null) {
							await serverConfig
								.updateOne({
									welcomeChannelId: channel,
									customWelcomeMessage: customMessage,
								})
								.then(() => {
									interaction.followUp(
										`✅ Automated welcome messages now be sent to ${channel} when a new member joins the server!`
									);
								})
								.catch((error) => {
									interaction.followUp(
										`Database error. Please try again in a moment.`
									);
									console.log(
										`DB error in ${fileURLToPath(import.meta.url)}:\n`,
										error
									);
								});
							return;
						}
					}
					if (type === "goodbye") {
						if (serverConfig === null) {
							const goodbyeChannel = new serverConfigSchema({
								guildId: interaction.guildId,
								goodbyeChannelId: channel,
								customGoodbyeMessage: customMessage,
							});
							goodbyeChannel
								.save()
								.then(() => {
									interaction.followUp(
										`✅ Automated goodbye messages will now be sent to ${channel} when a member leaves the server!`
									);
								})
								.catch((error) => {
									interaction.followUp(
										`Database error. Please try again in a moment.`
									);
									console.log(
										`DB error in ${fileURLToPath(import.meta.url)}:\n`,
										error
									);
								});
							return;
						}
						if (serverConfig.goodbyeChannelId !== null) {
							interaction.followUp(
								`❌ A channel has already been configured to send a message when a member leaves the server! \nTo edit the custom message, use the edit subcommand instead.`
							);
							return;
						}
						if (serverConfig.goodbyeChannelId === null) {
							await serverConfig
								.updateOne({
									goodbyeChannelId: channel,
									customGoodbyeMessage: customMessage,
								})
								.then(() => {
									interaction.followUp(
										`✅ Automated goodbye messages will now be sent to ${channel} when a member leaves the server!`
									);
								})
								.catch((error) => {
									interaction.followUp(
										`Database error. Please try again in a moment.`
									);
									console.log(
										`DB error in ${fileURLToPath(import.meta.url)}:\n`,
										error
									);
								});
							return;
						}
					}
				}
				if (command === "disable") {
					const type = interaction.options.getString("type");
					const serverConfig = await serverConfigSchema.findOne({
						guildId: interaction.guildId,
					});
					if (type === "welcomer") {
						if (serverConfig === null) {
							const config = new serverConfigSchema({
								guildId: interaction.guildId,
							});
							config
								.save()
								.then(() => {
									interaction.followUp(
										"❌ Automated join messages have not been enabled in this server!"
									);
									return;
								})
								.catch((error) => {
									interaction.followUp(
										`Database error. Please try again in a moment.`
									);
									console.log(
										`BD error in ${fileURLToPath(import.meta.url)}:\n`,
										error
									);
								});
							return;
						}
						if (serverConfig?.welcomeChannelId !== null) {
							await serverConfig
								?.updateOne({
									welcomeChannelId: null,
									customWelcomeMessage: null,
								})
								.then(() => {
									interaction.followUp(
										"✅ Automated welcome messages are now disabled!"
									);
								})
								.catch((error) => {
									interaction.followUp(
										`Database error. Please try again in a moment.`
									);
									console.log(
										`BD error in ${fileURLToPath(import.meta.url)}:\n`,
										error
									);
								});
							return;
						}
						if (serverConfig.welcomeChannelId === null) {
							interaction.followUp(
								"❌ Automated join messages have not been enabled in this server!"
							);
							return;
						}
					}
					if (type === "goodbye") {
						if (serverConfig === null) {
							const config = new serverConfigSchema({
								guildId: interaction.guildId,
							});
							config
								.save()
								.then(() => {
									interaction.followUp(
										"❌ Automated goodbye messages have not been enabled in this server!"
									);
									return;
								})
								.catch((error) => {
									interaction.followUp(
										`Database error. Please try again in a moment.`
									);
									console.log(
										`BD error in ${fileURLToPath(import.meta.url)}:\n`,
										error
									);
								});
							return;
						}
						if (serverConfig?.goodbyeChannelId !== null) {
							await serverConfig
								?.updateOne({
									goodbyeChannelId: null,
									customGoodbyeMessage: null,
								})
								.then(() => {
									interaction.followUp(
										"✅ Automated goodbye messages are now disabled!"
									);
								})
								.catch((error) => {
									interaction.followUp(
										`Database error. Please try again in a moment.`
									);
									console.log(
										`BD error in ${fileURLToPath(import.meta.url)}:\n`,
										error
									);
								});
							return;
						}
						if (serverConfig.goodbyeChannelId === null) {
							interaction.followUp(
								"❌ Automated goodbye messages have not been enabled in this server!"
							);
							return;
						}
					}
				}
				if (command === "edit") {
					const customMessage = interaction.options.getString("custom-message");
					const type = interaction.options.getString("type");
					const serverConfig = await serverConfigSchema.findOne({
						guildId: interaction.guildId,
					});
					if (type === "welcomer") {
						if (serverConfig === null) {
							const config = new serverConfigSchema({
								guildId: interaction.guildId,
							});
							config
								.save()
								.then(() => {
									interaction.followUp(
										"❌ Automated join messages have not been enabled in this server!"
									);
									return;
								})
								.catch((error) => {
									interaction.followUp(
										`Database error. Please try again in a moment.`
									);
									console.log(
										`BD error in ${fileURLToPath(import.meta.url)}:\n`,
										error
									);
								});
							return;
						}
						if (serverConfig.welcomeChannelId === null) {
							interaction.followUp(
								"❌ Automated join messages have not been enabled in this server!"
							);
							return;
						}

						if (serverConfig.welcomeChannelId !== null) {
							await serverConfig
								.updateOne({ customWelcomeMessage: customMessage })
								.then(() => {
									interaction.followUp(
										`✅ Custom join message has been updated!`
									);
								})
								.catch((error) => {
									interaction.followUp(
										"Database error. Please try again in a moment."
									);
									console.log(
										`DB error in ${fileURLToPath(import.meta.url)}:\n`,
										error
									);
								});
							return;
						}
					}
					if (type === "goodbye") {
						if (serverConfig === null) {
							const config = new serverConfigSchema({
								guildId: interaction.guildId,
							});
							config
								.save()
								.then(() => {
									interaction.followUp(
										"❌ Automated goodbye messages have not been enabled in this server!"
									);
									return;
								})
								.catch((error) => {
									interaction.followUp(
										`Database error. Please try again in a moment.`
									);
									console.log(
										`BD error in ${fileURLToPath(import.meta.url)}:\n`,
										error
									);
								});
							return;
						}
						if (serverConfig.goodbyeChannelId === null) {
							interaction.followUp(
								"❌ Automated join messages have not been enabled in this server!"
							);
							return;
						}

						if (serverConfig.goodbyeChannelId !== null) {
							await serverConfig
								.updateOne({ customGoodbyeMessage: customMessage })
								.then(() => {
									interaction.followUp(
										`✅ Custom join message has been updated!`
									);
								})
								.catch((error) => {
									interaction.followUp(
										"Database error. Please try again in a moment."
									);
									console.log(
										`DB error in ${fileURLToPath(import.meta.url)}:\n`,
										error
									);
								});
							return;
						}
					}
				}
				break;
			case "starboard":
				await interaction.deferReply({ flags: MessageFlags.Ephemeral });
				if (command === "enable") {
					const serverConfig = await serverConfigSchema.findOne({
						guildId: interaction.guildId,
					});
					const channel = await interaction.options.getChannel("channel");
					const reactionCount =
						(await interaction.options?.getInteger("reaction-count")) ?? 5;
					const reactionEmoji =
						(await interaction.options?.getString("emoji")) ?? "⭐";
					if (serverConfig === null) {
						const config = new serverConfigSchema({
							guildId: interaction.guildId,
							starboardChannelId: channel,
							starboardReactionCount: reactionCount,
							starboardReactionEmoji: reactionEmoji,
						});

						config
							.save()
							.then(() => {
								interaction.followUp(
									`✅ Starboard has been enabled with the following settings:\nStarboard channel: ${channel}\nEmoji: ${reactionEmoji}\nMinimum Reaction Count: ${reactionCount}`
								);
							})
							.catch((error) => {
								interaction.followUp(
									`Database error. Please try again in a moment.`
								);
								console.log(
									`DB error in ${fileURLToPath(import.meta.url)}:\n`,
									error
								);
							});
						return;
					}
					if (serverConfig.starboardChannelId === null) {
						await serverConfig
							.updateOne({
								starboardChannelId: channel,
								starboardReactionCount: reactionCount,
								starboardReactionEmoji: reactionEmoji,
							})
							.then(() => {
								interaction.followUp(
									`✅ Starboard has been enabled with the following settings:\nStarboard Channel: ${channel}\nEmoji: ${reactionEmoji}\nMinimum Reaction Count: ${reactionCount} `
								);
							})
							.catch((error) => {
								interaction.followUp(
									`Database error. Please try again in a moment.`
								);
								console.log(
									`DB error in ${fileURLToPath(import.meta.url)}:\n`,
									error
								);
							});
						return;
					}

					if (serverConfig.starboardChannelId !== null) {
						interaction.followUp(
							`❌ Starboard has already been configured in this server!`
						);
						return;
					}
				}
				if (command === "disable") {
					const serverConfig = await serverConfigSchema.findOne({
						guildId: interaction.guildId,
					});

					if (serverConfig === null) {
						const config = new serverConfigSchema({
							guildId: interaction.guildId,
						});

						config
							.save()
							.then(() => {
								interaction.followUp(
									`❌ Starboard has not been configured in this server!`
								);
							})
							.catch((error) => {
								interaction.followUp(
									`Database error. Please try again in a moment.`
								);
								console.log(
									`DB error in ${fileURLToPath(import.meta.url)}:\n`,
									error
								);
							});
						return;
					}
					if (serverConfig.starboardChannelId === null) {
						interaction.followUp(
							`❌ Starboard has not been configured in this server!`
						);
						return;
					}
					if (serverConfig.starboardChannelId !== null) {
						await serverConfig
							.updateOne({
								starboardChannelId: null,
								starboardReactionCount: 5,
								starboardReactionEmoji: "⭐",
							})
							.then(() => {
								interaction.followUp(
									`✅ Starboard is now disabled in this server!`
								);
							})
							.catch((error) => {
								interaction.followUp(
									`Database error. Please try again in a moment.`
								);
								console.log(
									`DB error in ${fileURLToPath(import.meta.url)}:\n`,
									error
								);
							});
						return;
					}
				}
				break;
			case "admin-roles":
				await interaction.deferReply({ flags: MessageFlags.Ephemeral });
				if (command === "add") {
					const role = interaction.options.getRole("role");
					const serverConfig = await serverConfigSchema.findOne({
						guildId: interaction.guildId,
					});
					if (serverConfig === null) {
						const config = new serverConfigSchema({
							guildId: interaction.guildId,
							$push: { adminRoles: role?.id },
						});

						config
							.save()
							.then(() => {
								interaction.followUp(
									`✅ ${role} has been logged as an Admin role!`
								);
							})
							.catch((error) => {
								interaction.followUp(
									`Database error. Please try again in a moment.`
								);
								console.log(
									`DB error in ${fileURLToPath(import.meta.url)}:\n`,
									error
								);
							});
						return;
					}
					if (
						serverConfig.adminRoles === undefined ||
						!serverConfig.adminRoles?.includes(`${role?.id}`)
					) {
						await serverConfig
							.updateOne({ $push: { adminRoles: role?.id } })
							.then(() => {
								interaction.followUp(
									`✅ ${role} has been logged as an Admin role!`
								);
							})
							.catch((error) => {
								interaction.followUp(
									`Database error. Please try again in a moment.`
								);
								console.log(
									`DB error in ${fileURLToPath(import.meta.url)}:\n`,
									error
								);
							});
						return;
					}

					if (serverConfig.adminRoles?.includes(`${role?.id}`)) {
						interaction.followUp(
							`❌ ${role} is already logged as an Admin role!`
						);
						return;
					}
				}
				if (command === "remove") {
					const role = interaction.options.getRole("role");
					const serverConfig = await serverConfigSchema.findOne({
						guildId: interaction.guildId,
					});
					if (serverConfig === null) {
						const config = new serverConfigSchema({
							guildId: interaction.guildId,
						});

						config
							.save()
							.then(() => {
								interaction.followUp(
									`❌ ${role} hasn't been logged as an Admin role!`
								);
							})
							.catch((error) => {
								interaction.followUp(
									`Database error. Please try again in a moment.`
								);
								console.log(
									`DB error in ${fileURLToPath(import.meta.url)}:\n`,
									error
								);
							});
						return;
					}
					if (
						serverConfig.adminRoles === undefined ||
						!serverConfig.adminRoles?.includes(role?.id as string)
					) {
						interaction.followUp(
							`❌ ${role} hasn't been logged as an Admin role!`
						);
						return;
					}
					if (serverConfig.adminRoles?.includes(`${role?.id}`)) {
						await serverConfig
							.updateOne({ $pull: { adminRoles: role?.id } })
							.then(() => {
								interaction.followUp(
									`✅ ${role} is no longer logged as an Admin role!`
								);
							})
							.catch((error) => {
								interaction.followUp(
									`Database error. Please try again in a moment.`
								);
								console.log(
									`DB error in ${fileURLToPath(import.meta.url)}:\n`,
									error
								);
							});
						return;
					}
				}
				break;
			case "moderator-roles":
				await interaction.deferReply({ flags: MessageFlags.Ephemeral });
				const role = interaction.options.getRole("role");
				const serverConfig = await serverConfigSchema.findOne({
					guildId: interaction.guildId,
				});
				if (command === "add") {
					if (serverConfig === null) {
						const config = new serverConfigSchema({
							guildId: interaction.guildId,
							$push: { moderatorRoles: role?.id },
						});

						config
							.save()
							.then(() => {
								interaction.followUp(
									`✅ ${role} has been logged as an Moderator role!`
								);
							})
							.catch((error) => {
								interaction.followUp(
									`Database error. Please try again in a moment.`
								);
								console.log(
									`DB error in ${fileURLToPath(import.meta.url)}:\n`,
									error
								);
							});
						return;
					}
					if (
						serverConfig.moderatorRoles === undefined ||
						!serverConfig.moderatorRoles?.includes(`${role?.id}`)
					) {
						await serverConfig
							.updateOne({ $push: { moderatorRoles: role?.id } })
							.then(() => {
								interaction.followUp(
									`✅ ${role} has been logged as a Moderator role!`
								);
							})
							.catch((error) => {
								interaction.followUp(
									`Database error. Please try again in a moment.`
								);
								console.log(
									`DB error in ${fileURLToPath(import.meta.url)}:\n`,
									error
								);
							});
						return;
					}

					if (serverConfig.moderatorRoles?.includes(`${role?.id}`)) {
						interaction.followUp(
							`❌ ${role} is already logged as a Moderator role!`
						);
						return;
					}
				}
				if (command === "remove") {
					if (serverConfig === null) {
						const config = new serverConfigSchema({
							guildId: interaction.guildId,
						});

						config
							.save()
							.then(() => {
								interaction.followUp(
									`❌ ${role} hasn't been logged as a Moderator role!`
								);
							})
							.catch((error) => {
								interaction.followUp(
									`Database error. Please try again in a moment.`
								);
								console.log(
									`DB error in ${fileURLToPath(import.meta.url)}:\n`,
									error
								);
							});
						return;
					}
					if (
						serverConfig.moderatorRoles === undefined ||
						!serverConfig.moderatorRoles?.includes(role?.id as string)
					) {
						interaction.followUp(
							`❌ ${role} hasn't been logged as a Moderator role!`
						);
						return;
					}
					if (serverConfig.moderatorRoles?.includes(`${role?.id}`)) {
						await serverConfig
							.updateOne({ $pull: { moderatorRoles: role?.id } })
							.then(() => {
								interaction.followUp(
									`✅ ${role} is no longer logged as a Moderator role!`
								);
							})
							.catch((error) => {
								interaction.followUp(
									`Database error. Please try again in a moment.`
								);
								console.log(
									`DB error in ${fileURLToPath(import.meta.url)}:\n`,
									error
								);
							});
						return;
					}
				}
				break;
			case "tickets":
				if (command === "enable") {
					await interaction.deferReply({ flags: MessageFlags.Ephemeral });
					const serverConfig = await ServerConfig.findOne({
						guildId: interaction.guildId,
					});
					const ticketCategory = interaction.options.getChannel(
						"category"
					) as GuildChannel;
					const ticketArchive = interaction.options.getChannel(
						"archive-channel"
					) as GuildChannel;
					const ticketAdminArchive = interaction.options.getChannel(
						`admin-archive-channel`
					) as GuildChannel;
					try {
						if (!serverConfig) {
							const newTicketSystem = new ServerConfig({
								guildId: interaction.guildId,
								ticketCategoryId: ticketCategory.id,
								ticketArchiveChannelId: ticketArchive.id,
								ticketAdminArchiveChannelId: ticketAdminArchive.id,
							});

							newTicketSystem
								.save()
								.then(() => {
									interaction.followUp(
										`✅ Ticket system is now enabled!\nTickets will be created under ${ticketCategory}\nArchived tickets will be stored in ${ticketArchive}\n\n If you'd like a custom opening message for tickets, please run ${"`/settings tickets edit-opener`"}`
									);
								})
								.catch((error) => {
									interaction.followUp(
										`Database error. Please try again in a moment.`
									);
									console.log(
										`DB error in ${fileURLToPath(import.meta.url)}:\n`,
										error
									);
								});
							return;
						}

						if (
							serverConfig.ticketArchiveChannelId &&
							serverConfig.ticketCategoryId &&
							serverConfig.ticketAdminArchiveChannelId
						) {
							interaction.followUp(
								`❌ The ticket system has already been configured for this server!`
							);
							return;
						}

						if (
							!serverConfig.ticketArchiveChannelId ||
							!serverConfig.ticketCategoryId ||
							!serverConfig.ticketAdminArchiveChannelId
						) {
							await serverConfig
								.updateOne({
									ticketArchiveChannelId: ticketArchive.id,
									ticketCategoryId: ticketCategory.id,
									ticketAdminArchiveChannelId: ticketAdminArchive.id,
								})
								.then(() => {
									interaction.followUp(
										`✅ Ticket system is now enabled!\nTickets will be created under ${ticketCategory}\nArchived tickets will be stored in ${ticketArchive}\nArchived Admin-Only tickets will be stores in ${ticketAdminArchive}\n\n If you'd like a custom opening message for tickets, please run ${"`/settings tickets edit-opener`"}`
									);
								})
								.catch((error) => {
									interaction.followUp(
										`Database error. Please try again in a moment.`
									);
									console.log(
										`DB error in ${fileURLToPath(import.meta.url)}:\n`,
										error
									);
								});
							return;
						}
					} catch (error) {
						interaction.followUp(
							"An error occurred running this command. Please try again in a moment."
						);
						console.log(`Error in ${fileURLToPath(import.meta.url)}:\n`, error);
					}
				}
				if (command === "disable") {
					await interaction.deferReply({ flags: MessageFlags.Ephemeral });
					const serverConfig = await ServerConfig.findOne({
						guildId: interaction.guildId,
					});
					if (
						!serverConfig ||
						(!serverConfig.ticketArchiveChannelId &&
							!serverConfig.ticketCategoryId &&
							!serverConfig.ticketAdminArchiveChannelId)
					) {
						interaction.followUp(
							`❌ This server hasn't enabled the ticket system!`
						);
						return;
					}

					serverConfig
						.updateOne({
							ticketArchiveChannelId: null,
							ticketCategoryId: null,
							ticketOpeningMessage: null,
							ticketAdminArchiveChannelId: null,
						})
						.then(() => {
							interaction.followUp(
								`✅ Ticket system is now disabled! All related settings have been deleted!`
							);
						})
						.catch((error) => {
							interaction.followUp(
								`Database error. please try again in a moment.`
							);
							console.log(
								`DB error in ${fileURLToPath(import.meta.url)}:\n`,
								error
							);
						});
					return;
				}
				if (command === "edit-opener") {
					try {
						const serverConfig = await ServerConfig.findOne({
							guildId: interaction.guildId,
						});

						if (
							!serverConfig ||
							(!serverConfig.ticketArchiveChannelId &&
								!serverConfig.ticketCategoryId &&
								!serverConfig.ticketAdminArchiveChannelId)
						) {
							interaction.followUp(
								`❌ Ticket system is curently disabled! Please run ${"`/settings tickets enable`"}`
							);
							return;
						}
						if (
							serverConfig.ticketArchiveChannelId &&
							serverConfig.ticketCategoryId &&
							serverConfig.ticketAdminArchiveChannelId
						) {
							const modal = new ModalBuilder()
								.setCustomId(`TicketOpener`)
								.setTitle(`Cutomize Opening Message for Tickets`);

							const customOpenerInput = new TextInputBuilder()
								.setCustomId(`ticketOpenerInput`)
								.setLabel(`Opening Message: `)
								.setStyle(TextInputStyle.Paragraph)
								.setRequired(true)
								.setPlaceholder(
									`"Please describe the reasoning for opening this ticket..."`
								);

							const customOpener =
								new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
									customOpenerInput
								);
							modal.addComponents(customOpener);

							await interaction.showModal(modal);
						}
						return;
					} catch (error) {
						console.log(error);
					}
				}
			default:
				break;
		}
	} catch (error) {}
}
