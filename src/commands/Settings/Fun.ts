import {
	ChatInputCommandInteraction,
	SlashCommandSubcommandBuilder,
} from "discord.js";
import { initialFunSettingsMenu } from "./Fun Menus/InitialFunSettingsMenu.js";

export default {
	data: new SlashCommandSubcommandBuilder()
		.setName(`fun`)
		.setDescription(`View or modify settings for fun commands`),

	run: async <T extends ChatInputCommandInteraction>(interaction: T) => {
		return initialFunSettingsMenu(interaction);
	},
};
