import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelSelectMenuBuilder,
	ChannelType,
	ComponentType,
	EmbedBuilder,
	MessageComponentInteraction,
	MessageFlags,
	TextChannel,
} from "discord.js";
import { objects } from "../../fun/throw/throwable-objects.js";
import ThrowItemList from "../../../models/ThrowItemList.js";
import { ThrowClass } from "../../../Util/ServerConfigClasses.js";
import { buildThrowSettingsEmbed } from "../../../Util/BuildMethods.js";
import { initialFunSettingsMenu } from "./InitialFunSettingsMenu.js";
import {
	validateNewThrowItems,
	validateRemovedThrowItems,
} from "../../../Util/ValidationHelpers.js";

export async function throwSettingsMenu(
	interaction: MessageComponentInteraction
): Promise<void> {
	const config = await ThrowItemList.findOneAndUpdate(
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
	const addCustomItemsButton = new ButtonBuilder()
		.setLabel(`Add Custom Items`)
		.setCustomId(`AddCustomItems`)
		.setStyle(ButtonStyle.Secondary);
	const removeCustomItemsButton = new ButtonBuilder()
		.setCustomId(`RemoveCustomItems`)
		.setLabel(`Remove Custom Items`)
		.setStyle(ButtonStyle.Secondary);
	const toggleCustomOnlyButton = new ButtonBuilder()
		.setCustomId(`ToggleCustomOnly`)
		.setLabel(` Toggle Custom Items Only`)
		.setStyle(ButtonStyle.Secondary);
	if (config.customItems.length === 0)
		removeCustomItemsButton.setDisabled(true);
	const maxValue = Math.min(25, interaction.guild?.channels.cache.size ?? 0);
	const blacklistedChannelsSelect = new ChannelSelectMenuBuilder()
		.setChannelTypes(ChannelType.GuildText)
		.setCustomId(`SelectBlacklistedChannels`)
		.setMinValues(0)
		.setMaxValues(maxValue)
		.setPlaceholder(`Select Blacklisted Channels`);

	const viewFullCustomItemListButton = new ButtonBuilder()
		.setLabel(`View Full Throwable Item List`)
		.setStyle(ButtonStyle.Secondary)
		.setCustomId(`ViewFullList`);

	if (config.customItems.length >= 30)
		toggleCustomOnlyButton.setDisabled(false);
	else toggleCustomOnlyButton.setDisabled(true);

	if (!config.customItems) viewFullCustomItemListButton.setDisabled(true);

	const blackListedChannelsRow =
		new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
			blacklistedChannelsSelect
		);
	const settingsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		addCustomItemsButton,
		removeCustomItemsButton,
		viewFullCustomItemListButton,
		toggleCustomOnlyButton
	);
	const controlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		prevPageButton,
		submitChangesButton
	);

	const settings = new ThrowClass(
		config.customItems,
		config.blacklistedChannels,
		config.customItemsOnly
	);

	const response = await interaction.update({
		content: ``,
		embeds: [buildThrowSettingsEmbed(settings, config, false)],
		components: [settingsRow, blackListedChannelsRow, controlRow],
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
			const hasChanges = settings.hasChangedFrom(config);
			if (hasChanges === true) {
				submitChangesButton.setDisabled(false);
			} else if (hasChanges === false) {
				submitChangesButton.setDisabled(true);
			}
			if (settings.customItems.length === 0)
				removeCustomItemsButton.setDisabled(true);
			else {
				removeCustomItemsButton.setDisabled(false);
			}
			if (settings.customItems.length >= 30)
				toggleCustomOnlyButton.setDisabled(false);
			else toggleCustomOnlyButton.setDisabled(true);

			if (i.deferred) {
				if (finalized === false) {
					return await i.editReply({
						embeds: [buildThrowSettingsEmbed(settings, config, finalized)],
						components: [settingsRow, blackListedChannelsRow, controlRow],
					});
				} else if (finalized === true) {
					return await i.editReply({
						embeds: [buildThrowSettingsEmbed(settings, config, finalized)],
						components: [nextStepRow],
					});
				}
			} else if (!i.replied) {
				if (finalized === false) {
					return await i.update({
						embeds: [buildThrowSettingsEmbed(settings, config, finalized)],
						components: [settingsRow, blackListedChannelsRow, controlRow],
					});
				} else if (finalized === true) {
					return await i.update({
						embeds: [buildThrowSettingsEmbed(settings, config, finalized)],
						components: [nextStepRow],
					});
				}
			}
		}

		if (i.isButton()) {
			switch (i.customId) {
				case "PrevPage":
					collector.stop();
					return initialFunSettingsMenu(i);
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
									initialFunSettingsMenu(i);
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
				case "ToggleCustomOnly":
					settings.onlyCustomItems = !settings.onlyCustomItems;
					await updateMenu(false);
					break;
				case "AddCustomItems":
					await i.deferUpdate();
					const addPrompt = await (i.channel as TextChannel).send({
						content: `Please send a message containing a list of custom items you'd like to add to the list separated by a comma (', ')`,
					});

					const itemAdditionCollector = (
						i.channel as TextChannel
					).createMessageCollector({
						filter: (m) => m.author.id === interaction.user.id,
						time: 300_000,
					});
					itemAdditionCollector.on(`collect`, async (m) => {
						const rawInput = m.content;
						let { validItems, rejectedItems, summaryMessage } =
							validateNewThrowItems(rawInput, settings);
						const duplicatedItems = validItems.filter((item) =>
							config.customItems.includes(item)
						);
						validItems = validItems.filter(
							(item) => !config.customItems.includes(item)
						);
						summaryMessage += `\n${duplicatedItems.length} item(s) were already in the list and were skipped.`;
						settings.addCustomItems(validItems);
						await i.followUp({
							content: summaryMessage,
							flags: MessageFlags.Ephemeral,
						});
						await (interaction.channel as TextChannel).bulkDelete([
							m.id,
							addPrompt.id,
						]);
						itemAdditionCollector.stop();
						await updateMenu(false);
					});
					break;
				case "RemoveCustomItems":
					await i.deferUpdate();
					const removePrompt = await (i.channel as TextChannel).send({
						content: `Please send a message containing a list of custom items you'd like to remove from the list separated by a comma (', ')`,
					});
					const itemRemovalCollector = (
						i.channel as TextChannel
					).createMessageCollector({
						filter: (m) => m.author.id === interaction.user.id,
						time: 120_000,
					});

					itemRemovalCollector.on(`collect`, async (m) => {
						const rawInput = m.content;
						let { itemsToRemove, notFoundItems, summaryMessage } =
							validateRemovedThrowItems(rawInput, settings);

						settings.removeCustomItems(itemsToRemove);
						if (settings.customItems.length < 30) {
							settings.onlyCustomItems = false;
						}
						await interaction.followUp({
							content: summaryMessage,
							flags: MessageFlags.Ephemeral,
						});
						await (interaction.channel as TextChannel).bulkDelete([
							m.id,
							removePrompt.id,
						]);
						itemRemovalCollector.stop();
						await updateMenu(false);
					});
					break;
				case "ViewFullList":
					if (settings.customItemsOnly === true) {
						const customItemList = settings.customItems;
						const fullList = objects.concat(...customItemList).join(", ");

						const embed = new EmbedBuilder()
							.setColor(0x003aff)
							.setTitle(`Throwable Item List`)
							.setFooter({ text: `Custom Items Only: Enabled` })
							.setDescription(fullList);

						await i.reply({
							content: "",
							embeds: [embed],
							flags: MessageFlags.Ephemeral,
						});
					} else if (settings.customItems.length > 0) {
						const customItemList = settings.customItems;
						const fullList = objects.concat(...customItemList).join(", ");
						const embed = new EmbedBuilder()
							.setColor(0x003aff)
							.setTitle(`Throwable Item List`)
							.setFooter({ text: `Custom Items Only: Disabled` })
							.setDescription(fullList);

						await i.reply({
							content: "",
							embeds: [embed],
							flags: MessageFlags.Ephemeral,
						});
					} else {
						const fullList = objects.join(", ");
						const embed = new EmbedBuilder()
							.setColor(0x003aff)
							.setTitle(`Throwable Item List`)
							.setFooter({ text: `Custom Items Only: Disabled` })
							.setDescription(fullList);

						await i.reply({
							content: "",
							embeds: [embed],
							flags: MessageFlags.Ephemeral,
						});
					}
			}
		}
		if (i.isChannelSelectMenu()) {
			switch (i.customId) {
				case "SelectBlacklistedChannels":
					settings.BlacklistedChannels = i.values;
					await updateMenu(false);
					break;
			}
		}
	});
}
