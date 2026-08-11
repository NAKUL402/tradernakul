import { useAuth } from "@/lib/auth-context";
import { Badge, Panel } from "@/components/app/ui-kit";
import { LogOut } from "lucide-react";

export function SettingsAccount() {
  const { user, profile, signOut } = useAuth();

  return (
    <Panel title="Account & Security">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Account Email</p>
          <p className="font-display font-medium text-foreground">{user?.email}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Account Role</p>
            <Badge tone="primary">{profile?.role === "admin" ? "Admin" : "User"}</Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
            <Badge tone={profile?.status === "approved" ? "win" : "accent"}>{profile?.status}</Badge>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-border">
          <button
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="size-4" /> 
            Sign Out
          </button>
        </div>
      </div>
    </Panel>
  );
}
