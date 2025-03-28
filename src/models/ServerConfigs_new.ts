import { defaultMaxListeners } from "events";
import { model, Schema } from "mongoose";

const banSettingsSchema = new Schema({
	evidenceRequired: {
		type: Boolean,
		default: false,
	},
	reasonRequired: {
		type: Boolean,
		default: false,
	},
	enabled: {
		type: Boolean,
		default: false,
	},
});

const kickSettingsSchema = new Schema({
	evidenceRequired: {
		type: Boolean,
		default: false,
	},
	reasonRequired: {
		type: Boolean,
		default: false,
	},
	enabled: {
		type: Boolean,
		default: false,
	},
});

const timeoutSettingsSchema = new Schema({
	evidenceRequired: {
		type: Boolean,
		default: false,
	},
	reasonRequired: {
		type: Boolean,
		default: false,
	},
	enabled: {
		type: Boolean,
		default: false,
	},
});

const warnSettingsSchema = new Schema({
	evidenceRequired: {
		type: Boolean,
		default: false,
	},
	reasonRequired: {
		type: Boolean,
		default: false,
	},
	enabled: {
		type: Boolean,
		default: false,
	},
});
const logSettingsSchema = new Schema({
	enabled: {
		type: Boolean,
		default: false,
	},
	actionLogChannel: {
		type: String,
		default: undefined,
	},
	messageLogChannel: {
		type: String,
		default: undefined,
	},
});

const moderationSettingsSchema = new Schema({
	logs: {
		type: logSettingsSchema,
		default: () => ({}),
	},
	ban: { type: banSettingsSchema, default: () => ({}) },
	kick: { type: kickSettingsSchema, default: () => ({}) },
	timeout: { type: timeoutSettingsSchema, default: () => ({}) },
	warns: { type: warnSettingsSchema, default: () => ({}) },
	adminRoles: {
		type: [String],
		default: undefined,
	},
	moderatorRoles: {
		type: [String],
		default: undefined,
	},
});

const ticketSettingsSchema = new Schema({
	enabled: {
		type: Boolean,
		default: false,
	},
	categoryId: {
		type: String,
		default: undefined,
	},
	archive: {
		type: String,
		default: undefined,
	},
	openingMessage: {
		type: String,
		default: undefined,
	},
});

const starboardSettingsSchema = new Schema({
	enabled: {
		type: Boolean,
		default: false,
	},
	channel: {
		type: String,
		default: undefined,
	},
	reactionCount: {
		type: Number,
		default: 5,
	},
	reactionEmoji: {
		type: String,
		default: "⭐",
	},
});

const welcomeSettingsSchema = new Schema({
	channel: {
		type: String,
		default: undefined,
	},
	message: {
		type: String,
		default: undefined,
	},
	messageAttachment: {
		type: String,
		default: null,
	},
});

const goodbyeSettingsSchema = new Schema({
	channel: {
		type: String,
		default: undefined,
	},
	message: {
		type: String,
		default: undefined,
	},
	messageAttachment: {
		type: String,
		default: null,
	},
});
const serverConfigs = new Schema({
	guildId: {
		type: String,
		unique: true,
		required: true,
	},
	suggestionChannel: {
		type: String,
		default: undefined,
	},
	moderation: { type: moderationSettingsSchema, default: () => ({}) },
	tickets: { type: ticketSettingsSchema, default: () => ({}) },
	starboard: { type: starboardSettingsSchema, default: () => ({}) },
	welcome: { type: welcomeSettingsSchema, default: () => ({}) },
	goodbye: { type: goodbyeSettingsSchema, default: () => ({}) },
});

export default model(`Server Configs2`, serverConfigs);
