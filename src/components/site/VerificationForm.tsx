import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Accepts a raw token or a pasted verification URL. */
export function VerificationForm({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const raw = value.trim();
    if (!raw) {
      setError("Enter the verification code printed on the certificate.");
      return;
    }
    const match = raw.match(/\/verify\/([^/?#\s]+)/i);
    const token = (match ? match[1] : raw).replace(/[^a-zA-Z0-9_-]/g, "");
    if (!token) {
      setError("That code does not look right. Check the letters and try again.");
      return;
    }
    setError(null);
    navigate({ to: "/verify/$token", params: { token } });
  }

  return (
    <form onSubmit={submit} noValidate className={compact ? "" : "max-w-xl"}>
      <Label htmlFor="verify-token">Verification code</Label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Input
          id="verify-token"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="e.g. 8f2c1a9b7d"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "verify-error" : "verify-help"}
          className="font-mono tracking-wide"
        />
        <Button type="submit" className="shrink-0 gap-2">
          Verify record
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      {error ? (
        <p id="verify-error" role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p id="verify-help" className="mt-2 text-xs text-muted-foreground">
          You can also paste the full verification link from the certificate’s QR code.
        </p>
      )}
    </form>
  );
}
