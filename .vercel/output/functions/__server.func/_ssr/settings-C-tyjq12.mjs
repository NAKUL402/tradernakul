import { i as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { B as Download, T as Save, j as Moon, o as Upload, p as Sun } from "../_libs/lucide-react.mjs";
import { i as Panel, o as cn, t as AppShell } from "./AppShell-RXXdI0nA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-C-tyjq12.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ACCENTS = [
	{
		name: "Neon Blue",
		value: "oklch(0.64 0.21 268)"
	},
	{
		name: "Violet",
		value: "oklch(0.62 0.24 305)"
	},
	{
		name: "Emerald",
		value: "oklch(0.72 0.19 155)"
	},
	{
		name: "Amber",
		value: "oklch(0.78 0.16 85)"
	},
	{
		name: "Rose",
		value: "oklch(0.65 0.23 15)"
	}
];
function Toggle({ on, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		role: "switch",
		"aria-checked": on,
		onClick: () => onChange(!on),
		className: cn("h-6 w-11 rounded-full p-0.5 transition", on ? "bg-gradient-to-r from-primary to-accent" : "bg-muted"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("block size-5 rounded-full bg-background transition-transform", on && "translate-x-5") })
	});
}
function SettingsPage() {
	const [dark, setDark] = (0, import_react.useState)(true);
	const [accent, setAccent] = (0, import_react.useState)(ACCENTS[0].value);
	const [currency, setCurrency] = (0, import_react.useState)("USD ($)");
	const [notif, setNotif] = (0, import_react.useState)({
		daily: true,
		weekly: true,
		coach: false
	});
	const setTheme = (isDark) => {
		setDark(isDark);
		document.documentElement.classList.toggle("dark", isDark);
	};
	const applyAccent = (v) => {
		setAccent(v);
		document.documentElement.style.setProperty("--primary", v);
		document.documentElement.style.setProperty("--ring", v);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Settings",
		subtitle: "Personalise your journal",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 lg:grid-cols-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Appearance",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: "Theme"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Switch between dark and light mode"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex rounded-xl border border-border p-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setTheme(true),
								className: cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs", dark && "bg-primary/20 text-primary"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "size-3.5" }), " Dark"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setTheme(false),
								className: cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs", !dark && "bg-primary/20 text-primary"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "size-3.5" }), " Light"]
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: "Accent colour"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 flex gap-3",
							children: ACCENTS.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								"aria-label": a.name,
								onClick: () => applyAccent(a.value),
								className: cn("size-9 rounded-xl ring-offset-2 ring-offset-background transition", accent === a.value && "ring-2 ring-foreground"),
								style: { background: a.value }
							}, a.name))
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Trading Preferences",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-sm font-medium",
							children: "Currency"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: currency,
							onChange: (e) => setCurrency(e.target.value),
							className: "mt-2 w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring",
							children: [
								"USD ($)",
								"INR (₹)",
								"EUR (€)",
								"GBP (£)",
								"AED (د.إ)"
							].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: c }, c))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => toast.success("CSV export ready — download started."),
								className: "flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-3 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), " Export CSV"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => toast.info("Choose a CSV file to import your trades."),
								className: "flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium transition hover:border-primary/60",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), " Import CSV"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => toast.success("Backup created successfully."),
							className: "mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium transition hover:border-primary/60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }), " Create backup"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Notifications",
					className: "lg:col-span-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-4",
						children: [
							[
								"daily",
								"Daily summary",
								"Roz shaam ko aapka PnL summary"
							],
							[
								"weekly",
								"Weekly report",
								"Har Sunday performance report"
							],
							[
								"coach",
								"AI Coach alerts",
								"Rule break hone par instant alert"
							]
						].map(([key, title, desc]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: desc
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								on: notif[key],
								onChange: (v) => setNotif({
									...notif,
									[key]: v
								})
							})]
						}, key))
					})
				})
			]
		})
	});
}
//#endregion
export { SettingsPage as component };
