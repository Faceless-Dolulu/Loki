type CooldownScope = `guild` | `global`;
type CooldownKey = `${string}:${string}:${string}`;

export const cooldowns = new Map<CooldownKey, number>();

export function isOnCooldown(
	userId: string,
	commandName: string,
	cooldownInMs: number,
	scope: CooldownScope,
	guildId?: string
): { onCooldown: true; retryAfter: number } | { onCooldown: false } {
	const id = scope === "guild" ? guildId ?? "global" : userId;
	const key: CooldownKey = `${scope}:${id}:${commandName}`;
	const now = Date.now();

	const expiresAt = cooldowns.get(key);
	if (expiresAt && now < expiresAt) {
		return { onCooldown: true, retryAfter: expiresAt - now };
	}

	cooldowns.set(key, now + cooldownInMs);
	return { onCooldown: false };
}
