import { Attachment, ColorResolvable, HexColorString } from "discord.js";

export class StickyMessage {
	private _title?: string;
	private _content?: string;
	private _customId?: string;
	private _attachment?: string;
	private _colour?: ColorResolvable;

	constructor(fields?: {
		title?: string;
		content?: string;
		customId?: string;
		attachment?: string;
		colour?: ColorResolvable;
	}) {
		this._title = fields?.title;
		this._content = fields?.content;
		this._customId = fields?.customId;
		this._attachment = fields?.attachment;
		this._colour = fields?.colour;
	}

	public getTitle(): string | null {
		return this._title ?? null;
	}

	public getContent(): string | null {
		return this._content ?? null;
	}

	public getCustomId(): string | null {
		return this._customId ?? null;
	}

	public getAttachment(): string | null {
		return this._attachment ?? null;
	}
	public getColour(): ColorResolvable | null {
		return this._colour ?? null;
	}

	public setTitle(title: string) {
		this._title = title;
	}
	public setColour(colour: string) {
		this._colour = colour as ColorResolvable;
	}

	public setContent(content: string) {
		this._content = content;
	}

	public setCustomId(customId: string) {
		this._customId = customId;
	}

	public setAttachment(attachment: string) {
		this._attachment = attachment;
	}
}
