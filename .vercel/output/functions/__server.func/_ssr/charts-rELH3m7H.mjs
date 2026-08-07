import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { a as YAxis, c as Line, d as Pie, f as Cell, i as LineChart, l as CartesianGrid, m as Tooltip, n as PieChart, o as XAxis, p as ResponsiveContainer, r as BarChart, s as Area, t as AreaChart, u as Bar } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/charts-rELH3m7H.js
var import_jsx_runtime = require_jsx_runtime();
var axis = {
	stroke: "var(--color-muted-foreground)",
	fontSize: 11,
	tickLine: false,
	axisLine: false
};
var tooltipStyle = {
	contentStyle: {
		background: "var(--color-popover)",
		border: "1px solid var(--color-border)",
		borderRadius: 14,
		fontSize: 12,
		color: "var(--color-popover-foreground)"
	},
	labelStyle: { color: "var(--color-muted-foreground)" }
};
function EquityChart({ data }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
		width: "100%",
		height: 260,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
			data,
			margin: {
				left: -18,
				right: 6,
				top: 6
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: "eq",
					x1: "0",
					y1: "0",
					x2: "0",
					y2: "1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "0%",
						stopColor: "var(--color-primary)",
						stopOpacity: .55
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "100%",
						stopColor: "var(--color-primary)",
						stopOpacity: 0
					})]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
					vertical: false,
					stroke: "var(--color-border)"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
					dataKey: "i",
					...axis
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
					...axis,
					width: 56
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { ...tooltipStyle }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
					type: "monotone",
					dataKey: "equity",
					stroke: "var(--color-primary)",
					strokeWidth: 2.4,
					fill: "url(#eq)"
				})
			]
		})
	});
}
function DrawdownChart({ data }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
		width: "100%",
		height: 220,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
			data,
			margin: {
				left: -18,
				right: 6,
				top: 6
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: "dd",
					x1: "0",
					y1: "0",
					x2: "0",
					y2: "1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "0%",
						stopColor: "var(--color-destructive)",
						stopOpacity: 0
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "100%",
						stopColor: "var(--color-destructive)",
						stopOpacity: .5
					})]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
					vertical: false,
					stroke: "var(--color-border)"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
					dataKey: "i",
					...axis
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
					...axis,
					width: 44,
					unit: "%"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { ...tooltipStyle }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
					type: "monotone",
					dataKey: "drawdown",
					stroke: "var(--color-destructive)",
					strokeWidth: 2,
					fill: "url(#dd)"
				})
			]
		})
	});
}
function WinLossPie({ wins, losses }) {
	const data = [{
		name: "Wins",
		value: wins,
		color: "oklch(0.72 0.19 155)"
	}, {
		name: "Losses",
		value: losses,
		color: "var(--color-destructive)"
	}];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
		width: "100%",
		height: 230,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PieChart, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pie, {
			data,
			dataKey: "value",
			innerRadius: 62,
			outerRadius: 92,
			paddingAngle: 4,
			stroke: "none",
			children: data.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { fill: d.color }, d.name))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { ...tooltipStyle })] })
	});
}
function BarsChart({ data, xKey = "label", yKey = "pnl", height = 240, unit }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
		width: "100%",
		height,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
			data,
			margin: {
				left: -18,
				right: 6,
				top: 6
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
					vertical: false,
					stroke: "var(--color-border)"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
					dataKey: xKey,
					...axis,
					interval: 0
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
					...axis,
					width: 52,
					...unit ? { unit } : {}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
					...tooltipStyle,
					cursor: {
						fill: "var(--color-muted)",
						opacity: .35
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
					dataKey: yKey,
					radius: [
						8,
						8,
						4,
						4
					],
					children: data.map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { fill: Number(d[yKey]) >= 0 ? "var(--color-primary)" : "var(--color-destructive)" }, i))
				})
			]
		})
	});
}
function TrendChart({ data, yKey = "winRate" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
		width: "100%",
		height: 230,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
			data,
			margin: {
				left: -18,
				right: 6,
				top: 6
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
					vertical: false,
					stroke: "var(--color-border)"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
					dataKey: "label",
					...axis
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
					...axis,
					width: 44,
					unit: "%"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { ...tooltipStyle }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
					type: "monotone",
					dataKey: yKey,
					stroke: "var(--color-accent)",
					strokeWidth: 2.6,
					dot: {
						r: 3,
						fill: "var(--color-accent)"
					}
				})
			]
		})
	});
}
//#endregion
export { WinLossPie as a, TrendChart as i, DrawdownChart as n, EquityChart as r, BarsChart as t };
