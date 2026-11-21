// @client
/**
 * ACT 1 — HeroCinema.
 * Full-bleed #05070B dark-silicon stage: a deterministic HTML5 canvas
 * topology-survey background (low-alpha isometric grid + a soft
 * amber/cobalt wavefront scan band, rAF paused off-screen, static under
 * `prefers-reduced-motion`), a fixed-height single-view SSE velocity &
 * concurrency streamer (n=4 parallel streams · 260 tok/s aggregate, or
 * n=1 single stream · 70.4 tok/s — zero layout shift), and the liquid
 * client installer with the page's single solid-amber primary button.
 *
 * Zero scroll hijacking, zero stuck opacity — the hero paints at full
 * visibility from the first frame, and every initial value is
 * deterministic (identical SSR and first-client render, no #418).
 */
import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from 'motion/react';
import { NumberFlowGroup } from '@number-flow/react';
import SafeNumberFlow from './SafeNumberFlow';
import { Check, Copy, Pause, Play } from 'lucide-react';
import { HARDWARE_SNAPSHOT, LEDGER_76DAY } from '../../data/telemetry';

/* ── Copy helper (real clipboard writes) ────────────────────────────── */

function writeClipboard(text: string): void {
  void navigator.clipboard?.writeText(text).catch(() => {
    /* non-secure context — feedback still shown */
  });
}

/* ── TopologySurveyCanvas — deterministic wireframe wave survey ─────────
 * Low-alpha isometric grid lines with a soft amber/cobalt wavefront scan
 * band sweeping across (inspired by Meng To's `scroll-mesh-survey`).
 *   · rAF pauses via IntersectionObserver when the hero leaves the view
 *   · devicePixelRatio clamped to 1.6 (retina without over-rasterizing)
 *   · `prefers-reduced-motion: reduce` → one static render, no loop
 * Canvas only exists after mount (client-only), so there is zero SSR/
 * hydration divergence — the element is painted empty by the CSS mesh.
 */

const SURVEY_DPR_MAX = 1.6;
const WAVE_PERIOD_S = 9;
const GRID_STEP = 44;

interface SurveyState {
  w: number;
  h: number;
  running: boolean;
  reduced: boolean;
  t0: number;
  elapsed: number;
}

function renderSurvey(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
): void {
  ctx.clearRect(0, 0, w, h);

  /* Isometric diamond lattice: two diagonal families at ±26.57°
     (3:4 slope) — low-alpha, gently modulated by the scan phase. */
  const phase = (t * 0.06) % (Math.PI * 2);
  ctx.lineWidth = 1;
  for (const slope of [1, -1]) {
    let i = 0;
    const span = w + h;
    for (let c = -span; c < span; c += GRID_STEP) {
      i += 1;
      const a = 0.028 + 0.017 * (0.5 + 0.5 * Math.sin(phase + i * 0.7));
      ctx.strokeStyle = `rgba(148, 180, 220, ${a.toFixed(3)})`;
      ctx.beginPath();
      const k = (c * 3) / 4;
      if (slope > 0) {
        ctx.moveTo(0, Math.max(0, k));
        ctx.lineTo(Math.min(w, w - k), Math.min(h, h - k));
      } else {
        ctx.moveTo(0, Math.min(h, h - k));
        ctx.lineTo(Math.min(w, w - k), Math.max(0, k));
      }
      ctx.stroke();
    }
  }

  /* Wavefront scan band: a soft vertical sweep, amber core fading into
     cobalt shoulders, traveling left→right over WAVE_PERIOD_S. */
  const x = ((t % WAVE_PERIOD_S) / WAVE_PERIOD_S) * (w + 520) - 260;
  const g = ctx.createLinearGradient(x - 260, 0, x + 260, 0);
  g.addColorStop(0, 'rgba(59,130,246,0)');
  g.addColorStop(0.42, 'rgba(59,130,246,0.07)');
  g.addColorStop(0.5, 'rgba(249,115,22,0.13)');
  g.addColorStop(0.58, 'rgba(59,130,246,0.07)');
  g.addColorStop(1, 'rgba(59,130,246,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function TopologySurveyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    )?.matches ?? false;
    const dpr = Math.min(window.devicePixelRatio || 1, SURVEY_DPR_MAX);

    const s: SurveyState = {
      w: 0,
      h: 0,
      running: !reduced,
      reduced,
      t0: performance.now(),
      elapsed: 3.2, // deterministic mid-sweep opening frame
    };

    const size = () => {
      const r = wrap.getBoundingClientRect();
      s.w = Math.max(1, Math.round(r.width));
      s.h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(s.w * dpr);
      canvas.height = Math.round(s.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();

    /* Defensive: if the first measurement landed on an un-laid-out
       (zero-size) wrapper, re-size on the next paint so the canvas
       never stays at the browser-default 300×150. */
    if (s.w < 2 || s.h < 2) {
      requestAnimationFrame(() => {
        size();
        if (s.reduced) staticRender();
      });
    }

    let raf = 0;
    let io: IntersectionObserver | undefined;

    const frame = (now: number) => {
      if (!s.running) return;
      s.elapsed = (now - s.t0) / 1000;
      renderSurvey(ctx, s.w, s.h, s.elapsed);
      raf = requestAnimationFrame(frame);
    };

    const staticRender = () => {
      renderSurvey(ctx, s.w, s.h, s.elapsed);
    };

    if (reduced) {
      // Reduced motion: a single deterministic static render.
      staticRender();
    } else if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const inView = e.isIntersecting;
            if (inView && !s.running) {
              s.running = true;
              s.t0 = performance.now() - s.elapsed * 1000;
              raf = requestAnimationFrame(frame);
            } else if (!inView && s.running) {
              s.running = false;
              cancelAnimationFrame(raf);
            }
          }
        },
        { threshold: 0.01 },
      );
      io.observe(wrap);
      raf = requestAnimationFrame(frame);
    } else {
      raf = requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(() => {
      size();
      if (reduced) staticRender();
    });
    ro.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0" aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full opacity-70" />
    </div>
  );
}

/* ── Liquid client installer ───────────────────────────────────────────
 * The client tab strip and the command bar share the exact same
 * `w-full max-w-3xl mx-auto` container, so they are pixel-aligned at
 * every breakpoint. The command text is `whitespace-nowrap
 * overflow-x-auto` — switching to the 3rd tab (100% Local / Air-Gap)
 * scrolls horizontally instead of wrapping to a second line, and the
 * page height never shifts.
 */

const CLIENTS: Array<{ id: string; label: string; cmd: string }> = [
  { id: 'all', label: 'All Clients', cmd: 'npx -y mcp-castor install --client all' },
  { id: 'claude', label: 'Claude Code', cmd: 'npx -y mcp-castor install --client claude' },
  {
    id: 'gemini',
    label: 'Gemini CLI',
    cmd: 'npx -y mcp-castor install --client gemini',
  },
  {
    id: 'airgap',
    label: '100% Local / Air-Gap',
    cmd: 'cargo install --path . --no-default-features --features mcp,ast --offline',
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
    <div className="mx-auto mt-6 w-full max-w-3xl">
      {/* Tab strip spans the exact width of the command box below it, so
          the bar's edges align 100% flush at every breakpoint (2-up on
          mobile, 4-up from sm up). */}
      <div
        role="tablist"
        aria-label="Install target"
        className="grid w-full grid-cols-2 gap-1 rounded-lg border border-white/10 bg-black/40 p-1 backdrop-blur-md sm:grid-cols-4"
      >
        {CLIENTS.map((c, i) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={i === client}
            onClick={() => setClient(i)}
            className="relative min-h-[40px] min-w-0 flex-1 rounded-md px-2 font-mono text-[11px] text-[#A3AEBF] transition-colors hover:text-[#F5F7FA] focus-visible:outline-2 focus-visible:outline-[#F97316] sm:px-3 sm:text-[12px]"
          >
            {i === client && (
              <motion.span
                layoutId="hero-client-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-md border border-white/10 bg-[#131A26]"
              />
            )}
            <span className="relative z-10 block truncate text-center sm:text-left">
              {c.label}
            </span>
          </button>
        ))}
      </div>

      {/* Glass-obsidian CLI bar — same w-full max-w-3xl container.
          Command never wraps: nowrap + horizontal scroll inside; 11px on
          mobile so `--client all` always fits without clipping. */}
      <div className="w-full max-w-3xl mx-auto mt-3 flex min-w-0 items-center gap-3 rounded-lg border border-white/12 bg-black/60 px-4 py-3 backdrop-blur-md">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded font-mono text-[11px] leading-relaxed text-[#D7DEE9] sm:text-[13.5px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="text-[#FB923C]">$ </span>
          {active.cmd}
        </code>
        {/* The single solid-amber primary button on the page. */}
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
            {copied ? (
              <Check size={14} strokeWidth={2.5} />
            ) : (
              <Copy size={14} strokeWidth={2.5} />
            )}
            {copied ? 'Copied' : 'Copy'}
          </motion.span>
        </button>
      </div>

      {/* Clean secondary callout directly below the bar (not a button) */}
      <p className="mt-4 text-center font-mono text-[12px] text-[#8C95A6] sm:text-left">
        <a
          href="#deploy"
          className="text-[#A9C6FF] underline decoration-white/25 underline-offset-4 transition-colors hover:text-[#F5F7FA]"
        >
          Running a team? We set up your GPUs, vLLM, and agent plumbing in
          48 hours →
        </a>
      </p>
    </div>
  );
}

/* ── SSE Velocity & Concurrency Streamer ───────────────────────────────
 * A calm, visceral, SINGLE-view streaming instrument. Strictly fixed
 * height (h-[340px] inner stage) with zero layout shift: every dynamic
 * value is pre-laid-out text or canvas pixels, and mode switches
 * (n=4 ↔ n=1) only change what is drawn — never the box.
 *
 *   n=4 (default): 4 parallel lanes streaming simultaneously from one
 *                  shared warm KV prefix — ~65–70 tok/s per lane =
 *                  260 tok/s aggregate (the proven n=4 figure).
 *   n=1:           one expanded lane, 4 sequential SSE lines, 70.4 tok/s.
 *
 * All readouts are deterministic and never start at 0.
 */

const LANE_TOKENS_PER_S = 65; // per-lane stream rate; 4 lanes ⇒ 260 aggregate
const BATCH_TOKENS = 320; // tokens per slice batch before the completion pulse
const PAUSE_AFTER_MS = 700;
const N4_PROGRESS0 = 0.62; // deterministic staggered opening frame

const SLICES: Array<{ id: string; name: string; note: string }> = [
  {
    id: 'slice/01',
    name: 'auth-session-guard',
    note: 'Scanning 18 files & patching token rotation',
  },
  {
    id: 'slice/02',
    name: 'api-rate-limiter',
    note: 'Updating concurrency semaphore & retry window',
  },
  {
    id: 'slice/03',
    name: 'schema-migration',
    note: 'Verifying SQL invariants across 12 tables',
  },
  {
    id: 'slice/04',
    name: 'sandbox-verifier',
    note: 'Running 42 unit tests in zero-egress sandbox',
  },
];

const STREAMER_H = 340; // fixed inner stage height — no layout shift ever

interface StreamerLane {
  progress: number; // tokens emitted this batch
  doneMs: number; // >0 → completion pulse active (ms elapsed)
  pausedMs: number; // hold before cycling to the next batch
}

function newLane(progress: number): StreamerLane {
  return { progress, doneMs: 0, pausedMs: 0 };
}

function StreamerCanvas({
  mode,
  running,
  lanesRef,
}: {
  mode: 1 | 4;
  running: boolean;
  lanesRef: React.RefObject<StreamerLane[]>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    )?.matches ?? false;
    const dpr = Math.min(window.devicePixelRatio || 1, SURVEY_DPR_MAX);

    const state = { w: 0, h: 0, t: reduced ? 2.4 : 0 };

    const size = () => {
      const r = parent.getBoundingClientRect();
      state.w = Math.max(1, Math.round(r.width));
      state.h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(state.w * dpr);
      canvas.height = Math.round(state.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();

    /* ── draw helpers ─────────────────────────────────────── */

    const MONO_S = '10px "IBM Plex Mono", ui-monospace, monospace';

    const drawLane = (
      lane: StreamerLane,
      x: number,
      y: number,
      w: number,
      h: number,
      slice: (typeof SLICES)[number],
      subLine: number,
    ) => {
      const frac = Math.min(1, lane.progress / BATCH_TOKENS);
      const head = Math.floor(lane.progress);
      const pulse = lane.doneMs > 0 ? 1 - lane.doneMs / PAUSE_AFTER_MS : 0;

      // Row background
      ctx.fillStyle = 'rgba(11,15,23,0.55)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

      // Header line: live SSE data packet + lane id + token counter
      const delta = `${slice.name}#${head}`;
      ctx.font = MONO_S;
      ctx.fillStyle = '#3B82F6';
      ctx.fillText(`data: {"delta": "${delta}"}`, x + 10, y + 16);
      ctx.fillStyle = lane.doneMs > 0 ? '#FB923C' : '#8C95A6';
      ctx.fillText(
        `${slice.id} · ${slice.name}${mode === 1 ? ` · line ${subLine + 1}/4` : ''}`,
        x + 10,
        y + 30,
      );
      const counter = `${head} tok`;
      ctx.fillStyle = '#F5F7FA';
      const cw = ctx.measureText(counter).width;
      ctx.fillText(counter, x + w - cw - 10, y + 16);
      if (pulse > 0) {
        ctx.fillStyle = `rgba(249,115,22,${(0.55 * pulse).toFixed(3)})`;
        ctx.fillText('✓ done', x + w - ctx.measureText('✓ done').width - 10, y + 30);
      }

      // Token block row: illuminated blocks stream left→right at proportional
      // 60fps velocity, cobalt body, amber head, completion pulse wash.
      const bx = x + 10;
      const bw = w - 20;
      const by = y + h - 18;
      const BLOCK = 9;
      const GAP = 3;
      const total = Math.floor(bw / (BLOCK + GAP));
      const lit = Math.min(total, Math.round(frac * total));
      for (let i = 0; i < total; i++) {
        const bxx = bx + i * (BLOCK + GAP);
        if (i < lit) {
          const isHead = i === lit - 1 && pulse === 0;
          ctx.fillStyle = isHead
            ? 'rgba(249,115,22,0.95)'
            : pulse > 0
              ? `rgba(249,115,22,${(0.35 + 0.4 * pulse).toFixed(3)})`
              : 'rgba(59,130,246,0.55)';
          ctx.fillRect(bxx, by, BLOCK, 8);
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.07)';
          ctx.fillRect(bxx, by, BLOCK, 8);
        }
      }
      // Lane note (clipped)
      ctx.fillStyle = 'rgba(140,149,166,0.9)';
      ctx.font = MONO_S;
      const note = slice.note;
      const maxW = bw - 60;
      let n2 = note;
      while (n2.length > 4 && ctx.measureText(n2).width > maxW) {
        n2 = n2.slice(0, -2);
      }
      ctx.fillText(n2 + (n2 !== note ? '…' : ''), bx, by - 4);
    };

    const render = () => {
      ctx.clearRect(0, 0, state.w, state.h);
      const lanes = lanesRef.current;
      const pad = 8;
      const innerW = state.w - pad * 2;

      if (mode === 4) {
        const gap = 8;
        const laneH = (state.h - pad * 2 - gap * 3) / 4;
        for (let i = 0; i < 4; i++) {
          drawLane(
            lanes[i] ?? newLane(0),
            pad,
            pad + i * (laneH + gap),
            innerW,
            laneH,
            SLICES[i],
            i,
          );
        }
      } else {
        // n=1: one expanded stream — 4 sequential SSE lines in the same
        // fixed-height viewport. Earlier lines render as completed (dim,
        // amber-checked); the active line streams live.
        const total = lanes[0].progress;
        const activeLine = Math.min(3, Math.floor(total / BATCH_TOKENS));
        const gap = 8;
        const laneH = (state.h - pad * 2 - gap * 3) / 4;
        for (let i = 0; i < 4; i++) {
          const done = i < activeLine;
          const cur = i === activeLine;
          const lane = done
            ? newLane(BATCH_TOKENS)
            : cur
              ? lanes[0]
              : newLane(0);
          drawLane(
            lane,
            pad,
            pad + i * (laneH + gap),
            innerW,
            laneH,
            SLICES[i],
            i,
          );
          if (done) {
            ctx.fillStyle = 'rgba(5,7,11,0.55)';
            ctx.fillRect(pad, pad + i * (laneH + gap), innerW, laneH);
            ctx.font = MONO_S;
            ctx.fillStyle = 'rgba(249,115,22,0.8)';
            ctx.fillText(
              `✓ ${SLICES[i].id} · ${SLICES[i].name} — ${BATCH_TOKENS} tok delivered`,
              pad + 10,
              pad + i * (laneH + gap) + 18,
            );
          }
        }
      }
    };

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const lanes = lanesRef.current;
      for (let i = 0; i < lanes.length; i++) {
        const lane = lanes[i];
        if (mode === 1 && i > 0) continue; // only lane 0 advances in n=1
        if (lane.doneMs > 0) {
          lane.doneMs += dt * 1000;
          if (lane.doneMs >= PAUSE_AFTER_MS) {
            lane.doneMs = 0;
            lane.pausedMs = 220 + Math.sin(i * 1.7) * 120; // staggered recycle
          }
        } else if (lane.pausedMs > 0) {
          lane.pausedMs -= dt * 1000;
          if (lane.pausedMs <= 0) lane.progress = 0; // start next slice batch
        } else if (mode === 4) {
          lane.progress += LANE_TOKENS_PER_S * dt;
          if (lane.progress >= BATCH_TOKENS) {
            lane.progress = BATCH_TOKENS; // hold the full bar through the pulse
            lane.doneMs = 1;
          }
        } else {
          // n=1: four sequential lines, then the batch recycles.
          lane.progress += LANE_TOKENS_PER_S * dt;
          if (lane.progress >= BATCH_TOKENS * 4) lane.progress = 0;
        }
      }
      state.t += dt;
      render();
      raf = requestAnimationFrame(frame);
    };

    if (reduced) {
      // Static deterministic frame (never 0 — lanes mid-stream).
      render();
    } else {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(() => {
      size();
      if (reduced) render();
    });
    ro.observe(parent);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [mode, running, lanesRef]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

function SSEStreamer() {
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<1 | 4>(4);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);

  // Deterministic initial state — identical on SSR and first client render:
  // all lanes mid-stream (0.62 stagger), all readouts at their real values.
  const lanesRef = useRef<StreamerLane[]>([
    newLane(N4_PROGRESS0 * BATCH_TOKENS),
    newLane((N4_PROGRESS0 + 0.08) * BATCH_TOKENS),
    newLane((N4_PROGRESS0 + 0.16) * BATCH_TOKENS),
    newLane((N4_PROGRESS0 + 0.24) * BATCH_TOKENS),
  ]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setInView(e.isIntersecting);
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = inView && !paused && !(reduced ?? false);

  const aggregateTps =
    mode === 4 ? LEDGER_76DAY.concurrentN4DecodeTps : LEDGER_76DAY.sustainedDecodeTps;

  return (
    <div
      ref={stageRef}
      className="mx-auto mt-12 w-full min-w-0 max-w-5xl"
    >
      <div
        className="rounded-xl p-px"
        style={{
          background:
            'conic-gradient(from 0deg, #3B82F6, #0A0D14 25%, #F97316 50%, #0A0D14 75%, #3B82F6)',
          animation: reduced ? undefined : 'border-beam 7s linear infinite',
        }}
        role="figure"
        aria-label="Castor SSE streaming instrument: n=4 concurrent agent streams from one warm KV prefix at 260 tokens per second aggregate"
      >
        <div className="flex flex-col overflow-hidden rounded-[11px] bg-[#0A0D14]">
          {/* ── Top instrument bar ─────────────────────────────────── */}
          <div className="flex min-h-[64px] flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/10 px-4 py-3 sm:px-5">
            {/* Pinned shared prefix */}
            <p className="font-mono text-[10.5px] tracking-[0.05em] text-[#8C95A6] sm:text-[11px]">
              <span className="text-[#FB923C]">VRAM PREFIX:</span>{' '}
              148.4K TOKENS · 93.8% WARM KV HIT
            </p>

            {/* 2-mode concurrency toggle + pause/resume */}
            <div className="ml-auto flex items-center gap-1.5">
              <div
                role="group"
                aria-label="Concurrency mode"
                className="flex rounded-lg border border-white/10 bg-black/40 p-0.5"
              >
                <button
                  type="button"
                  aria-pressed={mode === 4}
                  onClick={() => setMode(4)}
                  className={`rounded-md px-2.5 py-2 font-mono text-[10.5px] transition-colors sm:px-3 ${
                    mode === 4
                      ? 'bg-[#131A26] text-[#F5F7FA]'
                      : 'text-[#8C95A6] hover:text-[#F5F7FA]'
                  }`}
                >
                  n=4 Parallel · 260 tok/s
                </button>
                <button
                  type="button"
                  aria-pressed={mode === 1}
                  onClick={() => setMode(1)}
                  className={`rounded-md px-2.5 py-2 font-mono text-[10.5px] transition-colors sm:px-3 ${
                    mode === 1
                      ? 'bg-[#131A26] text-[#F5F7FA]'
                      : 'text-[#8C95A6] hover:text-[#F5F7FA]'
                  }`}
                >
                  n=1 Single · 70.4 tok/s
                </button>
              </div>
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? 'Resume the stream' : 'Pause the stream'}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black/40 text-[#D7DEE9] transition-colors hover:border-white/25"
              >
                {paused ? (
                  <Play size={14} strokeWidth={2.25} />
                ) : (
                  <Pause size={14} strokeWidth={2.25} />
                )}
              </button>
            </div>

            {/* Wing indicator badge */}
            <span className="w-full rounded-full border border-[#3B82F6]/40 bg-[#3B82F6]/10 px-3 py-1 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-[#7FA6FF] sm:ml-2 sm:w-auto sm:text-center">
              {mode === 4
                ? 'Wing 01: Hybrid Cloud+Local'
                : 'Wing 02: 100% Local (0 B Egress)'}
            </span>
          </div>

          {/* ── Center streaming viewport: strictly fixed height ───── */}
          <div className="relative shrink-0" style={{ height: STREAMER_H }}>
            <StreamerCanvas mode={mode} running={running} lanesRef={lanesRef} />
          </div>

          {/* ── Bottom telemetry & cloud-arbitrage comparison bar ────
              Four rock-solid live readouts — deterministic values,
              never starting at 0. */}
          <div className="grid grid-cols-2 gap-px border-t border-white/10 bg-white/5 lg:grid-cols-4">
            <NumberFlowGroup>
              <div className="bg-[#0A0D14] px-4 py-3 sm:px-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#5D6B80]">
                  Cached Prefill
                </p>
                <SafeNumberFlow
                  value={LEDGER_76DAY.peakCachedPrefillTps}
                  format={{ useGrouping: true }}
                  className="mt-0.5 font-mono text-[14px] font-semibold text-[#F5F7FA] sm:text-[15px]"
                />
                <span className="ml-1 font-mono text-[10.5px] text-[#5D6B80]">
                  tok/s
                </span>
              </div>
              <div className="bg-[#0A0D14] px-4 py-3 sm:px-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#5D6B80]">
                  Decode Throughput
                </p>
                <SafeNumberFlow
                  value={aggregateTps}
                  format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                  className="mt-0.5 font-mono text-[14px] font-semibold text-[#F5F7FA] sm:text-[15px]"
                />
                <span className="ml-1 font-mono text-[10.5px] text-[#5D6B80]">
                  tok/s ({mode === 4 ? 'n=4 aggregate' : 'n=1 stream'})
                </span>
              </div>
              <div className="bg-[#0A0D14] px-4 py-3 sm:px-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#5D6B80]">
                  Warm KV Reuse
                </p>
                <SafeNumberFlow
                  value={LEDGER_76DAY.cacheHitPct}
                  suffix="%"
                  format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                  className="mt-0.5 font-mono text-[14px] font-semibold text-[#F5F7FA] sm:text-[15px]"
                />
                <span className="ml-1 font-mono text-[10.5px] text-[#5D6B80]">
                  across 2.77B tokens
                </span>
              </div>
              <div className="bg-[#0A0D14] px-4 py-3 sm:px-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#5D6B80]">
                  Task Cost
                </p>
                <span className="mt-0.5 font-mono text-[14px] font-semibold text-[#FB923C] sm:text-[15px]">
                  $0.0000 local
                </span>
                <span className="ml-2 font-mono text-[10.5px] text-[#5D6B80]">
                  <span className="line-through whitespace-nowrap decoration-[#FB923C]/60">
                    $1.42 cloud API
                  </span>
                </span>
              </div>
            </NumberFlowGroup>
          </div>

          {/* ── Hardware footer strip ──────────────────────────────── */}
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
              78-Day RTX 3090 Benchmarks →
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

export default function HeroCinema() {
  const spotlight = useSpotlight();

  return (
    <section
      id="hero"
      className="dark-surface relative -mt-14 min-h-screen w-full min-w-0 max-w-full overflow-x-clip bg-[#05070B] pb-14 pt-10 sm:pt-14"
      onMouseMove={spotlight.onMouseMove}
    >
      {/* Static CSS mesh fallback — always painted (visible before the
          canvas hydrates, and in SSR): a dark cobalt+amber radial mesh. */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(90rem 44rem at 18% 12%, rgba(29,78,216,0.32), transparent 62%), radial-gradient(70rem 38rem at 82% 30%, rgba(234,88,12,0.17), transparent 64%), radial-gradient(52rem 32rem at 50% 92%, rgba(15,37,87,0.5), transparent 70%)',
        }}
      />

      {/* Deterministic HTML5 canvas topology wave survey (client-mounted) */}
      <TopologySurveyCanvas />

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
        <div className="mx-auto max-w-5xl text-center">
          <h1
            className="font-display text-[clamp(2.15rem,4.25vw,3.9rem)] font-bold leading-[1.02] tracking-[-0.038em] text-[#F5F7FA]"
          >
            {'Keep your frontier model. '}
            <span className="block text-[#FB923C]">
              Put your local GPU to work.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] text-[#A3AEBF] sm:text-lg">
            Two ways to run your coding agents. Pair Claude Code, Cursor, or
            Gemini with your own GPU and cut your token bill by over 90% —
            or run 100% local and private with zero cloud egress. And for
            teams, we handle the turnkey GPU setup, vLLM tuning, and custom
            agent plumbing.
          </p>
        </div>

        <InstallerBar />

        <SSEStreamer />
      </div>
    </section>
  );
}
