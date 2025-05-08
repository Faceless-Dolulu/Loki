import { model, Schema } from "mongoose";
import { ActionSettings } from "../Util/Interfaces.js";

const actionSettingsSchema = new Schema<ActionSettings>(
	{
		evidenceRequired: { type: Boolean, default: false },
		reasonRequired: { type: Boolean, default: false },
		enabled: { type: Boolean, default: false },
		logChannel: { type: String, default: null },
		whitelistedRoles: { type: [String], default: null },
	},
	{ _id: false }
);

const timedActionSettingsSchema = new Schema<ActionSettings>(
	{
		...actionSettingsSchema.obj,
		defaultDuration: { type: Number, default: 1_800_000 },
	},
	{ _id: false }
);

const muteSettingsSchema = new Schema<ActionSettings>(
	{
		...actionSettingsSchema.obj,
		defaultDuration: { type: Number, default: 1_800_000 },
		muteRoleId: { type: String, default: null },
	},
	{ _id: false }
);

const messageLogsSchema = new Schema(
	{
		messageDelete: { type: String, default: null },
		messageUpdate: { type: String, default: null },
		bulkDelete: { type: String, default: null },
		channelCreate: { type: String, default: null },
		channelDelete: { type: String, default: null },
		roleCreate: { type: String, default: null },
		roleDelete: { type: String, default: null },
		emojiCreate: { type: String, default: null },
		emojiDelete: { type: String, default: null },
	},
	{ _id: false }
);

const moderationConfigSchema = new Schema({
	guildId: { type: String, required: true, unique: true, index: true },
	ban: { type: actionSettingsSchema, default: () => ({}) },
	kick: { type: actionSettingsSchema, default: () => ({}) },
	warn: { type: actionSettingsSchema, default: () => ({}) },
	timeout: { type: timedActionSettingsSchema, default: () => ({}) },
	mute: { type: muteSettingsSchema, default: () => ({}) },
	messageLogs: { type: messageLogsSchema, default: () => ({}) },
	fallbackActionLogChannel: { type: String, default: null },
	fallbackMessageLogChannel: { type: String, default: null },
});

export default model("Moderation Config", moderationConfigSchema);
