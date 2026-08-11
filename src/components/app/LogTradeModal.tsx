import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { type Trade } from "@/lib/trades";
import { field, primaryBtn } from "./AuthLayout";
import { Upload, X, Star } from "lucide-react";

type LogTradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Partial<Trade>, imageFile?: File) => Promise<void>;
  initialTrade?: Trade | null;
  nextTradeNo?: number;
};

export function LogTradeModal({
  isOpen,
  onClose,
  onSave,
  initialTrade,
  nextTradeNo = 1,
}: LogTradeModalProps) {
  // 1. Pair: Free text input
  const [pair, setPair] = useState("");
  // 2. Trade No: Automatic
  const [tradeNo, setTradeNo] = useState<number>(nextTradeNo);
  // 3. Side
  const [side, setSide] = useState<"Buy" | "Sell">("Buy");
  const [session, setSession] = useState<"Asian" | "London" | "New York">("London");

  // REMOVED Entry Price & Exit Price per user request!
  // ADDED Result Amount in USD ($)
  const [resultAmount, setResultAmount] = useState("");

  // 4. Entry Time & Exit Time
  const [entryTime, setEntryTime] = useState("");
  const [exitTime, setExitTime] = useState("");
  // 5. Lots
  const [lots, setLots] = useState("");
  // 6. Result (Win or Loss)
  const [result, setResult] = useState<"Win" | "Loss">("Win");
  // 7. RRR: Free text
  const [rrr, setRrr] = useState("");
  const [riskPct, setRiskPct] = useState("1.0");
  // 8. Set-up: Free text
  const [setup, setSetup] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  // 10. Date
  const [date, setDate] = useState("");
  // 11. Trade Rating: Stars
  const [rating, setRating] = useState<number>(5);
  // 12. Reason for Taking Trade
  const [reason, setReason] = useState("");
  // 9. Mistakes
  const [mistakes, setMistakes] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userSettings } = useAuth();

  useEffect(() => {
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
        setDate(initialTrade.date || new Date().toISOString().slice(0, 10));
        setRating(initialTrade.rating || 5);
        setReason(initialTrade.reason || "");
        setMistakes(initialTrade.mistakes || "");
      } else {
        setPair("");
        setTradeNo(nextTradeNo);
        setSide("Buy");
        setSession(userSettings?.default_session || "London");
        setResultAmount("");
        setEntryTime(
          new Date().toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
        setExitTime(
          new Date().toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
        setLots("");
        setResult("Win");
        setRrr(userSettings?.default_rrr || "");
        setRiskPct(userSettings?.default_risk_pct ? String(userSettings.default_risk_pct) : "1.0");
        setSetup("");
        setConfirmation("");
        setNotes("");
        setTags("");
        setDate(new Date().toISOString().slice(0, 10));
        setRating(5);
        setReason("");
        setMistakes("");
      }
      setImageFile(null);
    }
  }, [isOpen, initialTrade, nextTradeNo, userSettings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const pnlValue = parseFloat(resultAmount) || 0;
      const finalPnl = result === "Loss" ? -Math.abs(pnlValue) : Math.abs(pnlValue);
      const risk = parseFloat(riskPct) || 1.0;

      const tradePayload: Partial<Trade> = {
        ...(initialTrade?.id ? { id: initialTrade.id } : {}),
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
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        screenshot: initialTrade?.screenshot || "chart-1",
        lots: lots.trim(),
        mistakes: mistakes.trim(),
        rating,
        reason: reason.trim(),
      };

      await onSave(tradePayload, imageFile || undefined);
      toast.success(
        initialTrade ? "Trade updated successfully!" : "New trade logged successfully!",
      );
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save trade";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectStyle =
    "w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass max-h-[90vh] w-full max-w-xl animate-rise overflow-y-auto rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div>
            <h2 className="font-display text-xl font-semibold">
              {initialTrade ? "Edit Trade" : "Log New Trade"} (No. #{tradeNo})
            </h2>
            <p className="text-xs text-muted-foreground">
              Record entry, setup, risk and chart screenshots.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Header Row: Pair, Side, Session */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Pair</label>
              <input
                type="text"
                placeholder="e.g. GBPUSD"
                required
                className={field}
                value={pair}
                onChange={(e) => setPair(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Side</label>
              <select
                className={selectStyle}
                value={side}
                onChange={(e) => setSide(e.target.value as "Buy" | "Sell")}
              >
                <option value="Buy">Buy</option>
                <option value="Sell">Sell</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Session
              </label>
              <select
                className={selectStyle}
                value={session}
                onChange={(e) => setSession(e.target.value as "Asian" | "London" | "New York")}
              >
                <option value="London">London</option>
                <option value="New York">New York</option>
                <option value="Asian">Asian</option>
              </select>
            </div>
          </div>

          {/* Result Amount in USD ($) replaces Entry/Exit price */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-primary mb-1">
                Result Amount ({userSettings?.currency?.split(" ")[1]?.replace(/[()]/g, "") || "$"})
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 5000 or -1500"
                className={`${field} border-primary/50 bg-primary/5 font-semibold text-foreground`}
                value={resultAmount}
                onChange={(e) => setResultAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Lot Size (Lots)
              </label>
              <input
                type="text"
                placeholder="e.g. 0.5"
                className={field}
                value={lots}
                onChange={(e) => setLots(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Risk %</label>
              <input
                type="number"
                step="0.1"
                required
                className={field}
                value={riskPct}
                onChange={(e) => setRiskPct(e.target.value)}
              />
            </div>
          </div>

          {/* Times and Results Row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Entry Time
              </label>
              <input
                type="time"
                required
                className={field}
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Exit Time
              </label>
              <input
                type="time"
                required
                className={field}
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Result Status
              </label>
              <select
                className={selectStyle}
                value={result}
                onChange={(e) => setResult(e.target.value as "Win" | "Loss")}
              >
                <option value="Win">Win</option>
                <option value="Loss">Loss</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                RRR (Free text)
              </label>
              <input
                type="text"
                placeholder="e.g. 1:3"
                required
                className={field}
                value={rrr}
                onChange={(e) => setRrr(e.target.value)}
              />
            </div>
          </div>

          {/* Setup, Date, Rating Row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="col-span-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Set-up</label>
              <input
                type="text"
                placeholder="e.g. Liquidity Sweep"
                required
                className={field}
                value={setup}
                onChange={(e) => setSetup(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
              <input
                type="date"
                required
                className={field}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Trade Rating
              </label>
              <div className="flex h-[42px] items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-0.5 text-muted-foreground hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`size-5 ${
                        star <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Confirmations & Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Confirmation
              </label>
              <input
                placeholder="Confirmation (e.g. CHoCH)"
                className={field}
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tags</label>
              <input
                placeholder="Tags (comma separated)"
                className={field}
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          {/* Reason for Taking Trade */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Reason for Taking Trade
            </label>
            <input
              type="text"
              placeholder="e.g. Strong H4 support retest + dynamic liquidity sweep"
              className={field}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Mistakes Section */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Mistakes</label>
            <input
              type="text"
              placeholder="e.g. Entered 5 mins early before candle closure"
              className={field}
              value={mistakes}
              onChange={(e) => setMistakes(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Trade Notes & Rules Followed
            </label>
            <textarea
              rows={2}
              placeholder="Log the details of your setup, execution, and exit. Did you follow your plan?"
              className="w-full rounded-xl border border-border bg-card/50 p-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-ring/40"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Chart Screenshot (Storage Upload)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/40 p-3 text-xs text-muted-foreground hover:border-primary/60 cursor-pointer">
                <Upload className="size-4 text-primary" />
                <span>{imageFile ? imageFile.name : "Click to select screenshot image"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className={primaryBtn}>
            {isSubmitting
              ? "Saving Trade…"
              : initialTrade
                ? "Update Trade Entry"
                : "Save Trade Entry"}
          </button>
        </form>
      </div>
    </div>
  );
}
