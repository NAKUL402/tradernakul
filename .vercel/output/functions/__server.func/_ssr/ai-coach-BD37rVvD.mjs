import { i as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { E as RefreshCw, G as ChevronRight, K as ChevronLeft, Q as Award, R as Flame, S as Send, V as Crown, W as CircleCheck, Y as Brain, c as TriangleAlert, f as Target, h as Sparkles, t as Zap, v as Shield } from "../_libs/lucide-react.mjs";
import { i as Panel, n as Badge, t as AppShell } from "./AppShell-RXXdI0nA.mjs";
import { c as money, m as streaks, o as fetchUserTrades, p as stats, s as groupStats } from "./trades-CFBoh8Ws.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ai-coach-BD37rVvD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var WEEKLY_GOLDEN_RULES = [
	{
		week: 1,
		title: "Capital Protection First",
		rule: "Your first goal is not to make money. Your first goal is to protect your capital. A disciplined trader survives long enough to become profitable.",
		principle: "Never risk more than 1% to 2% of your account equity on a single trade setup.",
		category: "Capital Protection"
	},
	{
		week: 2,
		title: "Liquidity Sweep Awareness",
		rule: "Smart money feeds on retail stop losses. Never buy at support or sell at resistance before a liquidity sweep occurs.",
		principle: "Wait for session highs or lows to be swept before taking reversal entries.",
		category: "Liquidity & Execution"
	},
	{
		week: 3,
		title: "The 30-Minute Post-Loss Rule",
		rule: "Revenge trading is an emotional attempt to control an uncontrollable market. Take a mandatory 30-minute break after every loss.",
		principle: "Step away from screens immediately after a stop out to reset your psychological state.",
		category: "Psychology"
	},
	{
		week: 4,
		title: "Asymmetric Risk:Reward Ratio",
		rule: "Your win rate does not make you rich; your Risk-to-Reward ratio does. A 40% win rate with a 1:3 RRR builds long-term wealth.",
		principle: "Refuse setups offering less than 1:2 RRR, regardless of how enticing the pattern looks.",
		category: "Risk Control"
	},
	{
		week: 5,
		title: "Process Over Outcome",
		rule: "A winning trade executed against your plan is a bad trade. A losing trade executed strictly following your plan is a successful trade.",
		principle: "Evaluate trading success purely by rule adherence, not by short-term monetary results.",
		category: "Discipline"
	},
	{
		week: 6,
		title: "Position Sizing Is Your Shield",
		rule: "If a trade causes anxiety or heart palpitations, your lot size is too large. Size down until entry feels robotic and calm.",
		principle: "Calculate position size dynamically based on stop loss distance, not fixed lot numbers.",
		category: "Capital Protection"
	},
	{
		week: 7,
		title: "FOMO Is a Retail Trap",
		rule: "Chasing a candle is paying top price for market noise. Elite traders let price return to their Point of Interest (POI).",
		principle: "If you miss the initial break, wait patiently for the retest or skip the move entirely.",
		category: "Psychology"
	},
	{
		week: 8,
		title: "Cash Is a Valid Position",
		rule: "Not trading in low-probability market conditions is an active trading edge. Preserving mental capital is as important as money.",
		principle: "Do not force trades on choppy or news-heavy days without high-conviction setups.",
		category: "Discipline"
	},
	{
		week: 9,
		title: "Robotic Execution Discipline",
		rule: "Hesitation at entry and early exit at target are signs of trade fear. Once setup is verified, execute without doubt.",
		principle: "Set entry, stop loss, and take profit, then let the market reach one of them without micro-managing.",
		category: "Liquidity & Execution"
	},
	{
		week: 10,
		title: "Drawdown Management Strategy",
		rule: "Drawdowns are a natural statistical cost of trading. Cut your position size by 50% during a 3-trade losing streak.",
		principle: "Protect confidence and bankroll by scaling down risk when market conditions mismatch your strategy.",
		category: "Risk Control"
	},
	{
		week: 11,
		title: "Session Volatility Alignment",
		rule: "Trade when institutional volume is active. High probability moves happen during London and New York session overlaps.",
		principle: "Avoid entering new positions during Asian consolidation unless trading specific range-bound setups.",
		category: "Liquidity & Execution"
	},
	{
		week: 12,
		title: "Overcoming Overconfidence",
		rule: "A winning streak can make you feel invincible. The market is most dangerous when you feel you cannot lose.",
		principle: "Stick to strict risk parameters even after 5 consecutive winning trades.",
		category: "Psychology"
	},
	{
		week: 13,
		title: "Order Block Validation",
		rule: "Not all order blocks hold. Only trade order blocks that created market structure breaks (BOS) and left fair value gaps (FVG).",
		principle: "Filter setups by demanding displacement before placing limit orders at order blocks.",
		category: "Liquidity & Execution"
	},
	{
		week: 14,
		title: "Daily Max Loss Limit",
		rule: "Set a hard daily loss limit of 2% of total capital. Once hit, close terminals and walk away for the rest of the day.",
		principle: "Protecting your account from catastrophe days is the key difference between pros and amateurs.",
		category: "Capital Protection"
	},
	{
		week: 15,
		title: "Trade Journaling Discipline",
		rule: "What gets measured gets improved. Journaling every trade with screenshots and emotions is your fastest path to mastery.",
		principle: "Review weekly trade logs every weekend to identify recurring execution patterns.",
		category: "Discipline"
	},
	{
		week: 16,
		title: "Accepting Market Uncertainty",
		rule: "Every single trade has a random distribution of outcome. Accept risk completely before placing the order.",
		principle: "If you cannot accept loss on a trade, you are not ready to enter it.",
		category: "Psychology"
	}
];
function getCurrentWeekIndex() {
	const now = /* @__PURE__ */ new Date();
	const start = new Date(now.getFullYear(), 0, 1);
	const diff = now.getTime() - start.getTime() + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 6e4;
	const dayOfYear = Math.floor(diff / 864e5);
	return Math.floor(dayOfYear / 7) % WEEKLY_GOLDEN_RULES.length;
}
function analyzeTradeDataWithAI(userTrades) {
	const currentWeeklyRule = WEEKLY_GOLDEN_RULES[getCurrentWeekIndex()] || WEEKLY_GOLDEN_RULES[0];
	const suggestedPrompts = [
		"How do I prevent revenge trading after a stop out?",
		"What is the best way to trade London Session liquidity sweeps?",
		"How should I adjust position size during a drawdown?",
		"How can I improve my average Risk-to-Reward ratio?"
	];
	if (!userTrades || userTrades.length === 0) return {
		qualityScore: 78,
		institutionalScore: 74,
		disciplineScore: 80,
		patienceScore: 75,
		riskControlScore: 82,
		overallGrade: "B",
		currentWeeklyRule,
		topMistakes: ["No live trade logs detected yet. Enter your recent trades to generate institutional analytics.", "Executing trades without logging entry setup & stop loss parameters."],
		topStrengths: ["AI Coach engine active and connected to institutional evaluation rules.", "Open access active — ready to analyze your edge instantly upon trade input."],
		improvementPlan: [
			"Phase 1: Log at least 5 live trades with pair name, side (Buy/Sell), entry price and stop loss.",
			"Phase 2: Maintain a fixed 1% risk per trade and tag setup type (Order Block / Liquidity Sweep).",
			"Phase 3: Conduct a weekend performance review using AI Coach insights."
		],
		psychologyText: "Patience is not passive waiting; it is actively refusing low-probability setups. Log your entries to unlock personalized psychological profiling.",
		riskReviewText: "Ensure strict risk control of 1% to 2% per trade. Always utilize an automated position sizing calculator prior to execution.",
		finalVerdict: "Your AI Mentor is active. Log your trades in the Journal to receive automated institutional grading and edge analysis.",
		suggestedPrompts
	};
	const s = stats(userTrades);
	const str = streaks(userTrades);
	const bySetup = groupStats(userTrades, (t) => t.setup);
	const qualityScore = Math.min(99, Math.max(35, Math.round(s.winRate * .65 + s.avgRRR * 14)));
	const institutionalScore = Math.min(98, Math.max(30, Math.round(s.profitFactor * 30 + 22)));
	const overallGrade = qualityScore >= 88 ? "A+" : qualityScore >= 78 ? "A" : qualityScore >= 68 ? "B" : qualityScore >= 58 ? "C" : "D";
	const bestPair = s.bestPair?.name || "XAUUSD";
	const worstPair = s.worstPair?.name || "USDJPY";
	const bestSetup = bySetup.sort((a, b) => b.winRate - a.winRate)[0]?.name || "Order Block";
	const mistakes = [];
	if (str.lossStreak >= 3) mistakes.push(`Max loss streak reached ${str.lossStreak} trades. Acknowledge emotional tilt and enforce a 30-min post-loss break.`);
	if (worstPair && worstPair !== bestPair) mistakes.push(`Suboptimal performance on ${worstPair}. Reduce lot size or eliminate setups on this asset.`);
	if (s.avgRRR < 1.8) mistakes.push(`Average Risk:Reward ratio is 1:${s.avgRRR.toFixed(2)}. Target a minimum of 1:2.0 RRR to compound gains.`);
	if (userTrades.some((t) => t.riskPct > 2.5)) mistakes.push("Position sizing exceeded 2.5% risk on certain trades. Standardize risk to max 1-2%.");
	if (mistakes.length === 0) mistakes.push("Watch out for news-driven volatility spikes during London open liquidity sweeps.");
	const strengths = [
		`Strong win rate on ${bestPair} (${s.bestPair ? s.bestPair.winRate.toFixed(0) : "65"}%). Keep this as your primary asset focus.`,
		`High execution precision on ${bestSetup} setups with positive expected value.`,
		`Consistent trade logging maintained across ${s.total} trades.`
	];
	const plan = [
		`Phase 1: Focus exclusively on high-conviction ${bestPair} + ${bestSetup} setups. Cut non-core pairs.`,
		"Phase 2: Enforce a strict 1% risk per trade limit with dynamic position sizing.",
		"Phase 3: Implement mandatory 30-minute cooling-off period after any stop loss execution.",
		"Phase 4: Perform weekly review of trade screenshots and emotional state notes."
	];
	return {
		qualityScore,
		institutionalScore,
		disciplineScore: Math.min(96, Math.max(50, Math.round(s.winRate + 22))),
		patienceScore: Math.min(95, Math.max(45, Math.round(s.avgRRR * 26))),
		riskControlScore: Math.min(98, Math.max(40, Math.round(s.profitFactor * 32))),
		overallGrade,
		currentWeeklyRule,
		topMistakes: mistakes,
		topStrengths: strengths,
		improvementPlan: plan,
		psychologyText: `${currentWeeklyRule.rule} Your win rate is ${s.winRate.toFixed(1)}%. Maintain robotic execution discipline and ignore short-term outcome noise.`,
		riskReviewText: `Profit Factor is ${s.profitFactor.toFixed(2)} and average RRR is 1:${s.avgRRR.toFixed(2)}. Capital preservation must remain your primary metric of trading excellence.`,
		finalVerdict: `Verdict: Your trading edge is statistically evident. Net performance is ${s.net >= 0 ? "profitable" : "improving"} (${money(s.net)}). Maintain 100% adherence to your trading plan rules without deviation.`,
		suggestedPrompts
	};
}
function Gauge3D({ value, label, tone }) {
	const colorStr = tone === "win" ? "oklch(0.72 0.19 155)" : tone === "accent" ? "var(--color-accent)" : "var(--color-primary)";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-2.5 group",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative grid size-32 place-items-center rounded-full transition-transform duration-500 hover:scale-105",
			style: {
				background: `conic-gradient(${colorStr} ${value * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
				boxShadow: `0 0 25px -5px ${colorStr}40`
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid size-24 place-items-center rounded-full bg-card/90 backdrop-blur-xl border border-border/60 shadow-inner",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display text-3xl font-bold tracking-tight text-foreground",
					children: value
				})
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs font-medium text-muted-foreground",
			children: label
		})]
	});
}
function List3D({ items, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-3 text-sm",
		children: items.map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "flex items-start gap-3 rounded-xl border border-border/40 bg-card/40 p-3 backdrop-blur-sm transition hover:bg-card/70",
			children: [tone === "good" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mt-0.5 size-4 shrink-0 text-[oklch(0.72_0.19_155)]" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mt-0.5 size-4 shrink-0 text-destructive" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "leading-relaxed text-muted-foreground",
				children: item
			})]
		}, idx))
	});
}
function CoachPage() {
	const [userTrades, setUserTrades] = (0, import_react.useState)([]);
	const [activeWeekIdx, setActiveWeekIdx] = (0, import_react.useState)(getCurrentWeekIndex());
	const [customQuestion, setCustomQuestion] = (0, import_react.useState)("");
	const [chatMessages, setChatMessages] = (0, import_react.useState)([{
		role: "coach",
		text: "Welcome to your AI Performance Lab. Select a quick prompt below or ask me any question about risk management, psychology, or execution."
	}]);
	const [isAnswering, setIsAnswering] = (0, import_react.useState)(false);
	const [readinessState, setReadinessState] = (0, import_react.useState)({
		emotion: "Calm",
		prep: "Prepared",
		risk: "Strict 1%"
	});
	(0, import_react.useEffect)(() => {
		fetchUserTrades().then((data) => setUserTrades(data));
	}, []);
	const ai = analyzeTradeDataWithAI(userTrades);
	const selectedRule = WEEKLY_GOLDEN_RULES[activeWeekIdx] || ai.currentWeeklyRule;
	const isCurrentWeek = activeWeekIdx === getCurrentWeekIndex();
	const handleAskQuestion = async (questionText) => {
		if (!questionText.trim()) return;
		const userMsg = questionText.trim();
		setChatMessages((prev) => [...prev, {
			role: "user",
			text: userMsg
		}]);
		setCustomQuestion("");
		setIsAnswering(true);
		try {
			const res = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: userMsg,
					context: `Current Weekly Rule: ${selectedRule.title}. Win Rate: ${ai.qualityScore}%. Overall Grade: ${ai.overallGrade}.`
				})
			});
			const data = await res.json();
			if (res.ok && data.success && data.response) {
				setChatMessages((prev) => [...prev, {
					role: "coach",
					text: data.response
				}]);
				if (data.warning) console.warn("[Gemini API Notice]:", data.warning);
			} else {
				const errReply = data.error || "Sorry, I am unable to generate a response right now. Please try again.";
				setChatMessages((prev) => [...prev, {
					role: "coach",
					text: errReply
				}]);
			}
		} catch {
			setChatMessages((prev) => [...prev, {
				role: "coach",
				text: "Network connection error. Please check your connection and try again."
			}]);
		} finally {
			setIsAnswering(false);
		}
	};
	const readinessScore = (readinessState.emotion === "Calm" ? 35 : readinessState.emotion === "Focused" ? 30 : 15) + (readinessState.prep === "Prepared" ? 35 : readinessState.prep === "Neutral" ? 20 : 10) + (readinessState.risk === "Strict 1%" ? 30 : readinessState.risk === "Flexible" ? 20 : 10);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "AI Coach",
		subtitle: "World-Class AI Trading Mentor & Performance Lab",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "glass relative overflow-hidden rounded-[2.5rem] border border-border/80 p-6 sm:p-8 shadow-2xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -left-20 -top-20 size-80 rounded-full bg-primary/20 blur-3xl animate-float-slow" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -right-20 -bottom-20 size-80 rounded-full bg-accent/20 blur-3xl animate-float-slow [animation-delay:2s]" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative grid size-16 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg glow-primary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brain, { className: "size-8 animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-emerald-500 text-[10px] font-bold text-black ring-2 ring-background",
								children: "✓"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-2xl font-bold tracking-tight sm:text-3xl text-gradient",
								children: "AI Performance Lab"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								tone: "primary",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "mr-1 size-3" }), " LIVE MENTOR ONLINE"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: "Institutional execution grading, weekly trading psychology rules & risk management."
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center gap-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-center backdrop-blur-md",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-semibold uppercase tracking-wider text-primary",
								children: "Pre-Trade Readiness"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-display text-lg font-bold text-foreground",
								children: [readinessScore, "%"]
							})]
						})
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-6 lg:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					className: "lg:col-span-3 border-primary/40 bg-gradient-to-br from-card/80 via-card/50 to-primary/5 shadow-2xl relative overflow-hidden",
					title: `Weekly Golden Rule · Week ${selectedRule.week} of ${WEEKLY_GOLDEN_RULES.length}`,
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setActiveWeekIdx((prev) => prev > 0 ? prev - 1 : WEEKLY_GOLDEN_RULES.length - 1),
								title: "Previous Week Rule",
								className: "grid size-8 place-items-center rounded-lg border border-border/60 bg-card/60 text-muted-foreground transition hover:border-primary/50 hover:text-foreground active:scale-95",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setActiveWeekIdx(getCurrentWeekIndex()),
								title: "Current Week",
								className: "flex items-center gap-1 rounded-lg border border-border/60 bg-card/60 px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-3" }), isCurrentWeek ? "Current" : "Reset"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setActiveWeekIdx((prev) => prev < WEEKLY_GOLDEN_RULES.length - 1 ? prev + 1 : 0),
								title: "Next Week Rule",
								className: "grid size-8 place-items-center rounded-lg border border-border/60 bg-card/60 text-muted-foreground transition hover:border-primary/50 hover:text-foreground active:scale-95",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })
							})
						]
					}),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative grid gap-6 md:grid-cols-[auto_1fr] md:items-center p-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid size-20 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-primary/30 via-accent/20 to-card border border-primary/40 text-primary shadow-xl glow-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { className: "size-10 text-primary animate-bounce-subtle" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "size-3 text-primary" }),
										" ",
										selectedRule.category
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground",
									children: "Rotates automatically every week"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "mt-3 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl",
								children: [
									"\"",
									selectedRule.title,
									"\""
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("blockquote", {
								className: "mt-2 text-base leading-relaxed text-foreground/90 font-medium italic border-l-2 border-primary/50 pl-3 py-1",
								children: [
									"\"",
									selectedRule.rule,
									"\""
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 rounded-xl border border-border/50 bg-background/50 p-3.5 backdrop-blur-md",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Target, { className: "size-3.5 text-accent" }), " Actionable Principle"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-muted-foreground",
									children: selectedRule.principle
								})]
							})
						] })]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					className: "lg:col-span-2 shadow-xl",
					title: "Institutional Execution Grade",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						tone: "primary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, { className: "mr-1 size-3" }), " AI GRADED"]
					}),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center gap-6 sm:flex-row sm:justify-around py-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge3D, {
								value: ai.qualityScore,
								label: "Trade Quality Score",
								tone: "primary"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge3D, {
								value: ai.institutionalScore,
								label: "Institutional Score",
								tone: "accent"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "relative grid size-32 place-items-center rounded-3xl bg-gradient-to-br from-primary via-accent to-primary text-primary-foreground shadow-2xl glow-primary transition-transform duration-500 hover:scale-105",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-display text-5xl font-extrabold tracking-tight",
										children: ai.overallGrade
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2.5 text-xs font-medium text-muted-foreground",
									children: "Overall Performance Grade"
								})]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-3 gap-3 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-border/50 bg-card/40 p-3 backdrop-blur-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
									children: "Discipline"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 font-display text-lg font-bold text-emerald-400",
									children: [ai.disciplineScore, " / 100"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-border/50 bg-card/40 p-3 backdrop-blur-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
									children: "Patience"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 font-display text-lg font-bold text-primary",
									children: [ai.patienceScore, " / 100"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-border/50 bg-card/40 p-3 backdrop-blur-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
									children: "Risk Control"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 font-display text-lg font-bold text-accent",
									children: [ai.riskControlScore, " / 100"]
								})]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Pre-Trading Readiness Assessor",
					className: "shadow-xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground mb-4",
							children: "Assess your psychological state before taking any trade entries today:"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4 text-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-medium text-foreground mb-1.5 flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Emotional State" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-primary font-bold",
										children: readinessState.emotion
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-3 gap-1.5",
									children: [
										"Calm",
										"Focused",
										"Anxious"
									].map((val) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setReadinessState((p) => ({
											...p,
											emotion: val
										})),
										className: `rounded-lg py-1.5 font-medium transition ${readinessState.emotion === val ? "bg-primary text-primary-foreground shadow" : "bg-card/50 text-muted-foreground hover:bg-card"}`,
										children: val
									}, val))
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-medium text-foreground mb-1.5 flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Market Preparation" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-accent font-bold",
										children: readinessState.prep
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-3 gap-1.5",
									children: [
										"Prepared",
										"Neutral",
										"Unprepared"
									].map((val) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setReadinessState((p) => ({
											...p,
											prep: val
										})),
										className: `rounded-lg py-1.5 font-medium transition ${readinessState.prep === val ? "bg-accent text-accent-foreground shadow" : "bg-card/50 text-muted-foreground hover:bg-card"}`,
										children: val
									}, val))
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-medium text-foreground mb-1.5 flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Risk Management Plan" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-emerald-400 font-bold",
										children: readinessState.risk
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-3 gap-1.5",
									children: [
										"Strict 1%",
										"Flexible",
										"High Risk"
									].map((val) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setReadinessState((p) => ({
											...p,
											risk: val
										})),
										className: `rounded-lg py-1.5 font-medium transition ${readinessState.risk === val ? "bg-emerald-500 text-black shadow" : "bg-card/50 text-muted-foreground hover:bg-card"}`,
										children: val
									}, val))
								})] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 rounded-xl border border-border/50 bg-background/50 p-3 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted-foreground",
								children: "Readiness Assessment:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: `font-display text-sm font-bold mt-0.5 ${readinessScore >= 80 ? "text-emerald-400" : readinessScore >= 60 ? "text-amber-400" : "text-destructive"}`,
								children: [
									readinessScore,
									"% — ",
									readinessScore >= 80 ? "Optimal Trading State" : readinessScore >= 60 ? "Proceed With Caution" : "Do Not Trade — Risk High"
								]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					className: "lg:col-span-3 shadow-2xl border-accent/30",
					title: "Interactive AI Mentor Assistant",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs font-semibold text-muted-foreground flex items-center gap-1 self-center mr-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "size-3 text-primary" }), " Suggested Questions:"]
								}), ai.suggestedPrompts.map((promptText) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => handleAskQuestion(promptText),
									className: "rounded-xl border border-border/60 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/60 hover:text-foreground active:scale-95",
									children: promptText
								}, promptText))]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "max-h-60 overflow-y-auto space-y-3 rounded-2xl border border-border/60 bg-background/60 p-4 backdrop-blur-md",
								children: [chatMessages.map((msg, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `flex gap-3 text-sm ${msg.role === "user" ? "justify-end" : "justify-start"}`,
									children: [msg.role === "coach" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid size-7 shrink-0 place-items-center rounded-lg bg-primary/20 text-primary",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brain, { className: "size-4" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: `max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground font-medium" : "border border-border/50 bg-card/80 text-muted-foreground"}`,
										children: msg.text
									})]
								}, i)), isAnswering && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2 items-center text-xs text-muted-foreground italic",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brain, { className: "size-4 animate-spin text-primary" }), " AI Coach is thinking..."]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								onSubmit: (e) => {
									e.preventDefault();
									handleAskQuestion(customQuestion);
								},
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									value: customQuestion,
									onChange: (e) => setCustomQuestion(e.target.value),
									placeholder: "Ask AI Coach about your setups, psychology, or position sizing...",
									className: "w-full rounded-xl border border-border bg-card/50 px-4 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-ring/40"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "submit",
									disabled: !customQuestion.trim() || isAnswering,
									className: "flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] glow-primary disabled:opacity-50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" }), "Ask"]
								})]
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Top Execution Mistakes",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List3D, {
						tone: "bad",
						items: ai.topMistakes
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Top Strengths",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List3D, {
						tone: "good",
						items: ai.topStrengths
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "30-Day Improvement Plan",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "space-y-3 text-sm text-muted-foreground",
						children: ai.improvementPlan.map((step, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-start gap-3 rounded-xl border border-border/40 bg-card/40 p-3 backdrop-blur-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-6 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-bold text-primary",
								children: idx + 1
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "leading-relaxed",
								children: step
							})]
						}, step))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Psychology Analysis",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed text-muted-foreground",
						children: ai.psychologyText
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 grid grid-cols-3 gap-2 text-center text-xs",
						children: [
							["FOMO Risk", "Low"],
							["Revenge Tilt", "Controlled"],
							["Overconfidence", "Low"]
						].map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-border/40 bg-muted/30 p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground",
								children: k
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 font-semibold text-foreground",
								children: v
							})]
						}, k))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Risk Management Review",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3 text-sm text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex items-start gap-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "mt-0.5 size-4 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ai.riskReviewText })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex items-start gap-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Target, { className: "mt-0.5 size-4 shrink-0 text-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Target minimum 1:2.0 Risk:Reward ratio on all high-conviction entries." })]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					className: "lg:col-span-3 border-primary/30 bg-gradient-to-r from-card via-card/80 to-primary/5 shadow-2xl",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg glow-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-6" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display text-lg font-bold text-foreground",
							children: "Final Coach Verdict"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-muted-foreground font-medium",
							children: ai.finalVerdict
						})] })]
					})
				})
			]
		})]
	});
}
//#endregion
export { CoachPage as component };
