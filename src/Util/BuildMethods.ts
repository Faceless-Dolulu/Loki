import {
	ButtonBuilder,
	ButtonStyle,
	channelMention,
	EmbedBuilder,
	roleMention,
} from "discord.js";
import { ActionSettings, ThrowSettings } from "./Interfaces.js";
import prettyMilliseconds from "pretty-ms";
import { ModerationSettingBase } from "./AbstractClasses.js";
import { arraysEqual } from "./ValidationHelpers.js";
import { ThrowClass } from "./ServerConfigClasses.js";

/**
 * Builds a toggle button that updates its label and style based on a boolean state.
 *
 * @param label - The base label for the setting (e.g. "Ban", "Kick")
 * @param isEnabled - Whether the setting is currently enabled
 * @param customId - The custom ID to use for the button
 */

export function buildToggleButton(
	label: string,
	isEnabled: boolean,
	customId: string
): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(customId)
		.setLabel(`${label}: ${isEnabled ? "Enabled" : "Disabled"}`)
		.setStyle(isEnabled ? ButtonStyle.Success : ButtonStyle.Danger);
}

/**
 * Builds an embed that updates its content based on updates made to its settings.
 *
 * @param actionConfig - The action's config (e.g. Ban config, kick config, etc.)
 * @param hasChanges  - Boolean for whether changes have been saved, defaults to false
 * @param action - The action type (e.g. Ban, kick, etc.)
 */

export function buildActionSettingsEmbed<T extends ModerationSettingBase>(
	settings: T,
	serverConfig: ActionSettings,
	action: string,
	fallbackLogChannel: string | null,
	hasChanged: boolean,
	finalized: boolean
): EmbedBuilder {
	const embed = new EmbedBuilder()
		.setDescription(
			`This panel shows the current configuration for the ${action.toLowerCase()} command.`
		)
		.setColor(settings.enabled === true ? 0x00b37e : 0xff3e3e);
	function formatField(
		name: string,
		value: string,
		changed: boolean,
		inline: boolean
	): { name: string; value: string; inline: boolean } {
		return {
			name: changed ? `✨ ${name}` : name,
			value: value,
			inline: inline,
		};
	}

	const fields = [];
	fields.push(
		formatField(
			"Status",
			settings.enabled ? "🟢 Enabled" : "🔴 Disabled",
			settings.enabled !== serverConfig.enabled,
			true
		)
	);
	fields.push(
		formatField(
			"Reason Required",
			settings.reasonRequired ? "✅ Yes" : "❌ No",
			settings.reasonRequired !== serverConfig.reasonRequired,
			true
		)
	);
	fields.push(
		formatField(
			`Evidence Required`,
			settings.evidenceRequired ? "✅ Yes" : "❌ No",
			settings.evidenceRequired !== serverConfig.evidenceRequired,
			true
		)
	);

	embed.setFooter({
		text: `Use the buttons below to update and save settings.\nTo clear a setting, just deselect all options in the menu.`,
	});
	embed.setTitle(`${action} Settings`);
	if (hasChanged == true) {
		embed.setTitle(`${action} Settings (Changes Not Saved)`);
	}
	if (finalized == true) {
		embed.setTitle(`${action} Settings (Changes Saved)`);
		embed.setFooter({
			text: `Your changes have been saved.\nUse the buttons below to select if you want to continue configuring other settings.`,
		});
	}

	if (settings.defaultDuration) {
		fields.push(
			formatField(
				"Default Duration",
				prettyMilliseconds(settings.defaultDuration, {
					verbose: true,
				}),
				settings.defaultDuration !== serverConfig.defaultDuration,
				true
			)
		);
	}
	if (settings.muteRoleId) {
		fields.push(
			formatField(
				`Mute Role`,
				roleMention(settings.muteRoleId),
				settings.muteRoleId !== serverConfig.muteRoleId,
				true
			)
		);
	}

	fields.push(
		formatField(
			`Log Channel`,
			settings.logChannel
				? channelMention(settings.logChannel)
				: settings.fallbackLogChannel
				? `Set to fallback logs: ${channelMention(
						fallbackLogChannel as string
				  )}`
				: `*None configured*`,
			settings.logChannel !== serverConfig.logChannel,
			true
		)
	);

	const roleMentions =
		(settings.whitelistedRoles
			?.map((id) => roleMention(id))
			.join(`\n`) as string) ?? "*None configured*";

	fields.push(
		formatField(
			`Whitelisted Roles`,
			roleMentions,
			!arraysEqual(
				settings.whitelistedRoles as string[],
				serverConfig.whitelistedRoles as string[]
			),
			true
		)
	);

	embed.addFields(fields);
	return embed;
}

/**
 * Builds and embed that updates its content based on update made to its settings.
 *
 * @param settings - The instantiated class containing the settings the user is configuring
 * @param serverConfig - The config currently saved in the database
 * @param finalized - Whether changes have been finalized or not
 */

export function buildThrowSettingsEmbed(
	settings: ThrowClass,
	serverConfig: ThrowSettings,
	finalized: boolean
): EmbedBuilder {
	const embed = new EmbedBuilder()
		.setColor(0xffcc00)
		.setDescription(
			"This panel shows the current configuration for the `/throw` command."
		);

	function formatField(
		name: string,
		value: string,
		changed: boolean,
		inline: boolean
	): { name: string; value: string; inline: boolean } {
		return {
			name: changed ? `✨ ${name}` : name,
			value: value,
			inline: inline,
		};
	}

	const hasChanges =
		settings.customItemsOnly !== serverConfig.customItemsOnly ||
		!arraysEqual(settings.customItems, serverConfig.customItems) ||
		!arraysEqual(
			settings.blacklistedChannels,
			serverConfig.blacklistedChannels
		);

	let title = "Throw Command Settings";
	if (finalized) title += " (Changes Saved)";
	else if (hasChanges) title += " (Changes Not Saved)";
	embed.setTitle(title);

	// Custom Items Only
	embed.addFields(
		formatField(
			`Use Only Custom Items?`,
			settings.customItemsOnly === true ? "✅ Yes" : "❌ No",
			settings.customItemsOnly !== serverConfig.customItemsOnly,
			false
		)
	);

	// Blacklisted Channels
	const blacklistedChannelsChanged = !arraysEqual(
		settings.blacklistedChannels,
		serverConfig.blacklistedChannels
	);
	const channelMentions =
		settings.blacklistedChannels.length > 0
			? settings.blacklistedChannels
					.map((channel) => channelMention(channel))
					.join(", ")
			: "*No channels blacklisted.*";
	embed.addFields(
		formatField(
			"Blacklisted Channels",
			channelMentions,
			blacklistedChannelsChanged,
			false
		)
	);

	// Custom Items
	const customItemsChanged = !arraysEqual(
		settings.customItems,
		serverConfig.customItems
	);
	const previewItems = settings.customItems.slice(0, 5);
	let itemValue = previewItems.join(", ");
	if (settings.customItems.length > 5)
		itemValue += `\n and ${settings.customItems.length - 5} more`;
	if (previewItems.length === 0) itemValue = `*No custom items added.*`;

	embed.addFields(
		formatField("Custom Items", itemValue, customItemsChanged, false)
	);

	// Footer
	if (!finalized) {
		embed.setFooter({
			text: `Use the buttons below to update and save settings. \nTo remove a setting, deselect all options.\n 30+ custom items must be added before enabling custom items only.`,
		});
	} else {
		embed.setFooter({
			text: "Your changes have been saved.\nUse the buttons below to select if you want to continue configuring other settings. ",
		});
	}

	return embed;
}
