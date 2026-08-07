import { i as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { O as Percent, R as Flame, f as Target, g as Snowflake, l as TrendingUp, r as Wallet, s as Trophy, tt as Activity, u as TrendingDown, w as Scale } from "../_libs/lucide-react.mjs";
import { a as StatCard, i as Panel, n as Badge, t as AppShell } from "./AppShell-RXXdI0nA.mjs";
import { a as equityCurve, c as money, d as pnlUsd, l as monthly, o as fetchUserTrades, p as stats, u as pct } from "./trades-CFBoh8Ws.mjs";
import { a as WinLossPie, r as EquityChart, t as BarsChart } from "./charts-rELH3m7H.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BPH2xQPx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Dashboard() {
	const [userTrades, setUserTrades] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		fetchUserTrades().then((data) => setUserTrades(data));
	}, []);
	const s = stats(userTrades);
	const eq = equityCurve(userTrades);
	const months = monthly(userTrades);
	const recent = [...userTrades].slice(-8).reverse();
	const weekly = months.slice(-7).map((m, i) => ({
		label: `W${i + 1}`,
		pnl: Math.round(m.pnl / 4)
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Dashboard",
		subtitle: "Track. Analyze. Improve.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "glass relative animate-rise overflow-hidden rounded-[2rem] p-6 sm:p-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -left-24 -top-32 size-80 rounded-full bg-primary/25 blur-3xl" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -right-20 -bottom-32 size-72 rounded-full bg-accent/20 blur-3xl" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-primary",
								children: "Net Performance"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-5 font-display text-5xl leading-none text-gradient sm:text-6xl lg:text-7xl",
								children: money(s.net)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-4 max-w-md text-sm text-muted-foreground",
								children: [
									s.total,
									" trades logged · ",
									pct(s.winRate),
									" win rate · profit factor ",
									s.profitFactor.toFixed(2),
									". Aapka edge data mein clearly visible hai."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 flex flex-wrap gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/journal",
									className: "rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 glow-primary",
									children: "Log a trade"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/ai-coach",
									className: "rounded-xl border border-border bg-card/40 px-5 py-2.5 text-sm font-medium transition hover:bg-card/70",
									children: "Ask AI Coach"
								})]
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-3 gap-3 sm:gap-4",
							children: [
								{
									k: "Win Rate",
									v: pct(s.winRate)
								},
								{
									k: "Avg RRR",
									v: `1:${s.avgRRR.toFixed(2)}`
								},
								{
									k: "Monthly",
									v: money(s.monthlyPnl)
								}
							].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hairline rounded-2xl bg-background/30 p-4 text-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
									children: i.k
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 font-display text-xl sm:text-2xl",
									children: i.v
								})]
							}, i.k))
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Total Trades",
						value: String(s.total),
						sub: "all time",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Win Rate",
						value: pct(s.winRate),
						delta: 4.2,
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Target, { className: "size-4" }),
						accent: "success"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Average RRR",
						value: `1 : ${s.avgRRR.toFixed(2)}`,
						sub: "risk / reward",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scale, { className: "size-4" }),
						accent: "accent"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Profit Factor",
						value: s.profitFactor.toFixed(2),
						delta: 1.8,
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Percent, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Monthly PnL",
						value: money(s.monthlyPnl),
						delta: s.monthlyPnl >= 0 ? 8.4 : -6.1,
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-4" }),
						accent: s.monthlyPnl >= 0 ? "success" : "destructive"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Win Streak",
						value: `${s.winStreak}`,
						sub: "consecutive wins",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "size-4" }),
						accent: "success"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Loss Streak",
						value: `${s.lossStreak}`,
						sub: "consecutive losses",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Snowflake, { className: "size-4" }),
						accent: "destructive"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Best Pair",
						value: s.bestPair.name,
						sub: `${money(s.bestPair.pnl)} · ${pct(s.bestPair.winRate)}`,
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: "size-4" }),
						accent: "success"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Worst Pair",
						value: s.worstPair.name,
						sub: `${money(s.worstPair.pnl)} · ${pct(s.worstPair.winRate)}`,
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingDown, { className: "size-4" }),
						accent: "destructive"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Weekly PnL",
						value: money(s.weeklyPnl),
						delta: 2.6,
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-4" }),
						accent: "accent"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-4 lg:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Equity Curve",
					className: "lg:col-span-2",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						tone: s.net >= 0 ? "win" : "loss",
						children: [money(s.net), " net"]
					}),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EquityChart, { data: eq })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Win / Loss Split",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WinLossPie, {
						wins: s.wins,
						losses: s.losses
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex justify-center gap-5 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "size-2 rounded-full bg-[oklch(0.72_0.19_155)]" }),
								s.wins,
								" Wins"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "size-2 rounded-full bg-destructive" }),
								s.losses,
								" Losses"
							]
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Monthly Performance",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarsChart, { data: months })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Weekly Performance",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarsChart, { data: weekly })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Recent Trades",
				className: "mt-4",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/journal",
					className: "text-xs font-medium text-primary hover:underline",
					children: "View all"
				}),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "-mx-2 overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[640px] text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "text-left text-[11px] uppercase tracking-wide text-muted-foreground",
							children: [
								"Date",
								"Pair",
								"Side",
								"Session",
								"RRR",
								"Result",
								"PnL"
							].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-2 pb-3 font-medium",
								children: h
							}, h))
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: recent.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-border/60 transition hover:bg-muted/30",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-3 text-muted-foreground",
									children: t.date
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-3 font-medium",
									children: t.pair
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: t.side === "Buy" ? "primary" : "muted",
										children: t.side
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-3 text-muted-foreground",
									children: t.session
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-2 py-3",
									children: ["1:", t.rrr]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: t.result === "Win" ? "win" : "loss",
										children: t.result
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: `px-2 py-3 font-semibold ${pnlUsd(t) >= 0 ? "text-[oklch(0.72_0.19_155)]" : "text-destructive"}`,
									children: money(pnlUsd(t))
								})
							]
						}, t.id)) })]
					})
				})
			})
		]
	});
}
//#endregion
export { Dashboard as component };
