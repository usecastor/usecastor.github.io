// @client
/**
 * ACT 2 — DualEngineBeam.
 * Warm-ivory (#F7F6F2) field guide: an asymmetric left-aligned header
 * ("Your frontier model shouldn't grep."), a Grid-Locked Interactive
 * Routing Blueprint reconfigured by 3 mode tabs (Wing 01 hybrid, Wing 02
 * air-gapped, Team GPU server & plumbing), and a 4-stat proof strip.
 *
 * Zero scroll hijacking — the section paints at full opacity from first
 * frame, and the schematic reconfiguration is pure DOM swap inside a
 * fixed grid (no layout shift, no broken viewBox math).
 */
import { useRef, useState } from 'react';
import { AnimatePresence, motion, useInView } from 'motion/react';
import { NumberFlowGroup } from '@number-flow/react';
import SafeNumberFlow from './SafeNumberFlow';
import { LEDGER_76DAY } from '../../data/telemetry';

/* ── Schematic mode data ─────────────────────────────────────────────── */

interface NodeDef {
  label: string;
  sub: string;
  active: boolean;
  locked?: boolean;
}

interface SpecCard {
  tag: string;
  title: string;
  body: string;
}

interface ModeDef {
  key: string;
  tab: string;
  headline: string;
  left: NodeDef[];
  center: { title: string; sub: string };
  right: NodeDef[];
  cloudConduit: boolean;
  airgapLock?: string;
  split: { cloudPct: number; localPct: number; cloudLabel: string; localLabel: string };
  blurb: string;
  cards: SpecCard[];
}

const MODES: ModeDef[] = [
  {
    key: 'wing1',
    tab: 'Wing 01 · Cloud + Local Hybrid',
    headline:
      'Your frontier model sends the brief. Your GPU runs the grind.',
    left: [
      {
        label: 'Claude Code',
        sub: 'architect · ~300-token brief',
        active: true,
      },
      { label: 'Cursor', sub: 'architect · ~300-token brief', active: true },
      {
        label: 'Gemini CLI',
        sub: 'architect · ~300-token brief',
        active: true,
      },
    ],
    center: { title: 'Castor Router', sub: 'brief up · KV-pinned local loop' },
    right: [
      {
        label: 'File reads & code search',
        sub: '148,400-token prefix · 93.8% warm · $0',
        active: true,
      },
      {
        label: 'AST edits & test loops',
        sub: '260 tok/s n=4 on your RTX 3090',
        active: true,
      },
      {
        label: '5-Layer Sandbox',
        sub: '137 vectors · 123 blocked',
        active: true,
      },
    ],
    cloudConduit: true,
    split: {
      cloudPct: 6,
      localPct: 94,
      cloudLabel: '~6% tokens to the frontier model (the brief)',
      localLabel: '~94% on your GPU from warm VRAM at $0',
    },
    blurb:
      'The cloud lead only pays for the ~300-token architectural brief — roughly 6% of the total. Everything else (the ~148,000-token file reads, searches, edits, and test loops) executes on your own GPU, 93.8% of it straight from warm VRAM at $0 per token.',
    cards: [
      {
        tag: 'Spec 01',
        title: 'Token Split',
        body: '~6% of tokens cross to the frontier model; ~94% route to your local GPU — where 93.8% of prompt tokens are warm-cache hits at $0.',
      },
      {
        tag: 'Spec 02',
        title: 'Warm KV Pinning',
        body: 'The 148,400-token repo prefix is pinned in VRAM once and reused across every session — zero re-prefill, 0ms cold starts between tasks.',
      },
      {
        tag: 'Spec 03',
        title: 'Conduit',
        body: 'A live cloud↔local conduit: brief up, results down. Your code never leaves the machine — only the short brief and the final diff.',
      },
    ],
  },
  {
    key: 'wing2',
    tab: 'Wing 02 · 100% Local & Private',
    headline: 'Shutter closed. Zero bytes leave the building.',
    left: [
      {
        label: 'Owned Workstations',
        sub: 'planning + tool execution on your GPUs',
        active: true,
      },
      {
        label: 'On-Prem GPU Servers',
        sub: 'vLLM behind your firewall',
        active: true,
      },
      {
        label: 'Frontier Cloud',
        sub: 'conduit closed',
        active: false,
        locked: true,
      },
    ],
    center: {
      title: 'AIR-GAP SHUTTER',
      sub: '0 BYTES EGRESS · LOCKED',
    },
    right: [
      {
        label: 'Planning & reasoning',
        sub: '100% on your own silicon',
        active: true,
      },
      {
        label: 'Tool execution',
        sub: 'file, search, edit, test — local',
        active: true,
      },
      {
        label: '5-Layer OS Sandbox',
        sub: 'path · command · env · network · fs',
        active: true,
      },
    ],
    cloudConduit: false,
    airgapLock: 'AIR-GAP SHUTTER: 0 BYTES EGRESS',
    split: {
      cloudPct: 0,
      localPct: 100,
      cloudLabel: '0% tokens to any cloud (conduit closed)',
      localLabel: '100% of planning & tool execution on owned hardware',
    },
    blurb:
      'For regulated, offline, or zero-trust environments: the external cloud conduit closes with an explicit air-gap shutter — 0 bytes egress. 100% of planning and tool execution runs on owned workstations or on-prem GPU servers, behind a 5-layer OS sandbox that blocks network egress at the kernel level.',
    cards: [
      {
        tag: 'Spec 01',
        title: '5-Layer OS Sandbox',
        body: 'Path, command, environment, network, and filesystem layers — 137 test vectors, 123 blocked. Egress is impossible, not just discouraged.',
      },
      {
        tag: 'Spec 02',
        title: 'Zero Egress',
        body: 'The air-gap shutter physically closes the cloud conduit. No API calls, no telemetry, no code — every byte of every task stays on hardware you own.',
      },
      {
        tag: 'Spec 03',
        title: 'Audit Ledger',
        body: 'Every task writes a per-task audit entry: what ran, what it touched, what it produced — the evidence trail for SOC 2 / ISO 27001 / CMMC / HIPAA reviews.',
      },
    ],
  },
  {
    key: 'team',
    tab: 'Team GPU Server & Plumbing',
    headline: '5–50 engineers, one GPU server — no OOM, no thrashing.',
    left: [
      { label: 'Engineer A', sub: 'Claude Code session', active: true },
      { label: 'Engineer B', sub: 'Cursor session', active: true },
      { label: 'Engineer C–E…', sub: 'up to 50 concurrent seats', active: true },
    ],
    center: { title: 'Central vLLM Node', sub: 'shared GPU pool · token-budgeted' },
    right: [
      {
        label: 'VRAM & Quantization',
        sub: 'W4A16 sizing per your exact model & GPU',
        active: true,
      },
      {
        label: 'Shared Prefix KV Pinning',
        sub: '93.8% hit across the whole team',
        active: true,
      },
      {
        label: 'Token-Budgeted Queue',
        sub: 'n=4 per request group · 260 tok/s aggregate',
        active: true,
      },
    ],
    cloudConduit: false,
    split: {
      cloudPct: 0,
      localPct: 100,
      cloudLabel: '1 shared server for 5–50 engineers',
      localLabel: '100% of load budgeted — no OOM crashes, no KV thrash',
    },
    blurb:
      'This is what we wire for you: a central vLLM GPU server shared by 5–50 engineers without OOM crashes or KV-cache thrashing — right-sized VRAM, pinned shared prefixes, a token-budgeted concurrency queue, and a sandboxed audit ledger on every request.',
    cards: [
      {
        tag: 'Spec 01',
        title: 'VRAM & Quantization Sizing',
        body: 'W4A16 quantization tuned to your exact model and GPU, so 5–50 seats share one node with headroom — no OOM crashes at 4am.',
      },
      {
        tag: 'Spec 02',
        title: 'Shared Prefix KV Pinning',
        body: 'One pinned KV prefix per repo, shared across the whole team — the 93.8% hit rate scales linearly instead of thrashing the cache.',
      },
      {
        tag: 'Spec 03',
        title: 'Token-Budgeted Concurrency Queue',
        body: 'Continuous batching capped at n=4 per group at 260 tok/s aggregate — every engineer gets fair, predictable throughput.',
      },
      {
        tag: 'Spec 04',
        title: '5-Layer OS Sandbox & Audit Ledger',
        body: 'Every request runs sandboxed and writes a per-task audit entry — the compliance evidence trail your security team signs off on.',
      },
    ],
  },
];

/* ── Schematic primitives ────────────────────────────────────────────── */

function NodeChip({ node, tone }: { node: NodeDef; tone: 'left' | 'right' }) {
  const isLeft = tone === 'left';
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-300 ${
        node.locked
          ? 'border-black/10 bg-[#EFEDE7] opacity-60'
          : node.active
            ? 'border-black/12 bg-white shadow-[0_1px_2px_rgba(16,19,25,0.05)]'
            : 'border-black/10 bg-[#EFEDE7] opacity-50'
      }`}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          node.locked
            ? 'bg-[#9CA3AF]'
            : node.active
              ? isLeft
                ? 'bg-[#1D4ED8]'
                : 'bg-[#F97316]'
              : 'bg-[#C9C5BA]'
        }`}
        aria-hidden="true"
      />
      <span className="min-w-0">
        <span
          className={`block truncate font-mono text-[12.5px] font-medium ${
            node.active ? 'text-[#101319]' : 'text-[#6C7484]'
          }`}
        >
          {node.label}
        </span>
        <span className="block truncate font-mono text-[10.5px] text-[#6C7484]">
          {node.sub}
        </span>
      </span>
    </div>
  );
}

function Conduit({
  active,
  amber,
  label,
}: {
  active: boolean;
  amber?: boolean;
  label?: string;
}) {
  return (
    <div className="relative hidden h-10 items-center justify-center md:flex">
      <div
        className={`h-px w-full transition-colors duration-500 ${
          active
            ? amber
              ? 'bg-[#F97316]'
              : 'bg-[#1D4ED8]'
            : 'bg-black/10'
        }`}
        aria-hidden="true"
      />
      {active && (
        <motion.span
          aria-hidden="true"
          className={`absolute h-1.5 w-1.5 rounded-full ${amber ? 'bg-[#F97316]' : 'bg-[#1D4ED8]'}`}
          animate={{ left: ['0%', '100%'], opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {label && (
        <span className="absolute rounded-full border border-black/10 bg-[#F7F6F2] px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.1em] text-[#4A5568]">
          {label}
        </span>
      )}
    </div>
  );
}

/* ── Grid-Locked Interactive Routing Blueprint ───────────────────────── */

function RoutingBlueprint() {
  const [modeIdx, setModeIdx] = useState(0);
  const mode = MODES[modeIdx];

  return (
    <div className="mt-12">
      {/* Mode tabs */}
      <div
        role="tablist"
        aria-label="Routing blueprint mode"
        className="flex flex-wrap gap-1.5"
      >
        {MODES.map((m, i) => (
          <button
            key={m.key}
            role="tab"
            aria-selected={i === modeIdx}
            onClick={() => setModeIdx(i)}
            className={`min-h-[42px] rounded-md border px-4 font-mono text-[11.5px] transition-colors sm:px-5 sm:text-[12.5px] ${
              i === modeIdx
                ? 'border-[#101319] bg-[#101319] text-[#F5F7FA]'
                : 'border-black/12 bg-white text-[#4A5568] hover:border-black/30 hover:text-[#101319]'
            }`}
          >
            {m.tab}
          </button>
        ))}
      </div>

      {/* Blueprint stage — grid-locked, fixed structure, mode swaps only
          the node/conduit/ratio content. */}
      <div className="mt-6 overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(16,19,25,0.04)]">
        <div className="grid gap-4 p-5 sm:p-7 md:grid-cols-[1fr_auto_1fr] md:gap-5">
          {/* Left nodes */}
          <div className="flex flex-col gap-2.5">
            {mode.left.map((n) => (
              <NodeChip key={n.label} node={n} tone="left" />
            ))}
          </div>

          {/* Center conduit + hub */}
          <div className="flex flex-col items-center justify-center gap-3 md:w-44">
            <Conduit
              active={mode.cloudConduit}
              label={
                mode.cloudConduit ? 'cloud ↔ local' : mode.airgapLock ?? 'closed'
              }
            />
            <div
              className={`flex h-24 w-full max-w-[180px] flex-col items-center justify-center rounded-lg border px-3 text-center ${
                mode.airgapLock
                  ? 'border-[#F97316] bg-[#F97316]/5'
                  : 'border-[#101319] bg-[#101319]'
              }`}
            >
              <p
                className={`font-mono text-[12px] font-semibold tracking-[0.04em] ${
                  mode.airgapLock ? 'text-[#E04F00]' : 'text-[#F5F7FA]'
                }`}
              >
                {mode.center.title}
              </p>
              <p
                className={`mt-0.5 font-mono text-[10px] tracking-[0.02em] ${
                  mode.airgapLock ? 'text-[#8C95A6]' : 'text-[#8C95A6]'
                }`}
              >
                {mode.center.sub}
              </p>
            </div>
            <Conduit
              active
              amber
              label={
                mode.key === 'team'
                  ? '260 tok/s n=4'
                  : mode.key === 'wing1'
                    ? 'warm KV · $0'
                    : 'local silicon'
              }
            />
          </div>

          {/* Right nodes */}
          <div className="flex flex-col gap-2.5">
            {mode.right.map((n) => (
              <NodeChip key={n.label} node={n} tone="right" />
            ))}
          </div>
        </div>

        {/* Token split ratio — reconfigures per mode */}
        <div className="border-t border-black/10 bg-[#F7F6F2] px-5 py-4 sm:px-7">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-white ring-1 ring-black/10">
            {mode.split.cloudPct > 0 && (
              <motion.div
                className="h-full bg-[#1D4ED8]"
                initial={false}
                animate={{ width: `${mode.split.cloudPct}%` }}
                transition={{ type: 'spring', stiffness: 140, damping: 22 }}
              />
            )}
            <motion.div
              className="h-full bg-[#F97316]"
              initial={false}
              animate={{ width: `${mode.split.localPct}%` }}
              transition={{ type: 'spring', stiffness: 140, damping: 22 }}
            />
          </div>
          <div className="mt-2 flex flex-col gap-1 font-mono text-[11px] text-[#4A5568] sm:flex-row sm:justify-between">
            <span>
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#1D4ED8]" aria-hidden="true" />
              {mode.split.cloudLabel}
            </span>
            <span>
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#F97316]" aria-hidden="true" />
              {mode.split.localLabel}
            </span>
          </div>
        </div>

        {/* Mode blurb + engineering spec cards */}
        <div className="grid gap-5 border-t border-black/10 p-5 sm:p-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
          <AnimatePresence mode="wait">
            <motion.p
              key={mode.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="text-[14px] leading-relaxed text-[#374151]"
            >
              {mode.blurb}
            </motion.p>
          </AnimatePresence>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {mode.cards.map((c) => (
              <div
                key={c.tag}
                className="rounded-lg border border-black/10 bg-[#F7F6F2] p-4"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#9CA3AF]">
                  {c.tag}
                </p>
                <p className="mt-1 font-mono text-[12.5px] font-semibold text-[#101319]">
                  {c.title}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[#4A5568]">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 4-stat proof strip ────────────────────────────────────────────────
 * Calm neutral eyebrows on the first 3 cards; the bright amber eyebrow
 * is reserved for the $10.12-vs-$6,044.48 savings card (4th). */

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
    label: 'n=4 aggregate decode',
  },
  {
    value: LEDGER_76DAY.cacheHitPct,
    suffix: '%',
    format: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
    label: 'warm KV reuse across 2.77B tokens',
  },
  {
    value: 6_044.48,
    prefix: '$',
    format: { useGrouping: true, minimumFractionDigits: 2, maximumFractionDigits: 2 },
    label: 'cloud cost vs $10.12 power',
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
                  $10.12 in power over 78 days
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
          <span className="folio-coord">
            Field Guide // 01 — Two Wings &amp; Production Plumbing
          </span>
          <span className="folio-index">01 / 04</span>
        </div>

        {/* ── Left-aligned asymmetric header (no text-center) ───────── */}
        <header className="asymmetric-spread mt-8">
          <div className="min-w-0">
            <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.035em] text-[#101319]">
              Your frontier model
              <br className="hidden sm:block" />
              shouldn&apos;t grep.
            </h2>
          </div>
          <div className="prose-measure min-w-0">
            <p className="text-base leading-relaxed text-[#4A5568] sm:text-lg">
              Over 78 days on one RTX 3090, 93.8% of prompt tokens were
              repetitive repo reads — the kind of grind that costs you $4 per
              million tokens in the cloud and $0 on your own GPU. That gap is
              the whole product.
            </p>
            <p className="mt-3 text-base leading-relaxed text-[#4A5568] sm:text-lg">
              There are two ways to run it: <strong className="font-semibold text-[#101319]">Wing 01</strong> keeps
              your frontier model (Claude Code, Cursor, or Gemini) as the
              architect while your GPU executes the grind — or{' '}
              <strong className="font-semibold text-[#101319]">Wing 02</strong> closes the
              cloud conduit entirely for 100% local, zero-egress operation.
              And when you run a team, we wire the production plumbing: the
              shared GPU server, the vLLM tuning, the sandboxing — so you
              never burn an engineering quarter on infrastructure.
            </p>
          </div>
        </header>

        {/* ── Grid-Locked Interactive Routing Blueprint ─────────────── */}
        <RoutingBlueprint />

        {/* ── 4-stat proof strip ────────────────────────────────────── */}
        <ProofStrip />
      </div>
    </section>
  );
}
