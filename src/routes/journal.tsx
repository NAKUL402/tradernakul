import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Badge, EmptyState, Panel } from "@/components/app/ui-kit";
import { LogTradeModal } from "@/components/app/LogTradeModal";
import { useAuth } from "@/lib/auth-context";
import {
  PAIRS, SETUPS, money, pnlUsd, type Trade,
  fetchUserTrades, saveTradeToSupabase, deleteTradeFromSupabase
} from "@/lib/trades";
import { Clock, ImageIcon, Plus, Search, SlidersHorizontal, Trash2, Edit3, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Trading Journal — Trading Journal AI" },
      { name: "description", content: "Log every trade with setup, session, RRR, risk, tags, screenshots and notes in a premium journal interface." },
      { property: "og:title", content: "Trading Journal — Trading Journal AI" },
      { property: "og:description", content: "Premium trade logging with filters, tags, screenshots and detailed notes." },
    ],
  }),
  component: Journal,
});

function TradeCard({ t, onOpen }: { t: Trade; onOpen: () => void }) {
  const pnl = pnlUsd(t);
  return (
    <button
      onClick={onOpen}
      className="glass group animate-rise w-full rounded-2xl p-4 text-left transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-base font-semibold">
            {t.pair} {t.tradeNo ? `#${t.tradeNo}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">{t.date} · {t.session}</p>
        </div>
        <Badge tone={t.result === "Win" ? "win" : "loss"}>{t.result}</Badge>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-xl bg-muted/40 p-2"><p className="text-muted-foreground">Side</p><p className="font-medium">{t.side}</p></div>
        <div className="rounded-xl bg-muted/40 p-2"><p className="text-muted-foreground">RRR</p><p className="font-medium">{t.rrr}</p></div>
        <div className="rounded-xl bg-muted/40 p-2"><p className="text-muted-foreground">Risk</p><p className="font-medium">{t.riskPct}%</p></div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="size-3.5" /> {t.entryTime} → {t.exitTime}
        <span className="ml-auto flex items-center gap-1 truncate max-w-[120px]"><ImageIcon className="size-3.5" /> Screenshot</span>
      </div>
      {t.screenshot && t.screenshot.startsWith("http") ? (
        <img src={t.screenshot} alt={t.pair} className="mt-3 h-24 w-full rounded-xl object-cover ring-1 ring-border" />
      ) : (
        <div className="mt-3 h-16 overflow-hidden rounded-xl bg-gradient-to-br from-primary/25 via-accent/15 to-transparent ring-1 ring-border" />
      )}
      <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{t.notes}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge tone="primary">{t.setup}</Badge>
        {(t.tags || []).map((tag) => <Badge key={tag}>{tag}</Badge>)}
        <span className={cn("ml-auto font-display text-sm font-semibold", pnl >= 0 ? "text-[oklch(0.72_0.19_155)]" : "text-destructive")}>{money(pnl)}</span>
      </div>
    </button>
  );
}

function Journal() {
  const { user } = useAuth();
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [q, setQ] = useState("");
  const [pair, setPair] = useState("All");
  const [result, setResult] = useState("All");
  const [setup, setSetup] = useState("All");
  const [sort, setSort] = useState("newest");
  const [open, setOpen] = useState<Trade | null>(null);

  // Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  // Delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadTrades();

    const handleOpenModal = () => {
      setEditingTrade(null);
      setIsLogModalOpen(true);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("open_log_trade_modal", handleOpenModal);

      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("openModal") === "true") {
        setIsLogModalOpen(true);
        window.history.replaceState({}, "", window.location.pathname);
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("open_log_trade_modal", handleOpenModal);
      }
    };
  }, []);

  const loadTrades = async () => {
    const data = await fetchUserTrades();
    setAllTrades(data);
  };

  const handleSaveTrade = async (tradePayload: Partial<Trade>, imageFile?: File) => {
    if (!user) {
      toast.error("Please sign in to save trades to database.");
      return;
    }
    await saveTradeToSupabase(tradePayload, user.id, imageFile);
    await loadTrades();
  };

  const handleDeleteTrade = async (tradeId: string) => {
    setIsDeleting(true);
    try {
      await deleteTradeFromSupabase(tradeId);
      // Also remove from local state immediately for instant UI feedback
      setAllTrades((prev) => prev.filter((t) => t.id !== tradeId));
      toast.success("Trade entry deleted successfully!");
      setOpen(null);
      setConfirmDeleteId(null);
      // Reload from source to sync
      await loadTrades();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete trade";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const list = useMemo(() => {
    let l = allTrades.filter((t) => {
      const tagsText = Array.isArray(t.tags) ? t.tags.join(" ") : "";
      const text = `${t.pair || ""} ${t.setup || ""} ${t.notes || ""} ${tagsText} ${t.session || ""}`.toLowerCase();
      return (
        text.includes(q.toLowerCase()) &&
        (pair === "All" || t.pair === pair) &&
        (result === "All" || t.result === result) &&
        (setup === "All" || t.setup === setup)
      );
    });
    l = [...l].sort((a, b) =>
      sort === "newest" ? (a.date < b.date ? 1 : -1)
      : sort === "oldest" ? (a.date > b.date ? 1 : -1)
      : sort === "rrr" ? b.rrr - a.rrr
      : pnlUsd(b) - pnlUsd(a),
    );
    return l;
  }, [allTrades, q, pair, result, setup, sort]);

  const select = "rounded-xl border border-border bg-card/60 px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <AppShell title="Trading Journal" subtitle={`${list.length} trades logged`}>
      <Panel
        action={
          <button
            onClick={() => {
              setEditingTrade(null);
              setIsLogModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 glow-primary"
          >
            <Plus className="size-4" /> Log Trade
          </button>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search pair, setup, tag or notes…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><SlidersHorizontal className="size-3.5" /> Filters</span>
            <select className={select} value={pair} onChange={(e) => setPair(e.target.value)}>
              {["All", ...PAIRS].map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className={select} value={result} onChange={(e) => setResult(e.target.value)}>
              {["All", "Win", "Loss"].map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className={select} value={setup} onChange={(e) => setSetup(e.target.value)}>
              {["All", ...SETUPS].map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className={select} value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="rrr">Highest RRR</option>
              <option value="pnl">Biggest PnL</option>
            </select>
          </div>
        </div>
      </Panel>

      {list.length === 0 ? (
        <div className="mt-4"><EmptyState title="No trades match your filters" hint="Try clearing the search box or switching the pair / result filter." /></div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.slice(0, 30).map((t) => <TradeCard key={t.id} t={t} onOpen={() => setOpen(t)} />)}
        </div>
      )}

      {/* Trade Detail Modal */}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/60 p-0 backdrop-blur-sm sm:place-items-center sm:p-6" onClick={() => { setOpen(null); setConfirmDeleteId(null); }}>
          <div className="glass max-h-[85vh] w-full max-w-lg animate-rise overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">
                  {open.pair} · {open.side} {open.tradeNo ? `(#${open.tradeNo})` : ""}
                </h3>
                <p className="text-xs text-muted-foreground">{open.date} · {open.session} session</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const currentOpen = open;
                    setOpen(null);
                    setEditingTrade(currentOpen);
                    setIsLogModalOpen(true);
                  }}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
                  title="Edit trade"
                >
                  <Edit3 className="size-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setConfirmDeleteId(open.id);
                  }}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive"
                  title="Delete trade"
                >
                  <Trash2 className="size-4" />
                </button>
                <button aria-label="Close" onClick={() => { setOpen(null); setConfirmDeleteId(null); }} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Inline Delete Confirmation */}
            {confirmDeleteId === open.id && (
              <div className="mt-3 rounded-xl border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm font-medium text-destructive">Are you sure you want to delete this trade?</p>
                <p className="mt-1 text-xs text-muted-foreground">This action cannot be undone.</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteTrade(open.id);
                    }}
                    disabled={isDeleting}
                    className="rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Yes, Delete"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setConfirmDeleteId(null);
                    }}
                    className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {open.screenshot && open.screenshot.startsWith("http") ? (
              <img src={open.screenshot} alt={open.pair} className="mt-4 h-48 w-full rounded-2xl object-cover ring-1 ring-border" />
            ) : (
              <div className="mt-4 h-36 rounded-2xl bg-gradient-to-br from-primary/30 via-accent/20 to-transparent ring-1 ring-border" />
            )}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              {[
                ["Entry Time", open.entryTime], ["Exit Time", open.exitTime],
                ["Result Amount (₹)", `₹${Math.abs(open.pnl).toLocaleString("en-IN")}`],
                ["Lots Size", open.lots || "—"], ["RRR", open.rrr],
                ["Risk", `${open.riskPct}%`], ["Setup", open.setup],
                ["Confirmation", open.confirmation || "—"], ["Result Status", open.result],
                ["Rating", "⭐".repeat(open.rating || 5)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-muted/40 p-2.5"><p className="text-muted-foreground">{k}</p><p className="font-medium">{v}</p></div>
              ))}
            </div>

            {open.reason && (
              <div className="mt-4 rounded-xl bg-muted/20 p-3 text-xs">
                <p className="font-semibold text-muted-foreground">Reason for taking trade:</p>
                <p className="mt-1 text-foreground leading-normal">{open.reason}</p>
              </div>
            )}

            {open.mistakes && (
              <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs animate-rise">
                <p className="font-semibold text-destructive/80">Mistakes recorded:</p>
                <p className="mt-1 text-foreground leading-normal">{open.mistakes}</p>
              </div>
            )}

            {open.notes && (
              <div className="mt-3 rounded-xl bg-muted/20 p-3 text-xs">
                <p className="font-semibold text-muted-foreground">Trade Notes & Rules Followed:</p>
                <p className="mt-1 text-muted-foreground leading-normal">{open.notes}</p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-1.5">
              {(open.tags || []).map((t) => <Badge key={t}>{t}</Badge>)}
            </div>
          </div>
        </div>
      )}

      {/* Log / Edit Trade Modal */}
      <LogTradeModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSave={handleSaveTrade}
        initialTrade={editingTrade}
        nextTradeNo={allTrades.length + 1}
      />
    </AppShell>
  );
}
