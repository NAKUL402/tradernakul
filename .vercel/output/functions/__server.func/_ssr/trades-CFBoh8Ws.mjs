import { n as supabase, t as isSupabaseConfigured } from "./supabase-BnRmJshq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/trades-CFBoh8Ws.js
var PAIRS = [
	"XAUUSD",
	"EURUSD",
	"GBPUSD",
	"USDJPY",
	"BTCUSD",
	"NAS100"
];
var SETUPS = [
	"Order Block",
	"FVG Retest",
	"Liquidity Sweep",
	"Break & Retest",
	"Trend Continuation"
];
var money = (n, currency = "₹") => `${n < 0 ? "-" : ""}${currency}${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
var pct = (n) => `${n.toFixed(1)}%`;
var ACCOUNT = 1e4;
var pnlUsd = (t) => Math.round(t.pnl || 0);
function streaks(list) {
	let win = 0, loss = 0;
	for (let i = list.length - 1; i >= 0; i--) if (list[i].result === "Win" && loss === 0) win++;
	else break;
	for (let i = list.length - 1; i >= 0; i--) if (list[i].result === "Loss" && win === 0) loss++;
	else break;
	return {
		win,
		loss
	};
}
function groupStats(list, key) {
	const map = /* @__PURE__ */ new Map();
	for (const t of list) {
		const k = key(t);
		const cur = map.get(k) ?? {
			name: k,
			trades: 0,
			wins: 0,
			pnl: 0
		};
		cur.trades++;
		if (t.result === "Win") cur.wins++;
		cur.pnl += pnlUsd(t);
		map.set(k, cur);
	}
	return [...map.values()].map((g) => ({
		...g,
		winRate: g.wins / g.trades * 100
	}));
}
function stats(list = []) {
	if (!list || list.length === 0) return {
		total: 0,
		winRate: 0,
		avgRRR: 0,
		profitFactor: 0,
		winStreak: 0,
		lossStreak: 0,
		bestPair: {
			name: "N/A",
			trades: 0,
			wins: 0,
			pnl: 0,
			winRate: 0
		},
		worstPair: {
			name: "N/A",
			trades: 0,
			wins: 0,
			pnl: 0,
			winRate: 0
		},
		net: 0,
		monthlyPnl: 0,
		weeklyPnl: 0,
		avgWin: 0,
		avgLoss: 0,
		wins: 0,
		losses: 0
	};
	const wins = list.filter((t) => t.result === "Win");
	const losses = list.filter((t) => t.result === "Loss");
	const gross = wins.reduce((s, t) => s + pnlUsd(t), 0);
	const grossLoss = Math.abs(losses.reduce((s, t) => s + pnlUsd(t), 0));
	const byPair = groupStats(list, (t) => t.pair).sort((a, b) => b.pnl - a.pnl);
	const s = streaks(list);
	const net = gross - grossLoss;
	const month = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
	return {
		total: list.length,
		winRate: wins.length / list.length * 100,
		avgRRR: list.reduce((sum, t) => sum + (parseFloat(t.rrr) || 0), 0) / list.length,
		profitFactor: grossLoss === 0 ? gross : gross / grossLoss,
		winStreak: s.win,
		lossStreak: s.loss,
		bestPair: byPair[0] ?? {
			name: "N/A",
			trades: 0,
			wins: 0,
			pnl: 0,
			winRate: 0
		},
		worstPair: byPair[byPair.length - 1] ?? {
			name: "N/A",
			trades: 0,
			wins: 0,
			pnl: 0,
			winRate: 0
		},
		net,
		monthlyPnl: list.filter((t) => t.date.startsWith(month)).reduce((s2, t) => s2 + pnlUsd(t), 0),
		weeklyPnl: list.slice(-8).reduce((s2, t) => s2 + pnlUsd(t), 0),
		avgWin: gross / Math.max(wins.length, 1),
		avgLoss: grossLoss / Math.max(losses.length, 1),
		wins: wins.length,
		losses: losses.length
	};
}
function equityCurve(list = []) {
	let eq = ACCOUNT;
	let peak = ACCOUNT;
	return list.map((t, i) => {
		eq += pnlUsd(t);
		peak = Math.max(peak, eq);
		return {
			i: i + 1,
			date: t.date,
			equity: Math.round(eq),
			drawdown: Math.round((eq - peak) / peak * 1e3) / 10
		};
	});
}
function monthly(list = []) {
	return groupStats(list, (t) => t.date.slice(0, 7)).sort((a, b) => a.name < b.name ? -1 : 1).map((m) => ({
		...m,
		label: (/* @__PURE__ */ new Date(`${m.name}-01T00:00:00Z`)).toLocaleString("en-US", { month: "short" })
	}));
}
var DOW = [
	"Sun",
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat"
];
var LOCAL_TRADES_KEY = "tn_trades_store_v2";
function getLocalTrades() {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(LOCAL_TRADES_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}
function setLocalTrades(list) {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(LOCAL_TRADES_KEY, JSON.stringify(list));
	} catch {}
}
async function fetchUserTrades() {
	let combined = getLocalTrades();
	if (isSupabaseConfigured) try {
		const { data, error } = await supabase.from("trades").select("*").order("date", { ascending: false });
		if (!error && data && data.length > 0) {
			const fetched = data.map((t) => ({
				id: t.id,
				tradeNo: t.trade_no ? parseInt(t.trade_no, 10) : void 0,
				date: t.date,
				pair: t.pair,
				side: t.side,
				session: t.session,
				entryTime: t.entry_time,
				exitTime: t.exit_time,
				entryPrice: parseFloat(t.entry_price || "0"),
				exitPrice: parseFloat(t.exit_price || "0"),
				result: t.result,
				rrr: String(t.rrr || "1.0"),
				riskPct: parseFloat(t.risk_pct || "1"),
				pnl: parseFloat(t.pnl || "0"),
				setup: t.setup,
				confirmation: t.confirmation || "",
				notes: t.notes || "",
				screenshot: t.screenshot_url || "chart-1",
				tags: t.tags || [],
				lots: t.lots || "",
				mistakes: t.mistakes || "",
				rating: t.rating ? parseInt(t.rating, 10) : void 0,
				reason: t.reason || ""
			}));
			const map = /* @__PURE__ */ new Map();
			for (const tr of combined) map.set(tr.id, tr);
			for (const tr of fetched) map.set(tr.id, tr);
			combined = Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
			setLocalTrades(combined);
		}
	} catch (err) {
		console.warn("[Trades] Supabase fetch notice:", err);
	}
	return combined;
}
async function saveTradeToSupabase(tradePayload, userId, imageFile) {
	let screenshotUrl = tradePayload.screenshot || "chart-1";
	if (imageFile && isSupabaseConfigured) try {
		const fileExt = imageFile.name.split(".").pop();
		const filePath = `${userId}/${Date.now()}.${fileExt}`;
		const { error: uploadError } = await supabase.storage.from("trade-screenshots").upload(filePath, imageFile);
		if (!uploadError) {
			const { data: publicUrlData } = supabase.storage.from("trade-screenshots").getPublicUrl(filePath);
			screenshotUrl = publicUrlData.publicUrl;
		}
	} catch (err) {
		console.warn("[Storage] Image upload notice:", err);
	}
	const tradeId = tradePayload.id || `trade-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
	const newTradeObj = {
		id: tradeId,
		tradeNo: tradePayload.tradeNo,
		date: tradePayload.date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
		pair: tradePayload.pair || "XAUUSD",
		side: tradePayload.side || "Buy",
		session: tradePayload.session || "London",
		entryTime: tradePayload.entryTime || "12:00",
		exitTime: tradePayload.exitTime || "13:00",
		entryPrice: tradePayload.entryPrice || 0,
		exitPrice: tradePayload.exitPrice || 0,
		result: tradePayload.result || "Win",
		rrr: String(tradePayload.rrr || "2.0"),
		riskPct: tradePayload.riskPct || 1,
		pnl: tradePayload.pnl || 0,
		setup: tradePayload.setup || "Liquidity Sweep",
		confirmation: tradePayload.confirmation || "",
		notes: tradePayload.notes || "",
		screenshot: screenshotUrl,
		tags: tradePayload.tags || [],
		lots: tradePayload.lots || "",
		mistakes: tradePayload.mistakes || "",
		rating: tradePayload.rating,
		reason: tradePayload.reason || ""
	};
	const currentList = getLocalTrades();
	const existingIdx = currentList.findIndex((t) => t.id === tradeId);
	if (existingIdx >= 0) currentList[existingIdx] = newTradeObj;
	else currentList.unshift(newTradeObj);
	setLocalTrades(currentList);
	if (isSupabaseConfigured) {
		const row = {
			id: tradeId,
			user_id: userId,
			trade_no: newTradeObj.tradeNo,
			date: newTradeObj.date,
			pair: newTradeObj.pair,
			side: newTradeObj.side,
			session: newTradeObj.session,
			entry_time: newTradeObj.entryTime,
			exit_time: newTradeObj.exitTime,
			entry_price: newTradeObj.entryPrice,
			exit_price: newTradeObj.exitPrice,
			result: newTradeObj.result,
			rrr: newTradeObj.rrr,
			risk_pct: newTradeObj.riskPct,
			pnl: newTradeObj.pnl,
			setup: newTradeObj.setup,
			confirmation: newTradeObj.confirmation,
			notes: newTradeObj.notes,
			screenshot_url: screenshotUrl,
			tags: newTradeObj.tags,
			lots: newTradeObj.lots,
			mistakes: newTradeObj.mistakes,
			rating: newTradeObj.rating,
			reason: newTradeObj.reason
		};
		try {
			if (tradePayload.id) await supabase.from("trades").update(row).eq("id", tradeId);
			else await supabase.from("trades").insert(row);
		} catch (e) {
			console.warn("[Database] Trades sync notice:", e);
		}
	}
}
async function deleteTradeFromSupabase(tradeId) {
	setLocalTrades(getLocalTrades().filter((t) => t.id !== tradeId));
	if (isSupabaseConfigured) try {
		await supabase.from("trades").delete().eq("id", tradeId);
	} catch (e) {
		console.warn("[Database] Delete trade notice:", e);
	}
}
//#endregion
export { equityCurve as a, money as c, pnlUsd as d, saveTradeToSupabase as f, deleteTradeFromSupabase as i, monthly as l, streaks as m, PAIRS as n, fetchUserTrades as o, stats as p, SETUPS as r, groupStats as s, DOW as t, pct as u };
