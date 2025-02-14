import { Schema, model } from "mongoose";

const stickyMessages = new Schema({
	guildId: {
		type: String,
		required: true,
	},
	messageContent: {
		type: String,
		required: true,
	},
	stickyId: {
		type: String,
		required: true,
	},
});

export default model(`Sticky Messages`, stickyMessages);
