import { CommandKit } from "commandkit";
import { Client } from "discord.js";
import { cooldowns } from "../../Util/cooldown.js";

const GARBAGE_COLLECTOR_INTERVAL_MS = 30_000; // ❗DO NOT CHANGE UNLESS SCALING SHOWS ISSUES

export default async function (
	c: Client<true>,
	client: Client<true>,
	handler: CommandKit
) {
	setInterval(() => {
		const now = Date.now();

		let cleaned = 0;

		for (const [key, expiresAt] of cooldowns.entries()) {
			if (expiresAt < now) {
				cooldowns.delete(key);
				cleaned++;
			}
		}
		if (cleaned > 0) {
			console.debug(
				`[Cooldown GC] Cleaned ${cleaned} expired cooldown entries`
			);
		}
	}, GARBAGE_COLLECTOR_INTERVAL_MS);
}
