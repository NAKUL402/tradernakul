import { i as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { b as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as useAuth } from "./router-BCFNEo9i.mjs";
import { H as Clock, N as Megaphone, T as Save, U as CircleX, W as CircleCheck, Z as Ban, b as ShieldAlert, d as Trash2, i as Users, t as Zap, tt as Activity, y as ShieldCheck } from "../_libs/lucide-react.mjs";
import { a as StatCard, i as Panel, n as Badge, t as AppShell } from "./AppShell-RXXdI0nA.mjs";
import { n as supabase } from "./supabase-BnRmJshq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-CZ0i4dr8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
async function sendStatusNotificationEmail({ email, name, status }) {
	try {
		const res = await fetch("/api/send-status-email", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email,
				name,
				status
			})
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok) return {
			success: false,
			error: data.error || `Server error: ${res.status}`
		};
		return { success: true };
	} catch (err) {
		return {
			success: false,
			error: `Network error: ${err instanceof Error ? err.message : String(err)}`
		};
	}
}
function AdminPage() {
	const { user, isAdmin, isOwner, isLoading } = useAuth();
	useNavigate();
	const [usersList, setUsersList] = (0, import_react.useState)([]);
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [isFetchingUsers, setIsFetchingUsers] = (0, import_react.useState)(true);
	const [totalDbTrades, setTotalDbTrades] = (0, import_react.useState)(0);
	const [banner, setBanner] = (0, import_react.useState)("Welcome to TraderNakul — Professional AI Trading Journal");
	const [bannerActive, setBannerActive] = (0, import_react.useState)(false);
	const [maintenance, setMaintenance] = (0, import_react.useState)(false);
	const [aiEnabled, setAiEnabled] = (0, import_react.useState)(true);
	const [mt5Enabled, setMt5Enabled] = (0, import_react.useState)(true);
	const [isSavingSettings, setIsSavingSettings] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		fetchUsers();
		fetchSettings();
	}, []);
	(0, import_react.useEffect)(() => {
		const isStrictAdmin = user?.email?.toLowerCase().trim() === "nakultrader007@gmail.com";
		if (isLoading || !isStrictAdmin) return;
		const params = new URLSearchParams(window.location.search);
		const approveEmail = params.get("approve");
		const rejectEmail = params.get("reject");
		if (params.get("fromEmail") !== "1") return;
		const applyEmailAction = async (targetEmail, action) => {
			const { data: profiles } = await supabase.from("profiles").select("*");
			const target = (profiles || []).find((p) => p.email.toLowerCase() === targetEmail.toLowerCase());
			if (!target) {
				toast.error(`User not found: ${targetEmail}`);
				return;
			}
			await updateUserStatus(target.id, action);
			window.history.replaceState({}, document.title, "/admin");
		};
		if (approveEmail) applyEmailAction(decodeURIComponent(approveEmail), "approved");
		else if (rejectEmail) applyEmailAction(decodeURIComponent(rejectEmail), "rejected");
	}, [
		isLoading,
		user,
		usersList
	]);
	const fetchUsers = async () => {
		setIsFetchingUsers(true);
		try {
			const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
			if (error) {
				toast.error(`Error loading users: ${error.message}`);
				setUsersList([]);
			} else if (data) setUsersList(data);
			const { count, error: countError } = await supabase.from("trades").select("*", {
				count: "exact",
				head: true
			});
			if (!countError && count !== null) setTotalDbTrades(count);
		} catch (err) {
			console.error("Error fetching users:", err);
			toast.error("Network error fetching user details.");
		} finally {
			setIsFetchingUsers(false);
		}
	};
	const fetchSettings = async () => {
		try {
			const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).single();
			if (!error && data) {
				setBanner(data.announcement_banner || "");
				setBannerActive(data.banner_active || false);
				setMaintenance(data.maintenance_mode || false);
				setAiEnabled(data.ai_coach_enabled ?? true);
				setMt5Enabled(data.mt5_sync_enabled ?? true);
			}
		} catch (err) {
			console.error("Error fetching site settings:", err);
		}
	};
	const updateUserStatus = async (targetId, newStatus) => {
		const targetUser = usersList.find((u) => u.id === targetId);
		if (targetUser?.is_owner) {
			toast.error("CRITICAL SECURITY: Owner profile cannot be modified.");
			return;
		}
		try {
			const { error } = await supabase.from("profiles").update({
				status: newStatus,
				updated_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", targetId);
			if (error) {
				toast.error(`Failed to update status in DB: ${error.message}`);
				return;
			}
			setUsersList((prev) => prev.map((u) => u.id === targetId ? {
				...u,
				status: newStatus
			} : u));
			toast.success(`User access set to ${newStatus.toUpperCase()}`);
			if (targetUser && (newStatus === "approved" || newStatus === "rejected")) {
				const userName = targetUser.full_name || targetUser.email.split("@")[0] || "Trader";
				sendStatusNotificationEmail({
					email: targetUser.email,
					name: userName,
					status: newStatus
				}).then((res) => {
					if (res.success) toast.success(`Status notification email sent to ${targetUser.email}`);
					else console.warn("Failed to send status notification email:", res.error);
				}).catch((err) => {
					console.warn("Error sending status notification email:", err);
				});
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Network error";
			toast.error(`Error updating status: ${msg}`);
		}
	};
	const deleteUser = async (targetId) => {
		const targetUser = usersList.find((u) => u.id === targetId);
		if (targetUser?.is_owner) {
			toast.error("CRITICAL SECURITY: Owner profile cannot be deleted.");
			return;
		}
		if (!confirm(`Are you sure you want to permanently delete user ${targetUser?.email}?`)) return;
		try {
			const { error } = await supabase.from("profiles").delete().eq("id", targetId);
			if (error) {
				toast.error(`Failed to delete user in DB: ${error.message}`);
				return;
			}
			setUsersList((prev) => prev.filter((u) => u.id !== targetId));
			toast.success("User profile deleted successfully");
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Network error";
			toast.error(`Error deleting user: ${msg}`);
		}
	};
	const handleSaveSettings = async () => {
		setIsSavingSettings(true);
		try {
			const { error } = await supabase.from("site_settings").upsert({
				id: 1,
				announcement_banner: banner,
				banner_active: bannerActive,
				maintenance_mode: maintenance,
				ai_coach_enabled: aiEnabled,
				mt5_sync_enabled: mt5Enabled,
				updated_at: (/* @__PURE__ */ new Date()).toISOString()
			});
			if (error) toast.error(`Error saving settings: ${error.message}`);
			else toast.success("Site control panel updated successfully!");
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Save failed";
			toast.error(msg);
		} finally {
			setIsSavingSettings(false);
		}
	};
	const filteredUsers = usersList.filter((u) => {
		if (filter === "all") return true;
		return u.status === filter;
	});
	const totalUsers = usersList.length;
	const pendingCount = usersList.filter((u) => u.status === "pending").length;
	const approvedCount = usersList.filter((u) => u.status === "approved" || u.is_owner).length;
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Admin Dashboard",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-[60vh] flex-col items-center justify-center text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm text-muted-foreground",
				children: "Loading admin dashboard…"
			})]
		})
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Login Required",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-[60vh] flex-col items-center justify-center text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "size-16 text-accent" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-4 font-display text-2xl font-bold",
					children: "Login Required"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Please login with your Owner email to access the Admin Dashboard."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/login",
					className: "mt-4 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 glow-primary",
					children: "Go to Login"
				})
			]
		})
	});
	if (!(user.email?.toLowerCase().trim() === "nakultrader007@gmail.com")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Access Denied",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-[60vh] flex-col items-center justify-center text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "size-16 text-destructive" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-4 font-display text-2xl font-bold",
					children: "403 Forbidden"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Only the administrator nakultrader007@gmail.com can access this portal."
				})
			]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Owner Admin Dashboard",
		subtitle: "User approvals, access control & website settings",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Total Users",
					value: String(totalUsers),
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-4" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Pending Approval",
					value: String(pendingCount),
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-4" }),
					accent: "accent"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Approved Traders",
					value: String(approvedCount),
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4" }),
					accent: "success"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Total Logged Trades",
					value: String(totalDbTrades),
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-4" })
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-6 lg:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "User Approval Management",
					className: "lg:col-span-2",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex rounded-xl border border-border p-1 overflow-x-auto max-w-[280px] sm:max-w-none",
						children: [
							"all",
							"pending",
							"approved",
							"rejected",
							"suspended"
						].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setFilter(f),
							className: `rounded-lg px-2 py-1 text-[11px] capitalize transition ${filter === f ? "bg-primary/20 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"}`,
							children: f
						}, f))
					}),
					children: isFetchingUsers ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "py-8 text-center text-xs text-muted-foreground",
						children: "Loading users list…"
					}) : filteredUsers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "py-8 text-center text-xs text-muted-foreground",
						children: [
							"No users matching filter \"",
							filter,
							"\"."
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full min-w-[620px] text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "text-left text-[11px] uppercase tracking-wide text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-3 font-medium",
										children: "User"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-3 font-medium",
										children: "Role"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-3 font-medium",
										children: "Status"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-3 font-medium",
										children: "Signed Up"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-3 font-medium text-right",
										children: "Actions"
									})
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: filteredUsers.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-border/60 transition hover:bg-muted/30",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "grid size-8 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 text-xs font-bold text-primary",
												children: u.full_name?.slice(0, 2).toUpperCase() || "TN"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-medium",
												children: u.full_name || "Trader"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: u.email
											})] })]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3",
										children: u.is_owner ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: "primary",
											className: "glow-primary",
											children: "Owner"
										}) : u.role === "admin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: "accent",
											children: "Admin"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: "muted",
											children: "User"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: u.status === "approved" || u.is_owner ? "win" : u.status === "pending" ? "primary" : u.status === "suspended" ? "loss" : "muted",
											children: u.status
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3 text-xs text-muted-foreground",
										children: new Date(u.created_at).toLocaleDateString()
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3 text-right",
										children: u.is_owner ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px] text-muted-foreground italic",
											children: "Protected"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-end gap-1.5 flex-wrap",
											children: [
												u.status !== "approved" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													onClick: () => updateUserStatus(u.id, "approved"),
													title: "Approve user access",
													className: "flex items-center gap-1 rounded-lg bg-[oklch(0.72_0.19_155)]/20 px-2.5 py-1 text-xs font-semibold text-[oklch(0.8_0.17_155)] hover:bg-[oklch(0.72_0.19_155)]/30",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-3" }), " Approve"]
												}),
												u.status !== "suspended" && u.status !== "rejected" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													onClick: () => updateUserStatus(u.id, "suspended"),
													title: "Suspend user access",
													className: "flex items-center gap-1 rounded-lg bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/30",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, { className: "size-3" }), " Suspend"]
												}),
												u.status !== "rejected" && u.status !== "approved" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													onClick: () => updateUserStatus(u.id, "rejected"),
													title: "Reject user access",
													className: "flex items-center gap-1 rounded-lg bg-destructive/20 px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/30",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "size-3" }), " Reject"]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													onClick: () => deleteUser(u.id),
													title: "Permanently Delete User",
													className: "flex items-center gap-1 rounded-lg bg-destructive/10 p-1 text-xs font-semibold text-destructive hover:bg-destructive/25",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
												})
											]
										})
									})
								]
							}, u.id)) })]
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Platform Control Panel",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center justify-between text-xs font-medium",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Announcement Banner" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: bannerActive,
									onChange: (e) => setBannerActive(e.target.checked),
									className: "accent-primary"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: banner,
								onChange: (e) => setBanner(e.target.value),
								placeholder: "Site wide banner message...",
								className: "mt-1.5 w-full rounded-xl border border-border bg-card/60 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between border-t border-border/60 pt-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-medium",
									children: "Maintenance Mode"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-muted-foreground",
									children: "Temporarily lock site for updates"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: maintenance,
									onChange: (e) => setMaintenance(e.target.checked),
									className: "accent-destructive size-4"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between border-t border-border/60 pt-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-medium",
									children: "AI Coach Feature"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-muted-foreground",
									children: "Enable AI trading coach"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: aiEnabled,
									onChange: (e) => setAiEnabled(e.target.checked),
									className: "accent-primary size-4"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between border-t border-border/60 pt-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-medium",
									children: "MT5 Auto Sync"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-muted-foreground",
									children: "MetaTrader 5 API integration"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: mt5Enabled,
									onChange: (e) => setMt5Enabled(e.target.checked),
									className: "accent-primary size-4"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: handleSaveSettings,
								disabled: isSavingSettings,
								className: "mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] glow-primary",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-3.5" }), isSavingSettings ? "Saving…" : "Save Control Settings"]
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "System & Feature Readiness",
					className: "lg:col-span-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-3 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-border/60 bg-card/40 p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 font-semibold text-primary",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "size-4" }), " MT5 Integration Endpoint"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-muted-foreground",
										children: "Ready for Phase 5 Webhook Connector. Payload listeners ready."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "win",
										className: "mt-3",
										children: "Phase 5 Ready"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-border/60 bg-card/40 p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 font-semibold text-accent",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-4" }), " Trade Journal RLS"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-muted-foreground",
										children: "PostgreSQL schema ready for isolated multi-tenant trade tables."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "primary",
										className: "mt-3",
										children: "Phase 4 Ready"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-border/60 bg-card/40 p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 font-semibold text-[oklch(0.72_0.19_155)]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, { className: "size-4" }), " Live AI Assistant Engine"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-muted-foreground",
										children: "Gemini API context prompt builder pipeline structured."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "win",
										className: "mt-3",
										children: "Phase 5 Ready"
									})
								]
							})
						]
					})
				})
			]
		})]
	});
}
//#endregion
export { AdminPage as component };
