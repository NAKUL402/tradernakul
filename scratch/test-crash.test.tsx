// @vitest-environment jsdom
import React from "react";
import { render } from "@testing-library/react";

jest.mock("../src/lib/auth-context", () => ({
  useAuth: () => ({
    userSettings: { currency: "USD", default_session: "London", default_rrr: "2.0" }
  })
}));

import { LogTradeModal } from "../src/components/app/LogTradeModal";

const mockTrade = {
  id: "trade-1786510776604-nlx4iv", // Custom string!
  tradeNo: 1,
  date: "2026-08-12",
  pair: "XAUUSD",
  side: "Buy" as const,
  session: "London" as const,
  entryTime: "12:00",
  exitTime: "13:00",
  entryPrice: 0,
  exitPrice: 0,
  result: "Win" as const,
  rrr: "2.0",
  riskPct: 1.0,
  pnl: 100,
  setup: "Test",
  tags: ["test"],
  lots: "1",
  mistakes: "",
  rating: 5,
  reason: ""
};

try {
  render(
    React.createElement(LogTradeModal, {
      isOpen: true,
      onClose: () => {},
      onSave: async () => {},
      initialTrade: mockTrade as any,
      nextTradeNo: 2
    })
  );
  console.log("RENDER SUCCESSFUL! NO CRASH.");
} catch (e) {
  console.error("CRASH OCCURRED:");
  console.error(e);
}
