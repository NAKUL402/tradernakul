import { i as __toESM, n as __exportAll$1 } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react, t as QueryClientProvider } from "../_libs/react+tanstack__react-query.mjs";
import { _ as createRootRouteWithContext, g as createFileRoute, h as lazyRouteComponent, l as Scripts, m as Outlet, p as createRouter, u as HeadContent, v as Link, x as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-BCFNEo9i.js
var router_BCFNEo9i_exports = /* @__PURE__ */ __exportAll$1({
	getRouter: () => getRouter,
	n: () => useAuth,
	t: () => router_exports
});
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
var AuthContext = (0, import_react.createContext)(void 0);
var OPEN_ACCESS_USER = {
	id: "open-access-trader-007",
	app_metadata: { provider: "email" },
	user_metadata: { name: "Trader Nakul" },
	aud: "authenticated",
	created_at: (/* @__PURE__ */ new Date()).toISOString(),
	email: "nakultrader007@gmail.com"
};
var OPEN_ACCESS_PROFILE = {
	id: "open-access-trader-007",
	email: "nakultrader007@gmail.com",
	full_name: "Trader Nakul",
	avatar_url: null,
	role: "admin",
	status: "approved",
	is_owner: true,
	created_at: (/* @__PURE__ */ new Date()).toISOString(),
	updated_at: (/* @__PURE__ */ new Date()).toISOString()
};
var OPEN_ACCESS_SESSION = {
	access_token: "open-access-token",
	token_type: "bearer",
	expires_in: 36e5,
	refresh_token: "open-access-refresh",
	user: OPEN_ACCESS_USER
};
function AuthProvider({ children }) {
	const [user, setUser] = (0, import_react.useState)(OPEN_ACCESS_USER);
	const [session, setSession] = (0, import_react.useState)(OPEN_ACCESS_SESSION);
	const [profile, setProfile] = (0, import_react.useState)(OPEN_ACCESS_PROFILE);
	const [isLoading, setIsLoading] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setUser(OPEN_ACCESS_USER);
		setSession(OPEN_ACCESS_SESSION);
		setProfile(OPEN_ACCESS_PROFILE);
		setIsLoading(false);
	}, []);
	const sendOTP = async (email) => {
		toast.success(`Open Access active! Verification code sent to ${email} (Instant Access Enabled).`);
	};
	const verifyOTP = async (email, _token) => {
		const cleanedEmail = email.toLowerCase().trim();
		const activeProfile = {
			id: `usr-${cleanedEmail.replace(/[^a-z0-9]/g, "")}`,
			email: cleanedEmail,
			full_name: cleanedEmail.split("@")[0] || "Trader",
			avatar_url: null,
			role: "admin",
			status: "approved",
			is_owner: true,
			created_at: (/* @__PURE__ */ new Date()).toISOString(),
			updated_at: (/* @__PURE__ */ new Date()).toISOString()
		};
		setUser({
			id: activeProfile.id,
			email: cleanedEmail
		});
		setProfile(activeProfile);
		toast.success("Welcome to TraderNakul AI! Instant Open Access Granted.");
	};
	const signOut = async () => {
		toast.info("Open Access Mode: You are free to browse and use all features.");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthContext.Provider, {
		value: {
			user,
			session,
			profile,
			isLoading: false,
			isApproved: true,
			isAdmin: true,
			isOwner: true,
			sendOTP,
			verifyOTP,
			signOut
		},
		children
	});
}
function useAuth() {
	const context = (0, import_react.useContext)(AuthContext);
	if (!context) throw new Error("useAuth must be used within an AuthProvider");
	return context;
}
var styles_default = "/assets/styles-DHAwhRMF.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const message = error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? error.stack : void 0;
	window.__lovableReportRuntimeError?.({
		message,
		...stack !== void 0 && { stack },
		filename: window.location.pathname
	});
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center glass p-8 rounded-3xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 glow-primary",
						children: "Go Home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		try {
			reportLovableError(error, { boundary: "tanstack_root_error_component" });
		} catch (e) {
			console.error("Error reporting exception:", e);
		}
	}, [error]);
	const handleRefresh = () => {
		try {
			router.invalidate();
		} catch {}
		reset();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center glass p-8 rounded-3xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "TraderNakul AI Dashboard"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Reconnecting to your session..."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: handleRefresh,
						className: "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 glow-primary",
						children: "Refresh Session"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-xl border border-border bg-card/40 px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-card/70",
						children: "Go Home"
					})]
				})
			]
		})
	});
}
var Route$11 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Dashboard — Trading Journal AI" },
			{
				name: "description",
				content: "Track, analyze and improve your trading with AI-powered analytics, equity curves and performance insights."
			},
			{
				name: "author",
				content: "Trading Journal AI"
			},
			{
				property: "og:title",
				content: "Dashboard — Trading Journal AI"
			},
			{
				property: "og:description",
				content: "Track, analyze and improve your trading with AI-powered analytics, equity curves and performance insights."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "twitter:site",
				content: "@Lovable"
			},
			{
				name: "twitter:title",
				content: "Dashboard — Trading Journal AI"
			},
			{
				name: "twitter:description",
				content: "Track, analyze and improve your trading with AI-powered analytics, equity curves and performance insights."
			},
			{
				property: "og:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f700659d-7641-4ea6-ad65-aeb5c2121e42/id-preview-7c0b8476--acc96bba-8a8e-45ce-8970-e7eb67c83866.lovable.app-1785921707611.png"
			},
			{
				name: "twitter:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f700659d-7641-4ea6-ad65-aeb5c2121e42/id-preview-7c0b8476--acc96bba-8a8e-45ce-8970-e7eb67c83866.lovable.app-1785921707611.png"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "dark",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$11.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, { position: "top-center" })]
	}) });
}
var $$splitComponentImporter$10 = () => import("./routes-BPH2xQPx.mjs");
var Route$10 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Dashboard — Trading Journal AI" },
		{
			name: "description",
			content: "Track, analyze and improve your trading with AI-powered analytics, equity curves and performance insights."
		},
		{
			property: "og:title",
			content: "Dashboard — Trading Journal AI"
		},
		{
			property: "og:description",
			content: "Track, analyze and improve your trading with AI-powered analytics, equity curves and performance insights."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./admin-CZ0i4dr8.mjs");
var Route$9 = createFileRoute("/admin")({
	head: () => ({ meta: [{ title: "Owner Admin Dashboard — Trading Journal AI" }, {
		name: "description",
		content: "Secure Owner Admin Portal: User approvals, access control, website settings, and analytics."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./ai-coach-BD37rVvD.mjs");
var Route$8 = createFileRoute("/ai-coach")({
	head: () => ({ meta: [
		{ title: "AI Coach — Trading Journal AI" },
		{
			name: "description",
			content: "World-class AI trading mentor: weekly golden rules, institutional performance grades, psychology analysis, and risk reviews."
		},
		{
			property: "og:title",
			content: "AI Coach — Trading Journal AI"
		},
		{
			property: "og:description",
			content: "World-class AI trading mentor & performance lab."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./analytics-XrMo0LKz.mjs");
var Route$7 = createFileRoute("/analytics")({
	head: () => ({ meta: [
		{ title: "Analytics — Trading Journal AI" },
		{
			name: "description",
			content: "Deep performance analytics: pair, session, setup, day-of-week, time-of-day, drawdown and risk analysis."
		},
		{
			property: "og:title",
			content: "Analytics — Trading Journal AI"
		},
		{
			property: "og:description",
			content: "Interactive charts for pair, session and setup performance plus drawdown and risk analysis."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./calendar-D_hyRIcd.mjs");
var Route$6 = createFileRoute("/calendar")({
	head: () => ({ meta: [
		{ title: "Calendar — Trading Journal AI" },
		{
			name: "description",
			content: "Daily PnL calendar heatmap showing which trading days made money and which cost you."
		},
		{
			property: "og:title",
			content: "Calendar — Trading Journal AI"
		},
		{
			property: "og:description",
			content: "Visual PnL heatmap of every trading day of the month."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./journal-BdDIH5Gg.mjs");
var Route$5 = createFileRoute("/journal")({
	head: () => ({ meta: [
		{ title: "Trading Journal — Trading Journal AI" },
		{
			name: "description",
			content: "Log every trade with setup, session, RRR, risk, tags, screenshots and notes in a premium journal interface."
		},
		{
			property: "og:title",
			content: "Trading Journal — Trading Journal AI"
		},
		{
			property: "og:description",
			content: "Premium trade logging with filters, tags, screenshots and detailed notes."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./login-BR0kC3tJ.mjs");
var Route$4 = createFileRoute("/login")({
	head: () => ({ meta: [{ title: "Open Access — Trading Journal AI" }, {
		name: "description",
		content: "Free Instant Access to Trading Journal AI dashboard and tools."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./profile-DxLpJvuc.mjs");
var Route$3 = createFileRoute("/profile")({
	head: () => ({ meta: [
		{ title: "Profile — Trading Journal AI" },
		{
			name: "description",
			content: "Your trader profile: plan, trading style, stats snapshot and account details."
		},
		{
			property: "og:title",
			content: "Profile — Trading Journal AI"
		},
		{
			property: "og:description",
			content: "Trader profile with plan details and lifetime performance snapshot."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./reports-BB4ngepm.mjs");
var Route$2 = createFileRoute("/reports")({
	head: () => ({ meta: [
		{ title: "Reports — Trading Journal AI" },
		{
			name: "description",
			content: "Weekly and monthly trading reports with exportable performance summaries."
		},
		{
			property: "og:title",
			content: "Reports — Trading Journal AI"
		},
		{
			property: "og:description",
			content: "Download weekly and monthly trading performance reports."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./settings-C-tyjq12.mjs");
var Route$1 = createFileRoute("/settings")({
	head: () => ({ meta: [
		{ title: "Settings — Trading Journal AI" },
		{
			name: "description",
			content: "Control theme, accent colour, currency, CSV import/export, backups and notifications."
		},
		{
			property: "og:title",
			content: "Settings — Trading Journal AI"
		},
		{
			property: "og:description",
			content: "Personalise your trading journal: theme, accent, currency and data backups."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./signup-ColxcyxO.mjs");
var Route = createFileRoute("/signup")({
	head: () => ({ meta: [{ title: "Open Access — Trading Journal AI" }, {
		name: "description",
		content: "Free Instant Access to Trading Journal AI dashboard and tools."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var rootRouteChildren = {
	IndexRoute: Route$10.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$11
	}),
	AdminRoute: Route$9.update({
		id: "/admin",
		path: "/admin",
		getParentRoute: () => Route$11
	}),
	AiCoachRoute: Route$8.update({
		id: "/ai-coach",
		path: "/ai-coach",
		getParentRoute: () => Route$11
	}),
	AnalyticsRoute: Route$7.update({
		id: "/analytics",
		path: "/analytics",
		getParentRoute: () => Route$11
	}),
	CalendarRoute: Route$6.update({
		id: "/calendar",
		path: "/calendar",
		getParentRoute: () => Route$11
	}),
	JournalRoute: Route$5.update({
		id: "/journal",
		path: "/journal",
		getParentRoute: () => Route$11
	}),
	LoginRoute: Route$4.update({
		id: "/login",
		path: "/login",
		getParentRoute: () => Route$11
	}),
	ProfileRoute: Route$3.update({
		id: "/profile",
		path: "/profile",
		getParentRoute: () => Route$11
	}),
	ReportsRoute: Route$2.update({
		id: "/reports",
		path: "/reports",
		getParentRoute: () => Route$11
	}),
	SettingsRoute: Route$1.update({
		id: "/settings",
		path: "/settings",
		getParentRoute: () => Route$11
	}),
	SignupRoute: Route.update({
		id: "/signup",
		path: "/signup",
		getParentRoute: () => Route$11
	})
};
var routeTree = Route$11._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { useAuth as n, router_BCFNEo9i_exports as t };
