//#region node_modules/.nitro/vite/services/ssr/index.js
var serverEntryPromise;
async function getServerEntry() {
	if (!serverEntryPromise) serverEntryPromise = import("./server-B_u24DzG.mjs").then((m) => m.default ?? m);
	return serverEntryPromise;
}
var server_default = { async fetch(request, env, ctx) {
	try {
		return await (await getServerEntry()).fetch(request, env, ctx);
	} catch (error) {
		console.error("SSR handler fetch notice:", error);
		return await (await getServerEntry()).fetch(request, env, ctx);
	}
} };
//#endregion
export { server_default as default };
