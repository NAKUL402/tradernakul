import { useAuth } from "@/lib/auth-context";
import { Badge, Panel } from "@/components/app/ui-kit";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function SettingsAccount() {
  const { user, profile, signOut, deleteAccount, isOwner } = useAuth();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleDelete = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setIsDeleting(true);
    try {
      await deleteAccount();
      // AuthContext handles redirect to /login
    } catch (err: any) {
      console.error(err);
      toast.error(`Account deletion failed. ${err.message || "Please try again."}`);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
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

      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-1">
          <h3 className="text-lg font-bold text-destructive">Danger Zone</h3>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </div>
        
        {isOwner ? (
          <div className="rounded-lg bg-background p-4 text-sm text-muted-foreground border">
            Owner accounts require administrative intervention to delete. This option is disabled for platform safety.
          </div>
        ) : (
          <>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition hover:bg-destructive/90"
              >
                Delete Account & All Data
              </button>
            ) : (
              <div className="rounded-lg border border-destructive/20 bg-background p-4 space-y-4">
                <div className="text-sm font-medium">
                  This will permanently delete your account and all associated data:
                  <ul className="mt-2 list-disc pl-5 text-muted-foreground space-y-1">
                    <li>Profile information</li>
                    <li>Trading journal and trades</li>
                    <li>AI chat history</li>
                    <li>API keys and settings</li>
                    <li>Screenshots and uploaded files</li>
                  </ul>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Type DELETE to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none transition focus:border-destructive"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                    }}
                    className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteConfirmText !== "DELETE" || isDeleting}
                    className="flex-1 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition hover:bg-destructive/90 disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
