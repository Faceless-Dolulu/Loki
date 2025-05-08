import {
	ChatInputCommandInteraction,
	SlashCommandSubcommandBuilder,
} from "discord.js";
import { initialModerationSettingsMenu } from "./Moderation Menus/InitialModerationSettingsMenu.js";

export default {
	data: new SlashCommandSubcommandBuilder()
		.setName(`moderation`)
		.setDescription(`View or modify Moderation settings`),

	run: async <T extends ChatInputCommandInteraction>(interaction: T) => {
		initialModerationSettingsMenu(interaction);
	},
};
