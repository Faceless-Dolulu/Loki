// import {
// 	ActionRowBuilder,
// 	MessageActionRowComponentBuilder,
// 	MessageComponentInteraction,
// } from "discord.js";

// export function updateComponent<T extends MessageActionRowComponentBuilder>(
// 	interaction: MessageComponentInteraction,
// 	newButtonFunc: (component: T) => T,
// 	customId = interaction.customId
// ): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
// 	const indices = findComponent(interaction, customId);
// 	if (!indices) {
// 		return [];
// 	}

// 	const actionRows = interaction.message.components.map<
// 		ActionRowBuilder<MessageActionRowComponentBuilder>
// 	>((row) => ActionRowBuilder.from(row));
// 	newButtonFunc(
// 		actionRows[indices.actionRowIndex].components[indices.componentIndex] as T
// 	);

// 	return actionRows;
// }

// function findComponent(
// 	interaction: MessageComponentInteraction,
// 	customId: string
// ): { actionRowIndex: number; componentIndex: number } | undefined {
// 	const actionRows = interaction.message.components;
// 	for (
// 		let actionRowIndex = 0;
// 		actionRowIndex < actionRows.length;
// 		++actionRowIndex
// 	) {
// 		const actionRow = actionRows[actionRowIndex];

// 		for (
// 			let componentIndex = 0;
// 			componentIndex < actionRow.components.length;
// 			++componentIndex
// 		) {
// 			if (actionRow.components[componentIndex].customId === customId) {
// 				return {
// 					actionRowIndex,
// 					componentIndex,
// 				};
// 			}
// 		}
// 	}
// }
