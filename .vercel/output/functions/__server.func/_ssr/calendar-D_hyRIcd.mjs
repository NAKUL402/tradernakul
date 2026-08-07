import { i as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { G as ChevronRight, K as ChevronLeft } from "../_libs/lucide-react.mjs";
import { i as Panel, n as Badge, o as cn, t as AppShell } from "./AppShell-RXXdI0nA.mjs";
import { c as money, d as pnlUsd, o as fetchUserTrades } from "./trades-CFBoh8Ws.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/calendar-D_hyRIcd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CalendarPage() {
	const [userTrades, setUserTrades] = (0, import_react.useState)([]);
	const [offset, setOffset] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		fetchUserTrades().then((data) => setUserTrades(data));
	}, []);
	const byDay = /* @__PURE__ */ new Map();
	for (const t of userTrades) byDay.set(t.date, (byDay.get(t.date) ?? 0) + pnlUsd(t));
	const base = new Date(Date.UTC(2026, 6 + offset, 1));
	const year = base.getUTCFullYear();
	const month = base.getUTCMonth();
	const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
	const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
	const label = base.toLocaleString("en-US", {
		month: "long",
		year: "numeric",
		timeZone: "UTC"
	});
	const cells = [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
	const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
	const monthPnl = [...byDay.entries()].filter(([d]) => d.startsWith(monthKey)).reduce((s, [, v]) => s + v, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Calendar",
		subtitle: "Daily PnL heatmap",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
			title: label,
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: monthPnl >= 0 ? "win" : "loss",
						children: money(monthPnl)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						"aria-label": "Previous month",
						onClick: () => setOffset((o) => o - 1),
						className: "rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						"aria-label": "Next month",
						onClick: () => setOffset((o) => o + 1),
						className: "rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })
					})
				]
			}),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-7 gap-1.5 text-center text-[10px] uppercase text-muted-foreground",
					children: [
						"Sun",
						"Mon",
						"Tue",
						"Wed",
						"Thu",
						"Fri",
						"Sat"
					].map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pb-1",
						children: d
					}, d))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-7 gap-1.5",
					children: cells.map((d, i) => {
						if (!d) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {}, `e${i}`);
						const key = `${monthKey}-${String(d).padStart(2, "0")}`;
						const pnl = byDay.get(key);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("flex aspect-square flex-col items-center justify-center rounded-xl p-1 transition hover:scale-105", pnl === void 0 ? "bg-muted/25 text-muted-foreground" : pnl >= 0 ? "bg-[oklch(0.72_0.19_155)]/20 text-[oklch(0.8_0.17_155)] ring-1 ring-[oklch(0.72_0.19_155)]/40" : "bg-destructive/20 text-destructive ring-1 ring-destructive/40"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] font-medium",
								children: d
							}), pnl !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[9px] font-semibold sm:text-[10px]",
								children: money(pnl)
							})]
						}, key);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex items-center justify-center gap-4 text-[11px] text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "size-2.5 rounded bg-[oklch(0.72_0.19_155)]/60" }), " Profit day"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "size-2.5 rounded bg-destructive/60" }), " Loss day"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "size-2.5 rounded bg-muted" }), " No trade"]
						})
					]
				})
			]
		})
	});
}
//#endregion
export { CalendarPage as component };
