import { supabase } from "./supabase";

export type MT5Payload = {
  apiKey: string;
  orderId: string;
  broker: string;
  accountNumber: string;
  pair: string;
  side: "Buy" | "Sell";
  lotSize: number;
  entryPrice: number;
  exitPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  pnl: number;
  commission?: number;
  swap?: number;
  executionTime: string;
};

export async function processMT5SyncPayload(
  payload: MT5Payload,
): Promise<{ success: boolean; message: string; tradeId?: string }> {
  try {
    if (!payload.apiKey) {
      return { success: false, message: "Missing X-MT5-API-KEY header or payload API Key" };
    }

    // 1. Verify API Key in database
    const { data: keyRecord, error: keyError } = await supabase
      .from("user_api_keys")
      .select("user_id, is_active")
      .eq("api_key", payload.apiKey)
      .single();

    if (keyError || !keyRecord || !keyRecord.is_active) {
      return { success: false, message: "Unauthorized: Invalid or revoked MT5 API Key" };
    }

    const userId = keyRecord.user_id;
    const win = payload.pnl >= 0;

    // 2. Prepare trade record
    const tradeRow = {
      user_id: userId,
      date: payload.executionTime.slice(0, 10) || new Date().toISOString().slice(0, 10),
      pair: payload.pair,
      side: payload.side,
      session: "London", // Default session calculation
      entry_time: payload.executionTime.slice(11, 16) || "12:00",
      exit_time: payload.executionTime.slice(11, 16) || "13:00",
      entry_price: payload.entryPrice,
      exit_price: payload.exitPrice,
      stop_loss: payload.stopLoss || null,
      take_profit: payload.takeProfit || null,
      result: win ? "Win" : "Loss",
      rrr: 2.0,
      risk_pct: 1.0,
      pnl: payload.pnl,
      setup: "MT5 Automated Sync",
      confirmation: "EA Webhook",
      notes: `MT5 Auto-Synced. Order ID: ${payload.orderId}, Broker: ${payload.broker}, Lots: ${payload.lotSize}`,
      screenshot_url: "",
      tags: ["MT5 Sync", "Automated"],
      mt5_order_id: payload.orderId,
      broker: payload.broker,
      account_number: payload.accountNumber,
      lot_size: payload.lotSize,
      commission: payload.commission || 0,
      swap: payload.swap || 0,
    };

    // 3. Upsert into trades table avoiding duplicate order imports
    const { data: tradeData, error: tradeError } = await supabase
      .from("trades")
      .upsert(tradeRow, { onConflict: "mt5_order_id" })
      .select("id")
      .single();

    if (tradeError) {
      return { success: false, message: `Trade import error: ${tradeError.message}` };
    }

    return {
      success: true,
      message: "MT5 Trade synced successfully!",
      tradeId: tradeData?.id,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return { success: false, message: msg };
  }
}
