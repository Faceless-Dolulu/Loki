import CaseCounter from "../models/CaseCounter.js";

export async function getNextCaseId(guildId: string): Promise<number> {
	const counter = await CaseCounter.findOneAndUpdate(
		{ guildId: guildId },
		{ $inc: { nextCaseId: 1 } },
		{ upsert: true, new: true }
	);
	return counter.nextCaseId as number;
}
