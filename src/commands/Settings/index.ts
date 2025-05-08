import type {
	CommandData,
	SlashCommandProps,
	CommandOptions,
} from "commandkit";
import {
	ChatInputCommandInteraction,
	Interaction,
	InteractionContextType,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import moderation from "./moderation.js";
import Fun from "./Fun.js";
export const data = new SlashCommandBuilder()
	.setName(`settings`)
	.setDescription(`View or modify server settings.`)
	.setContexts(InteractionContextType.Guild)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addSubcommand((command) => (command = moderation.data))
	.addSubcommand((command) => (command = Fun.data));

export async function run({ interaction, client, handler }: SlashCommandProps) {
	const command = interaction.options.getSubcommand();
	switch (command) {
		case "moderation":
			moderation.run(interaction);
			break;
		case "fun":
			Fun.run(interaction);
	}
}
