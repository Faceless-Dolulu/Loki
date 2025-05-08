/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		// Assume path is /cases/:guildId/:caseId/:filename
		const [, , guildId, caseId, fileName] = url.pathname.split('/');
		const key = ['cases', guildId, caseId, fileName].join('/');
		const object = await env.IMAGES_BUCKET.get(key);
		if (!object || !object.body) {
			return new Response('Not Found', { status: 404 });
		}

		const headers = new Headers();

		headers.set('Content-Type', object.httpMetadata?.contentType ?? 'application/octet-stream');

		return new Response(object.body, { status: 200, headers });
	},
} satisfies ExportedHandler<Env>;
