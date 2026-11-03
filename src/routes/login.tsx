import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck, UserPlus } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { isLoggedIn, setStoredUser, setToken } from "@/lib/auth";
import { pageHead } from "@/lib/seo";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () =>
    pageHead({
      title: "Sign in or create an account — QuickCert",
      description:
        "Sign in to QuickCert to design certificate templates and generate certificates from a spreadsheet. Free and open source.",
      path: "/login",
    }),
  beforeLoad: () => {
    if (typeof window !== "undefined" && isLoggedIn()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
});

type Mode = "login" | "register";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  async function finish(accessToken: string, greeting: string) {
    setToken(accessToken);
    const me = await api.getMe();
    setStoredUser(me);
    toast.success(greeting);
    navigate({ to: "/dashboard" });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { access_token } = await api.login(loginEmail.trim(), loginPassword);
      await finish(access_token, "Welcome back");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (regPassword !== regConfirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (regPassword.length < 8) {
      toast.error("Use at least 8 characters for your password");
      return;
    }
    setLoading(true);
    try {
      await api.register(regName.trim(), regEmail.trim(), regPassword);
      const { access_token } = await api.login(regEmail.trim(), regPassword);
      await finish(access_token, "Account created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-6 py-12 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-20">
          <div className="max-w-lg">
            <p className="micro flex items-center gap-3 text-muted-foreground">
              <span className="h-1.5 w-1.5 bg-accent" aria-hidden />
              Registry entry · free account
            </p>
            <h1 className="mt-5 font-display text-[clamp(2.6rem,6vw,4.5rem)] font-semibold leading-[0.94] tracking-[-0.04em]">
              Your workspace,
              <br />
              <span className="italic text-accent">ready to issue.</span>
            </h1>
            <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
              An account keeps your templates private and your generation history in one place. It
              costs nothing and there is no card required.
            </p>

            <ul className="mt-8 space-y-4 border-t border-ink/20 pt-6">
              {[
                {
                  icon: Lock,
                  title: "Private templates",
                  body: "Only your account can open, edit, or generate from your templates.",
                },
                {
                  icon: ShieldCheck,
                  title: "Public proof, on your terms",
                  body: "Verification is opt-in per individual certificate and exposes only the record fields.",
                },
                {
                  icon: KeyRound,
                  title: "No lock-in",
                  body: "Re-download any past batch, and self-host the same MIT-licensed code if you prefer.",
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-3">
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div aria-hidden className="absolute -inset-2 border border-ink/20" />
            <div className="relative border border-ink bg-card">
              <div className="border-b border-ink/25 bg-[#eef2e8] px-5 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-ink/60">
                    QuickCert · Access register
                  </span>
                  <span className="serial text-[0.5rem] text-ink/40">Form 01</span>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
                  <TabsList className="w-full justify-start gap-8">
                    <TabsTrigger value="login">Sign in</TabsTrigger>
                    <TabsTrigger value="register">Create account</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="mt-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Your password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            className="pr-11"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-1 top-1 grid h-8 w-8 place-items-center text-muted-foreground transition hover:text-foreground"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" aria-hidden />
                            ) : (
                              <Eye className="h-4 w-4" aria-hidden />
                            )}
                          </button>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="mt-2 w-full gap-2"
                        size="lg"
                        disabled={loading}
                      >
                        <KeyRound className="h-4 w-4" aria-hidden />
                        {loading ? "Signing in…" : "Sign in"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="register" className="mt-6">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reg-name">Full name</Label>
                        <Input
                          id="reg-name"
                          type="text"
                          placeholder="Your name"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          required
                          autoComplete="name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-email">Email</Label>
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder="you@example.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="reg-password">Password</Label>
                          <Input
                            id="reg-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="8+ characters"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            required
                            minLength={8}
                            autoComplete="new-password"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-confirm">Confirm</Label>
                          <Input
                            id="reg-confirm"
                            type={showPassword ? "text" : "password"}
                            placeholder="Repeat password"
                            value={regConfirm}
                            onChange={(e) => setRegConfirm(e.target.value)}
                            required
                            autoComplete="new-password"
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="mt-2 w-full gap-2"
                        size="lg"
                        disabled={loading}
                      >
                        <UserPlus className="h-4 w-4" aria-hidden />
                        {loading ? "Creating account…" : "Create free account"}
                      </Button>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        By creating an account you agree to the{" "}
                        <Link
                          to="/terms"
                          className="underline underline-offset-2 hover:text-foreground"
                        >
                          terms
                        </Link>{" "}
                        and{" "}
                        <Link
                          to="/privacy"
                          className="underline underline-offset-2 hover:text-foreground"
                        >
                          privacy notice
                        </Link>
                        .
                      </p>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="border-t border-dashed border-ink/20 px-5 py-3 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-ink/45 sm:px-7">
                Templates private · no card · no watermark
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
