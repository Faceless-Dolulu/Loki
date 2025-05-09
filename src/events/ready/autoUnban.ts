import { CommandKit } from "commandkit";
import { Client } from "discord.js";
import { ModerationCase as Case } from "../../Util/Interfaces.js";
import ModerationCase from "../../models/ModerationCase.js";
import { ChangeStreamDocument } from "mongodb";
const activeTempBans = new Map<string, NodeJS.Timeout>();
export default async function (
	c: Client<true>,
	client: Client<true>,
	handler: CommandKit
) {
	async function processUnban(banData: Case) {
		try {
			const guild = await client.guilds.fetch(banData.guildId);
			if (!guild) throw new Error(`Guild not found`);

			await guild.bans.remove(
				banData.targetId,
				`Ban expired (Case ${banData.caseId})`
			);
			const config = await ModerationCase.findOne({
				guildId: guild.id,
				caseId: banData.caseId,
			});
			if (config) {
				config.set(`active`, false);
				config.set(`closeReason`, `🤖 Ban Expired`);
				await config.save();
			}
		} catch (error) {
			console.error(`Auto-unban error:`, error);
		}
	}
	async function unban(banData: Case) {
		const delay = banData.expiresAt.getTime() - Date.now();
		if (delay <= 0) {
			return await processUnban(banData);
		}
		const key = `${banData.guildId}:${banData.caseId}`;
		const ban = setTimeout(async () => {
			activeTempBans.delete(key);
			try {
				processUnban(banData);
			} catch (error) {
				console.error(`Auto-unban error:`, error);
			} finally {
				activeTempBans.delete(key);
			}
		}, delay);
		activeTempBans.set(key, ban);
	}

	const data = await ModerationCase.find({ action: `ban`, active: true });
	data.forEach(unban);

	ModerationCase.watch<
		typeof ModerationCase,
		ChangeStreamDocument<typeof ModerationCase>
	>([], { fullDocument: "updateLookup" }).on(
		`change`,
		async (change: ChangeStreamDocument<Case>) => {
			if (
				change.operationType === "insert" &&
				change.fullDocument.action === "ban" &&
				change.fullDocument.active === true
			) {
				const newUnban = change.fullDocument as Case;
				if (newUnban.duration === null) {
					return;
				}
				return unban(newUnban);
			} else if (
				change.operationType === "update" &&
				change.fullDocument?.action === "ban" &&
				change.updateDescription.updatedFields?.active === false
			) {
				const guildId = change.fullDocument.guildId;
				const caseId = change.fullDocument.caseId;

				const key = `${guildId}:${caseId}`;
				const timeout = activeTempBans.get(key);
				if (timeout) {
					clearTimeout(timeout);
					activeTempBans.delete(key);
				} else return;
			}
		}
	);
}
