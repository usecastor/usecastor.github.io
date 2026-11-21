// @client
/**
 * ACT 2 — DualEngineBeam.
 * Warm-ivory (#F7F6F2) field guide: a clean asymmetric header
 * ("Your frontier model shouldn't grep."), the 40-Turn Coding Task
 * Trace — a 3-row horizontal timeline comparing cloud, hybrid, and
 * 100%-local execution of the exact same task (click any row to inspect
 * its breakdown) — three editorial columns, and a 4-stat proof strip.
 *
 * Zero scroll hijacking — the section paints at full opacity from first
 * frame, and the active row swap is pure DOM inside a fixed chassis.
 */
import { useRef, useState } from 'react';
import { AnimatePresence, motion, useInView } from 'motion/react';
import { NumberFlowGroup } from '@number-flow/react';
import SafeNumberFlow from './SafeNumberFlow';
import { LEDGER_76DAY } from '../../data/telemetry';

/* ── The 40-turn trace: three execution modes of one identical task ────
   Task: 40-turn coding task · 18 files · auth refactor & test suite.
   Every row is a 40-slot horizontal timeline, slot height grows as the
   session KV history compounds turn over turn. */

interface TurnDef {
  /** 'cloud' | 'local' | 'local-locked' per slot, left → right */
  kind: 'cloud' | 'local' | 'local-locked';
}

interface RowDef {
  key: string;
  name: string;
  wing: string;
  /** Per-turn visual plan (40 slots). */
  turns: TurnDef[];
  badge: string;
  caption: string;
  /** Breakdown shown below the chassis when the row is selected. */
  breakdown: Array<{ label: string; value: string }>;
  detail: string;
}

const N_TURNS = 40;

/** Height multiplier per turn index: session history compounds left→right. */
const turnH = (i: number) => 0.35 + (i / (N_TURNS - 1)) * 0.65;

const CLOUD_TURNS: TurnDef[] = Array.from(
  { length: N_TURNS },
  () => ({ kind: 'cloud' as const }),
);

const HYBRID_TURNS: TurnDef[] = [
  { kind: 'cloud' },
  ...Array.from({ length: N_TURNS - 1 }, () => ({ kind: 'local' as const })),
];

const LOCAL_TURNS: TurnDef[] = Array.from(
  { length: N_TURNS },
  () => ({ kind: 'local-locked' as const }),
);

const ROWS: RowDef[] = [
  {
    key: 'cloud',
    name: 'Standard Cloud Agent',
    wing: 'Claude Code / Cursor alone',
    turns: CLOUD_TURNS,
    badge: '40 cloud API turns · 1.42M billed tokens · $1.85 / task',
    caption:
      'Every file read, search, edit, and test run re-bills your growing session history in the cloud.',
    breakdown: [
      { label: 'Turn 1', value: '6.4K input tokens billed' },
      { label: 'Turn 40', value: '36.1K input tokens billed' },
      { label: 'Total billed', value: '1.42M tokens · $1.85' },
      { label: 'Session history', value: 'compounds every turn, re-sent' },
    ],
    detail:
      'Each turn re-sends the full prior conversation. By turn 40 every file read, search, edit, and test run is paid for again — 1.42M billed tokens for one task.',
  },
  {
    key: 'hybrid',
    name: 'Wing 01: Cloud + Local Hybrid',
    wing: 'Frontier Lead + Local GPU Worker',
    turns: HYBRID_TURNS,
    badge: '1 cloud turn + 39 local GPU turns · $0.0014 power · 98% saved',
    caption:
      'Your frontier model plans once. Your local GPU executes the 39 file, AST, and test turns at $0/token.',
    breakdown: [
      { label: 'Turn 1 (cloud)', value: '320-token brief, billed once' },
      { label: 'Turns 2–40 (local)', value: '260 tok/s (n=4) on your GPU' },
      { label: 'Session KV cache', value: '93.8% hit across the loop' },
      { label: 'Total cost', value: '$0.0014 power · 98% under cloud' },
    ],
    detail:
      'The frontier model issues one 320-token brief. The remaining 39 file, AST, and test turns execute on your local GPU, reusing the session KV cache at a 93.8% hit — power cost, not tokens billed.',
  },
  {
    key: 'airgap',
    name: 'Wing 02: 100% Local & Private',
    wing: 'On-Prem / Air-Gapped GPU',
    turns: LOCAL_TURNS,
    badge: '0 cloud turns · 0 B external egress · 100% on-prem',
    caption:
      'Planning and execution run entirely on your workstations or internal vLLM cluster. Nothing leaves your network.',
    breakdown: [
      { label: 'Cloud API calls', value: '0 — conduit closed' },
      { label: 'External egress', value: '0 B · 5-layer OS sandbox' },
      { label: 'Planner + executor', value: 'on-prem vLLM or workstations' },
      { label: 'Session KV cache', value: '93.8% hit, fully local' },
    ],
    detail:
      'Planning and execution both run on hardware you own — internal vLLM cluster or workstation GPUs. The 5-layer OS sandbox blocks egress at the kernel level; 0 bytes leave your network.',
  },
];

/* ── Timeline track: 40 discrete turn bars ───────────────────────────── */

function TurnTrack({ row, active }: { row: RowDef; active: boolean }) {
  return (
    <div
      className={`flex h-16 w-full items-end gap-[2px] px-1 ${
        row.key === 'airgap'
          ? 'rounded-lg border border-[#22C55E]/40 bg-[#22C55E]/5'
          : ''
      }`}
    >
      {row.turns.map((t, i) => {
        const h = `${Math.round(turnH(i) * 100)}%`;
        const cls =
          t.kind === 'cloud'
            ? i === 1 && row.key === 'hybrid'
              ? 'bg-[#1D4ED8]'
              : 'bg-gradient-to-t from-[#B91C1C] to-[#1D4ED8]'
            : t.kind === 'local-locked'
              ? 'bg-gradient-to-t from-[#059669] to-[#F97316]'
              : 'bg-gradient-to-t from-[#B45309] to-[#F97316]';
        return (
          <motion.span
            key={i}
            aria-hidden="true"
            className={`min-w-0 flex-1 rounded-[1px] transition-opacity ${cls} ${
              active ? 'opacity-100' : 'opacity-55'
            }`}
            style={{ height: h }}
            initial={false}
            animate={active ? { opacity: 1 } : { opacity: 0.55 }}
          />
        );
      })}
    </div>
  );
}

/* ── 40-Turn Coding Task Trace instrument ────────────────────────────── */

function TaskTrace() {
  const [activeIdx, setActiveIdx] = useState(1); // Wing 01 selected by default
  const row = ROWS[activeIdx];

  return (
    <div className="mt-12 bg-[#090C12] p-6 sm:p-8 border border-white/10">
      {/* Chassis header */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-mono text-[13px] font-semibold tracking-[0.04em] text-[#F5F7FA] sm:text-sm">
          40-Turn Coding Task Trace
          <span className="ml-3 text-[11.5px] font-normal tracking-[0.02em] text-[#8C95A6]">
            (18 Files · Auth Refactor &amp; Test Suite)
          </span>
        </h3>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#5D6B80]">
          Same task · three execution modes
        </p>
      </div>

      {/* Three selectable rows */}
      <div className="mt-6 space-y-3" role="tablist" aria-label="Execution mode">
        {ROWS.map((r, i) => {
          const active = i === activeIdx;
          return (
            <button
              key={r.key}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveIdx(i)}
              className={`block w-full rounded-lg border p-3 text-left transition-colors sm:p-4 ${
                active
                  ? 'border-[#F97316]/50 bg-[#10141C]'
                  : 'border-white/10 bg-black/20 hover:border-white/20'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                <p className="font-mono text-[11.5px] tracking-[0.03em] text-[#A3AEBF] sm:text-[12.5px]">
                  <span
                    className={`mr-2 font-semibold ${
                      active ? 'text-[#F5F7FA]' : 'text-[#8C95A6]'
                    }`}
                  >
                    {r.name}
                  </span>
                  <span className="hidden text-[10.5px] text-[#5D6B80] sm:inline">
                    {r.wing}
                  </span>
                </p>
                <span
                  className={`rounded-md px-2.5 py-1 font-mono text-[10.5px] tracking-[0.02em] ${
                    r.key === 'cloud'
                      ? 'bg-[#B91C1C]/15 text-[#F87171]'
                      : r.key === 'hybrid'
                        ? 'bg-[#F97316]/15 text-[#FB923C]'
                        : 'bg-[#22C55E]/15 text-[#4ADE80]'
                  }`}
                >
                  {r.badge}
                </span>
              </div>
              <div className="mt-3">
                <TurnTrack row={r} active={active} />
              </div>
              <p className="mt-2.5 max-w-2xl text-[12.5px] leading-snug text-[#8C95A6] sm:text-[13px]">
                {r.caption}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected-row execution breakdown */}
      <AnimatePresence mode="wait">
        <motion.div
          key={row.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 border-t border-white/10 pt-5"
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 lg:grid-cols-4">
            {row.breakdown.map((b) => (
              <div key={b.label}>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#5D6B80]">
                  {b.label}
                </p>
                <p className="mt-1 font-mono text-[12px] leading-snug text-[#D7DEE9]">
                  {b.value}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 max-w-3xl text-[13px] leading-relaxed text-[#8C95A6]">
            {row.detail}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ── Three editorial columns ─────────────────────────────────────────── */

const SPECS: Array<{ tag: string; title: string; body: string }> = [
  {
    tag: '01 / Cloud + Local Hybrid',
    title: 'One command to pair',
    body: 'Pair Claude Code, Cursor, or Gemini with local vLLM, llama.cpp, or Ollama in one command.',
  },
  {
    tag: '02 / 100% Local & Air-Gapped',
    title: 'Zero cloud dependencies',
    body: 'Zero cloud dependencies, compile-time offline binary, and 5-layer OS sandboxing for sensitive repositories.',
  },
  {
    tag: '03 / Turnkey Team Setup & Plumbing',
    title: 'Wired in 48 hours',
    body: 'We size your GPUs, configure vLLM continuous batching (260 tok/s n=4), and wire your team\u2019s workflow in 48 hours.',
  },
];

function SpecGrid() {
  return (
    <div className="spec-grid mt-8 grid grid-cols-1 gap-8 border-t border-black/10 pt-8 md:grid-cols-3">
      {SPECS.map((s) => (
        <div key={s.tag} className="min-w-0">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#9CA3AF]">
            {s.tag}
          </p>
          <h3 className="mt-1.5 font-display text-lg font-bold tracking-[-0.02em] text-[#101319]">
            {s.title}
          </h3>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#4A5568]">
            {s.body}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── 4-stat proof strip ────────────────────────────────────────────────
   Calm neutral eyebrows on the first 3 cards; the bright amber eyebrow
   is reserved for the $10.12-vs-$6,044.48 power-vs-cloud card (4th). */

interface ProofStat {
  value: number;
  prefix?: string;
  suffix?: string;
  format?: Record<string, string | number | boolean>;
  label: string;
  amber?: boolean;
}

const PROOF: ProofStat[] = [
  {
    value: LEDGER_76DAY.peakCachedPrefillTps,
    suffix: ' tok/s',
    format: { useGrouping: true, maximumFractionDigits: 0 },
    label: 'cached prefill',
  },
  {
    value: LEDGER_76DAY.concurrentN4DecodeTps,
    suffix: ' tok/s',
    format: { useGrouping: true, maximumFractionDigits: 0 },
    label: 'n=4 concurrent decode',
  },
  {
    value: LEDGER_76DAY.cacheHitPct,
    suffix: '%',
    format: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
    label: 'session KV cache hit',
  },
  {
    value: 10.12,
    prefix: '$',
    format: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    label: 'local power vs $6,044.48 cloud',
    amber: true,
  },
];

function ProofStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <div
      ref={ref}
      className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-black/10 bg-black/10 lg:grid-cols-4"
    >
      <NumberFlowGroup>
        {PROOF.map((m) => (
          <div key={m.label} className="min-w-0 bg-white p-5 sm:p-6">
            <p
              className={`font-mono text-[10.5px] uppercase tracking-[0.12em] ${
                m.amber ? 'text-[#E04F00]' : 'text-[#6C7484]'
              }`}
            >
              {m.label}
            </p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <SafeNumberFlow
                value={m.value}
                prefix={m.prefix}
                suffix={m.suffix}
                format={m.format}
                className={`mt-1.5 block font-display text-[clamp(1.7rem,3.2vw,2.6rem)] font-bold leading-none tracking-[-0.03em] ${
                  m.amber ? 'text-[#E04F00]' : 'text-[#101319]'
                }`}
              />
              {m.amber && (
                <p className="mt-1.5 font-mono text-[11px] text-[#6C7484]">
                  $6,044.48 would be the cloud bill
                </p>
              )}
            </motion.div>
          </div>
        ))}
      </NumberFlowGroup>
    </div>
  );
}

/* ── Root ────────────────────────────────────────────────────────────── */

export default function DualEngineBeam() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-[#F7F6F2] py-24 text-[#0E1117] lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* ── Folio bar ─────────────────────────────────────────────── */}
        <div className="folio-bar">
          <span className="folio-coord">01 // Architecture &amp; Services</span>
          <span className="folio-index">01 / 04</span>
        </div>

        {/* ── Clean asymmetric header ───────────────────────────────── */}
        <header className="asymmetric-spread mt-8">
          <div className="min-w-0">
            <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.035em] text-[#101319]">
              Your frontier model{' '}
              <br className="hidden sm:block" />
              shouldn&apos;t grep.
            </h2>
          </div>
          <div className="prose-measure min-w-0">
            <p className="max-w-[42ch] text-base leading-relaxed text-[#4A5568] sm:text-lg">
              Keep cloud models for high-level planning. Run the heavy tool
              loop on your own GPUs — or go 100% local.
            </p>
          </div>
        </header>

        {/* ── 40-Turn Coding Task Trace instrument ──────────────────── */}
        <TaskTrace />

        {/* ── Three editorial columns ───────────────────────────────── */}
        <SpecGrid />

        {/* ── 4-stat proof strip ────────────────────────────────────── */}
        <ProofStrip />
      </div>
    </section>
  );
}
