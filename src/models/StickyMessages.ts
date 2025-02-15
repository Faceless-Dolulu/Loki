import { Schema, model } from "mongoose";

const stickyMessages = new Schema({
	guildId: {
		type: String,
		required: true,
	},
	messageTitle: {
		type: String,
		required: true,
	},
	messageContent: {
		type: String,
		required: true,
	},
	channelId: {
		type: String,
		required: true,
		unique: true,
	},
	stickyMessageId: {
		type: String,
	},
});

export default model(`Sticky Messages`, stickyMessages);
