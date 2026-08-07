import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as useAuth } from "./router-BCFNEo9i.mjs";
import { i as Panel, n as Badge, t as AppShell } from "./AppShell-RXXdI0nA.mjs";
import { c as money, p as stats, u as pct } from "./trades-CFBoh8Ws.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-DxLpJvuc.js
var import_jsx_runtime = require_jsx_runtime();
function Profile() {
	const s = stats();
	const { user, profile, signOut } = useAuth();
	const name = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "Trader";
	const email = profile?.email || user?.email || "";
	const roleLabel = profile?.is_owner ? "Owner Admin" : profile?.role === "admin" ? "Admin" : "Trader";
	const statusLabel = profile?.status ? profile.status.toUpperCase() : "APPROVED";
	const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Profile",
		subtitle: "Your trader identity",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 lg:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "lg:col-span-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center gap-4 sm:flex-row",
					children: [profile?.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: profile.avatar_url,
						alt: name,
						className: "size-20 rounded-3xl object-cover ring-2 ring-primary/40 glow-primary"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-primary to-accent font-display text-2xl font-bold text-primary-foreground glow-primary",
						children: initials
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center sm:text-left",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-xl font-semibold",
								children: name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: email
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex flex-wrap justify-center gap-2 sm:justify-start",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "primary",
										children: roleLabel
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: profile?.status === "approved" || profile?.is_owner ? "win" : "muted",
										children: statusLabel
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: "Smart Money Concepts" })
								]
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4",
					children: [
						["Trades", String(s.total)],
						["Win Rate", pct(s.winRate)],
						["Net PnL", money(s.net)],
						["Best Pair", s.bestPair.name]
					].map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl bg-muted/40 p-3 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] uppercase text-muted-foreground",
							children: k
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-display text-lg font-semibold",
							children: v
						})]
					}, k))
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Account",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3 text-sm",
					children: [
						["Account size", "$10,000"],
						["Risk per trade", "1.2%"],
						["Broker", "IC Markets"],
						["Role", roleLabel]
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
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => signOut(),
					className: "mt-5 flex w-full items-center justify-center rounded-xl border border-border px-3 py-2.5 text-sm font-medium transition hover:border-destructive/60 hover:text-destructive",
					children: "Sign out"
				})]
			})]
		})
	});
}
//#endregion
export { Profile as component };
