import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelSelectMenuBuilder,
	ChannelType,
	ComponentType,
	Guild,
	MessageComponentInteraction,
	MessageFlags,
	RoleSelectMenuBuilder,
	TextChannel,
} from "discord.js";
import ModerationConfig from "../../../models/ModerationConfig.js";
import { buildActionSettingsEmbed } from "../../../Util/BuildMethods.js";
import { ActionSettings } from "../../../Util/Interfaces.js";
import { MuteSettings } from "../../../Util/ServerConfigClasses.js";
import { initialModerationSettingsMenu } from "./InitialModerationSettingsMenu.js";
import {
	arraysEqual,
	sortRolesByHierarchy,
} from "../../../Util/ValidationHelpers.js";
import ms from "ms";
import { normalizeTimeUnit } from "../../../Util/NormalizeTimeUnits.js";
export async function muteSettingsMenu<T extends MessageComponentInteraction>(
	interaction: T
): Promise<void> {
	const config = await ModerationConfig.findOneAndUpdate(
		{ guildId: interaction.guildId },
		{ $setOnInsert: { guildId: interaction.guildId } },
		{ upsert: true, new: true }
	);
	const prevPageButton = new ButtonBuilder()
		.setCustomId(`PrevPage`)
		.setLabel("Go Back")
		.setEmoji(`↩️`)
		.setStyle(ButtonStyle.Primary);
	const submitChangesButton = new ButtonBuilder()
		.setLabel(`Save Changes`)
		.setStyle(ButtonStyle.Success)
		.setCustomId(`SaveChanges`)
		.setDisabled(true);

	const evidenceRequiredToggle = new ButtonBuilder()
		.setLabel(`Toggle Evidence Required`)
		.setCustomId(`EvidenceRequired`)
		.setStyle(ButtonStyle.Secondary);

	const reasonRequiredToggle = new ButtonBuilder()
		.setLabel(`Toggle Reason Required`)
		.setCustomId(`ReasonRequired`)
		.setStyle(ButtonStyle.Secondary);
	const enabledToggle = new ButtonBuilder()
		.setLabel(`Toggle Command Status`)
		.setCustomId(`CommandStatus`)
		.setStyle(ButtonStyle.Secondary);
	const setDefaultDurationButton = new ButtonBuilder()
		.setLabel(`Set Default Duration`)
		.setCustomId(`SetDefaultDuration`)
		.setStyle(ButtonStyle.Secondary);
	const settingsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		enabledToggle,
		reasonRequiredToggle,
		evidenceRequiredToggle,
		setDefaultDurationButton
	);
	const controlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		prevPageButton,
		submitChangesButton
	);
	const logChannelSelect = new ChannelSelectMenuBuilder()
		.setChannelTypes(ChannelType.GuildText)
		.setCustomId(`SelectMuteLogChannel`)
		.setPlaceholder(`Log Channel`)
		.setMaxValues(1)
		.setMinValues(0);
	if (config.mute.logChannel) {
		logChannelSelect.setDefaultChannels(config.mute.logChannel);
	}
	const muteRoleSelect = new RoleSelectMenuBuilder()
		.setCustomId(`SelectMuteRole`)
		.setPlaceholder(`Mute Role`)
		.setMaxValues(1)
		.setMinValues(0);
	if (config.mute.muteRoleId) {
		muteRoleSelect.setDefaultRoles(config.mute.muteRoleId);
	}
	const muteRoleRow =
		new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(muteRoleSelect);
	const maxValue = Math.min(15, interaction.guild?.roles.cache.size ?? 0);
	const whitelistedRolesSelect = new RoleSelectMenuBuilder()
		.setCustomId(`SelectWhitelistedRoles`)
		.setPlaceholder(`Whitelisted Roles`)
		.setMaxValues(maxValue)
		.setMinValues(0);
	if (config.mute.whitelistedRoles) {
		whitelistedRolesSelect.setDefaultRoles(config.mute.whitelistedRoles);
	}
	const logChannelRow =
		new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
			logChannelSelect
		);
	const whitelistedRolesRow =
		new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
			whitelistedRolesSelect
		);

	const settings = new MuteSettings(
		config.mute.enabled,
		config.mute.reasonRequired,
		config.mute.evidenceRequired,
		config.mute.whitelistedRoles as string[],
		config.mute.defaultDuration as number,
		config.mute.logChannel as string | null,
		config.mute.muteRoleId as string
	);

	console.log(settings.WhitelistedRoles);
	console.log(config.mute);
	const response = await interaction.update({
		content: "",
		embeds: [
			buildActionSettingsEmbed(
				settings,
				config.mute,
				`Mute`,
				config.fallbackActionLogChannel,
				false,
				false
			),
		],
		components: [
			settingsRow,
			logChannelRow,
			whitelistedRolesRow,
			muteRoleRow,
			controlRow,
		],
	});
	const collector = response.createMessageComponentCollector({
		filter: (i) => i.user.id === interaction.user.id,
		time: 120_000,
	});
	const nextStepRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`Continue`)
			.setLabel(`Yes, continue`)
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId(`Finished`)
			.setLabel(`No, I'm done`)
			.setStyle(ButtonStyle.Secondary)
	);
	collector.on(`collect`, async (i) => {
		async function updateMenu(finalized: boolean) {
			const hasChanges = settings.hasChangedFrom(config.mute);
			if (hasChanges === true) {
				submitChangesButton.setDisabled(false);
			} else if (hasChanges === false) {
				submitChangesButton.setDisabled(true);
			}
			if (i.deferred) {
				if (!finalized) {
					return await i.editReply({
						embeds: [
							buildActionSettingsEmbed(
								settings,
								config.mute,
								"Mute",
								config.fallbackActionLogChannel,
								hasChanges,
								finalized
							),
						],
						components: [
							settingsRow,
							logChannelRow,
							whitelistedRolesRow,
							muteRoleRow,
							controlRow,
						],
					});
				} else if (finalized) {
					return await i.editReply({
						embeds: [
							buildActionSettingsEmbed(
								settings,
								config.mute,
								"Mute",
								config.fallbackActionLogChannel,
								hasChanges,
								finalized
							),
						],
						components: [nextStepRow],
					});
				}
			} else if (!i.replied) {
				if (!finalized) {
					return await i.update({
						embeds: [
							buildActionSettingsEmbed(
								settings,
								config.mute,
								"Mute",
								config.fallbackActionLogChannel,
								hasChanges,
								finalized
							),
						],
						components: [
							settingsRow,
							logChannelRow,
							whitelistedRolesRow,
							muteRoleRow,
							controlRow,
						],
					});
				} else if (finalized) {
					return await i.update({
						embeds: [
							buildActionSettingsEmbed(
								settings,
								config.mute,
								"Mute",
								config.fallbackActionLogChannel,
								hasChanges,
								finalized
							),
						],
						components: [nextStepRow],
					});
				}
			}
		}
		if (i.isButton()) {
			switch (i.customId) {
				case "EvidenceRequired":
					collector.resetTimer();
					settings.EvidenceRequired = !settings.EvidenceRequired;
					await updateMenu(false);
					break;
				case "ReasonRequired":
					collector.resetTimer();
					settings.ReasonRequired = !settings.ReasonRequired;
					await updateMenu(false);
					break;
				case "CommandStatus":
					collector.resetTimer();
					settings.Enabled = !settings.Enabled;
					await updateMenu(false);
					break;
				case "PrevPage":
					collector.stop();
					return initialModerationSettingsMenu(i);
				case "SetDefaultDuration":
					await i.deferUpdate();
					const prompt = await (i.channel as TextChannel).send({
						content: `Send a message containing the duration you'd like to set as default. (Format ex. 30m, 1h)`,
					});
					const durationCollector = (
						i.channel as TextChannel
					).createMessageCollector({
						filter: (m) => m.author.id === interaction.user.id,
						time: 120_000,
					});
					durationCollector.on(`collect`, async (m) => {
						const matches = m.content.matchAll(
							/^((\d+)\s*(years|year|yr|y|months|month|mo|weeks|week|w|days|day|d|hours|hour|h|minutes|minute|min|m|seconds|second|sec|s)\s*)+$/g
						);
						const seenUnits = new Set<string>();
						let totalDuration = 0 as number;
						for (const match of matches) {
							const rawUnit = match[3].toLowerCase();
							const normalizedUnit = normalizeTimeUnit(rawUnit);
							if (!normalizedUnit)
								return interaction.followUp({
									content: `⚠️ Invalid time unit detected.\n\nValid units: \`s\`, \`m\`, \`h\`, \`d\`, \`w\`, \`mo\`, \`y\``,
									flags: MessageFlags.Ephemeral,
								});
							if (seenUnits.has(normalizedUnit as string)) {
								return interaction.followUp({
									content: `⚠️ You've specified the ${
										"`" + normalizedUnit + "`"
									} unit multiple times. Please use each time unit only once.`,
									flags: MessageFlags.Ephemeral,
								});
							}

							seenUnits.add(normalizedUnit as string);
							const duration = ms(match[2] + normalizedUnit);
							totalDuration = totalDuration + duration;
						}
						settings.DefaultDuration = totalDuration;
						await (interaction.channel as TextChannel).bulkDelete([
							m.id,
							prompt.id,
						]);
						durationCollector.stop();
					});
					durationCollector.on(`end`, async () => {
						await updateMenu(false);
					});
					break;
				case "SaveChanges":
					if (!interaction.guildId) {
						await interaction.editReply({ components: [] });
						return await interaction.followUp({
							content: `An unknown error occurred. Terminating process.\nPlease run ${"`/settings moderation`"} again`,
							flags: MessageFlags.Ephemeral,
						});
					}
					await settings.saveToDatabase(interaction.guildId as string);

					const finished = await updateMenu(true);
					finished
						?.awaitMessageComponent({
							componentType: ComponentType.Button,
							time: 60_000,
						})
						.then(async (i) => {
							switch (i.customId) {
								case "Continue":
									initialModerationSettingsMenu(i);
									collector.stop("user_saved");
									break;
								case "Finished":
									nextStepRow.components.forEach((component) =>
										component.setDisabled(true)
									);
									await i.update({ components: [nextStepRow] });
									await i.followUp({
										content: `Process terminated. You can re-run ${"`/settings moderation`"} any time.`,
										flags: MessageFlags.Ephemeral,
									});
									collector.stop("user_saved");
									break;
							}
							return;
						})
						.catch(async () => {
							nextStepRow.components.forEach((component) =>
								component.setDisabled(true)
							);
							await interaction.editReply({ components: [nextStepRow] });
							await i.followUp({
								content: `Process automatically terminated. You can re-run ${"`/settings moderation`"} any time.`,
								flags: MessageFlags.Ephemeral,
							});
							collector.stop("user_saved");
						});
					return;
			}
		} else if (i.isChannelSelectMenu()) {
			switch (i.customId) {
				case "SelectMuteLogChannel":
					collector.resetTimer();
					settings.LogChannel = i.values[0];
					break;
			}
			await updateMenu(false);
		} else if (i.isRoleSelectMenu()) {
			switch (i.customId) {
				case "SelectWhitelistedRoles":
					collector.resetTimer();
					const sortedRoles = sortRolesByHierarchy(
						i.values,
						interaction.guild as Guild
					);
					settings.WhitelistedRoles = sortedRoles;
					break;
				case "SelectMuteRole":
					collector.resetTimer();
					settings.MuteRoleId = i.values[0];
					break;
			}
			await updateMenu(false);
		} else {
			return await i.reply({
				content: `You shouldn't be seeing this message. Make a bug report please!`,
				flags: MessageFlags.Ephemeral,
			});
		}
	});
	collector.on(`ignore`, async (i) => {
		return i.reply({
			content: `❌ This menu is not for you!`,
			flags: MessageFlags.Ephemeral,
		});
	});
	collector.on("end", async () => {
		switch (collector.endReason) {
			case "time":
				await interaction.followUp({
					content: `Settings menu has timed out. No changes were saved.`,
					flags: MessageFlags.Ephemeral,
				});
				break;
			default:
				return;
		}
	});
}
