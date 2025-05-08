import { Guild, Role } from "discord.js";
import { throwItemValidationResult, ThrowSettings } from "./Interfaces";
import { ThrowClass } from "./ServerConfigClasses.js";

export function arraysEqual<T>(
	a: T[] | null | undefined,
	b: T[] | null | undefined
): boolean {
	if (a === null && b === null) return true;
	if (a === undefined && b === undefined) return true;
	if (!a || !b) return false;
	if (a?.length !== b?.length) return false;
	const sortetdA = [...a].sort();
	const sortedB = [...b].sort();

	return sortetdA.every((val, index) => val === sortedB[index]);
}

export function normalize<T>(value: T | null | undefined) {
	return value ?? null;
}

export function sortRolesByHierarchy(
	roleIds: string[],
	guild: Guild
): string[] {
	return roleIds
		.map((roleId) => guild.roles.cache.get(roleId))
		.filter((role): role is Role => role !== undefined)
		.sort((a, b) => (b?.position as number) - (a?.position as number))
		.map((role) => role?.id as string);
}

export function validateNewThrowItems(
	rawInput: string,
	currentSettings: ThrowSettings
): throwItemValidationResult {
	const items = rawInput
		.split(",")
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	const validItems: string[] = [];
	const rejectedItems: { item: string; reasons: string[] }[] = [];
	const invalidCharRegex = /[*_`~|#<>[\](){}'"@\\\/!?.,;:^+=-]/;
	const existingItems: string[] = [];
	for (const item of items) {
		const reasons: string[] = [];
		if (
			currentSettings.customItems
				.map((s) => s.trim().toLowerCase())
				.includes(item.toLowerCase())
		) {
			existingItems.push(item);
			continue;
		}
		if (invalidCharRegex.test(item)) {
			reasons.push(`Contains illegal characters`);
		}
		if (item.length >= 52) {
			reasons.push(`Item exceeds 52 character limit`);
		}
		if (reasons.length > 0) {
			rejectedItems.push({ item, reasons });
		} else {
			validItems.push(item);
		}
	}

	const filteredValidItems = validItems.filter(
		(item) => !existingItems.includes(item)
	);

	let summaryLines: string[] = [];

	if (filteredValidItems.length > 0) {
		summaryLines.push(
			`✅ ${filteredValidItems.length} item(s) passed validation and will be added.\n`
		);
	}
	if (existingItems.length > 0) {
		summaryLines.push(
			`ℹ️ ${existingItems.length} item(s) were already in the list and were skipped.`
		);
	}
	if (rejectedItems.length > 0) {
		summaryLines.push(`⚠️ ${rejectedItems.length} item(s) were rejected.`);
		if (rejectedItems.length <= 5) {
			summaryLines.push(
				...rejectedItems.map(
					({ item, reasons }) =>
						`• \`${item || "(empty)"}\`: ${reasons.join(", ")}`
				)
			);
		} else {
			const uniqueReasons = new Set<string>();
			for (const r of rejectedItems) {
				r.reasons.forEach((reason) => uniqueReasons.add(reason));
			}
			summaryLines.push(
				`Reasons for rejected items: ${[...uniqueReasons].join(", ")}`
			);
		}
	}

	return {
		validItems: filteredValidItems,
		rejectedItems: rejectedItems,
		summaryMessage: summaryLines.join("\n"),
	};
}

export function validateRemovedThrowItems(
	rawInput: string,
	currentSettings: ThrowClass
): {
	itemsToRemove: string[];
	notFoundItems: string[];
	summaryMessage: string;
} {
	const itemMap = new Map<string, string>();
	for (const rawItem of rawInput.split(`,`)) {
		const trimmed = rawItem.trim();

		if (trimmed.length === 0) continue;

		const normalized = trimmed.toLowerCase();
		if (!itemMap.has(normalized)) {
			itemMap.set(normalized, trimmed);
		}
	}

	if (itemMap.size === 0)
		return {
			itemsToRemove: [],
			notFoundItems: [],
			summaryMessage: "⚠️ No changes were made, no items were specified.",
		};
	const items = Array.from(itemMap.values());
	const itemsToRemove: string[] = [];
	const notFoundItems: string[] = [];
	const normalizedExistingItems = new Set(
		currentSettings.customItems.map((s) => s.trim().toLowerCase())
	);
	for (const item of items) {
		if (normalizedExistingItems.has(item.toLowerCase())) {
			itemsToRemove.push(item);
		} else {
			notFoundItems.push(item);
		}
	}

	const summaryLines = [];

	if (itemsToRemove.length > 0) {
		summaryLines.push(
			`✅ ${itemsToRemove.length} item(s) removed from the list.`
		);
	}
	if (notFoundItems.length > 0) {
		summaryLines.push(
			`ℹ️ ${notFoundItems.length} item(s) not found and skipped.`
		);
	}

	return {
		itemsToRemove: itemsToRemove,
		notFoundItems: notFoundItems,
		summaryMessage: summaryLines.join("\n"),
	};
}
