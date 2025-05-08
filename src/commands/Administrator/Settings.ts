// import {
// 	ActionRow,
// 	ActionRowBuilder,
// 	ActionRowComponent,
// 	BaseGuildTextChannel,
// 	ButtonBuilder,
// 	ButtonInteraction,
// 	ButtonStyle,
// 	channelMention,
// 	ChannelSelectMenuBuilder,
// 	ChannelSelectMenuInteraction,
// 	ChannelType,
// 	ChatInputCommandInteraction,
// 	ColorResolvable,
// 	CommandInteraction,
// 	ComponentType,
// 	EmbedBuilder,
// 	Interaction,
// 	InteractionCallbackResponse,
// 	InteractionContextType,
// 	InteractionResponse,
// 	Message,
// 	MessageActionRowComponent,
// 	MessageActionRowComponentBuilder,
// 	MessageCollector,
// 	MessageComponent,
// 	MessageComponentInteraction,
// 	ModalActionRowComponentBuilder,
// 	ModalBuilder,
// 	Options,
// 	PermissionFlagsBits,
// 	RoleSelectMenuBuilder,
// 	SlashCommandBuilder,
// 	StringSelectMenuBuilder,
// 	StringSelectMenuOptionBuilder,
// 	TextBasedChannel,
// 	TextChannel,
// 	TextInputBuilder,
// 	TextInputStyle,
// } from "discord.js";
// import { SlashCommandProps } from "commandkit";
// import ServerConfigs from "../../models/ServerConfigs.js";
// import { updateComponent } from "../../Util/ButtonRowUpdater.js";
// import prettyMilliseconds from "pretty-ms";
// import { StickyMessage } from "../../Util/stickyMessageObjectClass.js";
// export const data = new SlashCommandBuilder()
// 	.setName(`settings`)
// 	.setDescription(`Configures settings for this server`)
// 	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
// 	.setContexts(InteractionContextType.Guild)
// 	.addSubcommandGroup((commandGroup) =>
// 		commandGroup
// 			.setName(`moderation`)
// 			.setDescription(`Configure settings for moderation settings`)
// 			.addSubcommand((command) =>
// 				command.setName(`logging`).setDescription(`Configure logging settings`)
// 			)
// 			.addSubcommand((command) =>
// 				command
// 					.setName(`ban`)
// 					.setDescription(`Configure settings for the ban command`)
// 			)
// 			.addSubcommand((command) =>
// 				command
// 					.setName(`kick`)
// 					.setDescription(`Configure settings for the kick command`)
// 			)
// 			.addSubcommand((command) =>
// 				command
// 					.setName(`timeout`)
// 					.setDescription(`Configure settings for the timeout command`)
// 			)
// 			.addSubcommand((command) =>
// 				command
// 					.setName(`warn`)
// 					.setDescription(`Configure the settings for the warn command`)
// 			)
// 			.addSubcommand((command) =>
// 				command
// 					.setName(`staff`)
// 					.setDescription(
// 						`Configure which roles are considered as moderators/admins`
// 					)
// 			)
// 	)
// 	.addSubcommand((command) =>
// 		command
// 			.setName(`tickets`)
// 			.setDescription(`Configure settings for the ticket system`)
// 	)
// 	.addSubcommand((command) =>
// 		command
// 			.setName(`starboard`)
// 			.setDescription(`Configure starboard settings within your server`)
// 	)
// 	.addSubcommand((command) =>
// 		command
// 			.setName(`join-message`)
// 			.setDescription(
// 				`Configure settings for automated welcome messages when a user joins the server`
// 			)
// 	)
// 	.addSubcommand((command) =>
// 		command
// 			.setName(`leave-message`)
// 			.setDescription(
// 				`Configure settings for automated goodbye messages when a user leaves this server`
// 			)
// 	)
// 	.addSubcommand((command) =>
// 		command
// 			.setName(`sticky-message`)
// 			.setDescription(`Configure sticky messages for a selected channel`)
// 	);

// export async function run({ interaction, client, handler }: SlashCommandProps) {
// 	try {
// 		const commandGroup = interaction.options.getSubcommandGroup();
// 		const command = interaction.options.getSubcommand();
// 		const serverConfig = await ServerConfigs.findOne({
// 			guildId: interaction.guildId,
// 		});
// 		const executor = interaction.user;
// 		let response;
// 		let enablerToggle;
// 		let evidenceRequiredToggle;
// 		let reasonRequiredToggle;
// 		let buttonRow;
// 		let selectCollector;
// 		let buttonCollector;
// 		let newActionRows;
// 		switch (commandGroup) {
// 			case "moderation":
// 				switch (command) {
// 					case "logging":
// 						const modActionLogSelector = new ChannelSelectMenuBuilder()
// 							.setCustomId(`modActionLogChannel`)
// 							.setChannelTypes(ChannelType.GuildText)
// 							.setMinValues(0)
// 							.setMaxValues(1)
// 							.setPlaceholder(`Moderator Action Logs`);

// 						const messageLogSelector = new ChannelSelectMenuBuilder()
// 							.setCustomId(`messageLogChannel`)
// 							.setChannelTypes(ChannelType.GuildText)
// 							.setMinValues(0)
// 							.setMaxValues(1)
// 							.setPlaceholder(`Message Logs`);

// 						if (serverConfig?.moderation.logs.actionLogChannel)
// 							modActionLogSelector.setDefaultChannels(
// 								serverConfig.moderation.logs.actionLogChannel
// 							);
// 						if (serverConfig?.moderation.logs.messageLogChannel)
// 							messageLogSelector.setDefaultChannels(
// 								serverConfig.moderation.logs.messageLogChannel
// 							);
// 						const modActionLogSelectorRow =
// 							new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
// 								modActionLogSelector
// 							);
// 						const messageLogSelectorRow =
// 							new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
// 								messageLogSelector
// 							);
// 						response = await interaction.reply({
// 							content: `Please configure the logging channels below:`,
// 							components: [modActionLogSelectorRow, messageLogSelectorRow],
// 							withResponse: true,
// 						});

// 						selectCollector =
// 							response.resource?.message?.createMessageComponentCollector({
// 								componentType: ComponentType.ChannelSelect,
// 								time: 60_000,
// 							});
// 						// Collector exists for 1 minute

// 						selectCollector?.on("collect", async (i) => {
// 							if (i.user.id !== executor.id) {
// 								i.reply({
// 									content: `❌ You have not created this menu`,
// 									flags: ["Ephemeral"],
// 								});
// 							} else if (i.customId === `modActionLogChannel`) {
// 								if (i.values[0] !== undefined) {
// 									serverConfig?.set(
// 										`moderation.logs.actionLogChannel`,
// 										i.values[0]
// 									);
// 									await serverConfig?.save();

// 									await i.reply({
// 										content: `Moderator actions will now be logged in ${channelMention(
// 											i.values[0]
// 										)}!`,
// 									});

// 									setTimeout(() => {
// 										i.deleteReply();
// 									}, 10_000);
// 								} else {
// 									serverConfig?.set(
// 										`moderation.logs.actionLogChannel`,
// 										undefined
// 									);
// 									await serverConfig?.save();

// 									await i.reply({
// 										content: `Moderator actions will no longer be logged.`,
// 									});

// 									setTimeout(() => {
// 										i.deleteReply();
// 									}, 10_000);
// 								}
// 							} else if (i.customId === `messageLogChannel`) {
// 								if (i.values[0] !== undefined) {
// 									serverConfig?.set(
// 										`moderation.logs.messageLogChannel`,
// 										i.values[0]
// 									);
// 									await serverConfig?.save();

// 									await i.reply({
// 										content: `Message events will now be logged in ${channelMention(
// 											i.values[0]
// 										)}!`,
// 									});

// 									setTimeout(() => {
// 										i.deleteReply();
// 									}, 10_000);
// 								}
// 							} else {
// 								serverConfig?.set(
// 									`moderation.logs.messageLogChannel`,
// 									undefined
// 								);
// 								await serverConfig?.save();

// 								await i.reply({
// 									content: `Message events will no longer be logged.`,
// 								});

// 								setTimeout(
// 									() => {
// 										i.deleteReply();
// 									}, // 10 seconds
// 									600_000
// 								);
// 							}
// 						});
// 						return;
// 					case "ban":
// 						enablerToggle = new ButtonBuilder().setCustomId(`EnablerToggle`);

// 						evidenceRequiredToggle = new ButtonBuilder()
// 							.setCustomId(`EvidenceRequired`)
// 							.setLabel(`Evidence Required`);

// 						reasonRequiredToggle = new ButtonBuilder()
// 							.setCustomId(`ReasonRequired`)
// 							.setLabel(`Reason Required`);

// 						if (serverConfig?.moderation.ban.enabled === true) {
// 							enablerToggle.setLabel(`Enabled`).setStyle(ButtonStyle.Success);
// 						} else if (serverConfig?.moderation.ban.enabled === false) {
// 							enablerToggle.setLabel(`Disabled`).setStyle(ButtonStyle.Danger);
// 						}

// 						if (serverConfig?.moderation.ban.evidenceRequired === true) {
// 							evidenceRequiredToggle.setStyle(ButtonStyle.Success);
// 						} else if (
// 							serverConfig?.moderation.ban.evidenceRequired === false
// 						) {
// 							evidenceRequiredToggle.setStyle(ButtonStyle.Danger);
// 						}

// 						if (serverConfig?.moderation.ban.reasonRequired === true) {
// 							reasonRequiredToggle.setStyle(ButtonStyle.Success);
// 						} else if (serverConfig?.moderation.ban.reasonRequired === false) {
// 							reasonRequiredToggle.setStyle(ButtonStyle.Danger);
// 						}

// 						buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
// 							enablerToggle,
// 							evidenceRequiredToggle,
// 							reasonRequiredToggle
// 						);

// 						response = await interaction.reply({
// 							content: `Ban Command Settings:`,
// 							components: [buttonRow],
// 							withResponse: true,
// 						});

// 						buttonCollector =
// 							response.resource?.message?.createMessageComponentCollector({
// 								componentType: ComponentType.Button,
// 								time: 60_000,
// 							});
// 						// Collector exists for 1 minute

// 						buttonCollector?.on(`collect`, async (i) => {
// 							if (i.user.id !== executor.id) {
// 								i.reply({
// 									content: `❌ You have not created this menu`,
// 									flags: ["Ephemeral"],
// 								});
// 								return;
// 							} else {
// 								if (i.customId == "EnablerToggle") {
// 									newActionRows = updateComponent<ButtonBuilder>(
// 										i,
// 										(button) =>
// 											button.setStyle(
// 												button.data.style === ButtonStyle.Success
// 													? ButtonStyle.Danger
// 													: ButtonStyle.Success
// 											) &&
// 											button.setLabel(
// 												button.data.style === ButtonStyle.Success
// 													? "Enabled"
// 													: "Disabled"
// 											)
// 									);
// 									serverConfig?.set(
// 										`moderation.ban.enabled`,
// 										i.component.style === ButtonStyle.Danger ? true : false
// 									);
// 									await serverConfig?.save();
// 									await i.update({
// 										content: i.message.content,
// 										components: newActionRows,
// 									});
// 								} else {
// 									newActionRows = updateComponent<ButtonBuilder>(i, (button) =>
// 										button.setStyle(
// 											button.data.style === ButtonStyle.Success
// 												? ButtonStyle.Danger
// 												: ButtonStyle.Success
// 										)
// 									);

// 									if (i.customId === "EvidenceRequired") {
// 										serverConfig?.set(
// 											`moderation.ban.evidenceRequired`,
// 											i.component.style === ButtonStyle.Danger ? true : false
// 										);
// 										await serverConfig?.save();
// 									} else if (i.customId === "ReasonRequired") {
// 										serverConfig?.set(
// 											`moderation.ban.reasonRequired`,
// 											i.component.style === ButtonStyle.Danger ? true : false
// 										);
// 										await serverConfig?.save();
// 									}
// 									await i.update({
// 										content: i.message.content,
// 										components: newActionRows,
// 									});
// 								}
// 							}
// 							return;
// 						});

// 						return;
// 					case "kick":
// 						enablerToggle = new ButtonBuilder().setCustomId(`EnablerToggle`);
// 						evidenceRequiredToggle = new ButtonBuilder()
// 							.setCustomId(`EvidenceRequired`)
// 							.setLabel(`Evidence Required`);
// 						reasonRequiredToggle = new ButtonBuilder()
// 							.setCustomId(`ReasonRequired`)
// 							.setLabel(`Reason Required`);

// 						serverConfig?.moderation.kick.enabled == true
// 							? enablerToggle.setLabel(`Enabled`).setStyle(ButtonStyle.Success)
// 							: enablerToggle.setLabel(`Disabled`).setStyle(ButtonStyle.Danger);
// 						serverConfig?.moderation.kick.reasonRequired === true
// 							? reasonRequiredToggle.setStyle(ButtonStyle.Success)
// 							: reasonRequiredToggle.setStyle(ButtonStyle.Danger);
// 						serverConfig?.moderation.kick.evidenceRequired === true
// 							? evidenceRequiredToggle.setStyle(ButtonStyle.Success)
// 							: evidenceRequiredToggle.setStyle(ButtonStyle.Danger);

// 						buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
// 							enablerToggle,
// 							evidenceRequiredToggle,
// 							reasonRequiredToggle
// 						);

// 						response = await interaction.reply({
// 							content: `Kick Command Settings:`,
// 							components: [buttonRow],
// 							withResponse: true,
// 						});

// 						buttonCollector =
// 							response.resource?.message?.createMessageComponentCollector({
// 								componentType: ComponentType.Button,
// 								time: 60_000,
// 							});
// 						// Collector exists for 1 minute

// 						buttonCollector?.on(`collect`, async (i) => {
// 							if (i.user.id !== executor.id) {
// 								i.reply({
// 									content: `❌ You have not created this menu`,
// 									flags: ["Ephemeral"],
// 								});
// 								return;
// 							} else if (i.customId === `EnablerToggle`) {
// 								newActionRows = updateComponent<ButtonBuilder>(
// 									i,
// 									(button) =>
// 										button.setStyle(
// 											button.data.style === ButtonStyle.Success
// 												? ButtonStyle.Danger
// 												: ButtonStyle.Success
// 										) &&
// 										button.setLabel(
// 											button.data.style === ButtonStyle.Success
// 												? "Enabled"
// 												: "Disabled"
// 										)
// 								);

// 								serverConfig?.set(
// 									`moderation.kick.enabled`,
// 									i.component.style === ButtonStyle.Danger ? true : false
// 								);
// 								await serverConfig?.save();

// 								await i.update({
// 									content: i.message.content,
// 									components: newActionRows,
// 								});
// 							} else {
// 								newActionRows = updateComponent<ButtonBuilder>(i, (button) =>
// 									button.setStyle(
// 										button.data.style === ButtonStyle.Success
// 											? ButtonStyle.Danger
// 											: ButtonStyle.Success
// 									)
// 								);
// 								i.customId === "ReasonRequired"
// 									? serverConfig?.set(
// 											`moderation.kick.reasonRequired`,
// 											i.component.style === ButtonStyle.Danger ? true : false
// 									  )
// 									: serverConfig?.set(
// 											`moderation.kick.evidenceRequired`,
// 											i.component.style === ButtonStyle.Danger ? true : false
// 									  );
// 								await serverConfig?.save();
// 								i.update({
// 									content: i.message.content,
// 									components: newActionRows,
// 								});
// 							}
// 							return;
// 						});
// 						return;
// 					case "timeout":
// 						enablerToggle = new ButtonBuilder().setCustomId(`EnablerToggle`);
// 						serverConfig?.moderation.timeout.enabled === true
// 							? enablerToggle.setStyle(ButtonStyle.Success).setLabel(`Enabled`)
// 							: enablerToggle.setStyle(ButtonStyle.Danger).setLabel(`Disabled`);
// 						reasonRequiredToggle = new ButtonBuilder()
// 							.setCustomId(`ReasonRequired`)
// 							.setLabel(`Reason Required`);
// 						serverConfig?.moderation.timeout.reasonRequired === true
// 							? reasonRequiredToggle.setStyle(ButtonStyle.Success)
// 							: reasonRequiredToggle.setStyle(ButtonStyle.Danger);
// 						evidenceRequiredToggle = new ButtonBuilder()
// 							.setCustomId(`EvidenceRequired`)
// 							.setLabel(`Evidence Required`);
// 						serverConfig?.moderation.timeout.evidenceRequired === true
// 							? evidenceRequiredToggle.setStyle(ButtonStyle.Success)
// 							: evidenceRequiredToggle.setStyle(ButtonStyle.Danger);
// 						const setDurationButton = new ButtonBuilder()
// 							.setCustomId(`SetDuration`)
// 							.setLabel(`Set Default Duration`)
// 							.setStyle(ButtonStyle.Secondary);
// 						buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
// 							enablerToggle,
// 							evidenceRequiredToggle,
// 							reasonRequiredToggle,
// 							setDurationButton
// 						);
// 						response = await interaction.reply({
// 							content: `Timeout Command Settings`,
// 							components: [buttonRow],
// 							withResponse: true,
// 						});
// 						buttonCollector =
// 							response.resource?.message?.createMessageComponentCollector({
// 								componentType: ComponentType.Button,
// 								filter: (i) => i.user.id === executor.id,
// 								time: 120_000,
// 							}); // Collector exists for 2 minutes

// 						buttonCollector?.on("collect", async (i: ButtonInteraction) => {
// 							if (i.customId === `EnablerToggle`) {
// 								newActionRows = updateComponent<ButtonBuilder>(
// 									i,
// 									(button) =>
// 										button.setStyle(
// 											button.data.style === ButtonStyle.Success
// 												? ButtonStyle.Danger
// 												: ButtonStyle.Success
// 										) &&
// 										button.setLabel(
// 											button.data.style === ButtonStyle.Success
// 												? "Enabled"
// 												: "Disabled"
// 										)
// 								);

// 								serverConfig?.set(
// 									`moderation.timeout.enabled`,
// 									i.component.style === ButtonStyle.Danger ? true : false
// 								);
// 								await serverConfig?.save();

// 								await i.update({
// 									content: i.message.content,
// 									components: newActionRows,
// 								});
// 							} else if (i.customId === `SetDuration`) {
// 								const setDurationModal = new ModalBuilder()
// 									.setCustomId(`SetDefaultTimeoutDuration`)
// 									.setTitle(`Default Timeout Duration`);

// 								const setDurationInput = new TextInputBuilder()
// 									.setCustomId(`DefaultTimeoutDurationInput`)
// 									.setLabel(`Default Duration (ex. 30m)`)
// 									.setStyle(TextInputStyle.Short)
// 									.setValue(
// 										prettyMilliseconds(
// 											serverConfig?.moderation.timeout
// 												.defaultTimeoutDuration as number,
// 											{ verbose: false }
// 										)
// 									)
// 									.setMaxLength(52)
// 									.setRequired(true);

// 								const durationInput =
// 									new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
// 										setDurationInput
// 									);

// 								setDurationModal.addComponents(durationInput);

// 								await i.showModal(setDurationModal);
// 							} else {
// 								newActionRows = updateComponent<ButtonBuilder>(i, (button) =>
// 									button.setStyle(
// 										button.data.style === ButtonStyle.Success
// 											? ButtonStyle.Danger
// 											: ButtonStyle.Success
// 									)
// 								);

// 								i.customId === "ReasonRequired"
// 									? serverConfig?.set(
// 											`moderation.timeout.reasonRequired`,
// 											i.component.style === ButtonStyle.Danger ? true : false
// 									  )
// 									: serverConfig?.set(
// 											`moderation.timeout.evidenceRequired`,
// 											i.component.style === ButtonStyle.Danger ? true : false
// 									  );
// 								await serverConfig?.save();
// 								i.update({
// 									content: i.message.content,
// 									components: newActionRows,
// 								});
// 							}
// 						});
// 						return;
// 					case "warn":
// 						enablerToggle = new ButtonBuilder().setCustomId(`EnablerToggle`);
// 						serverConfig?.moderation.warns.enabled === true
// 							? enablerToggle.setStyle(ButtonStyle.Success).setLabel("Enabled")
// 							: enablerToggle.setStyle(ButtonStyle.Danger).setLabel(`Disabled`);
// 						reasonRequiredToggle = new ButtonBuilder()
// 							.setCustomId(`ReasonRequired`)
// 							.setLabel(`Reason Required`);
// 						serverConfig?.moderation.warns.reasonRequired === true
// 							? reasonRequiredToggle.setStyle(ButtonStyle.Success)
// 							: reasonRequiredToggle.setStyle(ButtonStyle.Danger);
// 						evidenceRequiredToggle = new ButtonBuilder()
// 							.setCustomId(`EvidenceRequired`)
// 							.setLabel(`Evidence Required`);
// 						serverConfig?.moderation.warns.evidenceRequired === true
// 							? evidenceRequiredToggle.setStyle(ButtonStyle.Success)
// 							: evidenceRequiredToggle.setStyle(ButtonStyle.Danger);
// 						buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
// 							enablerToggle,
// 							evidenceRequiredToggle,
// 							reasonRequiredToggle
// 						);
// 						response = await interaction.reply({
// 							content: `Warn Settings`,
// 							components: [buttonRow],
// 							withResponse: true,
// 						});
// 						buttonCollector =
// 							response.resource?.message?.createMessageComponentCollector({
// 								componentType: ComponentType.Button,
// 								filter: (i) => i.user.id === executor.id,
// 								time: 60_000,
// 							});
// 						// Collector exists for 1 minute
// 						buttonCollector?.on(`collect`, async (i) => {
// 							if (i.customId === "EnablerToggle") {
// 								newActionRows = updateComponent<ButtonBuilder>(
// 									i,
// 									(button) =>
// 										button.setStyle(
// 											button.data.style === ButtonStyle.Danger
// 												? ButtonStyle.Success
// 												: ButtonStyle.Danger
// 										) &&
// 										button.setLabel(
// 											button.data.style === ButtonStyle.Danger
// 												? "Enabled"
// 												: "Disabled"
// 										)
// 								);
// 								serverConfig?.set(
// 									`moderation.warns.enabled`,
// 									i.component.style === ButtonStyle.Danger ? true : false
// 								);
// 								await serverConfig?.save();
// 								await i.update({
// 									content: i.message.content,
// 									components: newActionRows,
// 								});
// 							} else {
// 								newActionRows = updateComponent<ButtonBuilder>(i, (button) =>
// 									button.setStyle(
// 										button.data.style === ButtonStyle.Success
// 											? ButtonStyle.Danger
// 											: ButtonStyle.Success
// 									)
// 								);

// 								i.customId === "ReasonRequired"
// 									? serverConfig?.set(
// 											`moderation.warns.reasonRequired`,
// 											i.component.style === ButtonStyle.Danger ? true : false
// 									  )
// 									: serverConfig?.set(
// 											`moderation.warns.evidenceRequired`,
// 											i.component.style === ButtonStyle.Danger ? true : false
// 									  );
// 								await serverConfig?.save();
// 								i.update({
// 									content: i.message.content,
// 									components: newActionRows,
// 								});
// 							}
// 							return;
// 						});
// 						return;
// 					case "staff":
// 						let maxValue;
// 						if (!interaction.guild?.roles.cache.size) {
// 							return await interaction.reply({
// 								content: `You don't have any roles to assign!`,
// 								flags: "Ephemeral",
// 							});
// 						} else if (interaction.guild.roles.cache.size <= 10) {
// 							maxValue = interaction.guild.roles.cache.size;
// 						} else maxValue = 10;
// 						const moderatorRolesSelector = new RoleSelectMenuBuilder()
// 							.setCustomId(`moderatorRoles`)
// 							.setMinValues(0)
// 							.setMaxValues(maxValue as number)
// 							.setPlaceholder(`Moderator Roles`);
// 						const adminRolesSelector = new RoleSelectMenuBuilder()
// 							.setCustomId(`adminRoles`)
// 							.setMinValues(0)
// 							.setMaxValues(maxValue as number)
// 							.setPlaceholder(`Admin Roles`);
// 						if (serverConfig?.moderation.adminRoles) {
// 							adminRolesSelector.setDefaultRoles(
// 								serverConfig?.moderation.adminRoles
// 							);
// 						}
// 						if (serverConfig?.moderation.moderatorRoles) {
// 							moderatorRolesSelector.setDefaultRoles(
// 								serverConfig?.moderation.moderatorRoles
// 							);
// 						}
// 						const moderatorRolesRow =
// 							new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
// 								moderatorRolesSelector
// 							);
// 						const adminRolesRow =
// 							new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
// 								adminRolesSelector
// 							);

// 						response = await interaction.reply({
// 							content: `You can add/remove roles to the respective staff role lists below`,
// 							components: [moderatorRolesRow, adminRolesRow],
// 							withResponse: true,
// 						});

// 						selectCollector =
// 							response.resource?.message?.createMessageComponentCollector({
// 								componentType: ComponentType.RoleSelect,
// 								filter: (i) => i.user.id === executor.id,
// 								time: 300_000,
// 							});
// 						// Collector exists for 5 minutes

// 						selectCollector?.on(`collect`, async (i) => {
// 							if (i.customId === `moderatorRoles`) {
// 								!i.values
// 									? await i
// 											.reply({
// 												content: `✅ All roles have been removed from the list of moderator roles.`,
// 												flags: "Ephemeral",
// 											})
// 											.then(() => {
// 												return;
// 											})
// 									: serverConfig?.set(`moderation.moderatorRoles`, i.values);
// 								await serverConfig?.save();
// 								await i.reply({
// 									content: `✅ Changes succesfully saved.`,
// 									flags: "Ephemeral",
// 								});
// 							} else if (i.customId === "adminRoles") {
// 								!i.values
// 									? await i
// 											.reply({
// 												content: `✅ All roles have been removed from the list of admin roles.`,
// 												flags: "Ephemeral",
// 											})
// 											.then(() => {
// 												return;
// 											})
// 									: serverConfig?.set(`moderation.adminRoles`, i.values);
// 								await serverConfig?.save();
// 								await i.reply({
// 									content: `✅ Changes succesfully saved.`,
// 									flags: "Ephemeral",
// 								});
// 							}
// 						});
// 				}
// 			case null:
// 				switch (command) {
// 					case "tickets":
// 						const loggedTicketCategory = [
// 							serverConfig?.tickets.categoryId,
// 						] as string[];
// 						const loggedTicketArchiveChannel = [
// 							serverConfig?.tickets.archive,
// 						] as string[];
// 						enablerToggle = new ButtonBuilder().setCustomId("EnablerToggle");
// 						serverConfig?.tickets.enabled === true
// 							? enablerToggle.setStyle(ButtonStyle.Success).setLabel(`Enabled`)
// 							: enablerToggle.setStyle(ButtonStyle.Danger).setLabel(`Disabled`);
// 						const ticketCategorySelector = new ChannelSelectMenuBuilder()
// 							.setCustomId(`TicketCategory`)
// 							.addChannelTypes(ChannelType.GuildCategory)
// 							.setDefaultChannels(loggedTicketCategory ?? undefined)
// 							.setMinValues(0)
// 							.setMaxValues(1)
// 							.setPlaceholder(`Channel Category for Tickets`);
// 						const ticketArchiveChannelSelector = new ChannelSelectMenuBuilder()
// 							.addChannelTypes(ChannelType.GuildText)
// 							.setCustomId(`TicketArchiveChannel`)
// 							.setDefaultChannels(loggedTicketArchiveChannel ?? undefined)
// 							.setMinValues(0)
// 							.setMaxValues(1)
// 							.setPlaceholder(`Ticket Archive Channel`);
// 						const ticketOpenerButton = new ButtonBuilder()
// 							.setLabel(`Set Opening Message`)
// 							.setStyle(ButtonStyle.Secondary)
// 							.setCustomId(`TicketOpeningMessage`);

// 						const ticketCategoryRow =
// 							new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
// 								ticketCategorySelector
// 							);
// 						const ticketArchiveRow =
// 							new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
// 								ticketArchiveChannelSelector
// 							);

// 						buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
// 							enablerToggle,
// 							ticketOpenerButton,
// 						]);
// 						response = await interaction.reply({
// 							content: `You may configure the ticket system below:`,
// 							components: [ticketCategoryRow, ticketArchiveRow, buttonRow],
// 							withResponse: true,
// 						});

// 						selectCollector =
// 							response.resource?.message?.createMessageComponentCollector({
// 								componentType: ComponentType.ChannelSelect,
// 								filter: (i) => i.user.id === executor.id,
// 								time: 300_000,
// 							});
// 						buttonCollector =
// 							response.resource?.message?.createMessageComponentCollector({
// 								componentType: ComponentType.Button,
// 								filter: (i) => i.user.id === executor.id,
// 								time: 300_000,
// 							});
// 						buttonCollector?.on(`collect`, async (i) => {
// 							if (i.customId === "EnablerToggle") {
// 								newActionRows = updateComponent<ButtonBuilder>(
// 									i,
// 									(button) =>
// 										button.setStyle(
// 											button.data.style === ButtonStyle.Danger
// 												? ButtonStyle.Success
// 												: ButtonStyle.Danger
// 										) &&
// 										button.setLabel(
// 											button.data.style === ButtonStyle.Danger
// 												? "Disabled"
// 												: "Enabled"
// 										)
// 								);
// 								serverConfig?.set(
// 									`tickets.enabled`,
// 									i.component.style === ButtonStyle.Danger ? true : false
// 								);
// 								await serverConfig?.save();
// 								await i.update({
// 									content: i.message.content,
// 									components: newActionRows,
// 								});
// 							} else {
// 								const ticketOpenerModal = new ModalBuilder()
// 									.setCustomId(`TicketOpeningMessage`)
// 									.setTitle(`Set Ticket Opening Message`);

// 								const ticketOpenerInput = new TextInputBuilder()
// 									.setLabel(`Opening Message`)
// 									.setRequired(true)
// 									.setValue(serverConfig?.tickets.openingMessage as string)
// 									.setMaxLength(2000)
// 									.setStyle(TextInputStyle.Paragraph)
// 									.setCustomId(`TicketOpeningMessageInput`);

// 								const ticketOpening =
// 									new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
// 										ticketOpenerInput
// 									);
// 								ticketOpenerModal.addComponents(ticketOpening);

// 								await i.showModal(ticketOpenerModal);
// 								return;
// 							}
// 						});
// 						selectCollector?.on(`collect`, async (i) => {
// 							if (i.customId === `TicketArchiveChannel`) {
// 								serverConfig?.set(`tickets.archive`, i.values[0] ?? undefined);
// 								await serverConfig?.save();
// 								i.reply({
// 									content: `✅ Tickets will be archived in ${channelMention(
// 										i.values[0]
// 									)} upon closure`,
// 									flags: "Ephemeral",
// 								});
// 							} else if (i.customId === `TicketCategory`) {
// 								serverConfig?.set(
// 									`tickets.categoryId`,
// 									i.values[0] ?? undefined
// 								);
// 								await serverConfig?.save();
// 								i.reply({
// 									content: `✅ Ticket channels will be created under the ${channelMention(
// 										i.values[0]
// 									)} category`,
// 									flags: "Ephemeral",
// 								});
// 							}
// 						});
// 						return;
// 					case "starboard":
// 						let loggedStarboardChannel = [] as string[];

// 						if (serverConfig?.starboard.channel) {
// 							loggedStarboardChannel = [
// 								serverConfig.starboard.channel,
// 							] as string[];
// 						}
// 						enablerToggle = new ButtonBuilder().setCustomId(`EnablerToggle`);
// 						serverConfig?.starboard.enabled === true
// 							? enablerToggle.setStyle(ButtonStyle.Success).setLabel(`Enabled`)
// 							: enablerToggle.setStyle(ButtonStyle.Danger).setLabel(`Disabled`);
// 						const starboardChannelSelector = new ChannelSelectMenuBuilder()
// 							.setChannelTypes(ChannelType.GuildText)
// 							.setCustomId(`StarboardChannel`)
// 							.setMinValues(1)
// 							.setMaxValues(1)
// 							.setDefaultChannels(loggedStarboardChannel ?? null)
// 							.setPlaceholder(`Starboard Channel`);
// 						const setReactionEmojiButton = new ButtonBuilder()
// 							.setCustomId(`SetStarboardReaction`)
// 							.setLabel(`| Set Reaction Emoji`)
// 							.setEmoji(serverConfig?.starboard.reactionEmoji as string)
// 							.setStyle(ButtonStyle.Secondary);
// 						const setReactionCountButton = new ButtonBuilder()
// 							.setCustomId(`SetMinStarboardReactionCount`)
// 							.setStyle(ButtonStyle.Secondary)
// 							.setLabel(
// 								`${serverConfig?.starboard.reactionCount} | Set Min Reaction Count`
// 							);

// 						buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
// 							enablerToggle,
// 							setReactionEmojiButton,
// 							setReactionCountButton
// 						);
// 						const starboardChannelRow =
// 							new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
// 								starboardChannelSelector
// 							);

// 						const initialStarboardResponse = await interaction.reply({
// 							content: `Configure the starboard settings below:`,
// 							components: [starboardChannelRow, buttonRow],
// 							withResponse: true,
// 						});

// 						buttonCollector =
// 							initialStarboardResponse.resource?.message?.createMessageComponentCollector(
// 								{
// 									componentType: ComponentType.Button,
// 									filter: (i) => i.user.id === executor.id,
// 									time: 300_000,
// 								}
// 							);
// 						selectCollector =
// 							initialStarboardResponse.resource?.message?.createMessageComponentCollector(
// 								{
// 									componentType: ComponentType.ChannelSelect,
// 									filter: (i) => i.user.id === executor.id,
// 									time: 300_000,
// 								}
// 							);

// 						buttonCollector?.on(`collect`, async (i) => {
// 							switch (i.customId) {
// 								case "EnablerToggle":
// 									newActionRows = updateComponent<ButtonBuilder>(
// 										i,
// 										(button) =>
// 											button.setStyle(
// 												button.data.style === ButtonStyle.Danger
// 													? ButtonStyle.Success
// 													: ButtonStyle.Danger
// 											) &&
// 											button.setLabel(
// 												button.data.style === ButtonStyle.Danger
// 													? "Disabled"
// 													: "Enabled"
// 											)
// 									);
// 									serverConfig?.set(
// 										`starboard.enabled`,
// 										i.component.style === ButtonStyle.Danger ? true : false
// 									);
// 									await serverConfig?.save();
// 									await i.update({
// 										content: i.message.content,
// 										components: newActionRows,
// 									});
// 									return;

// 								case "SetStarboardReaction":
// 									const reactionPrompt = await i.reply({
// 										content: `Please react this message with the emoji you want to use to trigger the starboard. If a custom emoji is used, it must belong to this server.`,
// 										withResponse: true,
// 									});
// 									const reactionEmojiCollector =
// 										reactionPrompt.resource?.message?.createReactionCollector({
// 											filter: (reaction, user) => {
// 												return user.id === executor.id;
// 											},
// 											time: 120_000,
// 										});
// 									let reactionEmoji: string;
// 									reactionEmojiCollector?.on("collect", async (r) => {
// 										const channel = r.message.channel as TextChannel;
// 										reactionEmoji = r.emoji.toString();

// 										if (
// 											!r.emoji.createdTimestamp ||
// 											r.message.guild?.emojis.cache.find(
// 												(emoji) => emoji.identifier === r.emoji.identifier
// 											)
// 										) {
// 											serverConfig?.set(
// 												`starboard.reactionEmoji`,
// 												r.emoji.toString()
// 											);
// 											await serverConfig?.save();
// 											const confirmation = await channel.send({
// 												content: `${r.emoji} is now set as the starboard reaction emoji`,
// 											});
// 											newActionRows = updateComponent<ButtonBuilder>(
// 												i,
// 												(button) => button.setEmoji(reactionEmoji)
// 											);
// 											initialStarboardResponse.resource?.message?.edit({
// 												content:
// 													initialStarboardResponse.resource.message.content,
// 												components: newActionRows,
// 											});
// 											setTimeout(async () => {
// 												await confirmation.delete();
// 												reactionEmojiCollector.stop(`Received valid input`);
// 											}, 5000);
// 										} else {
// 											channel.send(
// 												`❌ I don't have access to that emoji, please use a different emoji`
// 											);
// 											return;
// 										}
// 									});
// 									reactionEmojiCollector?.on("end", async () => {
// 										reactionPrompt.resource?.message?.delete();
// 									});
// 								case "SetMinStarboardReactionCount":
// 									const minReactionCountPrompt = await i.reply({
// 										content: `Please send a message containing an integer number (ex. 5)`,
// 									});
// 									const minReactionCountInput = new MessageCollector(
// 										i.channel as TextBasedChannel,
// 										{
// 											filter: (m) => m.author.id === executor.id,
// 											time: 120_000,
// 										}
// 									);

// 									minReactionCountInput.on("collect", async (m) => {
// 										const regexFilter = new RegExp(/^\d+$/g); // Filter checks if message sent only contains digits. No whitespace or other characters.

// 										if (regexFilter.test(m.content)) {
// 											const minReactionCount = parseInt(m.content);
// 											serverConfig?.set(
// 												`starboard.reactionCount`,
// 												minReactionCount
// 											);
// 											await serverConfig?.save();
// 											newActionRows = updateComponent<ButtonBuilder>(
// 												i,
// 												(button) =>
// 													button.setLabel(
// 														`${m.content} | Set Min Reaction Count`
// 													)
// 											);
// 											await i.editReply({
// 												content: i.message.content,
// 												components: newActionRows,
// 											});

// 											const confirmation = await (
// 												m.channel as BaseGuildTextChannel
// 											).send({
// 												content: `✅ ${minReactionCount} reaction(s) are now required for a message to be posted in the starboard channel`,
// 											});
// 											await m.delete();
// 											minReactionCountInput.stop();
// 											setTimeout(() => {
// 												confirmation.delete();
// 											}, 5000);

// 											return;
// 										} else {
// 											const reply = await m.reply({
// 												content: `❌ Invalid input. Please try again and ensure that no letters, special characters, or spaces are present`,
// 											});
// 											setTimeout(() => {
// 												reply.delete();
// 											}, 2000);
// 											return;
// 										}
// 									});
// 							}
// 						});
// 						selectCollector?.on(`collect`, async (i) => {
// 							serverConfig?.set(`starboard.channel`, i.values[0]);
// 							await serverConfig?.save();
// 							i.reply({
// 								content: `${channelMention(
// 									i.values[0]
// 								)} has been set as the starboard channel`,
// 								flags: ["Ephemeral"],
// 							});
// 							return;
// 						});
// 					case "join-message":
// 						let loggedWelcomeChannel = [] as string[];
// 						if (serverConfig?.welcome.channel) {
// 							loggedWelcomeChannel = [serverConfig.welcome.channel] as string[];
// 						}
// 						enablerToggle = new ButtonBuilder().setCustomId(`EnablerToggle`);
// 						serverConfig?.welcome.enabled === true
// 							? enablerToggle.setStyle(ButtonStyle.Success).setLabel(`Enabled`)
// 							: enablerToggle.setStyle(ButtonStyle.Danger).setLabel(`Disabled`);

// 						const welcomeChannelSelector = new ChannelSelectMenuBuilder()
// 							.setChannelTypes(ChannelType.GuildText)
// 							.setCustomId(`WelcomeChannelSelector`)
// 							.setDefaultChannels(loggedWelcomeChannel)
// 							.setMinValues(1)
// 							.setMaxValues(1)
// 							.setPlaceholder(`Welcome Channel`);
// 						const setWelcomeMessageButton = new ButtonBuilder()
// 							.setCustomId(`SetWelcomeMessage`)
// 							.setStyle(ButtonStyle.Secondary)
// 							.setLabel(`Set Welcome Message`);
// 						const setWelcomeAttachmentButton = new ButtonBuilder()
// 							.setCustomId(`SetWelcomeAttachment`)
// 							.setStyle(ButtonStyle.Secondary)
// 							.setLabel(`Set Message Attachment`)
// 							.setDisabled(true);

// 						const welcomeChannelRow =
// 							new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
// 								welcomeChannelSelector
// 							);
// 						buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
// 							enablerToggle,
// 							setWelcomeMessageButton,
// 							setWelcomeAttachmentButton,
// 						]);

// 						response = await interaction.reply({
// 							content: `Configure welcome message properties below:`,
// 							components: [welcomeChannelRow, buttonRow],
// 							withResponse: true,
// 						});

// 						buttonCollector =
// 							response.resource?.message?.createMessageComponentCollector({
// 								componentType: ComponentType.Button,
// 								filter: (i) => i.user.id === executor.id,
// 								time: 300_000,
// 							});
// 						selectCollector =
// 							response.resource?.message?.createMessageComponentCollector({
// 								componentType: ComponentType.ChannelSelect,
// 								filter: (i) => i.user.id === executor.id,
// 								time: 300_000,
// 							});

// 						buttonCollector?.on(`collect`, async (i) => {
// 							switch (i.customId) {
// 								case "EnablerToggle":
// 									newActionRows = updateComponent<ButtonBuilder>(
// 										i,
// 										(button) =>
// 											button.setStyle(
// 												button.data.style === ButtonStyle.Danger
// 													? ButtonStyle.Success
// 													: ButtonStyle.Danger
// 											) &&
// 											button.setLabel(
// 												button.data.style === ButtonStyle.Danger
// 													? "Disabled"
// 													: "Enabled"
// 											)
// 									);
// 									serverConfig?.set(
// 										`welcome.enabled`,
// 										i.component.style === ButtonStyle.Danger ? true : false
// 									);
// 									await serverConfig?.save();
// 									await i.update({
// 										content: i.message.content,
// 										components: newActionRows,
// 									});
// 									return;
// 								case "SetWelcomeMessage":
// 									const setWelcomeMessageModal = new ModalBuilder()
// 										.setTitle(`Set Welcome Message`)
// 										.setCustomId(`WelcomeMessageModal`);

// 									const welcomeMessageInput = new TextInputBuilder()
// 										.setCustomId(`WelcomeMessageInput`)
// 										.setLabel(`Welcome Message`)
// 										.setRequired(true)
// 										.setStyle(TextInputStyle.Paragraph)
// 										.setMaxLength(2000)
// 										.setValue(serverConfig?.welcome.message as string);
// 									const welcomeMessageInputRow =
// 										new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
// 											welcomeMessageInput
// 										);

// 									setWelcomeMessageModal.addComponents(welcomeMessageInputRow);

// 									await i.showModal(setWelcomeMessageModal);
// 							}
// 						});
// 						selectCollector?.on(`collect`, async (i) => {
// 							serverConfig?.set(`welcome.channel`, i.values[0] ?? undefined);
// 							await serverConfig?.save();
// 							const confirmation = await i.reply({
// 								content: `✅ Welcome messages will be sent in ${channelMention(
// 									i.values[0]
// 								)} upon closure`,
// 								flags: "Ephemeral",
// 							});
// 							setTimeout(() => {
// 								confirmation.delete();
// 							}, 5000);
// 						});
// 						return;
// 					case "leave-message":
// 						let loggedGoodbyeChannel = [] as string[];
// 						if (serverConfig?.goodbye.channel) {
// 							loggedGoodbyeChannel = [serverConfig.goodbye.channel] as string[];
// 						}
// 						enablerToggle = new ButtonBuilder().setCustomId(`EnablerToggle`);
// 						serverConfig?.goodbye.enabled === true
// 							? enablerToggle.setStyle(ButtonStyle.Success).setLabel(`Enabled`)
// 							: enablerToggle.setStyle(ButtonStyle.Danger).setLabel(`Disabled`);
// 						const goodbyeChannelSelector = new ChannelSelectMenuBuilder()
// 							.setChannelTypes(ChannelType.GuildText)
// 							.setCustomId(`GoodbyeChannelSelector`)
// 							.setDefaultChannels(loggedGoodbyeChannel)
// 							.setMinValues(1)
// 							.setMaxValues(1)
// 							.setPlaceholder(`Goodbye Channel`);
// 						const setGoodbyeMessageButton = new ButtonBuilder()
// 							.setCustomId(`SetGoodbyeMessage`)
// 							.setStyle(ButtonStyle.Secondary)
// 							.setLabel(`Set Goodbye Message`);
// 						const setGoodbyeAttachmentButton = new ButtonBuilder()
// 							.setCustomId(`SetGoodbyeAttachment`)
// 							.setStyle(ButtonStyle.Secondary)
// 							.setLabel(`Set Message Attachment`)
// 							.setDisabled(true);
// 						const goodbyeChannelRow =
// 							new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
// 								goodbyeChannelSelector
// 							);
// 						buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
// 							enablerToggle,
// 							setGoodbyeMessageButton,
// 							setGoodbyeAttachmentButton,
// 						]);
// 						response = await interaction.reply({
// 							content: `Configure goodbye message properties below:`,
// 							components: [goodbyeChannelRow, buttonRow],
// 							withResponse: true,
// 						});

// 						buttonCollector =
// 							response.resource?.message?.createMessageComponentCollector({
// 								componentType: ComponentType.Button,
// 								filter: (i) => i.user.id === executor.id,
// 								time: 300_000,
// 							});
// 						const goodbyeChannelCollector =
// 							response.resource?.message?.createMessageComponentCollector({
// 								componentType: ComponentType.ChannelSelect,
// 								filter: (i) => i.user.id === executor.id,
// 								time: 300_000,
// 							});

// 						buttonCollector?.on("collect", async (i) => {
// 							switch (i.customId) {
// 								case "EnablerToggle":
// 									newActionRows = updateComponent<ButtonBuilder>(
// 										i,
// 										(button) =>
// 											button.setStyle(
// 												button.data.style === ButtonStyle.Danger
// 													? ButtonStyle.Success
// 													: ButtonStyle.Danger
// 											) &&
// 											button.setLabel(
// 												button.data.style === ButtonStyle.Danger
// 													? "Disabled"
// 													: "Enabled"
// 											)
// 									);
// 									serverConfig?.set(
// 										`goodbye.enabled`,
// 										i.component.style === ButtonStyle.Danger ? true : false
// 									);
// 									await serverConfig?.save();
// 									await i.update({
// 										content: i.message.content,
// 										components: newActionRows,
// 									});
// 									return;
// 								case "SetGoodbyeMessage":
// 									const setGoodbyeMessageModal = new ModalBuilder()
// 										.setTitle(`Set Goodbye Message`)
// 										.setCustomId(`GoodbyeMessageModal`);

// 									const goodbyeMessageInput = new TextInputBuilder()
// 										.setCustomId(`GoodbyeMessageInput`)
// 										.setLabel(`Goodbye Message`)
// 										.setRequired(true)
// 										.setStyle(TextInputStyle.Paragraph)
// 										.setMaxLength(2000)
// 										.setValue(serverConfig?.welcome.message as string);
// 									const goodbyeMessageInputRow =
// 										new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
// 											goodbyeMessageInput
// 										);

// 									setGoodbyeMessageModal.addComponents(goodbyeMessageInputRow);

// 									await i.showModal(setGoodbyeMessageModal);
// 									return;
// 							}
// 						});
// 						goodbyeChannelCollector?.on(`collect`, async (i) => {
// 							serverConfig?.set(`goodbye.channel`, i.values[0]);
// 							await serverConfig?.save();
// 							const confirmation = await i.reply({
// 								content: `✅ Goodbye messages will be sent in ${channelMention(
// 									i.values[0]
// 								)}`,
// 								flags: "Ephemeral",
// 							});

// 							setTimeout(() => {
// 								confirmation.delete();
// 							}, 5000);
// 						});
// 						return;
// 					case "sticky-message":
// 						async function selectStickyChannelMenu<T extends Interaction>(
// 							interaction: T
// 						): Promise<void> {
// 							const channelSelector = new ChannelSelectMenuBuilder()
// 								.addChannelTypes(ChannelType.GuildText)
// 								.setPlaceholder(`Channel`)
// 								.setCustomId(`ChannelSelector`);
// 							const channelSelectorActionRow =
// 								new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
// 									channelSelector
// 								);
// 							const messageContent = `Select the channel you want to create/edit/delete sticky messages in`;
// 							let response;
// 							if (interaction.isChatInputCommand()) {
// 								response = await interaction.reply({
// 									content: messageContent,
// 									components: [channelSelectorActionRow],
// 								});
// 							} else if (interaction.isButton()) {
// 								response = await interaction.update({
// 									content: messageContent,
// 									components: [channelSelectorActionRow],
// 								});
// 							}
// 							response
// 								?.awaitMessageComponent({
// 									componentType: ComponentType.ChannelSelect,
// 									filter: (i) => i.user.id === interaction.user.id,
// 									time: 120_000,
// 								})
// 								.then((i) => {
// 									selectStickySettingsType(i, i.values[0]);
// 								})
// 								.catch(() => {
// 									if (
// 										interaction.isButton() ||
// 										interaction.isChatInputCommand()
// 									) {
// 										interaction.followUp({
// 											content: `Process timed out. Please run the command again`,
// 											flags: [`Ephemeral`],
// 										});
// 									}
// 								});
// 						}

// 						async function selectStickySettingsType<
// 							T extends MessageComponentInteraction
// 						>(interaction: T, channelId: string): Promise<void> {
// 							const prevPageButton = new ButtonBuilder()
// 								.setCustomId(`PreviousStickySettingsPage`)
// 								.setLabel("Go Back")
// 								.setEmoji("⬅️")
// 								.setStyle(ButtonStyle.Primary);
// 							const createNewStickyButton = new ButtonBuilder()
// 								.setCustomId(`CreateNewSticky`)
// 								.setLabel(`Create`)
// 								.setStyle(ButtonStyle.Secondary);
// 							const deleteStickyButton = new ButtonBuilder()
// 								.setCustomId(`DeleteExistingSticky`)
// 								.setLabel(`Delete`)
// 								.setStyle(ButtonStyle.Secondary);
// 							const editStickyButton = new ButtonBuilder()
// 								.setCustomId(`EditExistingSticky`)
// 								.setLabel(`Edit`)
// 								.setStyle(ButtonStyle.Secondary);
// 							const Page2ButtonRow =
// 								new ActionRowBuilder<ButtonBuilder>().addComponents([
// 									prevPageButton,
// 									createNewStickyButton,
// 									editStickyButton,
// 									deleteStickyButton,
// 								]);
// 							response = await interaction.update({
// 								content: `Use the buttons below to create/edit/delete sticky messages in ${channelMention(
// 									channelId as string
// 								)}. If you selected the wrong channel, use the 'go back' button to redo your selection.`,
// 								components: [Page2ButtonRow],
// 								withResponse: true,
// 							});
// 							response.resource?.message
// 								?.awaitMessageComponent({
// 									componentType: ComponentType.Button,
// 									filter: (i) => i.user.id === executor.id,
// 									time: 120_000,
// 								})
// 								.then((i) => {
// 									switch (i.customId) {
// 										case "PreviousStickySettingsPage":
// 											selectStickyChannelMenu(i);
// 											return;
// 										case "CreateNewSticky":
// 											if (
// 												serverConfig?.stickyMessages.filter(
// 													(entry) => entry.channelId
// 												).length === 4
// 											) {
// 												i.reply({
// 													content: `❌ Reached maximum number of sticky messages in ${channelMention(
// 														channelId
// 													)}.\nEdit or delete a sticky before creating another`,
// 												});
// 											} else {
// 												createStickyMessageMenu(i, channelId);
// 											}
// 											return;
// 										case "EditExistingSticky":
// 											selectStickyMessageToEditMenu(i, channelId);
// 											return;
// 										case "DeleteExistingSticky":
// 											selectStickyMessageToDeleteMenu(i, channelId);
// 									}
// 								})
// 								.catch((error) => {
// 									console.log(error);
// 									interaction.followUp({
// 										content: `Process timed out. Please run the command again`,
// 										flags: "Ephemeral",
// 									});
// 									return;
// 								});
// 						}
// 						async function selectStickyMessageToDeleteMenu(
// 							interaction: ButtonInteraction,
// 							channelId: string
// 						) {
// 							if (
// 								!serverConfig?.stickyMessages.find(
// 									(entry) => entry.channelId === channelId
// 								)
// 							) {
// 								interaction.reply({
// 									content: `There are no sticky messages created inside ${channelMention(
// 										channelId
// 									)}`,
// 									flags: "Ephemeral",
// 								});
// 								return;
// 							} else {
// 								const stickies = serverConfig?.stickyMessages.filter(
// 									(entry) => entry.channelId === channelId
// 								);
// 								const stickyMessageSelect = new StringSelectMenuBuilder()
// 									.setCustomId(`StickyMessageSelector`)
// 									.setPlaceholder(`Sticky Message`)
// 									.setMaxValues(stickies.length)
// 									.setMinValues(1);
// 								stickies.forEach((entry) => {
// 									stickyMessageSelect.addOptions(
// 										new StringSelectMenuOptionBuilder()
// 											.setLabel(entry.customId as string)
// 											.setValue(entry._id.toString())
// 											.setDescription(
// 												`The sticky message with the nickname of ${entry.customId}`
// 											)
// 									);
// 								});

// 								const prevPageButton = new ButtonBuilder()
// 									.setCustomId(`PrevPage`)
// 									.setLabel(`Go Back`)
// 									.setEmoji("⬅️")
// 									.setStyle(ButtonStyle.Primary);
// 								const prevPageRow =
// 									new ActionRowBuilder<ButtonBuilder>().addComponents(
// 										prevPageButton
// 									);
// 								const stickyMessageSelectRow =
// 									new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
// 										stickyMessageSelect
// 									);
// 								const yes = new ButtonBuilder()
// 									.setCustomId(`Yes`)
// 									.setLabel(`Yes`)
// 									.setStyle(ButtonStyle.Success);
// 								const no = new ButtonBuilder()
// 									.setCustomId(`No`)
// 									.setLabel(`No`)
// 									.setStyle(ButtonStyle.Danger);
// 								const binaryOptionRow =
// 									new ActionRowBuilder<ButtonBuilder>().addComponents([
// 										no,
// 										yes,
// 									]);

// 								const response = await interaction.update({
// 									content: `Select the sticky message you want to delete below`,
// 									components: [stickyMessageSelectRow, prevPageRow],
// 								});
// 								response
// 									.awaitMessageComponent({
// 										filter: (i) => i.user.id === interaction.user.id,
// 										time: 180_000,
// 									})
// 									.then(async (i) => {
// 										if (i.isStringSelectMenu()) {
// 											i.values.forEach((value) => {
// 												serverConfig.stickyMessages.remove({
// 													_id: value,
// 												});
// 											});

// 											serverConfig.save();
// 											const confirmation = await i.reply({
// 												content: `✅ Sticky message(s) deleted!\nAre you finished using the sticky message settings menus?`,
// 												components: [binaryOptionRow],
// 												withResponse: true,
// 											});
// 											confirmation.resource?.message
// 												?.awaitMessageComponent({
// 													componentType: ComponentType.Button,
// 													filter: (i) => i.user.id === interaction.user.id,
// 													time: 120_000,
// 												})
// 												.then(async (m) => {
// 													switch (m.customId) {
// 														case "Yes":
// 															m.reply({
// 																content: `Process Terminated.`,
// 																flags: "Ephemeral",
// 															});
// 															await response.delete();
// 															await confirmation.resource?.message?.delete();

// 															return;
// 														case "No":
// 															selectStickyChannelMenu(m);
// 															return;
// 													}
// 												})
// 												.catch(async () => {
// 													await i.followUp({
// 														content: `Process has been terminated. If you didn't choose an option, process has timed out.`,
// 														flags: "Ephemeral",
// 													});
// 												});
// 											return;
// 										} else if (i.isButton()) {
// 											switch (i.customId) {
// 												case "PrevPage":
// 													selectStickySettingsType(i, channelId);
// 													return;
// 											}
// 										}
// 									});

// 								return;
// 							}
// 						}
// 						async function selectStickyMessageToEditMenu(
// 							interaction: ButtonInteraction,
// 							channelId: string
// 						): Promise<void> {
// 							if (
// 								!serverConfig?.stickyMessages.find(
// 									(entry) => entry.channelId === channelId
// 								)
// 							) {
// 								interaction.reply({
// 									content: `There are no sticky messages created inside ${channelMention(
// 										channelId
// 									)}`,
// 									flags: "Ephemeral",
// 								});
// 								return;
// 							} else {
// 								const stickyMessageSelect = new StringSelectMenuBuilder()
// 									.setCustomId(`StickyMessageSelector`)
// 									.setPlaceholder(`Sticky Message`)
// 									.setMaxValues(1)
// 									.setMinValues(1);
// 								serverConfig?.stickyMessages
// 									.filter((entry) => entry.channelId === channelId)
// 									.forEach((entry) => {
// 										stickyMessageSelect.addOptions(
// 											new StringSelectMenuOptionBuilder()
// 												.setLabel(entry.customId as string)
// 												.setValue(entry?.customId as string)
// 												.setDescription(
// 													`The sticky message with the nickname of ${entry.customId}`
// 												)
// 										);
// 									});
// 								const prevPageButton = new ButtonBuilder()
// 									.setCustomId(`PrevPage`)
// 									.setLabel(`Go Back`)
// 									.setEmoji("⬅️")
// 									.setStyle(ButtonStyle.Primary);
// 								const prevPageRow =
// 									new ActionRowBuilder<ButtonBuilder>().addComponents(
// 										prevPageButton
// 									);
// 								const stickyMessageSelectRow =
// 									new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
// 										stickyMessageSelect
// 									);
// 								const response = await interaction.update({
// 									content: `Select the sticky message you want to edit below`,
// 									components: [stickyMessageSelectRow, prevPageRow],
// 								});
// 								response
// 									.awaitMessageComponent({
// 										filter: (i) => i.user.id === interaction.user.id,
// 										time: 180_000,
// 									})
// 									.then(async (i) => {
// 										if (i.isStringSelectMenu()) {
// 											editStickyMessageMenu(i, i.values[0], channelId);
// 										} else if (i.isButton()) {
// 											switch (i.customId) {
// 												case "PrevPage":
// 													selectStickySettingsType(i, channelId);
// 													return;
// 											}
// 										}
// 									});

// 								return;
// 							}
// 						}
// 						async function editStickyMessageMenu<
// 							T extends MessageComponentInteraction
// 						>(
// 							interaction: T,
// 							stickyCustomId: string,
// 							channelId: string
// 						): Promise<void> {
// 							const prevPageButton = new ButtonBuilder()
// 								.setCustomId(`PreviousStickySettingsPage`)
// 								.setLabel("Go Back")
// 								.setEmoji("⬅️")
// 								.setStyle(ButtonStyle.Primary);
// 							const setStickyContentButton = new ButtonBuilder()
// 								.setCustomId(`SetStickyContentButton`)
// 								.setLabel(`Set Content`)
// 								.setStyle(ButtonStyle.Secondary);
// 							const setStickyTitleButton = new ButtonBuilder()
// 								.setCustomId(`SetStickyTitleButton`)
// 								.setLabel(`Set Title`)
// 								.setStyle(ButtonStyle.Secondary);
// 							const setStickyImageButton = new ButtonBuilder()
// 								.setCustomId(`SetStickyImageButton`)
// 								.setLabel(`Set Image`)
// 								.setStyle(ButtonStyle.Secondary)
// 								.setDisabled(true);
// 							const previewStickyMessageButton = new ButtonBuilder()
// 								.setCustomId(`PreviewSticky`)
// 								.setLabel(`Preview`)
// 								.setStyle(ButtonStyle.Primary);
// 							const saveStickyButton = new ButtonBuilder()
// 								.setCustomId(`SaveStickyButton`)
// 								.setLabel(`Submit Sticky`)
// 								.setStyle(ButtonStyle.Success);
// 							const setStickyColourButton = new ButtonBuilder()
// 								.setCustomId(`SetStickyColourButton`)
// 								.setLabel(`Set Colour`)
// 								.setStyle(ButtonStyle.Secondary);

// 							const yes = new ButtonBuilder()
// 								.setCustomId(`Yes`)
// 								.setLabel(`Yes`)
// 								.setStyle(ButtonStyle.Success);
// 							const no = new ButtonBuilder()
// 								.setCustomId(`No`)
// 								.setLabel(`No`)
// 								.setStyle(ButtonStyle.Danger);
// 							const binaryOptionRow =
// 								new ActionRowBuilder<ButtonBuilder>().addComponents([no, yes]);

// 							const existingSticky = serverConfig?.stickyMessages
// 								.find(
// 									(entry) =>
// 										entry.channelId === channelId &&
// 										entry.customId === stickyCustomId
// 								)
// 								?.toJSON();
// 							const sticky = new StickyMessage({
// 								title: (existingSticky?.messageTitle as string) ?? null,
// 								content: existingSticky?.messageContent as string,
// 								attachment: existingSticky?.stickyAttachment as string,
// 								colour: existingSticky?.stickyColour as ColorResolvable,
// 							});

// 							sticky.setContent(existingSticky?.messageContent as string);
// 							sticky.setTitle(existingSticky?.messageTitle as string);
// 							sticky.setColour(existingSticky?.stickyColour as string);
// 							sticky.setCustomId(existingSticky?.customId as string);
// 							sticky.setAttachment(existingSticky?.stickyAttachment as string);
// 							const stickyComponentsRow =
// 								new ActionRowBuilder<ButtonBuilder>().addComponents([
// 									setStickyTitleButton,
// 									setStickyContentButton,
// 									setStickyImageButton,
// 									setStickyColourButton,
// 								]);
// 							const secondStickyComponentsRow =
// 								new ActionRowBuilder<ButtonBuilder>().addComponents([
// 									prevPageButton,
// 									previewStickyMessageButton,
// 									saveStickyButton,
// 								]);
// 							const response = await interaction.update({
// 								content: `Use the buttons below to edit the sticky message. When you are finished, press the 'submit' button to finalize your changes.`,
// 								components: [stickyComponentsRow, secondStickyComponentsRow],
// 								withResponse: true,
// 							});

// 							const buttonCollector =
// 								response.resource?.message?.createMessageComponentCollector({
// 									componentType: ComponentType.Button,
// 									filter: (i) => i.user.id === interaction.user.id,
// 									time: 600_000,
// 								});
// 							buttonCollector?.on(`collect`, async (i) => {
// 								switch (i.customId) {
// 									case "PreviousStickySettingsPage":
// 										buttonCollector.stop();
// 										selectStickyMessageToEditMenu(i, channelId);
// 										return;
// 									case "SetStickyTitleButton":
// 										const setStickyTitlePrompt = await i.reply(
// 											`Please send a message containing the new title of the sticky message. The title cannot be longer than 256 characters.`
// 										);
// 										const stickyTitleCollector = new MessageCollector(
// 											i.channel as TextBasedChannel,
// 											{
// 												filter: (i) => i.author.id === interaction.user.id,
// 												time: 120_000,
// 											}
// 										);

// 										stickyTitleCollector.on(`collect`, async (m) => {
// 											if (m.content.length > 256) {
// 												const reply = await m.reply(
// 													`❌ Title too long. It must be ${
// 														m.content.length - 256
// 													} chracters shorter`
// 												);
// 												stickyTitleCollector.resetTimer();
// 												setTimeout(async () => {
// 													m.delete();
// 													await reply.delete();
// 												}, 5000);
// 											} else {
// 												sticky.setTitle(m.content);
// 												stickyTitleCollector.stop(
// 													`Received valid sticky title`
// 												);
// 												const confirmation = await m.reply(
// 													`✅ Sticky title set`
// 												);
// 												buttonCollector.resetTimer();
// 												setTimeout(async () => {
// 													await setStickyTitlePrompt.delete();
// 													await m.delete();
// 													await confirmation.delete();
// 												}, 2000);
// 											}
// 										});
// 										return;
// 									case "SetStickyContentButton":
// 										const setStickyContentPrompt = await i.reply(
// 											`Please send a message containing the new content of the sticky message.`
// 										);
// 										const stickyContentCollector = new MessageCollector(
// 											i.channel as TextBasedChannel,
// 											{
// 												filter: (i) => i.author.id === interaction.user.id,
// 												time: 300_000,
// 											}
// 										);
// 										stickyContentCollector.on(`collect`, async (m) => {
// 											sticky.setContent(m.content);
// 											stickyContentCollector.stop();
// 											buttonCollector.resetTimer();
// 											const confirmation = await m.reply(
// 												`✅ Sticky content set`
// 											);
// 											setTimeout(async () => {
// 												await setStickyContentPrompt.delete();
// 												await m.delete();
// 												await confirmation.delete();
// 											}, 2000);
// 										});
// 										return;
// 									case "SetStickyColourButton":
// 										const setStickyColourPrompt = await i.reply(
// 											`Please send a message containing the hexcode of the colour you'd like to use. (Format: ######)`
// 										);
// 										const stickyColourCollector = new MessageCollector(
// 											i.channel as TextBasedChannel,
// 											{
// 												filter: (i) => i.author.id === interaction.user.id,
// 												time: 120_000,
// 											}
// 										);
// 										stickyColourCollector.on(`collect`, async (m) => {
// 											if (m.content.match(/^([a-f0-9]{6,6}$)/gi)) {
// 												sticky.setColour(m.content);
// 												const confirmation = await m.reply(
// 													`✅ Colour set succesfully!`
// 												);
// 												stickyColourCollector.stop();
// 												buttonCollector.resetTimer();

// 												setTimeout(async () => {
// 													await setStickyColourPrompt.delete();
// 													await m.delete();
// 													await confirmation.delete();
// 												}, 2000);
// 											} else {
// 												i.followUp({
// 													content: `❌ Invalid input format. Please input a valid hexcode (Ex. FF4D55)`,
// 													flags: "Ephemeral",
// 												});
// 												return;
// 											}
// 										});
// 										return;
// 									case "PreviewSticky":
// 										if (!sticky.getContent()) {
// 											await i.reply({
// 												content: `❌ Sticky content hasn't been set yet!`,
// 												flags: "Ephemeral",
// 											});
// 											return;
// 										} else {
// 											const embed = new EmbedBuilder()
// 												.setTitle(sticky.getTitle())
// 												.setDescription(sticky.getContent())
// 												.setImage(sticky.getAttachment())
// 												.setColor(sticky.getColour());
// 											await i.reply({
// 												embeds: [embed],
// 												flags: "Ephemeral",
// 												content: `Here is your sticky as it is currently set.`,
// 											});
// 											return;
// 										}
// 									case "SaveStickyButton":
// 										if (!sticky.getContent()) {
// 											await i.reply({
// 												content: `❌ Sticky content hasn't been set yet!`,
// 												flags: "Ephemeral",
// 											});
// 											return;
// 										} else {
// 											const stickyMessage = serverConfig?.stickyMessages.find(
// 												(entry) =>
// 													entry.customId === stickyCustomId &&
// 													entry.channelId === channelId
// 											);
// 											stickyMessage?.set({
// 												messageContent: sticky.getContent(),
// 												messageTitle: sticky.getTitle(),
// 												stickyAttachment: sticky.getAttachment(),
// 												stickyColour: sticky.getColour() as string,
// 											});
// 											await serverConfig?.save();
// 											const confirmation = await i.reply({
// 												content: `✅ Sticky message created! Are you finished using the sticky message settings menus?`,
// 												components: [binaryOptionRow],
// 												withResponse: true,
// 											});

// 											buttonCollector.stop();
// 											confirmation.resource?.message
// 												?.awaitMessageComponent({
// 													componentType: ComponentType.Button,
// 													filter: (i) => i.user.id === interaction.user.id,
// 													time: 120_000,
// 												})
// 												.then(async (m) => {
// 													switch (m.customId) {
// 														case "Yes":
// 															m.reply({
// 																content: `Process Terminated`,
// 																flags: "Ephemeral",
// 															});
// 															await confirmation.resource?.message?.delete();
// 															await response.resource?.message?.delete();

// 															return;
// 														case "No":
// 															selectStickyChannelMenu(m);
// 															return;
// 													}
// 												})
// 												.catch(async () => {
// 													await i.followUp({
// 														content: `Process has been terminated. If you didn't choose an option, process has timed out.`,
// 														flags: "Ephemeral",
// 													});
// 												});
// 											return;
// 										}
// 								}
// 							});
// 						}
// 						async function createStickyMessageMenu<
// 							T extends MessageComponentInteraction
// 						>(interaction: T, channelId: string): Promise<void> {
// 							const prevPageButton = new ButtonBuilder()
// 								.setCustomId(`PreviousStickySettingsPage`)
// 								.setLabel("Go Back")
// 								.setEmoji("⬅️")
// 								.setStyle(ButtonStyle.Primary);
// 							const setStickyContentButton = new ButtonBuilder()
// 								.setCustomId(`SetStickyContentButton`)
// 								.setLabel(`Set Content`)
// 								.setStyle(ButtonStyle.Secondary);
// 							const setStickyTitleButton = new ButtonBuilder()
// 								.setCustomId(`SetStickyTitleButton`)
// 								.setLabel(`Set Title`)
// 								.setStyle(ButtonStyle.Secondary);
// 							const setStickyImageButton = new ButtonBuilder()
// 								.setCustomId(`SetStickyImageButton`)
// 								.setLabel(`Set Image`)
// 								.setStyle(ButtonStyle.Secondary)
// 								.setDisabled(true);
// 							const setStickyCustomIdButton = new ButtonBuilder()
// 								.setCustomId(`SetStickyCustomIdButton`)
// 								.setLabel(`Set Custom ID`)
// 								.setStyle(ButtonStyle.Secondary);
// 							const previewStickyMessageButton = new ButtonBuilder()
// 								.setCustomId(`PreviewSticky`)
// 								.setLabel(`Preview`)
// 								.setStyle(ButtonStyle.Primary);
// 							const saveStickyButton = new ButtonBuilder()
// 								.setCustomId(`SaveStickyButton`)
// 								.setLabel(`Submit Sticky`)
// 								.setStyle(ButtonStyle.Success);
// 							const setStickyColourButton = new ButtonBuilder()
// 								.setCustomId(`SetStickyColourButton`)
// 								.setLabel(`Set Colour`)
// 								.setStyle(ButtonStyle.Secondary);

// 							const yes = new ButtonBuilder()
// 								.setCustomId(`Yes`)
// 								.setLabel(`Yes`)
// 								.setStyle(ButtonStyle.Success);
// 							const no = new ButtonBuilder()
// 								.setCustomId(`No`)
// 								.setLabel(`No`)
// 								.setStyle(ButtonStyle.Danger);
// 							const binaryOptionRow =
// 								new ActionRowBuilder<ButtonBuilder>().addComponents([no, yes]);

// 							const sticky = new StickyMessage();
// 							const stickyComponentsRow =
// 								new ActionRowBuilder<ButtonBuilder>().addComponents([
// 									setStickyTitleButton,
// 									setStickyContentButton,
// 									setStickyImageButton,
// 									setStickyColourButton,
// 									setStickyCustomIdButton,
// 								]);
// 							const secondStickyComponentsRow =
// 								new ActionRowBuilder<ButtonBuilder>().addComponents([
// 									prevPageButton,
// 									previewStickyMessageButton,
// 									saveStickyButton,
// 								]);

// 							const response = await interaction.update({
// 								content: `Use the buttons below to build your sticky message. When you are finished, press the 'submit' to create the sticky message`,
// 								components: [stickyComponentsRow, secondStickyComponentsRow],
// 								withResponse: true,
// 							});

// 							const buttonCollector =
// 								response.resource?.message?.createMessageComponentCollector({
// 									componentType: ComponentType.Button,
// 									filter: (i) => i.user.id === interaction.user.id,
// 									time: 600_000,
// 								});

// 							buttonCollector?.on(`collect`, async (i) => {
// 								switch (i.customId) {
// 									case "PreviousStickyPage":
// 										buttonCollector.stop();
// 										selectStickySettingsType(i, channelId);
// 										return;
// 									case "SetStickyColourButton":
// 										const setStickyColourPrompt = await i.reply(
// 											`Please send a message containing the hexcode of the colour you'd like to use. (Format: ######)`
// 										);
// 										const stickyColourCollector = new MessageCollector(
// 											i.channel as TextBasedChannel,
// 											{
// 												filter: (i) => i.author.id === interaction.user.id,
// 												time: 120_000,
// 											}
// 										);
// 										stickyColourCollector.on(`collect`, async (m) => {
// 											if (m.content.match(/^([a-f0-9]{6,6}$)/gi)) {
// 												sticky.setColour(m.content);
// 												const confirmation = await m.reply(
// 													`✅ Colour set succesfully!`
// 												);
// 												stickyColourCollector.stop();
// 												buttonCollector.resetTimer();

// 												setTimeout(async () => {
// 													await setStickyColourPrompt.delete();
// 													await m.delete();
// 													await confirmation.delete();
// 												}, 2000);
// 											} else {
// 												i.followUp({
// 													content: `❌ Invalid input format. Please input a valid hexcode (Ex. FF4D55)`,
// 													flags: "Ephemeral",
// 												});
// 												return;
// 											}
// 										});
// 										return;
// 									case "SetStickyTitleButton":
// 										const setStickyTitlePrompt = await i.reply(
// 											`Please send a message containing the title of your sticky message. The title cannot be longer than 256 characters.`
// 										);
// 										const stickyTitleCollector = new MessageCollector(
// 											i.channel as TextBasedChannel,
// 											{
// 												filter: (i) => i.author.id === interaction.user.id,
// 												time: 120_000,
// 											}
// 										);

// 										stickyTitleCollector.on(`collect`, async (m) => {
// 											if (m.content.length > 256) {
// 												const reply = await m.reply(
// 													`❌ Title too long. It must be ${
// 														m.content.length - 256
// 													} characters shorter`
// 												);
// 												stickyTitleCollector.resetTimer();
// 												setTimeout(() => {
// 													reply.delete();
// 												}, 5000);
// 											} else {
// 												sticky.setTitle(m.content);
// 												stickyTitleCollector.stop(
// 													`Recieved valid sticky title`
// 												);
// 												const confirmation = await m.reply(
// 													`✅ Sticky title set`
// 												);
// 												buttonCollector.resetTimer();
// 												setTimeout(async () => {
// 													await setStickyTitlePrompt.delete();
// 													await m.delete();
// 													await confirmation.delete();
// 												}, 2000);
// 											}
// 										});
// 										return;
// 									case "SetStickyContentButton":
// 										const setStickyContentPrompt = await i.reply(
// 											`Please send a message containing the content of your sticky message.`
// 										);
// 										const stickyContentCollector = new MessageCollector(
// 											i.channel as TextBasedChannel,
// 											{
// 												filter: (i) => i.author.id === interaction.user.id,
// 												time: 300_000,
// 											}
// 										);
// 										stickyContentCollector.on(`collect`, async (m) => {
// 											sticky.setContent(m.content);
// 											stickyContentCollector.stop();
// 											buttonCollector.resetTimer();
// 											const confirmation = await m.reply(
// 												`✅ Sticky content set`
// 											);
// 											setTimeout(async () => {
// 												await setStickyContentPrompt.delete();
// 												await m.delete();
// 												await confirmation.delete();
// 											}, 2000);
// 										});
// 										return;
// 									case "SetStickyCustomIdButton":
// 										const setStickyCustomIdPrompt = await i.reply(
// 											`Please send a mesage containing the nicknem of this new sticky message. The nickname must not exceed 26 characters. This will be used to differentiate between different sticky messages in the same channel.\n Select the nickname carefully as it is **PERMANENT**`
// 										);
// 										const stickyCustomIdCollector = new MessageCollector(
// 											i.channel as TextBasedChannel,
// 											{
// 												filter: (i) => i.author.id === interaction.user.id,
// 												time: 120_000,
// 											}
// 										);
// 										stickyCustomIdCollector.on(`collect`, async (m) => {
// 											if (m.content.length > 26) {
// 												await m.reply(
// 													`❌ Nickname too long. It must be ${
// 														m.content.length - 26
// 													} characters shorter`
// 												);
// 												return;
// 											} else if (
// 												serverConfig?.stickyMessages.find(
// 													(entry) => entry.customId === m.content.toLowerCase()
// 												)
// 											) {
// 												m.reply(
// 													`❌ A sticky message with the same nickname already exists. If you meant to edit the properties of that sticky, go back and use the 'edit' button instead`
// 												);
// 												return;
// 											} else {
// 												sticky.setCustomId(m.content.toLowerCase());
// 												stickyCustomIdCollector.stop();
// 												buttonCollector.resetTimer();
// 												const confirmation = await m.reply(`✅ Nickname set`);

// 												setTimeout(async () => {
// 													await setStickyCustomIdPrompt.delete();
// 													await m.delete();
// 													await confirmation.delete();
// 												}, 2000);
// 												return;
// 											}
// 										});
// 										return;
// 									case "PreviewSticky":
// 										if (!sticky.getContent()) {
// 											await i.reply({
// 												content: `❌ Sticky content hasn't been set yet!`,
// 												flags: "Ephemeral",
// 											});
// 											return;
// 										} else {
// 											const embed = new EmbedBuilder()
// 												.setTitle(sticky.getTitle())
// 												.setDescription(sticky.getContent())
// 												.setImage(sticky.getAttachment())
// 												.setColor(sticky.getColour());
// 											await i.reply({
// 												embeds: [embed],
// 												flags: "Ephemeral",
// 												content: `Here is your sticky as it is currently set.`,
// 											});
// 										}
// 										return;
// 									case "SaveStickyButton":
// 										if (!sticky.getContent()) {
// 											await i.reply({
// 												content: `❌ Sticky content hasn't been set yet!`,
// 												flags: "Ephemeral",
// 											});
// 											return;
// 										} else if (!sticky.getCustomId()) {
// 											await i.reply({
// 												content: `❌ Sticky nickname not set!`,
// 												flags: "Ephemeral",
// 											});
// 											return;
// 										} else {
// 											serverConfig?.stickyMessages.push({
// 												messageTitle: sticky.getTitle(),
// 												messageContent: sticky.getContent(),
// 												channelId: channelId,
// 												customId: sticky.getCustomId()?.toLowerCase(),
// 												stickyColour: sticky.getColour()?.toString(),
// 												stickyAttachment: sticky.getAttachment(),
// 											});
// 											await serverConfig?.save();
// 											const confirmation = await i.reply({
// 												content: `✅ Sticky message created! Are you finished using the sticky message settings menus?`,
// 												components: [binaryOptionRow],
// 												withResponse: true,
// 											});

// 											buttonCollector.stop();
// 											confirmation.resource?.message
// 												?.awaitMessageComponent({
// 													componentType: ComponentType.Button,
// 													filter: (i) => i.user.id === interaction.user.id,
// 													time: 120_000,
// 												})
// 												.then(async (m) => {
// 													switch (m.customId) {
// 														case "Yes":
// 															m.reply({
// 																content: `Process terminated.`,
// 																flags: "Ephemeral",
// 															});

// 															await response.resource?.message?.delete();
// 															await confirmation.resource?.message?.delete();

// 															return;
// 														case "No":
// 															selectStickyChannelMenu(m);
// 															return;
// 													}
// 												})
// 												.catch(async () => {
// 													await i.followUp({
// 														content: `Process has timed out.`,
// 														flags: "Ephemeral",
// 													});
// 												});
// 											return;
// 										}
// 								}
// 							});
// 						}

// 						selectStickyChannelMenu(interaction);
// 				}
// 		}
// 	} catch (error) {
// 		console.log(error);
// 	}
// }
