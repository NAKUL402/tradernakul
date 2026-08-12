import { Link } from "@tanstack/react-router";
import {
  Database,
  RefreshCw,
  Trash2,
  UserCog,
  Settings,
  ListTree,
  Activity,
  Bot,
  LayoutDashboard,
} from "lucide-react";
import { useEffect, useState } from "react";

export function LocalTestControlPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [mockDbStatus, setMockDbStatus] = useState<string>("");

  useEffect(() => {
    if (!import.meta.env.DEV || (import.meta.env as any)["VITE_DEV_TEST_MODE"] !== "true") return;

    // Check size of localStorage mock keys
    let keys = 0;
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)?.startsWith("mock_db_")) keys++;
    }
    setMockDbStatus(`Mock DB active with ${keys} tables tracked in memory.`);
  }, [isOpen]);

  if (!import.meta.env.DEV || (import.meta.env as any)["VITE_DEV_TEST_MODE"] !== "true") {
    return null; // Never render in production
  }

  const resetData = () => {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith("mock_db_") || key === "mock_user_metadata") {
        localStorage.removeItem(key);
      }
    }
    alert("Mock database cleared. Seeding will run on next load.");
    window.location.reload();
  };

  const clearStorage = () => {
    localStorage.clear();
    alert("Full localStorage cleared.");
    window.location.reload();
  };

  const reloadApp = () => {
    window.location.reload();
  };

  const showMockUser = () => {
    alert(
      "Current Mock User:\n\n" +
        "Email: test-owner@local.test\n" +
        "Role: admin\n" +
        "Is Owner: true\n" +
        "Status: approved",
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-12 right-2 z-50 flex items-center gap-2 rounded bg-red-600/90 px-3 py-2 text-xs font-bold text-white shadow-xl hover:bg-red-500"
      >
        <Database className="size-4" />
        TEST CONTROLS
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[999] flex w-80 flex-col gap-4 rounded-xl border border-red-500/50 bg-background/95 p-4 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-red-500/20 pb-2">
        <h3 className="flex items-center gap-2 font-display text-sm font-bold text-red-500">
          <Database className="size-4" />
          LOCAL TEST CONTROL
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Link to="/" className="flex items-center gap-2 rounded bg-muted p-2 hover:bg-primary/20">
          <LayoutDashboard className="size-3" /> Dashboard
        </Link>
        <Link
          to="/admin"
          className="flex items-center gap-2 rounded bg-muted p-2 hover:bg-primary/20"
        >
          <ListTree className="size-3" /> Admin
        </Link>
        <Link
          to="/journal"
          className="flex items-center gap-2 rounded bg-muted p-2 hover:bg-primary/20"
        >
          <ListTree className="size-3" /> Journal
        </Link>
        <Link
          to="/analytics"
          className="flex items-center gap-2 rounded bg-muted p-2 hover:bg-primary/20"
        >
          <Activity className="size-3" /> Analytics
        </Link>
        <Link
          to="/ai-coach"
          search={{ chat: false }}
          className="flex items-center gap-2 rounded bg-muted p-2 hover:bg-primary/20"
        >
          <Bot className="size-3" /> AI Coach
        </Link>
        <Link
          to="/profile"
          className="flex items-center gap-2 rounded bg-muted p-2 hover:bg-primary/20"
        >
          <UserCog className="size-3" /> Profile
        </Link>
        <Link
          to="/settings"
          className="col-span-2 flex items-center justify-center gap-2 rounded bg-muted p-2 hover:bg-primary/20"
        >
          <Settings className="size-3" /> Settings Center
        </Link>
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-border/50 text-xs">
        <p className="text-[10px] text-muted-foreground">{mockDbStatus}</p>

        <button
          onClick={showMockUser}
          className="rounded bg-blue-500/20 p-2 text-blue-400 hover:bg-blue-500/30"
        >
          Show Current Mock User
        </button>
        <button
          onClick={resetData}
          className="flex items-center justify-center gap-2 rounded bg-orange-500/20 p-2 text-orange-400 hover:bg-orange-500/30"
        >
          <RefreshCw className="size-3" /> Reset Local Test Data
        </button>
        <button
          onClick={clearStorage}
          className="flex items-center justify-center gap-2 rounded bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30"
        >
          <Trash2 className="size-3" /> Clear Local Storage
        </button>
        <button onClick={reloadApp} className="rounded bg-muted p-2 hover:bg-muted/80">
          Reload Application
        </button>
      </div>
    </div>
  );
}
