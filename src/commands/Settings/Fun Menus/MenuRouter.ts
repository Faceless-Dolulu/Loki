import { MessageComponent, MessageComponentInteraction } from "discord.js";
import { throwSettingsMenu } from "./ThrowSettingsMenu.js";

export const funMenuHandlers: Record<
	string,
	(interaction: MessageComponentInteraction) => Promise<void>
> = {
	throw: throwSettingsMenu,
};
