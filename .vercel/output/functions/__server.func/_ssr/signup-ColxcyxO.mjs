import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/signup-ColxcyxO.js
var import_jsx_runtime = require_jsx_runtime();
function SignupPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -left-32 top-0 size-[28rem] animate-float-slow rounded-full bg-primary/25 blur-[120px]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -right-24 bottom-0 size-[26rem] animate-float-slow rounded-full bg-accent/25 blur-[120px] [animation-delay:2s]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] [background-size:44px_44px]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "glass relative w-full max-w-md animate-rise rounded-3xl p-6 sm:p-8 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex items-center justify-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground glow-primary",
						children: "TJ"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block font-display text-sm font-semibold",
							children: "Trading Journal AI"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-[11px] text-muted-foreground",
							children: "Track. Analyze. Improve."
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto size-16 grid place-items-center rounded-2xl bg-primary/20 text-3xl",
							children: "🎉"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-4 font-display text-2xl font-semibold",
							children: "Instant Access Unlocked"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted-foreground",
							children: "No signup or approval required. Start logging trades and exploring AI insights right away."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							className: "mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] glow-primary",
							children: "Enter Dashboard Directly"
						})
					]
				})]
			})
		]
	});
}
//#endregion
export { SignupPage as component };
