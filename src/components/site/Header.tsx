import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Menu, User, X } from "lucide-react";
import { getStoredUser, isLoggedIn, logout } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/site/BrandMark";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PUBLIC_LINKS = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/verify", label: "Verify" },
  { to: "/about", label: "About" },
] as const;

const APP_LINKS = [
  { to: "/dashboard", label: "Overview" },
  { to: "/templates", label: "Templates" },
  { to: "/history", label: "History" },
] as const;

export function Header() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  const loggedIn = isLoggedIn();
  const user = getStoredUser();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function handleLogout() {
    logout();
    toast.success("Signed out");
    navigate({ to: "/login" });
  }

  const links = loggedIn ? APP_LINKS : PUBLIC_LINKS;

  return (
    <header className="no-print sticky top-0 z-40 border-b border-ink/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="hidden border-b border-ink/10 md:block">
        <div className="mx-auto flex h-7 max-w-[1240px] items-center justify-between px-6 font-mono text-[0.5rem] uppercase tracking-[0.2em] text-muted-foreground">
          <span>QuickCert · Registry of issued records</span>
          <span className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 bg-valid" aria-hidden />
              Free &amp; open source
            </span>
            <span>MIT licence</span>
            <span>No watermark</span>
          </span>
        </div>
      </div>

      <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6">
        <BrandMark />

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === "/dashboard" }}
              className="group relative py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground"
            >
              {link.label}
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-px h-px scale-x-0 bg-accent transition-transform duration-200 group-hover:scale-x-100 group-data-[status=active]:scale-x-100"
              />
            </Link>
          ))}
          {!loggedIn && (
            <a
              href="https://github.com/SABAH-K-J/QuickCertV2"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Source
            </a>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {loggedIn ? (
            <>
              {user && (
                <span className="flex items-center gap-2 border-r border-border pr-3 text-xs text-muted-foreground">
                  <User className="h-3.5 w-3.5" aria-hidden />
                  <span className="max-w-[140px] truncate">{user.name}</span>
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-foreground underline decoration-transparent decoration-1 underline-offset-4 transition hover:decoration-accent"
              >
                Sign in
              </Link>
              <Button asChild size="sm" className="px-4">
                <Link to="/login">Start designing</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center border border-ink/30 text-foreground md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-x-0 top-[68px] z-50 max-h-[calc(100dvh-68px)] overflow-y-auto border-b border-ink/25 bg-card px-5 pb-8 pt-5 shadow-[0_24px_60px_-20px_rgb(18_37_29/35%)] transition-transform duration-200 md:hidden",
          menuOpen ? "translate-y-0" : "pointer-events-none -translate-y-2 opacity-0",
        )}
        aria-hidden={!menuOpen}
      >
        <p className="micro mb-3 text-muted-foreground">
          {loggedIn ? "Your workspace" : "QuickCert"}
        </p>
        <nav aria-label="Mobile primary" className="flex flex-col">
          {links.map((link, i) => (
            <Link
              key={link.to}
              to={link.to}
              tabIndex={menuOpen ? 0 : -1}
              className="flex items-baseline justify-between border-t border-border py-3.5 first:border-t-0"
            >
              <span className="font-display text-2xl tracking-tight">{link.label}</span>
              <span className="serial text-[0.5625rem] text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
            </Link>
          ))}
          {!loggedIn && (
            <Link
              to="/about"
              tabIndex={menuOpen ? 0 : -1}
              className="flex items-baseline justify-between border-t border-border py-3.5"
            >
              <span className="font-display text-2xl tracking-tight">About</span>
              <span className="serial text-[0.5625rem] text-muted-foreground">04</span>
            </Link>
          )}
        </nav>

        <div className="mt-6 flex flex-col gap-2 border-t border-ink/20 pt-5">
          {loggedIn ? (
            <>
              {user && (
                <p className="mb-2 text-xs text-muted-foreground">
                  Signed in as <span className="text-foreground">{user.name}</span>
                </p>
              )}
              <Button variant="outline" onClick={handleLogout} className="w-full justify-start">
                <LogOut aria-hidden /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="w-full">
                <Link to="/login" tabIndex={menuOpen ? 0 : -1}>
                  Start designing
                </Link>
              </Button>
              <Link
                to="/login"
                tabIndex={menuOpen ? 0 : -1}
                className="py-2 text-center text-sm text-muted-foreground underline underline-offset-4"
              >
                Sign in to an existing account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
