import { CommandKit } from "commandkit";
import { Client, ModalSubmitInteraction } from "discord.js";
import ServerConfig from "../../models/ServerConfigs.js";
import ms from "ms";
import prettyMilliseconds from "pretty-ms";

export default async (
	interaction: ModalSubmitInteraction,
	Client: Client,
	handler: CommandKit
) => {
	try {
		if (interaction.customId === "SetDefaultTimeoutDuration") {
			const serverConfig = await ServerConfig.findOne({
				guildId: interaction.guildId,
			});
			const defaultTimeoutDuration = ms(
				interaction.fields.getTextInputValue(`DefaultTimeoutDurationInput`)
			);
			if (defaultTimeoutDuration === undefined) {
				interaction.reply({
					content: `❌ Invalid input. Please write a valid duration of time. i.e., 30 minutes (30m).\nChanges have not been saved.`,
					flags: ["Ephemeral"],
				});
				return true;
			} else {
				serverConfig?.set(
					`moderation.timeout.defaultTimeoutDuration`,
					defaultTimeoutDuration
				);
				await serverConfig?.save();
				await interaction.reply({
					content: `✅ Default timeout duration has been set to ${prettyMilliseconds(
						defaultTimeoutDuration,
						{ verbose: true }
					)}`,
					flags: ["Ephemeral"],
				});
				return true;
			}
		} else return false;
	} catch (error) {}
};
