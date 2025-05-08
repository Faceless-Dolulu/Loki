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
} from "discord.js";
import ModerationConfig from "../../../models/ModerationConfig.js";
import { buildActionSettingsEmbed } from "../../../Util/BuildMethods.js";
import { ActionSettings } from "../../../Util/Interfaces.js";
import { WarnSettings } from "../../../Util/ServerConfigClasses.js";
import { initialModerationSettingsMenu } from "./InitialModerationSettingsMenu.js";
import {
	arraysEqual,
	sortRolesByHierarchy,
} from "../../../Util/ValidationHelpers.js";
export async function warnSettingsMenu<T extends MessageComponentInteraction>(
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
	const settingsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		enabledToggle,
		reasonRequiredToggle,
		evidenceRequiredToggle
	);
	const controlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		prevPageButton,
		submitChangesButton
	);
	const logChannelSelect = new ChannelSelectMenuBuilder()
		.setChannelTypes(ChannelType.GuildText)
		.setCustomId(`SelectWarnLogChannel`)
		.setPlaceholder(`Log Channel`)
		.setMaxValues(1)
		.setMinValues(0);
	if (config.warn.logChannel) {
		logChannelSelect.setDefaultChannels(config.warn.logChannel);
	}
	const maxValue = Math.min(15, interaction.guild?.roles.cache.size ?? 0);
	const whitelistedRolesSelect = new RoleSelectMenuBuilder()
		.setCustomId(`SelectWhitelistedRoles`)
		.setPlaceholder(`Whitelisted Roles`)
		.setMaxValues(maxValue)
		.setMinValues(0);
	if (config.warn.whitelistedRoles) {
		whitelistedRolesSelect.setDefaultRoles(config.warn.whitelistedRoles);
	}
	const logChannelRow =
		new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
			logChannelSelect
		);
	const whitelistedRolesRow =
		new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
			whitelistedRolesSelect
		);

	const settings = new WarnSettings(
		config.warn.enabled,
		config.warn.reasonRequired,
		config.warn.evidenceRequired,
		config.warn.whitelistedRoles as string[],
		config.warn.logChannel as string | null
	);
	const response = await interaction.update({
		content: "",
		embeds: [
			buildActionSettingsEmbed(
				settings,
				config.warn,
				`Warn`,
				config.fallbackActionLogChannel,
				false,
				false
			),
		],
		components: [settingsRow, logChannelRow, whitelistedRolesRow, controlRow],
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
			const hasChanges = settings.hasChangedFrom(config.warn);
			if (hasChanges === true) {
				submitChangesButton.setDisabled(false);
			} else if (hasChanges === false) {
				submitChangesButton.setDisabled(true);
			}

			if (!finalized) {
				return await i.update({
					embeds: [
						buildActionSettingsEmbed(
							settings,
							config.warn,
							"Warn",
							config.fallbackActionLogChannel,
							hasChanges,
							finalized
						),
					],
					components: [
						settingsRow,
						logChannelRow,
						whitelistedRolesRow,
						controlRow,
					],
				});
			} else if (finalized) {
				return await i.update({
					embeds: [
						buildActionSettingsEmbed(
							settings,
							config.warn,
							"Warn",
							config.fallbackActionLogChannel,
							hasChanges,
							finalized
						),
					],
					components: [nextStepRow],
				});
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
				case "SelectWarnLogChannel":
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
