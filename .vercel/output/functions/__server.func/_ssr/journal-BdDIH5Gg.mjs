import { i as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as useAuth } from "./router-BCFNEo9i.mjs";
import { C as Search, D as Plus, H as Clock, L as Image, _ as SlidersHorizontal, d as Trash2, k as PenLine, m as Star, n as X, o as Upload } from "../_libs/lucide-react.mjs";
import { i as Panel, n as Badge, o as cn, r as EmptyState, t as AppShell } from "./AppShell-RXXdI0nA.mjs";
import { c as money, d as pnlUsd, f as saveTradeToSupabase, i as deleteTradeFromSupabase, n as PAIRS, o as fetchUserTrades, r as SETUPS } from "./trades-CFBoh8Ws.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/journal-BdDIH5Gg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var field = "w-full rounded-xl border border-border bg-card/50 px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-ring/40";
var primaryBtn = "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] glow-primary";
function LogTradeModal({ isOpen, onClose, onSave, initialTrade, nextTradeNo = 1 }) {
	const [pair, setPair] = (0, import_react.useState)("");
	const [tradeNo, setTradeNo] = (0, import_react.useState)(nextTradeNo);
	const [side, setSide] = (0, import_react.useState)("Buy");
	const [session, setSession] = (0, import_react.useState)("London");
	const [resultAmount, setResultAmount] = (0, import_react.useState)("");
	const [entryTime, setEntryTime] = (0, import_react.useState)("");
	const [exitTime, setExitTime] = (0, import_react.useState)("");
	const [lots, setLots] = (0, import_react.useState)("");
	const [result, setResult] = (0, import_react.useState)("Win");
	const [rrr, setRrr] = (0, import_react.useState)("");
	const [riskPct, setRiskPct] = (0, import_react.useState)("1.0");
	const [setup, setSetup] = (0, import_react.useState)("");
	const [confirmation, setConfirmation] = (0, import_react.useState)("");
	const [notes, setNotes] = (0, import_react.useState)("");
	const [tags, setTags] = (0, import_react.useState)("");
	const [date, setDate] = (0, import_react.useState)("");
	const [rating, setRating] = (0, import_react.useState)(5);
	const [reason, setReason] = (0, import_react.useState)("");
	const [mistakes, setMistakes] = (0, import_react.useState)("");
	const [imageFile, setImageFile] = (0, import_react.useState)(null);
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (isOpen) {
			if (initialTrade) {
				setPair(initialTrade.pair || "");
				setTradeNo(initialTrade.tradeNo || nextTradeNo);
				setSide(initialTrade.side || "Buy");
				setSession(initialTrade.session || "London");
				setResultAmount(String(initialTrade.pnl ? Math.abs(initialTrade.pnl) : ""));
				setEntryTime(initialTrade.entryTime || "12:00");
				setExitTime(initialTrade.exitTime || "13:00");
				setLots(initialTrade.lots || "");
				setResult(initialTrade.result || "Win");
				setRrr(String(initialTrade.rrr || ""));
				setRiskPct(String(initialTrade.riskPct || "1.0"));
				setSetup(initialTrade.setup || "");
				setConfirmation(initialTrade.confirmation || "");
				setNotes(initialTrade.notes || "");
				setTags(Array.isArray(initialTrade.tags) ? initialTrade.tags.join(", ") : "");
				setDate(initialTrade.date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
				setRating(initialTrade.rating || 5);
				setReason(initialTrade.reason || "");
				setMistakes(initialTrade.mistakes || "");
			} else {
				setPair("");
				setTradeNo(nextTradeNo);
				setSide("Buy");
				setSession("London");
				setResultAmount("");
				setEntryTime((/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
					hour12: false,
					hour: "2-digit",
					minute: "2-digit"
				}));
				setExitTime((/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
					hour12: false,
					hour: "2-digit",
					minute: "2-digit"
				}));
				setLots("");
				setResult("Win");
				setRrr("");
				setRiskPct("1.0");
				setSetup("");
				setConfirmation("");
				setNotes("");
				setTags("A+ Setup, Patience");
				setDate((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
				setRating(5);
				setReason("");
				setMistakes("");
			}
			setImageFile(null);
		}
	}, [
		isOpen,
		initialTrade,
		nextTradeNo
	]);
	if (!isOpen) return null;
	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		try {
			const pnlValue = parseFloat(resultAmount) || 0;
			const finalPnl = result === "Loss" ? -Math.abs(pnlValue) : Math.abs(pnlValue);
			const risk = parseFloat(riskPct) || 1;
			await onSave({
				id: initialTrade?.id,
				tradeNo,
				date,
				pair: pair.toUpperCase().trim(),
				side,
				session,
				entryTime,
				exitTime,
				entryPrice: 0,
				exitPrice: 0,
				result,
				rrr,
				riskPct: risk,
				pnl: finalPnl,
				setup: setup.trim(),
				confirmation,
				notes,
				tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
				screenshot: initialTrade?.screenshot || "chart-1",
				lots: lots.trim(),
				mistakes: mistakes.trim(),
				rating,
				reason: reason.trim()
			}, imageFile || void 0);
			toast.success(initialTrade ? "Trade updated successfully!" : "New trade logged successfully!");
			onClose();
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to save trade";
			toast.error(msg);
		} finally {
			setIsSubmitting(false);
		}
	};
	const selectStyle = "w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "glass max-h-[90vh] w-full max-w-xl animate-rise overflow-y-auto rounded-3xl p-6",
			onClick: (e) => e.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between border-b border-border/60 pb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "font-display text-xl font-semibold",
					children: [
						initialTrade ? "Edit Trade" : "Log New Trade",
						" (No. #",
						tradeNo,
						")"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: "Record entry, setup, risk and chart screenshots."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onClose,
					className: "rounded-lg p-1.5 text-muted-foreground hover:text-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: handleSubmit,
				className: "mt-4 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-medium text-muted-foreground mb-1",
								children: "Pair (Manual Type)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								placeholder: "e.g. GBPUSD",
								required: true,
								className: field,
								value: pair,
								onChange: (e) => setPair(e.target.value)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-medium text-muted-foreground mb-1",
								children: "Side"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: selectStyle,
								value: side,
								onChange: (e) => setSide(e.target.value),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "Buy",
									children: "Buy"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "Sell",
									children: "Sell"
								})]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-medium text-muted-foreground mb-1",
								children: "Session"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: selectStyle,
								value: session,
								onChange: (e) => setSession(e.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "London",
										children: "London"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "New York",
										children: "New York"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "Asian",
										children: "Asian"
									})
								]
							})] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "col-span-2 sm:col-span-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-xs font-semibold text-primary mb-1",
									children: "Result Amount (₹ Rupees)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									step: "any",
									required: true,
									placeholder: "e.g. 5000 or -1500",
									className: `${field} border-primary/50 bg-primary/5 font-semibold text-foreground`,
									value: resultAmount,
									onChange: (e) => setResultAmount(e.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-medium text-muted-foreground mb-1",
								children: "Lot Size (Lots)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								placeholder: "e.g. 0.5",
								className: field,
								value: lots,
								onChange: (e) => setLots(e.target.value)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-medium text-muted-foreground mb-1",
								children: "Risk %"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								step: "0.1",
								required: true,
								className: field,
								value: riskPct,
								onChange: (e) => setRiskPct(e.target.value)
							})] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-medium text-muted-foreground mb-1",
								children: "Entry Time"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "time",
								required: true,
								className: field,
								value: entryTime,
								onChange: (e) => setEntryTime(e.target.value)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-medium text-muted-foreground mb-1",
								children: "Exit Time"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "time",
								required: true,
								className: field,
								value: exitTime,
								onChange: (e) => setExitTime(e.target.value)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-medium text-muted-foreground mb-1",
								children: "Result Status"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: selectStyle,
								value: result,
								onChange: (e) => setResult(e.target.value),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "Win",
									children: "Win"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "Loss",
									children: "Loss"
								})]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-medium text-muted-foreground mb-1",
								children: "RRR (Free text)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								placeholder: "e.g. 1:3",
								required: true,
								className: field,
								value: rrr,
								onChange: (e) => setRrr(e.target.value)
							})] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "col-span-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-xs font-medium text-muted-foreground mb-1",
									children: "Set-up (Manual Type)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									placeholder: "e.g. Liquidity Sweep",
									required: true,
									className: field,
									value: setup,
									onChange: (e) => setSetup(e.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-medium text-muted-foreground mb-1",
								children: "Date"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "date",
								required: true,
								className: field,
								value: date,
								onChange: (e) => setDate(e.target.value)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-medium text-muted-foreground mb-1",
								children: "Trade Rating"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-[42px] items-center gap-1",
								children: [
									1,
									2,
									3,
									4,
									5
								].map((star) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setRating(star),
									className: "p-0.5 text-muted-foreground hover:scale-110 transition-transform",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: `size-5 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}` })
								}, star))
							})] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium text-muted-foreground mb-1",
							children: "Confirmation"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							placeholder: "Confirmation (e.g. CHoCH)",
							className: field,
							value: confirmation,
							onChange: (e) => setConfirmation(e.target.value)
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium text-muted-foreground mb-1",
							children: "Tags"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							placeholder: "Tags (comma separated)",
							className: field,
							value: tags,
							onChange: (e) => setTags(e.target.value)
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "block text-xs font-medium text-muted-foreground mb-1",
						children: "Reason for Taking Trade"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						placeholder: "e.g. Strong H4 support retest + dynamic liquidity sweep",
						className: field,
						value: reason,
						onChange: (e) => setReason(e.target.value)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "block text-xs font-medium text-muted-foreground mb-1",
						children: "Mistakes"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						placeholder: "e.g. Entered 5 mins early before candle closure",
						className: field,
						value: mistakes,
						onChange: (e) => setMistakes(e.target.value)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "block text-xs font-medium text-muted-foreground mb-1",
						children: "Trade Notes & Rules Followed"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						rows: 2,
						placeholder: "Plan ke according entry liya, TP tak patience rakha...",
						className: "w-full rounded-xl border border-border bg-card/50 p-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-ring/40",
						value: notes,
						onChange: (e) => setNotes(e.target.value)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "block text-xs font-medium text-muted-foreground mb-1",
						children: "Chart Screenshot (Storage Upload)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center gap-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/40 p-3 text-xs text-muted-foreground hover:border-primary/60 cursor-pointer",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4 text-primary" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: imageFile ? imageFile.name : "Click to select screenshot image" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "file",
									accept: "image/*",
									className: "hidden",
									onChange: (e) => setImageFile(e.target.files?.[0] || null)
								})
							]
						})
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						disabled: isSubmitting,
						className: primaryBtn,
						children: isSubmitting ? "Saving Trade…" : initialTrade ? "Update Trade Entry" : "Save Trade Entry"
					})
				]
			})]
		})
	});
}
function TradeCard({ t, onOpen }) {
	const pnl = pnlUsd(t);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick: onOpen,
		className: "glass group animate-rise w-full rounded-2xl p-4 text-left transition-transform duration-300 hover:-translate-y-1",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-display text-base font-semibold",
					children: [
						t.pair,
						" ",
						t.tradeNo ? `#${t.tradeNo}` : ""
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground",
					children: [
						t.date,
						" · ",
						t.session
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: t.result === "Win" ? "win" : "loss",
					children: t.result
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid grid-cols-3 gap-2 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-muted/40 p-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground",
							children: "Side"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: t.side
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-muted/40 p-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground",
							children: "RRR"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: t.rrr
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-muted/40 p-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground",
							children: "Risk"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-medium",
							children: [t.riskPct, "%"]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex items-center gap-2 text-xs text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-3.5" }),
					" ",
					t.entryTime,
					" → ",
					t.exitTime,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "ml-auto flex items-center gap-1 truncate max-w-[120px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "size-3.5" }), " Screenshot"]
					})
				]
			}),
			t.screenshot && t.screenshot.startsWith("http") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: t.screenshot,
				alt: t.pair,
				className: "mt-3 h-24 w-full rounded-xl object-cover ring-1 ring-border"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-3 h-16 overflow-hidden rounded-xl bg-gradient-to-br from-primary/25 via-accent/15 to-transparent ring-1 ring-border" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 line-clamp-2 text-xs text-muted-foreground",
				children: t.notes
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap items-center gap-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "primary",
						children: t.setup
					}),
					(t.tags || []).map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: tag }, tag)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("ml-auto font-display text-sm font-semibold", pnl >= 0 ? "text-[oklch(0.72_0.19_155)]" : "text-destructive"),
						children: money(pnl)
					})
				]
			})
		]
	});
}
function Journal() {
	const { user } = useAuth();
	const [allTrades, setAllTrades] = (0, import_react.useState)([]);
	const [q, setQ] = (0, import_react.useState)("");
	const [pair, setPair] = (0, import_react.useState)("All");
	const [result, setResult] = (0, import_react.useState)("All");
	const [setup, setSetup] = (0, import_react.useState)("All");
	const [sort, setSort] = (0, import_react.useState)("newest");
	const [open, setOpen] = (0, import_react.useState)(null);
	const [isLogModalOpen, setIsLogModalOpen] = (0, import_react.useState)(false);
	const [editingTrade, setEditingTrade] = (0, import_react.useState)(null);
	const [confirmDeleteId, setConfirmDeleteId] = (0, import_react.useState)(null);
	const [isDeleting, setIsDeleting] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		loadTrades();
		const handleOpenModal = () => {
			setEditingTrade(null);
			setIsLogModalOpen(true);
		};
		if (typeof window !== "undefined") {
			window.addEventListener("open_log_trade_modal", handleOpenModal);
			if (new URLSearchParams(window.location.search).get("openModal") === "true") {
				setIsLogModalOpen(true);
				window.history.replaceState({}, "", window.location.pathname);
			}
		}
		return () => {
			if (typeof window !== "undefined") window.removeEventListener("open_log_trade_modal", handleOpenModal);
		};
	}, []);
	const loadTrades = async () => {
		const data = await fetchUserTrades();
		setAllTrades(data);
	};
	const handleSaveTrade = async (tradePayload, imageFile) => {
		const userId = user?.id || "open-access-trader-007";
		await saveTradeToSupabase(tradePayload, userId, imageFile);
		await loadTrades();
	};
	const handleDeleteTrade = async (tradeId) => {
		setIsDeleting(true);
		try {
			await deleteTradeFromSupabase(tradeId);
			setAllTrades((prev) => prev.filter((t) => t.id !== tradeId));
			toast.success("Trade entry deleted successfully!");
			setOpen(null);
			setConfirmDeleteId(null);
			await loadTrades();
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to delete trade";
			toast.error(msg);
		} finally {
			setIsDeleting(false);
		}
	};
	const list = (0, import_react.useMemo)(() => {
		let l = allTrades.filter((t) => {
			const tagsText = Array.isArray(t.tags) ? t.tags.join(" ") : "";
			return `${t.pair || ""} ${t.setup || ""} ${t.notes || ""} ${tagsText} ${t.session || ""}`.toLowerCase().includes(q.toLowerCase()) && (pair === "All" || t.pair === pair) && (result === "All" || t.result === result) && (setup === "All" || t.setup === setup);
		});
		l = [...l].sort((a, b) => sort === "newest" ? a.date < b.date ? 1 : -1 : sort === "oldest" ? a.date > b.date ? 1 : -1 : sort === "rrr" ? b.rrr - a.rrr : pnlUsd(b) - pnlUsd(a));
		return l;
	}, [
		allTrades,
		q,
		pair,
		result,
		setup,
		sort
	]);
	const select = "rounded-xl border border-border bg-card/60 px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Trading Journal",
		subtitle: `${list.length} trades logged`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => {
						setEditingTrade(null);
						setIsLogModalOpen(true);
					},
					className: "flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 glow-primary",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " Log Trade"]
				}),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: q,
							onChange: (e) => setQ(e.target.value),
							placeholder: "Search pair, setup, tag or notes…",
							className: "w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1 text-xs text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "size-3.5" }), " Filters"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: select,
								value: pair,
								onChange: (e) => setPair(e.target.value),
								children: ["All", ...PAIRS].map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: p }, p))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: select,
								value: result,
								onChange: (e) => setResult(e.target.value),
								children: [
									"All",
									"Win",
									"Loss"
								].map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: p }, p))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: select,
								value: setup,
								onChange: (e) => setSetup(e.target.value),
								children: ["All", ...SETUPS].map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: p }, p))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: select,
								value: sort,
								onChange: (e) => setSort(e.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "newest",
										children: "Newest first"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "oldest",
										children: "Oldest first"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "rrr",
										children: "Highest RRR"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "pnl",
										children: "Biggest PnL"
									})
								]
							})
						]
					})]
				})
			}),
			list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					title: "No trades match your filters",
					hint: "Try clearing the search box or switching the pair / result filter."
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
				children: list.slice(0, 30).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TradeCard, {
					t,
					onOpen: () => setOpen(t)
				}, t.id))
			}),
			open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 grid place-items-end bg-black/60 p-0 backdrop-blur-sm sm:place-items-center sm:p-6",
				onClick: () => {
					setOpen(null);
					setConfirmDeleteId(null);
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "glass max-h-[85vh] w-full max-w-lg animate-rise overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl",
					onClick: (e) => e.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
								className: "font-display text-lg font-semibold",
								children: [
									open.pair,
									" · ",
									open.side,
									" ",
									open.tradeNo ? `(#${open.tradeNo})` : ""
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									open.date,
									" · ",
									open.session,
									" session"
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => {
											const currentOpen = open;
											setOpen(null);
											setEditingTrade(currentOpen);
											setIsLogModalOpen(true);
										},
										className: "rounded-lg p-1.5 text-muted-foreground hover:text-foreground",
										title: "Edit trade",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { className: "size-4" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: (e) => {
											e.preventDefault();
											e.stopPropagation();
											setConfirmDeleteId(open.id);
										},
										className: "rounded-lg p-1.5 text-muted-foreground hover:text-destructive",
										title: "Delete trade",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										"aria-label": "Close",
										onClick: () => {
											setOpen(null);
											setConfirmDeleteId(null);
										},
										className: "rounded-lg p-1.5 text-muted-foreground hover:text-foreground",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
									})
								]
							})]
						}),
						confirmDeleteId === open.id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 rounded-xl border border-destructive/50 bg-destructive/10 p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium text-destructive",
									children: "Are you sure you want to delete this trade?"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-muted-foreground",
									children: "This action cannot be undone."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: (e) => {
											e.preventDefault();
											e.stopPropagation();
											handleDeleteTrade(open.id);
										},
										disabled: isDeleting,
										className: "rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50",
										children: isDeleting ? "Deleting..." : "Yes, Delete"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: (e) => {
											e.preventDefault();
											e.stopPropagation();
											setConfirmDeleteId(null);
										},
										className: "rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted",
										children: "Cancel"
									})]
								})
							]
						}),
						open.screenshot && open.screenshot.startsWith("http") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: open.screenshot,
							alt: open.pair,
							className: "mt-4 h-48 w-full rounded-2xl object-cover ring-1 ring-border"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-4 h-36 rounded-2xl bg-gradient-to-br from-primary/30 via-accent/20 to-transparent ring-1 ring-border" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3",
							children: [
								["Entry Time", open.entryTime],
								["Exit Time", open.exitTime],
								["Result Amount (₹)", `₹${Math.abs(open.pnl).toLocaleString("en-IN")}`],
								["Lots Size", open.lots || "—"],
								["RRR", open.rrr],
								["Risk", `${open.riskPct}%`],
								["Setup", open.setup],
								["Confirmation", open.confirmation || "—"],
								["Result Status", open.result],
								["Rating", "⭐".repeat(open.rating || 5)]
							].map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl bg-muted/40 p-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-muted-foreground",
									children: k
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: v
								})]
							}, k))
						}),
						open.reason && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 rounded-xl bg-muted/20 p-3 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-muted-foreground",
								children: "Reason for taking trade:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-foreground leading-normal",
								children: open.reason
							})]
						}),
						open.mistakes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs animate-rise",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-destructive/80",
								children: "Mistakes recorded:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-foreground leading-normal",
								children: open.mistakes
							})]
						}),
						open.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 rounded-xl bg-muted/20 p-3 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-muted-foreground",
								children: "Trade Notes & Rules Followed:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-muted-foreground leading-normal",
								children: open.notes
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 flex flex-wrap gap-1.5",
							children: (open.tags || []).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: t }, t))
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogTradeModal, {
				isOpen: isLogModalOpen,
				onClose: () => setIsLogModalOpen(false),
				onSave: handleSaveTrade,
				initialTrade: editingTrade,
				nextTradeNo: allTrades.length + 1
			})
		]
	});
}
//#endregion
export { Journal as component };
