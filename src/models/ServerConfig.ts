import { Schema, model } from "mongoose";

const serverConfigSchema = new Schema({
	guildId: {
		type: String,
		required: true,
		unique: true,
	},
	welcomeChannelId: {
		type: String,
		default: null,
	},
	customWelcomeMessage: {
		type: String,
		default: null,
	},
	goodbyeChannelId: {
		type: String,
		default: null,
	},
	customGoodbyeMessage: {
		type: String,
		default: null,
	},
	adminRoles: {
		type: [String],
		default: undefined,
	},
	moderatorRoles: {
		type: [String],
		default: undefined,
	},
	banLogsChannelId: {
		type: String,
		default: null,
	},
	kickLogsChannelId: {
		type: String,
		default: null,
	},
	timeoutLogsChannelId: {
		type: String,
		default: null,
	},
	warnLogsChannelId: {
		type: String,
		default: null,
	},
	starboardChannelId: {
		type: String,
		default: null,
	},
	starboardReactionCount: {
		type: Number,
		default: 5,
	},
	starboardReactionEmoji: {
		type: String,
		default: "⭐",
	},
	messageLogsChannelId: {
		type: String,
		default: null,
	},
	suggestionChannelId: {
		type: String,
		default: null,
	},
	ticketCategoryId: {
		type: String,
		default: null,
	},
	ticketArchiveChannelId: {
		type: String,
		default: null,
	},
	ticketAdminArchiveChannelId: {
		type: String,
		default: null,
	},
	ticketOpeningMessage: {
		type: String,
		default: null,
	},
});

export default model(`Server Configs`, serverConfigSchema);
