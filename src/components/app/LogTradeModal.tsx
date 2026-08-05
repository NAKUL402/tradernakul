import { useState } from "react";
import { toast } from "sonner";
import { PAIRS, SETUPS, SESSIONS, type Trade } from "@/lib/trades";
import { field, primaryBtn } from "./AuthLayout";
import { Upload, X } from "lucide-react";

type LogTradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Partial<Trade>, imageFile?: File) => Promise<void>;
  initialTrade?: Trade | null;
};

export function LogTradeModal({ isOpen, onClose, onSave, initialTrade }: LogTradeModalProps) {
  const [pair, setPair] = useState(initialTrade?.pair || PAIRS[0]!);
  const [side, setSide] = useState<"Buy" | "Sell">(initialTrade?.side || "Buy");
  const [session, setSession] = useState<"Asian" | "London" | "New York">(initialTrade?.session || "London");
  const [entryPrice, setEntryPrice] = useState(String(initialTrade?.entryPrice || 2420.5));
  const [exitPrice, setExitPrice] = useState(String(initialTrade?.exitPrice || 2445.0));
  const [rrr, setRrr] = useState(String(initialTrade?.rrr || 2.5));
  const [riskPct, setRiskPct] = useState(String(initialTrade?.riskPct || 1.0));
  const [setup, setSetup] = useState(initialTrade?.setup || SETUPS[0]!);
  const [confirmation, setConfirmation] = useState(initialTrade?.confirmation || "CHoCH");
  const [notes, setNotes] = useState(initialTrade?.notes || "");
  const [tags, setTags] = useState(initialTrade?.tags ? initialTrade.tags.join(", ") : "A+ Setup, Patience");
  const [date, setDate] = useState(initialTrade?.date || new Date().toISOString().slice(0, 10));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const entryP = parseFloat(entryPrice) || 0;
      const exitP = parseFloat(exitPrice) || 0;
      const risk = parseFloat(riskPct) || 1.0;
      const ratio = parseFloat(rrr) || 1.0;
      
      const win = side === "Buy" ? exitP >= entryP : exitP <= entryP;
      const pnl = win ? Math.round(risk * ratio * 100) / 100 : -risk;

      const tradePayload: Partial<Trade> = {
        id: initialTrade?.id,
        date,
        pair,
        side,
        session,
        entryTime: initialTrade?.entryTime || "14:30",
        exitTime: initialTrade?.exitTime || "15:45",
        entryPrice: entryP,
        exitPrice: exitP,
        result: win ? "Win" : "Loss",
        rrr: ratio,
        riskPct: risk,
        pnl,
        setup,
        confirmation,
        notes,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        screenshot: initialTrade?.screenshot || "chart-1",
      };

      await onSave(tradePayload, imageFile || undefined);
      toast.success(initialTrade ? "Trade updated successfully!" : "New trade logged successfully!");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save trade";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectStyle = "w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass max-h-[90vh] w-full max-w-xl animate-rise overflow-y-auto rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div>
            <h2 className="font-display text-xl font-semibold">{initialTrade ? "Edit Trade" : "Log New Trade"}</h2>
            <p className="text-xs text-muted-foreground">Record entry, setup, risk and chart screenshots.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Pair</label>
              <select className={selectStyle} value={pair} onChange={(e) => setPair(e.target.value)}>
                {PAIRS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Side</label>
              <select className={selectStyle} value={side} onChange={(e) => setSide(e.target.value as "Buy" | "Sell")}>
                <option value="Buy">Buy</option>
                <option value="Sell">Sell</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Session</label>
              <select className={selectStyle} value={session} onChange={(e) => setSession(e.target.value as "Asian" | "London" | "New York")}>
                {SESSIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Entry Price</label>
              <input type="number" step="any" required className={field} value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Exit Price</label>
              <input type="number" step="any" required className={field} value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Risk %</label>
              <input type="number" step="0.1" required className={field} value={riskPct} onChange={(e) => setRiskPct(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">RRR (1:X)</label>
              <input type="number" step="0.1" required className={field} value={rrr} onChange={(e) => setRrr(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Setup</label>
              <select className={selectStyle} value={setup} onChange={(e) => setSetup(e.target.value)}>
                {SETUPS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
              <input type="date" required className={field} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Confirmation & Tags</label>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Confirmation (e.g. CHoCH)" className={field} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
              <input placeholder="Tags (comma separated)" className={field} value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Trade Notes & Rules Followed</label>
            <textarea
              rows={3}
              placeholder="Plan ke according entry liya, TP tak patience rakha..."
              className="w-full rounded-xl border border-border bg-card/50 p-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-ring/40"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Chart Screenshot (Supabase Storage)</label>
            <div className="flex items-center gap-3">
              <label className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/40 p-3 text-xs text-muted-foreground hover:border-primary/60 cursor-pointer">
                <Upload className="size-4 text-primary" />
                <span>{imageFile ? imageFile.name : "Click to select screenshot image"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className={primaryBtn}>
            {isSubmitting ? "Saving Trade…" : initialTrade ? "Update Trade Entry" : "Save Trade Entry"}
          </button>
        </form>
      </div>
    </div>
  );
}
