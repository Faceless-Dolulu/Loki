import { SlashCommandProps } from "commandkit";
import { InteractionContextType, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
	.setContexts(InteractionContextType.Guild)
	.setName(`remove-timeout`)
	.setDescription(`Remove a timeout issued to a user`)
	.addUserOption((option) =>
		option
			.setName(`target`)
			.setDescription(`The user you want to remove active timeouts for`)
			.setRequired(true)
	)
	.addStringOption((option) =>
		option
			.setName(`reason`)
			.setDescription(`The reason for removing the timeout`)
			.setMaxLength(128)
	);

export async function run({
	interaction,
	client,
	handler,
}: SlashCommandProps) {}
