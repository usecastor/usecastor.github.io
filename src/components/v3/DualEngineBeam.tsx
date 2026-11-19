// @client
/**
 * ACT 2 — DualEngineBeam.
 * Airy warm-ivory (#F7F6F2) act: a curved SVG AnimatedBeam architecture stage
 * (cloud leads → Castor core → local silicon, with animated cobalt + amber
 * laser gradients), three spring-morphing capability pills, and four giant
 * floating NumberFlow metrics that roll from 0 to their real values on scroll.
 *
 * Zero scroll hijacking — the section paints at full opacity from first frame.
 */
import { useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useInView,
} from 'motion/react';
import { Cpu, Sparkles, Cloud } from 'lucide-react';
import { NumberFlowGroup } from '@number-flow/react';
import SafeNumberFlow from './SafeNumberFlow';
import { LEDGER_76DAY } from '../../data/telemetry';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/* ── Architecture node data (100% real, from telemetry.ts) ──────────── */

const CLOUD_LEADS: Array<{ name: string; Icon: typeof Cloud }> = [
  { name: 'Claude Opus 5.5', Icon: Sparkles },
  { name: 'Gemini 4 Neon', Icon: Cloud },
  { name: 'GPT-6.2 Astra', Icon: Cpu },
];

const LOCAL_SILICON: Array<string> = [
  'RTX 3090 · Qwen3.8-27B',
  '5-Layer Sandbox · 137 Vectors',
  '27-Grammar AST Gate',
];

/* ── Root ────────────────────────────────────────────────────────────── */

export default function DualEngineBeam() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-[#F7F6F2] py-24 text-[#0E1117] lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* ── Concise header ────────────────────────────────────────── */}
        <header className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.035em]">
            Your frontier model shouldn&apos;t grep.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-[#4A5568] sm:text-lg">
            Over 76 days on one RTX 3090, 93.7% of prompt tokens were repetitive
            repo reads.
          </p>
        </header>

        {/* ── AnimatedBeam architecture stage ───────────────────────── */}
        <div className="relative mx-auto mt-14 max-w-5xl">
          {/* SVG beam overlay (md+ only): cubic-bezier conduits with
              animated cobalt (left→core) and amber (core→right) laser
              gradient pulses. */}
          <svg
            className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
            viewBox="0 0 1000 300"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              {/* Cobalt laser gradient (cloud → core) */}
              <linearGradient id="beam-cobalt" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.12" />
                <motion.stop
                  offset="50%"
                  stopColor="#2563EB"
                  animate={{ stopOpacity: [0.15, 0.9, 0.15] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.12" />
              </linearGradient>
              {/* Amber laser gradient (core → local) */}
              <linearGradient id="beam-amber" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#EA580C" stopOpacity="0.12" />
                <motion.stop
                  offset="50%"
                  stopColor="#EA580C"
                  animate={{ stopOpacity: [0.15, 0.9, 0.15] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                />
                <stop offset="100%" stopColor="#EA580C" stopOpacity="0.12" />
              </linearGradient>
            </defs>

            {/* Left → center (cobalt): three cubic-bezier conduits */}
            <path d="M 210 60 C 330 60, 380 150, 470 150" fill="none" stroke="url(#beam-cobalt)" strokeWidth={2.25} />
            <path d="M 210 150 C 320 150, 360 150, 470 150" fill="none" stroke="url(#beam-cobalt)" strokeWidth={2.25} />
            <path d="M 210 240 C 330 240, 380 150, 470 150" fill="none" stroke="url(#beam-cobalt)" strokeWidth={2.25} />

            {/* Center → right (amber): three cubic-bezier conduits */}
            <path d="M 530 150 C 620 150, 660 60, 790 60" fill="none" stroke="url(#beam-amber)" strokeWidth={2.25} />
            <path d="M 530 150 C 640 150, 680 150, 790 150" fill="none" stroke="url(#beam-amber)" strokeWidth={2.25} />
            <path d="M 530 150 C 620 150, 660 240, 790 240" fill="none" stroke="url(#beam-amber)" strokeWidth={2.25} />
          </svg>

          {/* 3-column responsive layout (horizontal on md+, stacked on mobile) */}
          <div className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
            {/* Left: Cloud leads */}
            <div className="flex flex-col justify-center gap-4">
              {CLOUD_LEADS.map(({ name, Icon }) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,19,25,0.04)]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1D4ED8]/10 text-[#1D4ED8]">
                    <Icon size={17} strokeWidth={2} />
                  </span>
                  <span className="min-w-0 truncate font-mono text-[12.5px] font-medium text-[#101319]">
                    {name}
                  </span>
                </div>
              ))}
            </div>

            {/* Center: Castor core */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center">
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-xl"
                  style={{ boxShadow: '0 0 0 1px rgba(29,78,216,0.4)' }}
                  animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-xl bg-[#0A0D14] shadow-[0_20px_40px_-12px_rgba(16,19,25,0.4)]">
                  <img
                    src={`${base}/assets/logo.svg`}
                    alt=""
                    width="40"
                    height="40"
                    className="h-10 w-10"
                  />
                </div>
              </div>
              <p className="mt-4 font-mono text-[12px] font-semibold tracking-[0.02em] text-[#101319]">
                Castor Microkernel
              </p>
              <p className="mt-0.5 font-mono text-[11px] tracking-[0.02em] text-[#6C7484]">
                3 MCP Tools · Rust
              </p>
            </div>

            {/* Right: Local silicon */}
            <div className="flex flex-col justify-center gap-4">
              {LOCAL_SILICON.map((label) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,19,25,0.04)]"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#F97316]" aria-hidden="true" />
                  <span className="min-w-0 truncate font-mono text-[12.5px] font-medium text-[#101319]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Three spring-morphing capability pills ────────────────── */}
        <CapabilityPills />

        {/* ── Four giant floating NumberFlow metrics ────────────────── */}
        <GiantMetrics />
      </div>
    </section>
  );
}

/* ── Capability pills: one crisp verified fact morphs per click ─────── */

const CAPABILITIES: Array<{ label: string; fact: string }> = [
  {
    label: '5-Layer Sandbox',
    fact: 'Path, command, env, network, filesystem — 137 vectors, 123 blocked, zero egress.',
  },
  {
    label: 'Tree-Sitter AST Gate',
    fact: '27 grammars parse every edit; an unparsable patch never touches your tree.',
  },
  {
    label: '150K Warm KV Pool',
    fact: '150K-token prefix cache on the RTX 3090 — why 93.7% of prompts reuse at $0.00.',
  },
];

function CapabilityPills() {
  const [active, setActive] = useState(0);

  return (
    <div className="mx-auto mt-16 max-w-3xl">
      <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Capabilities">
        {CAPABILITIES.map((c, i) => (
          <button
            key={c.label}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className="relative min-h-[40px] rounded-full border border-black/10 px-4 font-mono text-[12px] font-medium transition-colors"
          >
            {i === active && (
              <motion.span
                layoutId="cap-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-full border border-[#1D4ED8]/30 bg-[#1D4ED8]/10"
              />
            )}
            <span className={`relative z-10 ${i === active ? 'text-[#1D4ED8]' : 'text-[#4A5568]'}`}>
              {c.label}
            </span>
          </button>
        ))}
      </div>
      <div className="mx-auto mt-4 min-h-[64px] max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.p
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-center font-mono text-[13px] leading-relaxed text-[#374151]"
          >
            {CAPABILITIES[active].fact}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Giant floating NumberFlow metrics (roll from 0 on scroll-in) ───── */

const METRICS: Array<{
  value: number;
  prefix?: string;
  suffix?: string;
  format?: Record<string, string | number | boolean>;
  label: string;
}> = [
  {
    value: 2.62,
    suffix: 'B',
    format: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    label: 'Tokens processed (76d)',
  },
  {
    value: LEDGER_76DAY.cacheHitPct,
    suffix: '%',
    format: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
    label: 'Warm KV prefix hit',
  },
  {
    value: LEDGER_76DAY.novPrefillAvgTps,
    format: { useGrouping: true, maximumFractionDigits: 0 },
    label: 'tok/s Nov prefill avg',
  },
  {
    value: LEDGER_76DAY.netSavingsUsd,
    prefix: '$',
    format: { maximumFractionDigits: 0 },
    label: 'Net saved vs $9.38 power',
  },
];

function GiantMetrics() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <div
      ref={ref}
      className="mt-20 grid grid-cols-2 gap-8 border-t border-black/10 pt-14 lg:grid-cols-4"
    >
      <NumberFlowGroup>
        {METRICS.map((m) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0"
          >
            <div className="flex items-baseline justify-center">
              <SafeNumberFlow
                value={m.value}
                prefix={m.prefix}
                suffix={m.suffix}
                format={m.format}
                className="font-display text-[clamp(2.2rem,4.5vw,3.75rem)] font-bold tracking-[-0.03em] text-[#101319]"
              />
            </div>
            <p className="mt-1.5 text-center font-mono text-[11.5px] tracking-[0.04em] text-[#6C7484]">
              {m.label}
            </p>
          </motion.div>
        ))}
      </NumberFlowGroup>
    </div>
  );
}
