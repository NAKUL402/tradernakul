import React from "react";
import renderer from "react-test-renderer";

jest.mock("../src/lib/auth-context", () => ({
  useAuth: () => ({
    userSettings: { currency: null, default_session: "London", default_rrr: "2.0" }
  })
}));

import { LogTradeModal } from "../src/components/app/LogTradeModal";

const mockTrade = {
  id: "uuid-test",
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
  renderer.create(
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
