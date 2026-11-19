// @client
/**
 * ACT 1 — HeroCinema.
 * Full-bleed #05070B dark-silicon stage: a live 60fps Paper Design WebGL2
 * GrainGradient mesh (client-mounted behind a WebGL2 capability guard, with a
 * pure-CSS cobalt+amber radial fallback for SSR / software contexts), a
 * liquid `layoutId` client installer, and the live BorderBeam +
 * ShikiMagicMovePrecompiled + NumberFlow theater.
 *
 * Zero scroll hijacking, zero stuck opacity — the hero paints at full
 * visibility from the first frame.
 */
import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from 'motion/react';
import {
  GrainGradient,
  type GrainGradientProps,
} from '@paper-design/shaders-react';
import { ShikiMagicMovePrecompiled } from 'shiki-magic-move/react';
import type {
  KeyedToken,
  KeyedTokensInfo,
} from 'shiki-magic-move/types';
import { NumberFlowGroup } from '@number-flow/react';
import SafeNumberFlow from './SafeNumberFlow';
import { Check, Copy, Pause, Play } from 'lucide-react';
import { HARDWARE_SNAPSHOT, LEDGER_76DAY } from '../../data/telemetry';

export interface PrecompiledHeroStep {
  id: string;
  label: string;
  lang: 'rust' | 'bash';
  code: string;
  tokens: KeyedTokensInfo;
}

interface HeroCinemaProps {
  steps: PrecompiledHeroStep[];
}

/* ── Deterministic static code fallback (zero #418) ────────────────────
 * `ShikiMagicMovePrecompiled`'s underlying `ShikiMagicMoveRenderer`
 * attaches the theme's `rootStyle` as an inline `style` on its `<pre>`
 * inside a `useEffect` — so the SSR markup (no inline style) and the
 * first client render (inline style) diverge, and React 19's hydration
 * logs `#418`. On the initial (SSR + first client) pass we instead
 * render the exact same clean static `<pre>` the server emitted —
 * identical tokens, classes, and colors — and swap seamlessly into the
 * live precompiled theater after mount.
 */
function normalizeCss(css?: string | React.CSSProperties): React.CSSProperties {
  if (!css) return {};
  if (typeof css === 'object') return css;
  const out: Record<string, string> = {};
  for (const pair of css.split(';')) {
    const idx = pair.indexOf(':');
    if (idx > -1) {
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      if (key && val) out[key] = val;
    }
  }
  return out as React.CSSProperties;
}

function StaticShikiPre({ tokens }: { tokens: KeyedTokensInfo }) {
  return (
    <pre className="shiki-magic-move-container">
      <div>
        {tokens.tokens.map((t: KeyedToken) =>
          t.content === '\n' ? (
            <br key={t.key} />
          ) : (
            <span
              key={t.key}
              style={{ ...normalizeCss(t.htmlStyle), color: t.color }}
              className={['shiki-magic-move-item', t.htmlClass]
                .filter(Boolean)
                .join(' ')}
            >
              {t.content}
            </span>
          ),
        )}
      </div>
    </pre>
  );
}

function HeroCodeStage({
  steps,
  step,
  options,
}: {
  steps: PrecompiledHeroStep[];
  step: number;
  options: { duration: number; stagger: number; lineNumbers: boolean };
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const active = steps[Math.min(step, steps.length - 1)];

  if (!mounted) {
    // Deterministic SSR markup: clean static <pre> with the current
    // frame's precompiled tokens — identical server and client.
    return <StaticShikiPre tokens={active.tokens} />;
  }

  // Live morphing theater — mounted client-side only, so the declarative
  // DOM surgery (and its inline rootStyle) never crosses hydration.
  return (
    <ShikiMagicMovePrecompiled
      steps={steps.map((s) => s.tokens)}
      step={step}
      options={options}
    />
  );
}

/* ── Copy helper (real clipboard writes) ────────────────────────────── */

function writeClipboard(text: string): void {
  void navigator.clipboard?.writeText(text).catch(() => {
    /* non-secure context — feedback still shown */
  });
}

/* ── WebGL2 capability + software-renderer probe (client-only) ─────────
 * Guards against CPU-pegging software renderers (SwiftShader, llvmpipe,
 * Mesa, ANGLE "Microsoft Basic Render", Intel "Warp") so the live
 * GrainGradient shader never runs on devices without a real GPU.
 * Reduced-motion devices skip the live shader and keep the CSS mesh.
 */

const SOFTWARE_RENDERER_RE =
  /swiftshader|llvmpipe|warp|software|microsoft basic render|mesa/i;

interface ShaderProbe {
  enabled: boolean;
}

function probeShader(): ShaderProbe {
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return { enabled: false };
    }
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    if (!gl) return { enabled: false };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) {
      const renderer = String(
        gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? '',
      );
      if (SOFTWARE_RENDERER_RE.test(renderer)) {
        // Software renderer detected — do not mount GrainGradient.
        return { enabled: false };
      }
    }
    return { enabled: true };
  } catch {
    return { enabled: false };
  }
}

/* ── Live GPU shader layer (client-mounted, guarded) ──────────────────
 * Two independent gates:
 *   1. Software-renderer + reduced-motion probe above.
 *   2. IntersectionObserver: `speed` drops to 0 when the hero leaves the
 *      viewport so off-screen devices never burn battery / CPU.
 */

function HeroShader() {
  const [enabled, setEnabled] = useState(false);
  const [inView, setInView] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = probeShader();
    setEnabled(p.enabled);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setInView(e.isIntersecting);
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enabled]);

  const params: Pick<
    GrainGradientProps,
    | 'speed'
    | 'fit'
    | 'scale'
    | 'colorBack'
    | 'colors'
    | 'softness'
    | 'intensity'
    | 'noise'
    | 'shape'
  > = {
    speed: inView ? 0.35 : 0,
    fit: 'none',
    scale: 1,
    colorBack: '#05070B',
    colors: ['#05070B', '#0F2557', '#1D4ED8', '#EA580C'],
    softness: 0.8,
    intensity: 0.35,
    noise: 0.45,
    shape: 'blob',
  };

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 opacity-[0.55]"
      aria-hidden="true"
    >
      {enabled && <GrainGradient {...params} className="h-full w-full" />}
    </div>
  );
}

/* ── Liquid client installer ─────────────────────────────────────────── */

const CLIENTS: Array<{ id: string; label: string; cmd: string }> = [
  { id: 'all', label: 'All Clients', cmd: 'npx -y mcp-castor install --client all' },
  { id: 'claude', label: 'Claude Code', cmd: 'npx -y mcp-castor install --client claude' },
  {
    id: 'antigravity',
    label: 'Antigravity',
    cmd: 'npx -y mcp-castor install --client antigravity',
  },
  {
    id: 'airgap',
    label: 'Air-Gap',
    cmd: 'cargo install --path . --no-default-features --features mcp,ast',
  },
];

function InstallerBar() {
  const [client, setClient] = useState(0);
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  const active = CLIENTS[client];

  const copy = () => {
    writeClipboard(active.cmd);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto mt-8 max-w-xl min-w-0">
      {/* Liquid spring-glide tabs — 2×2 grid on mobile, inline row on sm+ */}
      <div
        role="tablist"
        aria-label="Install target"
        className="mx-auto grid w-fit max-w-full grid-cols-2 gap-1 rounded-lg border border-white/10 bg-black/40 p-1 backdrop-blur-md sm:inline-flex"
      >
        {CLIENTS.map((c, i) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={i === client}
            onClick={() => setClient(i)}
            className="relative min-h-[40px] rounded-md px-3 font-mono text-[11px] text-[#A3AEBF] transition-colors hover:text-[#F5F7FA] focus-visible:outline-2 focus-visible:outline-[#F97316] sm:text-[12px]"
          >
            {i === client && (
              <motion.span
                layoutId="hero-client-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-md border border-white/10 bg-[#131A26]"
              />
            )}
            <span className="relative z-10 text-center sm:text-left">
              {c.label}
            </span>
          </button>
        ))}
      </div>

      {/* Glass-obsidian CLI bar — command wraps on narrow viewports */}
      <div className="mt-3 flex min-w-0 items-center justify-between gap-3 rounded-lg border border-white/12 bg-black/60 px-4 py-3 backdrop-blur-md">
        <code className="min-w-0 flex-1 break-words whitespace-normal rounded font-mono text-[12px] leading-relaxed text-[#D7DEE9] sm:text-[13.5px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="text-[#FB923C]">$ </span>
          <AnimatePresence initial={false} mode="wait">
            <motion.span
              key={client}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="inline"
            >
              {active.cmd}
            </motion.span>
          </AnimatePresence>
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy install command"
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-md bg-[#F97316] px-3.5 font-mono text-[12px] font-semibold text-[#0B0F17] transition-colors hover:bg-[#FB923C]"
        >
          <motion.span
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="flex items-center gap-1.5"
          >
            {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={2.5} />}
            {copied ? 'Copied' : 'Copy'}
          </motion.span>
        </button>
      </div>
    </div>
  );
}

/* ── Live telemetry per theater step (100% real Nov-19-2026 ledger) ─── */

const STEP_TELEMETRY: Array<{
  prefill: number;
  decode: number;
  kv: number;
  usd: number;
}> = [
  { prefill: 0, decode: 0.0, kv: 0.0, usd: 0.0 },
  {
    prefill: LEDGER_76DAY.novPrefillAvgTps,
    decode: LEDGER_76DAY.novDecodeP50Tps,
    kv: LEDGER_76DAY.cacheHitPct,
    usd: 0,
  },
  {
    prefill: LEDGER_76DAY.novPrefillP95Tps,
    decode: LEDGER_76DAY.novDecodeP95Tps,
    kv: LEDGER_76DAY.cacheHitPct,
    usd: 0,
  },
  {
    prefill: LEDGER_76DAY.novPrefillMaxTps,
    decode: LEDGER_76DAY.novDecodeMaxTps,
    kv: LEDGER_76DAY.cacheHitPct,
    usd: 0,
  },
];

/* ── The BorderBeam theater ──────────────────────────────────────────── */

const STEP_BUTTONS = ['Dispatch', 'Warm KV', 'AST Edit', 'Exit 0'];

function Theater({ steps }: { steps: PrecompiledHeroStep[] }) {
  const reduced = useReducedMotion();
  // Instant-Impact default: open on the AST-gated edit frame (P95 prefill,
  // real Rust `verify_token` code) so visitors see blazing RTX 3090 telemetry
  // and real code the millisecond the page paints. Auto-play still cycles
  // smoothly 2 → 3 → 0 → 1 → 2.
  const [step, setStep] = useState(2);
  const [playing, setPlaying] = useState(true);
  const stepBtns = useRef<Array<HTMLButtonElement | null>>([]);
  const active = STEP_TELEMETRY[step];

  // Auto-advance every 3.6s — disabled when paused or reduced motion.
  useEffect(() => {
    if (!playing || reduced) return;
    const t = window.setInterval(
      () => setStep((s) => (s + 1) % steps.length),
      3600,
    );
    return () => window.clearInterval(t);
  }, [playing, reduced, steps.length]);

  // Keep the spring-glide pill inside the viewport when auto-advancing.
  useEffect(() => {
    const el = stepBtns.current[step];
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [step]);

  const select = (i: number) => {
    setStep(i);
    setPlaying(false);
  };

  return (
    <div className="mx-auto mt-12 w-full min-w-0 max-w-5xl">
      {/* 1px luminous rotating conic rim (Cobalt → Amber) around the
          glass-obsidian hardware window. GPU-only transform rotation. */}
      <div
        className="relative rounded-xl p-px"
        style={{
          background:
            'conic-gradient(from 0deg, #3B82F6, #0A0D14 25%, #F97316 50%, #0A0D14 75%, #3B82F6)',
          animation: reduced ? undefined : 'border-beam 7s linear infinite',
        }}
        role="figure"
        aria-label="Castor live execution theater"
      >
        <div className="overflow-hidden rounded-[11px] bg-[#0A0D14]">
          {/* ── Top HUD bar ─────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-white/10 px-3 py-3 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              {/* Step tabs + play/pause on ONE row at 390px, no scrollbar */}
              <div className="flex min-w-0 flex-1 items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1 sm:flex-none sm:gap-1.5">
                {STEP_BUTTONS.map((label, i) => (
                  <button
                    key={label}
                    ref={(el) => {
                      stepBtns.current[i] = el;
                    }}
                    onClick={() => select(i)}
                    aria-pressed={i === step}
                    className="relative h-9 min-w-0 flex-1 rounded-md px-1.5 font-mono text-[10px] text-[#A3AEBF] transition-colors hover:text-[#F5F7FA] focus-visible:outline-2 focus-visible:outline-[#F97316] sm:h-[40px] sm:flex-none sm:px-3 sm:text-[11.5px]"
                  >
                    {i === step && (
                      <motion.span
                        layoutId="theater-step-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-md border border-white/10 bg-[#131A26]"
                      />
                    )}
                    <span className="relative z-10 block truncate">{label}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? 'Pause the loop' : 'Play the loop'}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black/40 text-[#D7DEE9] transition-colors hover:border-white/25 sm:h-10 sm:w-10"
              >
                {playing && !reduced ? (
                  <Pause size={14} strokeWidth={2.25} />
                ) : (
                  <Play size={14} strokeWidth={2.25} />
                )}
              </button>
            </div>

            {/* Live spinning telemetry strip */}
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1 font-mono">
              <NumberFlowGroup>
                <span className="min-w-0">
                  <SafeNumberFlow
                    value={active.prefill}
                    format={{ useGrouping: true }}
                    className="text-[13px] text-[#F5F7FA]"
                  />
                  <span className="ml-1 text-[10.5px] tracking-[0.08em] text-[#5D6B80]">
                    PREFILL TOK/S
                  </span>
                </span>
                <span className="min-w-0">
                  <SafeNumberFlow
                    value={active.decode}
                    format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                    className="text-[13px] text-[#F5F7FA]"
                  />
                  <span className="ml-1 text-[10.5px] tracking-[0.08em] text-[#5D6B80]">
                    DECODE TOK/S
                  </span>
                </span>
                <span className="min-w-0">
                  <SafeNumberFlow
                    value={active.kv}
                    suffix="%"
                    format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                    className="text-[13px] text-[#F5F7FA]"
                  />
                  <span className="ml-1 text-[10.5px] tracking-[0.08em] text-[#5D6B80]">
                    WARM KV
                  </span>
                </span>
                <span className="min-w-0">
                  <SafeNumberFlow
                    value={active.usd}
                    prefix="$"
                    format={{ minimumFractionDigits: 3, maximumFractionDigits: 3 }}
                    className="text-[13px] text-[#FB923C]"
                  />
                  <span className="ml-1 text-[10.5px] tracking-[0.08em] text-[#5D6B80]">
                    CLOUD
                  </span>
                </span>
              </NumberFlowGroup>
            </div>
          </div>

          {/* ── Code morphing stage ─────────────────────────────────── */}
          <div className="min-h-[250px] overflow-x-auto p-3.5 text-[10.5px] sm:min-h-[270px] sm:p-6 sm:text-[13px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <HeroCodeStage
              steps={steps}
              step={step}
              options={{ duration: 600, stagger: 1.5, lineNumbers: true }}
            />
          </div>

          {/* ── Bottom hardware footer strip ────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-white/10 bg-black/30 px-4 py-3 sm:px-5">
            <p className="font-mono text-[11px] tracking-[0.03em] text-[#8C95A6]">
              {HARDWARE_SNAPSHOT.gpu.model.replace('NVIDIA GeForce ', '')} (
              {Math.round(HARDWARE_SNAPSHOT.gpu.vramTotalMiB / 1024)} GB) ·{' '}
              {HARDWARE_SNAPSHOT.engine.model.split('-')[0]}-W4A16 ·{' '}
              {HARDWARE_SNAPSHOT.engine.name} · {HARDWARE_SNAPSHOT.gpu.powerDrawW}{' '}
              W · {HARDWARE_SNAPSHOT.gpu.tempC} °C
            </p>
            <a
              href="/benchmarks/qwen3-8-27b-rtx-3090/"
              className="whitespace-nowrap font-mono text-[11.5px] text-[#7FA6FF] underline decoration-white/20 underline-offset-4 transition-colors hover:text-[#A9C6FF]"
            >
              Full 76-day benchmarks →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Pointer spotlight (silky Cobalt/Amber radial, GPU) ──────────────── */

function useSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(50);
  const y = useMotionValue(30);
  const gradient = useMotionTemplate`radial-gradient(640px circle at ${x}% ${y}%, rgba(59,130,246,0.10), rgba(249,115,22,0.05) 45%, transparent 72%)`;

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set(((e.clientX - r.left) / r.width) * 100);
    y.set(((e.clientY - r.top) / r.height) * 100);
  };

  return { ref, gradient, onMouseMove };
}

/* ── Root ────────────────────────────────────────────────────────────── */

export default function HeroCinema({ steps }: HeroCinemaProps) {
  const spotlight = useSpotlight();

  return (
    <section
      id="hero"
      className="relative -mt-14 min-h-screen w-full min-w-0 max-w-full overflow-x-clip bg-[#05070B] pb-20 pt-16 sm:pt-20"
      onMouseMove={spotlight.onMouseMove}
    >
      {/* Static CSS mesh fallback — always painted (visible before the
          WebGL mount, and in SSR / software contexts): a gorgeous dark
          cobalt+amber radial mesh. */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(90rem 44rem at 18% 12%, rgba(29,78,216,0.32), transparent 62%), radial-gradient(70rem 38rem at 82% 30%, rgba(234,88,12,0.17), transparent 64%), radial-gradient(52rem 32rem at 50% 92%, rgba(15,37,87,0.5), transparent 70%)',
        }}
      />

      {/* Live 60fps WebGL2 GrainGradient (client-mounted, capability-guarded) */}
      <HeroShader />

      {/* Pointer-tracked radial spotlight */}
      <motion.div
        ref={spotlight.ref}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: spotlight.gradient }}
      />

      {/* Soft vignette fading smoothly to solid #05070B at the bottom edge */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(120% 70% at 50% 38%, transparent 52%, rgba(5,7,11,0.55) 100%), linear-gradient(to bottom, transparent 58%, #05070B 100%)',
        }}
      />

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h1
            className="font-display text-[clamp(2.6rem,6vw,5.25rem)] font-bold leading-[0.94] tracking-[-0.045em] text-[#F5F7FA]"
          >
            Keep your frontier model.
            <br />
            <span className="text-[#FB923C]">Stop paying it</span> to read files.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-[#A3AEBF] sm:text-lg">
            Pair Claude Opus 5.5, Gemini 4, or GPT-6.2 with Qwen3.8-27B on your
            own GPU — 93.7% warm KV reuse at $0.00 per local token.
          </p>
        </div>

        <InstallerBar />

        <Theater steps={steps} />
      </div>
    </section>
  );
}
