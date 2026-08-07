import { i as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { B as Download, z as FileText } from "../_libs/lucide-react.mjs";
import { i as Panel, n as Badge, t as AppShell } from "./AppShell-RXXdI0nA.mjs";
import { c as money, l as monthly, o as fetchUserTrades, p as stats, u as pct } from "./trades-CFBoh8Ws.mjs";
import { i as TrendChart, t as BarsChart } from "./charts-rELH3m7H.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reports-BB4ngepm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Reports() {
	const [userTrades, setUserTrades] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		fetchUserTrades().then((data) => setUserTrades(data));
	}, []);
	const months = monthly(userTrades);
	const s = stats(userTrades);
	const weekly = months.slice(-6).map((m, i) => ({
		label: `Week ${i + 1}`,
		pnl: Math.round(m.pnl / 4),
		winRate: m.winRate
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Reports",
		subtitle: "Weekly & monthly performance summaries",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 lg:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Monthly Report",
					className: "lg:col-span-2",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-accent px-3 py-1.5 text-xs font-semibold text-primary-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }), " Export"]
					}),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarsChart, { data: months }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 grid gap-2 sm:grid-cols-2",
						children: months.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: m.label
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-muted-foreground",
									children: [
										m.trades,
										" trades · ",
										pct(m.winRate)
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: m.pnl >= 0 ? "font-semibold text-[oklch(0.72_0.19_155)]" : "font-semibold text-destructive",
									children: money(m.pnl)
								})
							]
						}, m.name))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Summary",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-3 text-sm",
						children: [
							["Total Trades", String(s.total)],
							["Win Rate", pct(s.winRate)],
							["Profit Factor", s.profitFactor.toFixed(2)],
							["Average RRR", `1:${s.avgRRR.toFixed(2)}`],
							["Net PnL", money(s.net)],
							["Best Pair", s.bestPair.name]
						].map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between border-b border-border/50 pb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: k
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: v
							})]
						}, k))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 space-y-2",
						children: [
							"Monthly report — Jul 2026",
							"Weekly report — W27",
							"Tax summary 2026"
						].map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "flex w-full items-center gap-2 rounded-xl border border-border bg-card/50 px-3 py-2.5 text-left text-xs transition hover:border-primary/50",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-4 text-primary" }),
								" ",
								r,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "primary",
									children: "PDF"
								})
							]
						}, r))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Weekly Performance",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarsChart, { data: weekly })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Win Rate Trend",
					className: "lg:col-span-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendChart, { data: months })
				})
			]
		})
	});
}
//#endregion
export { Reports as component };
