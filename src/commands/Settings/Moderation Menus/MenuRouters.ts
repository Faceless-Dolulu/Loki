import { MessageComponentInteraction } from "discord.js";
import { banSettingsMenu } from "./BanSettingsMenu.js";
import { kickSettingsMenu } from "./KickSettingsMenu.js";
import { warnSettingsMenu } from "./WarnSettingsMenu.js";
import { timeoutSettingsMenu } from "./TimeoutSettingsMenu.js";
import { muteSettingsMenu } from "./MuteSettingsMenu.js";
export const moderationMenuHandlers: Record<
	string,
	(interaction: MessageComponentInteraction) => Promise<void>
> = {
	ban: banSettingsMenu,
	kick: kickSettingsMenu,
	warn: warnSettingsMenu,
	timeout: timeoutSettingsMenu,
	mute: muteSettingsMenu,
};
