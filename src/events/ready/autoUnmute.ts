import { CommandKit } from "commandkit";
import { Client } from "discord.js";
import ModerationCase from "../../models/ModerationCase.js";
import { ModerationCase as Case } from "../../Util/Interfaces.js";
import {
	ChangeStreamDocument,
	ChangeStreamInsertDocument,
	ChangeStreamUpdateDocument,
} from "mongodb";
const activeMutes = new Map<string, NodeJS.Timeout>();
export default async function (
	c: Client<true>,
	client: Client<true>,
	handler: CommandKit
) {
	async function processUnmute(muteData: Case) {
		try {
			const guild = await client.guilds.fetch(muteData.guildId);
			if (!guild) throw new Error(`Guild not found`);
			const target = await guild.members.fetch(muteData.targetId);
			if (!target) throw new Error(`Target not found`);
			await target.roles.remove(
				muteData.mutedRoleId,
				`Mute expired (Case ${muteData.caseId})`
			);
			const config = await ModerationCase.findOne({
				guildId: guild.id,
				caseId: muteData.caseId,
			});
			if (config) {
				config?.set(`active`, false);
				await config?.save();
			}
		} catch (error) {
			console.error(`Auto-unmute error:`, error);
		}
	}
	async function unmute(muteData: Case) {
		const delay = muteData.expiresAt.getTime() - Date.now();
		if (delay <= 0) {
			return await processUnmute(muteData);
		}
		const key = `${muteData.guildId}:${muteData.caseId}`;
		const mute = setTimeout(async () => {
			activeMutes.delete(key);
			try {
				processUnmute(muteData);
			} catch (error) {
				console.error(`Auto-unmute error:`, error);
			} finally {
				activeMutes.delete(key);
			}
		}, delay);
		activeMutes.set(key, mute);
	}
	const data = await ModerationCase.find({
		action: "mute",
		active: true,
	});
	data.forEach(unmute);

	ModerationCase.watch<
		typeof ModerationCase,
		| ChangeStreamDocument<typeof ModerationCase>
		| ChangeStreamInsertDocument<typeof ModerationCase>
		| ChangeStreamUpdateDocument<typeof ModerationCase>
	>([], { fullDocument: "updateLookup" }).on(
		`change`,
		async (
			change: ChangeStreamDocument<Case> | ChangeStreamUpdateDocument<Case>
		) => {
			if (
				change.operationType === "insert" &&
				change.fullDocument.action === "mute" &&
				change.fullDocument.active === true
			) {
				const newUnmute = change.fullDocument as Case;
				unmute(newUnmute);
			} else if (
				change.operationType === "update" &&
				change.fullDocument?.action === "mute" &&
				change.updateDescription.updatedFields?.active === false
			) {
				const guildId = change.fullDocument.guildId;
				const caseId = change.fullDocument.caseId;

				const key = `${guildId}:${caseId}`;
				const timeout = activeMutes.get(key);
				if (timeout) {
					clearTimeout(timeout);
					activeMutes.delete(key);
				}
			}
		}
	);
}
