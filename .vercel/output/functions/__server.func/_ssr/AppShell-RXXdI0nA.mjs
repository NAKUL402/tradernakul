import { i as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { b as useNavigate, d as useRouterState, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useAuth } from "./router-BCFNEo9i.mjs";
import { $ as ArrowUpRight, A as NotebookPen, C as Search, D as Plus, F as LoaderCircle, H as Clock, I as LayoutDashboard, J as CalendarDays, M as Menu, P as LogOut, U as CircleX, X as Bell, Y as Brain, a as User, b as ShieldAlert, et as ArrowDownRight, q as ChartColumn, x as Settings, y as ShieldCheck, z as FileText } from "../_libs/lucide-react.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AppShell-RXXdI0nA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function Panel({ title, action, children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: cn("glass animate-rise rounded-3xl p-4 sm:p-5", className),
		children: [(title || action) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex items-center justify-between gap-3",
			children: [title && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-sm font-semibold sm:text-base",
				children: title
			}), action]
		}), children]
	});
}
function StatCard({ label, value, sub, delta, icon, accent = "primary" }) {
	const ring = {
		primary: "from-primary/25",
		accent: "from-accent/25",
		success: "from-[oklch(0.72_0.19_155)]/25",
		destructive: "from-destructive/25"
	}[accent];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "glass group relative animate-rise overflow-hidden rounded-2xl p-4 transition-transform duration-300 hover:-translate-y-1",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("pointer-events-none absolute -right-10 -top-12 size-28 rounded-full bg-gradient-to-br to-transparent blur-2xl", ring) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
					children: label
				}), icon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-muted-foreground transition group-hover:text-primary",
					children: icon
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 font-display text-2xl font-semibold",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 flex items-center gap-2 text-xs",
				children: [typeof delta === "number" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: cn("inline-flex items-center gap-0.5 font-medium", delta >= 0 ? "text-[oklch(0.72_0.19_155)]" : "text-destructive"),
					children: [
						delta >= 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownRight, { className: "size-3" }),
						Math.abs(delta).toFixed(1),
						"%"
					]
				}), sub && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-muted-foreground",
					children: sub
				})]
			})
		]
	});
}
function Badge({ children, tone = "muted" }) {
	const tones = {
		win: "bg-[oklch(0.72_0.19_155)]/15 text-[oklch(0.78_0.17_155)] border-[oklch(0.72_0.19_155)]/30",
		loss: "bg-destructive/15 text-destructive border-destructive/30",
		primary: "bg-primary/15 text-primary border-primary/30",
		muted: "bg-muted/60 text-muted-foreground border-border"
	}[tone];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium", tones),
		children
	});
}
function EmptyState({ title, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-14 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-sm font-semibold",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "max-w-xs text-xs text-muted-foreground",
			children: hint
		})]
	});
}
function AccessPending() {
	const { user, profile, signOut } = useAuth();
	const name = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "Trader";
	const email = profile?.email || user?.email || "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex min-h-[80vh] items-center justify-center p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -left-24 top-0 size-80 rounded-full bg-primary/20 blur-[100px]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-accent/20 blur-[100px]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "glass relative w-full max-w-lg animate-rise rounded-3xl p-6 text-center sm:p-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-auto grid size-16 place-items-center rounded-2xl bg-amber-500/20 text-amber-400 glow-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-8 animate-pulse" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-6 font-display text-2xl font-semibold",
						children: "Access Pending Approval"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted-foreground",
						children: "Your access request has been submitted. The owner will review your request."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 rounded-2xl bg-card/60 p-4 text-left border border-border/60 space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Applicant Name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-foreground",
									children: name
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Email Address"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-foreground",
									children: email
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Current Status"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "muted",
									className: "bg-amber-500/20 text-amber-300 border-amber-500/30",
									children: "Pending Approval"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex items-center gap-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "size-4 shrink-0 text-amber-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Only approved accounts can view trading metrics, journal entries, and AI insights. You will gain full access as soon as the admin approves your account." })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => signOut(),
						className: "mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card/40 py-3 text-sm font-medium transition hover:bg-card/80 active:scale-[0.99]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" }), "Sign out"]
					})
				]
			})
		]
	});
}
function AccessDenied() {
	const { user, profile, signOut } = useAuth();
	const name = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "Trader";
	const email = profile?.email || user?.email || "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex min-h-[80vh] items-center justify-center p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -left-24 top-0 size-80 rounded-full bg-destructive/20 blur-[100px]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "glass relative w-full max-w-lg animate-rise rounded-3xl p-6 text-center sm:p-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto grid size-16 place-items-center rounded-2xl bg-destructive/20 text-destructive glow-primary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "size-8" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-6 font-display text-2xl font-semibold",
					children: "Access Denied"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Your access request to TraderNakul has been rejected by the owner."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 rounded-2xl bg-card/60 p-4 text-left border border-border/60 space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "User Name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium text-foreground",
								children: name
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "Email Address"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium text-foreground",
								children: email
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "Current Status"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "loss",
								children: "Access Denied"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => signOut(),
					className: "mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card/40 py-3 text-sm font-medium transition hover:bg-card/80 active:scale-[0.99]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" }), "Sign out"]
				})
			]
		})]
	});
}
function Gatekeeper({ children }) {
	const { user, profile, isLoading, isApproved } = useAuth();
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		if (!isLoading && (!user || !profile || !isApproved)) navigate({ to: "/login" });
	}, [
		user,
		profile,
		isLoading,
		isApproved,
		navigate
	]);
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-[70vh] items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-8 animate-spin text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: "Verifying access permissions…"
			})]
		})
	});
	if (!user || !profile || !isApproved) return null;
	if (profile.status === "pending" && !profile.is_owner) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccessPending, {});
	if ((profile.status === "rejected" || profile.status === "suspended") && !profile.is_owner) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccessDenied, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var nav = [
	{
		to: "/",
		label: "Dashboard",
		icon: LayoutDashboard
	},
	{
		to: "/journal",
		label: "Journal",
		icon: NotebookPen
	},
	{
		to: "/analytics",
		label: "Analytics",
		icon: ChartColumn
	},
	{
		to: "/ai-coach",
		label: "AI Coach",
		icon: Brain
	},
	{
		to: "/calendar",
		label: "Calendar",
		icon: CalendarDays
	},
	{
		to: "/reports",
		label: "Reports",
		icon: FileText
	},
	{
		to: "/settings",
		label: "Settings",
		icon: Settings
	},
	{
		to: "/profile",
		label: "Profile",
		icon: User
	}
];
var mobileNav = nav.slice(0, 5);
function Brand({ compact }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground glow-primary",
			children: "TJ"
		}), !compact && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "leading-tight",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-sm font-semibold",
				children: "Trading Journal AI"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] text-muted-foreground",
				children: "Track. Analyze. Improve."
			})]
		})]
	});
}
function AppShell({ title, subtitle, children }) {
	const [collapsed, setCollapsed] = (0, import_react.useState)(false);
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { user, profile } = useAuth();
	const name = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "TN";
	const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen w-full",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: cn("sticky top-0 hidden h-screen shrink-0 flex-col gap-6 border-r border-border/60 bg-sidebar/70 p-4 backdrop-blur-xl transition-[width] duration-300 lg:flex", collapsed ? "w-[86px]" : "w-[262px]"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, { compact: collapsed }), !collapsed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							"aria-label": "Collapse sidebar",
							onClick: () => setCollapsed(true),
							className: "rounded-lg p-2 text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-4" })
						})]
					}),
					collapsed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						"aria-label": "Expand sidebar",
						onClick: () => setCollapsed(false),
						className: "mx-auto rounded-lg p-2 text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "flex flex-1 flex-col gap-1",
						children: [nav.map((item) => {
							const active = pathname === item.to;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: item.to,
								title: item.label,
								className: cn("group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all", active ? "bg-gradient-to-r from-primary/25 to-accent/15 text-foreground shadow-[inset_0_0_0_1px_var(--color-border)]" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground", collapsed && "justify-center px-0"),
								children: [
									active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute left-0 h-6 w-1 rounded-r-full bg-gradient-to-b from-primary to-accent" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: cn("size-[18px] shrink-0", active && "text-primary") }),
									!collapsed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.label })
								]
							}, item.to);
						}), user?.email?.toLowerCase().trim() === "nakultrader007@gmail.com" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/admin",
							title: "Admin Portal",
							className: cn("group relative mt-2 flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/20", pathname === "/admin" && "bg-primary/30 shadow-[inset_0_0_0_1px_var(--color-primary)]", collapsed && "justify-center px-0"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-[18px] shrink-0 text-primary animate-pulse" }), !collapsed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Admin Portal" })]
						})]
					}),
					!collapsed && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "glass rounded-2xl p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-sm font-semibold",
								children: "Pro Plan"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: "Unlimited AI coach reviews & reports."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/ai-coach",
								className: "mt-3 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90",
								children: "Open AI Coach"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 flex-1 flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 px-4 py-3 sm:px-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "lg:hidden",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, { compact: true })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hidden min-w-0 flex-1 md:block",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "truncate font-display text-lg font-semibold",
									children: title
								}), subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-xs text-muted-foreground",
									children: subtitle
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "ml-auto flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "hidden items-center gap-2 rounded-xl border border-border/70 bg-card/50 px-3 py-2 text-xs text-muted-foreground sm:flex",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Search trades…" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										"aria-label": "Notifications",
										className: "relative rounded-xl border border-border/70 bg-card/50 p-2 text-muted-foreground transition hover:text-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute right-1.5 top-1.5 size-1.5 rounded-full bg-accent" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/profile",
										"aria-label": "Profile",
										className: "grid size-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-primary text-xs font-bold text-primary-foreground",
										children: profile?.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: profile.avatar_url,
											alt: name,
											className: "size-full rounded-xl object-cover"
										}) : initials
									})
								]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-4 pb-3 md:hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-xl font-semibold",
							children: title
						}), subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: subtitle
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pb-10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gatekeeper, { children })
				})]
			}),
			pathname === "/journal" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/journal?openModal=true",
				onClick: () => {
					if (typeof window !== "undefined" && window.location.pathname === "/journal") window.dispatchEvent(new CustomEvent("open_log_trade_modal"));
				},
				"aria-label": "Add trade",
				className: "fixed bottom-24 right-5 z-40 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground glow-primary transition active:scale-95 lg:bottom-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-6" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-xl lg:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-stretch justify-between px-2 py-2",
					children: mobileNav.map((item) => {
						const active = pathname === item.to;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							className: cn("flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition", active ? "text-primary" : "text-muted-foreground"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: cn("size-5", active && "drop-shadow-[0_0_8px_var(--color-primary)]") }), item.label]
						}, item.to);
					})
				})
			})
		]
	});
}
//#endregion
export { StatCard as a, Panel as i, Badge as n, cn as o, EmptyState as r, AppShell as t };
