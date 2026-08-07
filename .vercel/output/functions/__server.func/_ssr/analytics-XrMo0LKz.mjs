import { i as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { a as StatCard, i as Panel, t as AppShell } from "./AppShell-RXXdI0nA.mjs";
import { a as equityCurve, c as money, l as monthly, o as fetchUserTrades, p as stats, s as groupStats, t as DOW, u as pct } from "./trades-CFBoh8Ws.mjs";
import { i as TrendChart, n as DrawdownChart, t as BarsChart } from "./charts-rELH3m7H.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics-XrMo0LKz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Table({ rows }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-x-auto text-xs sm:text-sm",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full min-w-[320px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "pb-2 font-medium",
						children: "Name"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "pb-2 font-medium",
						children: "Trades"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "pb-2 font-medium",
						children: "Win Rate"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "pb-2 font-medium text-right",
						children: "PnL"
					})
				]
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "border-b border-border/40 transition hover:bg-muted/10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "py-2.5 font-medium",
						children: row.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "py-2.5 text-muted-foreground",
						children: row.trades
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "py-2.5 text-muted-foreground",
						children: pct(row.winRate)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: `py-2.5 text-right font-semibold ${row.pnl >= 0 ? "text-[oklch(0.72_0.19_155)]" : "text-destructive"}`,
						children: money(row.pnl)
					})
				]
			}, row.name)) })]
		})
	});
}
function Analytics() {
	const [userTrades, setUserTrades] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		fetchUserTrades().then((data) => setUserTrades(data));
	}, []);
	const s = stats(userTrades);
	const eq = equityCurve(userTrades);
	const byPair = groupStats(userTrades, (t) => t.pair).sort((a, b) => b.pnl - a.pnl);
	const bySession = groupStats(userTrades, (t) => t.session);
	const bySetup = groupStats(userTrades, (t) => t.setup).sort((a, b) => b.pnl - a.pnl);
	const byDow = groupStats(userTrades, (t) => DOW[(/* @__PURE__ */ new Date(`${t.date}T00:00:00Z`)).getUTCDay()]).map((g) => ({
		...g,
		label: g.name
	}));
	const byHour = groupStats(userTrades, (t) => `${t.entryTime.slice(0, 2)}:00`).sort((a, b) => a.name < b.name ? -1 : 1).map((g) => ({
		...g,
		label: g.name
	}));
	const months = monthly(userTrades);
	const risk = groupStats(userTrades, (t) => `${t.riskPct}%`).sort((a, b) => parseFloat(a.name) - parseFloat(b.name)).map((g) => ({
		...g,
		label: g.name,
		count: g.trades
	}));
	const maxDd = Math.min(...eq.map((e) => e.drawdown));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Analytics",
		subtitle: "Advanced performance breakdown",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-2 gap-3 lg:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Net PnL",
					value: money(s.net),
					accent: s.net >= 0 ? "success" : "destructive",
					delta: 5.3
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Max Drawdown",
					value: `${maxDd.toFixed(1)}%`,
					accent: "destructive",
					sub: "peak to valley"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Avg Win",
					value: money(Math.round(s.avgWin)),
					accent: "success"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Avg Loss",
					value: money(-Math.round(s.avgLoss)),
					accent: "destructive"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid gap-4 lg:grid-cols-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Pair-wise Performance",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarsChart, { data: byPair.map((p) => ({
						...p,
						label: p.name
					})) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Table, { rows: byPair })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Session-wise Performance",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarsChart, { data: bySession.map((p) => ({
						...p,
						label: p.name
					})) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Table, { rows: bySession })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Setup-wise Performance",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Table, { rows: bySetup })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Day of Week",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarsChart, { data: byDow })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Time of Day (entry hour)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarsChart, {
						data: byHour,
						height: 230
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Win Rate Trend",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendChart, { data: months })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Monthly Report",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarsChart, { data: months }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Table, { rows: months })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Risk Distribution",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarsChart, {
						data: risk,
						yKey: "count",
						height: 230
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Drawdown Analysis",
					className: "lg:col-span-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DrawdownChart, { data: eq })
				})
			]
		})]
	});
}
//#endregion
export { Analytics as component };
