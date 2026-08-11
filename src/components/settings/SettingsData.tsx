import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Panel } from "@/components/app/ui-kit";
import { Download } from "lucide-react";
import { fetchUserTrades } from "@/lib/trades";
import { toast } from "sonner";

export function SettingsData() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const trades = await fetchUserTrades(user.id);
      if (!trades || trades.length === 0) {
        toast.info("No trades to export.");
        setIsExporting(false);
        return;
      }
      
      const headers = ["ID", "Date", "Pair", "Side", "Session", "Result", "Entry Time", "Exit Time", "Entry Price", "Exit Price", "Risk %", "RRR", "PnL", "Setup", "Notes"];
      const rows = trades.map(t => [
        t.id, t.date, t.pair, t.side, t.session, t.result, t.entryTime, t.exitTime, 
        t.entryPrice, t.exitPrice, t.riskPct, t.rrr, t.pnl, t.setup, `"${(t.notes || "").replace(/"/g, '""')}"`
      ]);
      
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `edgejournal_export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("CSV export downloaded successfully.");
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export data.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Panel title="Data & Export">
      <p className="mb-4 text-xs text-muted-foreground">
        Download a complete copy of your trading journal records in CSV format.
      </p>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        <Download className="size-4" /> 
        {isExporting ? "Exporting..." : "Export My Data (CSV)"}
      </button>
    </Panel>
  );
}
