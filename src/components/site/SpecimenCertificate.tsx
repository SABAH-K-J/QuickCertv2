export function SpecimenCertificate({
  recipient = "Amara Diallo",
  course = "Workshop Facilitation",
  date = "14 June 2026",
  serial = "QC-7F3A-2026",
  compact = false,
  className = "",
}: {
  recipient?: string;
  course?: string;
  date?: string;
  serial?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <figure
      className={`relative overflow-hidden border border-ink bg-[#f7f3e7] text-ink shadow-[0_28px_70px_-28px_rgb(18_37_29/55%),0_2px_0_rgb(18_37_29/12%)] ${className}`}
    >
      <div aria-hidden className="absolute inset-[7px] border border-ink/35" />
      <div aria-hidden className="absolute inset-[11px] border border-ink/15" />

      <div className={`relative ${compact ? "p-5 sm:p-6" : "p-6 sm:p-9"}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.5rem] uppercase tracking-[0.24em] text-ink/60">
              QuickCert · Registry of record
            </p>
            <p className="mt-1 font-mono text-[0.5rem] uppercase tracking-[0.16em] text-ink/45">
              Issued document / specimen
            </p>
          </div>
          <div aria-hidden className="relative h-11 w-11 shrink-0">
            <div className="absolute inset-0 rounded-full border border-ink/30" />
            <div className="guilloche absolute inset-[3px]" />
            <div className="absolute inset-[13px] bg-accent" />
          </div>
        </div>

        <div className="mt-6 text-center sm:mt-8">
          <p className="font-mono text-[0.5rem] uppercase tracking-[0.3em] text-ink/55">
            This certifies that
          </p>
          <p
            key={recipient}
            className={`print-in mt-2 font-display font-semibold leading-[1.02] tracking-[-0.03em] ${
              compact ? "text-[clamp(1.6rem,5vw,2.4rem)]" : "text-[clamp(2rem,5.4vw,3.35rem)]"
            }`}
          >
            {recipient || "Recipient name"}
          </p>
          <div aria-hidden className="mx-auto mt-3 flex max-w-[220px] items-center gap-2">
            <span className="h-px flex-1 bg-ink/35" />
            <span className="h-1 w-1 rotate-45 bg-accent" />
            <span className="h-px flex-1 bg-ink/35" />
          </div>
          <p className="mx-auto mt-3 max-w-sm text-[0.7rem] leading-relaxed text-ink/70 sm:text-xs">
            has completed the requirements for
          </p>
          <p
            key={course}
            className={`print-in mt-1 font-display italic leading-tight ${
              compact ? "text-lg" : "text-xl sm:text-2xl"
            }`}
          >
            {course || "Course or event"}
          </p>
        </div>

        <div
          className={`grid grid-cols-[1fr_auto_1fr] items-end gap-3 ${compact ? "mt-6" : "mt-9"}`}
        >
          <div>
            <p className="font-mono text-[0.4375rem] uppercase tracking-[0.18em] text-ink/50">
              Issued
            </p>
            <p className="mt-1 border-t border-ink/40 pt-1 text-[0.65rem] text-ink/80">{date}</p>
          </div>

          <div className="flex flex-col items-center">
            <div
              aria-hidden
              className={`relative grid place-items-center rounded-full border border-accent/60 text-accent ${
                compact ? "h-14 w-14" : "h-16 w-16 sm:h-20 sm:w-20"
              }`}
            >
              <div className="guilloche-fine absolute inset-[4px] rounded-full opacity-60" />
              <span className="relative font-mono text-[0.4375rem] uppercase leading-tight tracking-[0.12em]">
                Verified
                <br />
                record
              </span>
            </div>
            <span className="mt-1.5 font-mono text-[0.4375rem] uppercase tracking-[0.16em] text-ink/45">
              {serial}
            </span>
          </div>

          <div className="text-right">
            <p className="font-mono text-[0.4375rem] uppercase tracking-[0.18em] text-ink/50">
              Authorised by
            </p>
            <p className="mt-1 border-t border-ink/40 pt-1 font-display text-sm italic text-ink/80">
              R. Okonkwo
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-dashed border-ink/25 pt-3">
          <span className="font-mono text-[0.4375rem] uppercase tracking-[0.16em] text-ink/40">
            Synthetic specimen · not a real award
          </span>
          <span className="flex gap-[3px]" aria-hidden>
            {Array.from({ length: 18 }).map((_, i) => (
              <span
                key={i}
                className="block w-[2px] bg-ink/50"
                style={{ height: `${6 + ((i * 7) % 11)}px` }}
              />
            ))}
          </span>
        </div>
      </div>
    </figure>
  );
}
