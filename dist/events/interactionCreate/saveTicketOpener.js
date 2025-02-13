import ServerConfig from "../../models/ServerConfig.js";
export default async (interaction, Client, handler) => {
    try {
        if (!interaction.isFromMessage)
            return;
        if (interaction.customId === "TicketOpener") {
            const serverConfig = await ServerConfig.findOne({
                guildId: interaction.guildId,
            });
            const openingMessage = interaction.fields.getTextInputValue("ticketOpenerInput");
            serverConfig
                ?.updateOne({ ticketOpeningMessage: openingMessage })
                .then(() => {
                interaction.reply(`✅ Custom message has been saved! Open a test ticket to view your changes!`);
                return true;
            });
        }
    }
    catch (error) { }
};
