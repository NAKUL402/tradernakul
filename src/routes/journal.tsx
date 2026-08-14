import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Badge, EmptyState, Panel } from "@/components/app/ui-kit";
import { LogTradeModal } from "@/components/app/LogTradeModal";
import { useAuth } from "@/lib/auth-context";
import {
  PAIRS,
  SETUPS,
  money,
  pnlUsd,
  type Trade,
  fetchUserTrades,
  saveTradeToSupabase,
  deleteTradeFromSupabase,
  isValidImageUrl,
  sortTradesNewestFirst,
} from "@/lib/trades";
import { Clock, ImageIcon, Plus, Search, SlidersHorizontal, Trash2, Edit3, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Trading Journal — Edge Journal" },
      {
        name: "description",
        content:
          "Log every trade with setup, session, RRR, risk, tags, screenshots and notes in a premium journal interface.",
      },
      { property: "og:title", content: "Trading Journal — Edge Journal" },
      {
        property: "og:description",
        content: "Premium trade logging with filters, tags, screenshots and detailed notes.",
      },
    ],
  }),
  component: Journal,
});

function TradeCard({ t, onOpen }: { t: Trade; onOpen: () => void }) {
  const { userSettings } = useAuth();
  const pnl = pnlUsd(t);
  const currencySymbol = userSettings?.currency?.split(" ")[1]?.replace(/[()]/g, "") || "$";
  const glow = t.result === "Win" ? "neon-glow-green" : "neon-glow-red";
  return (
    <button
      onClick={onOpen}
      className={cn(
        "neon-card group w-full p-5 text-left transition-all duration-300 cursor-pointer",
        glow
      )}
    >
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <p className="font-display text-base font-bold text-foreground truncate max-w-full">
            {t.pair} {t.tradeNo ? `#${t.tradeNo}` : ""}
          </p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">
            {t.date} · {t.session}
          </p>
        </div>
        <Badge tone={t.result === "Win" ? "win" : "loss"}>{t.result}</Badge>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-xl bg-muted/50 p-2.5 text-center transition-colors group-hover:bg-muted">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Side</p>
          <p className="font-semibold text-foreground mt-0.5">{t.side}</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-2.5 text-center transition-colors group-hover:bg-muted">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">RRR</p>
          <p className="font-semibold text-foreground mt-0.5">{t.rrr}</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-2.5 text-center transition-colors group-hover:bg-muted">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Risk</p>
          <p className="font-semibold text-foreground mt-0.5">{t.riskPct}%</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Clock className="size-3.5" /> {t.entryTime} → {t.exitTime}
        <span className="ml-auto flex items-center gap-1 truncate max-w-[120px]">
          <ImageIcon className="size-3.5" /> Screenshot
        </span>
      </div>
      {isValidImageUrl(t.screenshot) ? (
        <img
          src={t.screenshot}
          alt={t.pair}
          className="mt-3 h-28 w-full rounded-xl object-cover border border-border"
        />
      ) : (
        <div className="mt-3 h-16 overflow-hidden rounded-xl bg-muted/30 border border-border/50" />
      )}
      <p className="mt-3 line-clamp-2 text-xs font-medium text-muted-foreground leading-relaxed">{t.notes}</p>
      <div className="mt-4 flex flex-wrap items-center gap-1.5 min-w-0">
        <Badge tone="primary">{t.setup}</Badge>
        {(t.tags || []).map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
        <span
          className={cn(
            "ml-auto font-display text-sm font-bold tabular-nums shrink-0 pl-2",
            pnl >= 0 ? "text-success" : "text-danger",
          )}
        >
          {money(pnl, currencySymbol)}
        </span>
      </div>
    </button>
  );
}

function FilterInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border-none bg-surface-glass elevation-1 px-3 py-1.5 text-xs text-foreground transition-all focus-within:ring-2 focus-within:ring-primary/20">
      <span className="font-medium text-muted-foreground whitespace-nowrap">{label}:</span>
      <input
        type="text"
        value={value === "All" ? "" : value}
        onChange={(e) => onChange(e.target.value || "All")}
        placeholder="All"
        className="w-16 sm:w-20 bg-transparent outline-none placeholder:text-foreground"
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border-none bg-surface-glass elevation-1 pl-3 pr-2 py-1.5 text-xs text-foreground transition-all focus-within:ring-2 focus-within:ring-primary/20">
      <span className="font-medium text-muted-foreground whitespace-nowrap">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent outline-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-background">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Journal() {
  const { user, siteSettings, userSettings } = useAuth();
  const currencySymbol = userSettings?.currency?.split(" ")[1]?.replace(/[()]/g, "") || "$";
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

  const list = useMemo(() => {
    let l = allTrades.filter((t) => {
      const tagsText = Array.isArray(t.tags) ? t.tags.join(" ") : "";
      const text =
        `${t.pair || ""} ${t.setup || ""} ${t.notes || ""} ${tagsText} ${t.session || ""}`.toLowerCase();
      return (
        text.includes(q.toLowerCase()) &&
        (pair === "All" || (t.pair?.toLowerCase() || "").includes(pair.toLowerCase())) &&
        (result === "All" || t.result === result) &&
        (setup === "All" || (t.setup?.toLowerCase() || "").includes(setup.toLowerCase()))
      );
    });
    if (sort === "oldest") {
      l = sortTradesNewestFirst(l).reverse();
    } else if (sort === "rrr") {
      l = [...l].sort((a, b) => parseFloat(b.rrr || "0") - parseFloat(a.rrr || "0"));
    } else if (sort === "pnl") {
      l = [...l].sort((a, b) => pnlUsd(b) - pnlUsd(a));
    } else {
      // Default: newest first (global timeline)
      l = sortTradesNewestFirst(l);
    }
    return l;
  }, [allTrades, q, pair, result, setup, sort]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") {
        const idx = list.findIndex((t) => t.id === open.id);
        if (idx >= 0 && idx < list.length - 1) setOpen(list[idx + 1] ?? null);
      } else if (e.key === "ArrowLeft") {
        const idx = list.findIndex((t) => t.id === open.id);
        if (idx > 0) setOpen(list[idx - 1] ?? null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, list]);

  const loadTrades = async () => {
    const data = await fetchUserTrades();
    const newestFirst = sortTradesNewestFirst(data);
    const totalCount = newestFirst.length;

    // Assign tradeNo so newest trade gets #N, 2nd newest gets #(N-1)... down to oldest which gets #1
    const tradesWithNumbers = newestFirst.map((t, index) => ({
      ...t,
      tradeNo: totalCount - index,
    }));
    setAllTrades(tradesWithNumbers);
  };

  const handleSaveTrade = async (tradePayload: Partial<Trade>, imageFile?: File) => {
    const userId = user?.id || "open-access-trader-007";
    await saveTradeToSupabase(tradePayload, userId, imageFile);
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

  return (
    <AppShell title="Trading Journal" subtitle={`${list.length} trades logged`}>
      <Panel
        className="neon-glow-blue"
        action={
          siteSettings?.journal_enabled !== false ? (
            <button
              onClick={() => {
                setEditingTrade(null);
                setIsLogModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition-all hover:elevation-2 hover:-translate-y-[1px] shadow-[0_0_16px_rgba(99,102,241,0.4)]"
            >
              <Plus className="size-4" /> Log Trade
            </button>
          ) : (
            <span className="text-xs text-destructive font-semibold bg-destructive/10 px-3 py-1.5 rounded-xl border border-destructive/20">
              Journal Read-Only
            </span>
          )
        }
      >
        {siteSettings?.journal_enabled === false && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200">
            <p className="text-xs font-medium">
              ⚠️ The Trading Journal is in read-only mode. Adding, editing, and deleting trades is
              temporarily disabled.
            </p>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-background/60 px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search pair, setup, tag or notes…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
              <SlidersHorizontal className="size-3.5" /> Filters
            </span>
            <FilterInput label="Symbol" value={pair} onChange={setPair} />
            <FilterSelect
              label="Result"
              value={result}
              onChange={setResult}
              options={[
                { label: "All", value: "All" },
                { label: "Win", value: "Win" },
                { label: "Loss", value: "Loss" },
              ]}
            />
            <FilterInput label="Setup" value={setup} onChange={setSetup} />
            <FilterSelect
              label="Sort"
              value={sort}
              onChange={setSort}
              options={[
                { label: "Newest first", value: "newest" },
                { label: "Oldest first", value: "oldest" },
                { label: "Highest RRR", value: "rrr" },
                { label: "Highest Profit", value: "pnl" },
              ]}
            />
          </div>
        </div>
      </Panel>

      {allTrades.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="Your journal is empty"
            hint="Start logging your first trade to build your journal and unlock AI insights."
          />
        </div>
      ) : list.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No trades match your filters"
            hint="Try clearing the search box or switching the pair / result filter."
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.slice(0, 30).map((t) => (
            <TradeCard key={t.id} t={t} onOpen={() => setOpen(t)} />
          ))}
        </div>
      )}

      {/* Trade Detail Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-end bg-black/60 p-0 backdrop-blur-sm sm:place-items-center sm:p-6"
          onClick={() => {
            setOpen(null);
            setConfirmDeleteId(null);
          }}
        >
          <div
            className="glass max-h-[85vh] w-full max-w-lg animate-rise overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">
                  {open.pair} · {open.side} {open.tradeNo ? `(#${open.tradeNo})` : ""}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {open.date} · {open.session} session
                </p>
              </div>
              <div className="flex items-center gap-1">
                {siteSettings?.journal_enabled !== false && (
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
                )}
                {siteSettings?.journal_enabled !== false && (
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
                )}
                <button
                  aria-label="Close"
                  onClick={() => {
                    setOpen(null);
                    setConfirmDeleteId(null);
                  }}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Inline Delete Confirmation */}
            {confirmDeleteId === open.id && (
              <div className="mt-3 rounded-xl border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm font-medium text-destructive">
                  Are you sure you want to delete this trade?
                </p>
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

            {isValidImageUrl(open.screenshot) ? (
              <img
                src={open.screenshot}
                alt={open.pair}
                className="mt-4 h-48 w-full rounded-2xl object-cover ring-1 ring-border"
              />
            ) : (
              <div className="mt-4 h-36 rounded-2xl bg-gradient-to-br from-primary/30 via-accent/20 to-transparent ring-1 ring-border" />
            )}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              {[
                ["Entry Time", open.entryTime],
                ["Exit Time", open.exitTime],
                ["Result Amount", `${currencySymbol}${Math.abs(open.pnl).toLocaleString("en-US")}`],
                ["Lots Size", open.lots || "—"],
                ["RRR", open.rrr],
                ["Risk", `${open.riskPct}%`],
                ["Setup", open.setup],
                ["Confirmation", open.confirmation || "—"],
                ["Result Status", open.result],
                ["Rating", "⭐".repeat(open.rating || 5)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-muted/40 p-2.5">
                  <p className="text-muted-foreground">{k}</p>
                  <p className="font-medium">{v}</p>
                </div>
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
              {(open.tags || []).map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
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
