import {
	ActionRow,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	channelMention,
	ChannelSelectMenuBuilder,
	ChannelType,
	InteractionContextType,
	ModalActionRowComponentBuilder,
	ModalBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
	TextChannel,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import { SlashCommandProps } from "commandkit";
import ServerConfigs from "../../models/ServerConfigs_new.js";
import { Channel } from "diagnostics_channel";

export const data = new SlashCommandBuilder()
	.setName(`settings2`)
	.setDescription(`Configures settings for this server`)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.setContexts(InteractionContextType.Guild)
	.addSubcommandGroup((commandGroup) =>
		commandGroup
			.setName(`moderation`)
			.setDescription(`Configure settings for moderation settings`)
			.addSubcommand((command) =>
				command.setName(`logging`).setDescription(`Configure logging settings`)
			)
	);

export async function run({ interaction, client, handler }: SlashCommandProps) {
	try {
		const commandGroup = interaction.options.getSubcommandGroup();
		const command = interaction.options.getSubcommand();
		const serverConfig = await ServerConfigs.findOne({
			guildId: interaction.guildId,
		});
		let buttonRow;
		let selectRow1;
		let selectRow2;
		let enable;
		let disable;
		let select1;
		let select2;
		switch (commandGroup) {
			case "moderation":
				switch (command) {
					case "logging":
						enable = new ButtonBuilder()
							.setCustomId(`logEnabler`)
							.setLabel(`Enable`)
							.setStyle(ButtonStyle.Success);

						disable = new ButtonBuilder()
							.setCustomId(`logDisabler`)
							.setLabel(`Disable`)
							.setStyle(ButtonStyle.Danger);

						select1 = new ChannelSelectMenuBuilder()
							.setCustomId(`modActionLogChannel`)
							.setChannelTypes(ChannelType.GuildText)
							.setMaxValues(1)
							.setPlaceholder(`Moderator Action Logs`);

						select2 = new ChannelSelectMenuBuilder()
							.setCustomId(`messageLogChannel`)
							.setChannelTypes(ChannelType.GuildText)
							.setMaxValues(1)
							.setPlaceholder(`Message Logs`);

						buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
							enable,
							disable
						);

						selectRow1 =
							new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
								select1
							);
						selectRow2 =
							new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
								select2
							);
						await interaction.reply({
							content: `Configure logging settings here:`,
							components: [selectRow1, selectRow2, buttonRow],
						});
				}
		}
	} catch (error) {
		console.log(error);
	}
}
