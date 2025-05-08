import { Schema, model } from "mongoose";

const caseCounterSchema = new Schema({
	guildId: { type: String, required: true, unique: true },
	nextCaseId: { type: Number },
});

export default model("Case Counter", caseCounterSchema);
