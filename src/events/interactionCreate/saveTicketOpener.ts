// import { CommandKit } from "commandkit";
// import { Client, ModalSubmitInteraction } from "discord.js";
// import ServerConfig from "../../models/ServerConfigs_new.js";

// export default async (
// 	interaction: ModalSubmitInteraction,
// 	Client: Client,
// 	handler: CommandKit
// ) => {
// 	try {
// 		if (!interaction.isFromMessage) return;
// 		if (interaction.customId === "TicketOpener") {
// 			const serverConfig = await ServerConfig.findOne({
// 				guildId: interaction.guildId,
// 			});
// 			const openingMessage =
// 				interaction.fields.getTextInputValue("ticketOpenerInput");
// 			serverConfig
// 				?.updateOne({ ticketOpeningMessage: openingMessage })
// 				.then(() => {
// 					interaction.reply(
// 						`✅ Custom message has been saved! Open a test ticket to view your changes!`
// 					);
// 					return true;
// 				});
// 		}
// 	} catch (error) {}
// };
