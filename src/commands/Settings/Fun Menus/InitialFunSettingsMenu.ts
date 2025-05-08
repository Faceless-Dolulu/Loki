import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Interaction,
	MessageFlags,
	StringSelectMenuBuilder,
} from "discord.js";
import { funMenuHandlers } from "./MenuRouter.js";

export async function initialFunSettingsMenu<T extends Interaction>(
	interaction: T
) {
	const funSettings = [
		{
			label: `Throw Command`,
			value: `throw`,
		},
	];

	const selectMenu = new StringSelectMenuBuilder()
		.setCustomId(`SelectFunSetting`)
		.setPlaceholder(`Choose a command to configure`)
		.addOptions(funSettings);
	const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
		selectMenu
	);

	const cancelButton = new ButtonBuilder()
		.setCustomId(`Cancel`)
		.setLabel(`Cancel`)
		.setEmoji("❌")
		.setStyle(ButtonStyle.Secondary);

	const cancelRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		cancelButton
	);

	let menu;

	if (interaction.isChatInputCommand()) {
		menu = await interaction.reply({
			content: `Select which fun command you want to configure below:`,
			components: [row, cancelRow],
		});
	} else if (interaction.isButton()) {
		menu = await interaction.update({
			content: `Select which fun command you want to configure below:`,
			embeds: [],
			components: [row, cancelRow],
		});
	} else return;

	const collector = menu.createMessageComponentCollector({
		filter: (i) => i.user.id === interaction.user.id,
		time: 120_000,
	});
	collector.on(`collect`, async (i) => {
		if (i.isStringSelectMenu()) {
			collector.stop();
			const selected = i.values[0];
			const handler = funMenuHandlers[selected];
			return await handler(i);
		}
		if (i.isButton()) {
			switch (i.customId) {
				case "Cancel":
					row.components.forEach((component) => component.setDisabled(true));
					cancelRow.components.forEach((component) =>
						component.setDisabled(true)
					);
					await i.update({ components: [row, cancelRow] });
					return collector.stop(`process_cancelled`);
			}
		}
	});
	collector.on(`end`, async () => {
		switch (collector.endReason) {
			case "time":
				row.components.forEach((component) => {
					component.setDisabled(true);
				});
				cancelRow.components.forEach((component) =>
					component.setDisabled(true)
				);
				await menu.edit({ components: [row, cancelRow] });
				await interaction.followUp({
					content:
						"The process has timed out. Please run `/settings moderation` again.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			case "process_cancelled":
				return await interaction.followUp({
					content: `Process canceled. All unsaved changes have been lost.`,
					flags: MessageFlags.Ephemeral,
				});
		}
	});
}
