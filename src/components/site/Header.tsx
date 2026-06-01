import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, User, Clock } from "lucide-react";
import { getStoredUser, logout, isLoggedIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function Header() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const loggedIn = isLoggedIn();

  function handleLogout() {
    logout();
    toast.success("Logged out");
    navigate({ to: "/login" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-primary to-accent-glow shadow-[0_0_24px_-4px_var(--primary)]" />
          <span className="font-display text-lg font-semibold tracking-tight">
            QuickCert
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {loggedIn ? (
            <>
              <Link
                to="/"
                activeOptions={{ exact: true }}
                className="rounded-md px-3 py-2 text-muted-foreground transition hover:text-foreground data-[status=active]:text-foreground"
              >
                Home
              </Link>
              <Link
                to="/templates"
                className="rounded-md px-3 py-2 text-muted-foreground transition hover:text-foreground data-[status=active]:text-foreground"
              >
                Templates
              </Link>
              <Link
                to="/history"
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-muted-foreground transition hover:text-foreground data-[status=active]:text-foreground"
              >
                <Clock className="h-3.5 w-3.5" />
                History
              </Link>

              {/* User badge */}
              {user && (
                <div className="ml-2 flex items-center gap-2 rounded-full border border-border/70 bg-surface/60 py-1 pl-2 pr-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <span className="max-w-[120px] truncate text-xs font-medium text-foreground">
                    {user.name}
                  </span>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="ml-1 gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </>
          ) : (
            <Link
              to="/login"
              className="ml-2 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-12px_var(--primary)] transition hover:bg-primary/90"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
