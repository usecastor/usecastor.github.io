// @client
/**
 * ACT 1 — HeroCinema.
 * Full-bleed #05070B dark-silicon stage: a completely STATIC background
 * (subtle CSS grid + radial vignette — nothing spins, sweeps, or animates
 * behind the instrument), a fixed-height DOM-based LLM streaming window
 * that renders real words / tokens / lines / paragraphs / tool calls
 * token-by-token from top to bottom with a live amber cursor `▋`
 * (n=4 · 2×2 split-terminal grid at 260 tok/s aggregate, or n=1 single
 * stream at 70.4 tok/s — 360px stage), and the liquid client installer
 * with the page's single solid-amber primary button.
 *
 * Zero scroll hijacking, zero stuck opacity — the hero paints at full
 * visibility from the first frame, and every initial value is
 * deterministic (identical SSR and first-client render, no #418).
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'motion/react';
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
      <div className="mx-auto mt-3 flex min-w-0 w-full max-w-3xl items-center gap-3 rounded-lg border border-white/12 bg-black/60 px-4 py-3 backdrop-blur-md">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded font-mono text-[11px] leading-relaxed text-[#D7DEE9] [scrollbar-width:none] sm:text-[13.5px] [&::-webkit-scrollbar]:hidden">
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

/* ── Reduced-motion hook (hydration-safe) ──────────────────────────────
 * Initializes to `false` (identical to SSR) and only reads/subscribes to
 * `window.matchMedia('(prefers-reduced-motion: reduce)')` inside
 * `useEffect` — so the first client hydration pass can never diverge
 * from the server render (no React #418).
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/* ── Authentic LLM token-by-token streamer ─────────────────────────────
 * A fixed-height DOM "terminal" that streams REAL readable words,
 * tokens, lines, paragraphs, and tool calls token-by-token / line-by-line
 * from top to bottom with a live amber cursor `▋` at the writing head —
 * exactly like Claude Code / Cursor / ChatGPT streaming a response.
 *
 *   n=1: one expanded stream · 70.4 tok/s · 284 tokens per turn.
 *   n=4: 2×2 split-terminal grid · 4 concurrent workers · ~65 tok/s each
 *        · 260 tok/s aggregate from the shared session KV cache.
 *
 * Only lines whose words have been revealed render (360px stage on
 * desktop, 480px on mobile), so the pane scrolls through real content.
 * Under `prefers-reduced-motion` the full output is rendered statically
 * with no loop.
 */

type LineKind =
  | 'prompt'
  | 'tool'
  | 'para'
  | 'code'
  | 'diff'
  | 'test'
  | 'close';

interface StreamLine {
  kind: LineKind;
  text: string;
}

interface PaneSpec {
  worker: string;
  file: string;
  rate: number; // tok/s shown in the pane header
  totalTokens: number; // counter lands exactly here when the pane completes
  startOffsetS: number; // deterministic stagger between the 4 workers
  lines: StreamLine[];
}

const N1_TOTAL = 284; // single-stream turn length (0 → 284 tokens)
const N1_RATE = LEDGER_76DAY.sustainedDecodeTps; // 70.4 tok/s
const N4_RATE = LEDGER_76DAY.concurrentN4DecodeTps; // 260 tok/s aggregate
const WORD_INTERVAL_S = 0.18; // ~11 words/sec writing cadence (readable)
const PAUSE_AFTER_S = 2.2; // hold the finished output so it can be read

const N1_LINES: StreamLine[] = [
  { kind: 'prompt', text: '> Fix token refresh race condition in src/auth/refresh.rs and run auth test suite' },
  { kind: 'tool', text: '● read_file src/auth/refresh.rs (412 lines · 93.8% session KV cache hit · 0ms)' },
  { kind: 'para', text: 'Concurrent refresh calls race on rotation_lock when two client requests arrive within the same 30-second grace window. Adding an idempotency check before minting a new token pair:' },
  { kind: 'code', text: 'pub async fn rotate_refresh_token(&self, token_id: Uuid) -> Result<TokenPair, AuthError> {' },
  { kind: 'code', text: 'let guard = self.rotation_lock.lock().await;' },
  { kind: 'diff', text: 'if guard.rotated_within(Duration::from_secs(30)) {' },
  { kind: 'diff', text: 'return Ok(guard.cached_pair().clone());' },
  { kind: 'diff', text: '}' },
  { kind: 'code', text: 'self.mint_and_persist_pair(token_id).await' },
  { kind: 'code', text: '}' },
  { kind: 'test', text: '● bash cargo test --package auth — 14 passed in 0.41s (exit 0)' },
  { kind: 'close', text: 'Done. All 14 auth tests pass with zero network egress and $0.0000 token cost.' },
];

const N4_PANES: PaneSpec[] = [
  {
    worker: 'worker-01',
    file: 'src/auth/refresh.rs',
    rate: 66.2,
    totalTokens: 58,
    startOffsetS: 0,
    lines: [
      { kind: 'para', text: 'Two clients hit rotate within one 30s grace window and raced on rotation_lock.' },
      { kind: 'para', text: 'Adding an idempotency guard before minting a fresh token pair:' },
      { kind: 'diff', text: 'if guard.rotated_within(Duration::from_secs(30)) {' },
      { kind: 'diff', text: 'return Ok(guard.cached_pair().clone());' },
      { kind: 'diff', text: '}' },
      { kind: 'test', text: '✓ cargo test auth (14 passed)' },
    ],
  },
  {
    worker: 'worker-02',
    file: 'src/api/rate_limit.rs',
    rate: 64.8,
    totalTokens: 56,
    startOffsetS: 0.12,
    lines: [
      { kind: 'para', text: 'A 100 rps burst drained the whole budget in a single tick.' },
      { kind: 'para', text: 'Replacing the fixed refill with a sliding-window token bucket:' },
      { kind: 'diff', text: 'let now = Instant::now();' },
      { kind: 'diff', text: 'self.window.retain(|t| now.duration_since(*t) < WINDOW);' },
      { kind: 'diff', text: 'let free = self.capacity.saturating_sub(self.window.len());' },
      { kind: 'test', text: '✓ cargo test rate_limit (9 passed)' },
    ],
  },
  {
    worker: 'worker-03',
    file: 'src/db/pool.rs',
    rate: 65.1,
    totalTokens: 54,
    startOffsetS: 0.24,
    lines: [
      { kind: 'para', text: 'Idle connections held VRAM for 12 minutes past their TTL.' },
      { kind: 'para', text: 'Adding a hard idle-timeout guard before reuse:' },
      { kind: 'diff', text: 'if conn.idle_for() > IDLE_TTL {' },
      { kind: 'diff', text: 'self.drain(conn.id).await?;' },
      { kind: 'diff', text: 'continue;' },
      { kind: 'test', text: '✓ cargo test db_pool (11 passed)' },
    ],
  },
  {
    worker: 'worker-04',
    file: 'src/sandbox/policy.rs',
    rate: 63.9,
    totalTokens: 52,
    startOffsetS: 0.36,
    lines: [
      { kind: 'para', text: 'The egress audit found raw socket() calls bypassing the proxy.' },
      { kind: 'para', text: 'Tightening the zero-egress rule to deny outbound connects:' },
      { kind: 'diff', text: 'Rule::deny("socket",' },
      { kind: 'diff', text: 'SocketFlags::CONNECT | SocketFlags::SEND,' },
      { kind: 'diff', text: '),' },
      { kind: 'test', text: '✓ cargo test sandbox (22 passed)' },
    ],
  },
];

interface ComputedLine {
  kind: LineKind;
  words: string[];
  startWord: number; // cumulative word offset where this line begins
}

interface ComputedPane {
  worker: string;
  file: string;
  rate: number;
  totalTokens: number;
  startOffsetS: number;
  lines: ComputedLine[];
  totalWords: number;
}

function buildPane(p: PaneSpec): ComputedPane {
  let acc = 0;
  const lines: ComputedLine[] = p.lines.map((l) => {
    const words = l.text.split(/\s+/).filter(Boolean);
    const line: ComputedLine = { kind: l.kind, words, startWord: acc };
    acc += words.length;
    return line;
  });
  return {
    worker: p.worker,
    file: p.file,
    rate: p.rate,
    totalTokens: p.totalTokens,
    startOffsetS: p.startOffsetS,
    lines,
    totalWords: acc,
  };
}

const SINGLE_PANE: ComputedPane = buildPane({
  worker: 'worker-01',
  file: 'src/auth/refresh.rs',
  rate: N1_RATE,
  totalTokens: N1_TOTAL,
  startOffsetS: 0,
  lines: N1_LINES,
});

const QUAD_PANES: ComputedPane[] = N4_PANES.map(buildPane);

function lineTextClass(kind: LineKind): string {
  switch (kind) {
    case 'prompt':
      return 'text-[#FB923C]';
    case 'tool':
      return 'text-[#8C95A6]';
    case 'test':
      return 'text-[#4ADE80]';
    case 'close':
      return 'text-[#A3AEBF]';
    case 'code':
    case 'diff':
      return 'text-[#D7DEE9]';
    default:
      return 'text-[#D7DEE9]';
  }
}

function LineView({
  line,
  visibleWords,
  cursorOn,
}: {
  line: ComputedLine;
  visibleWords: number;
  cursorOn: boolean;
}) {
  const isDiff = line.kind === 'diff';
  const isTool = line.kind === 'tool';
  const isTest = line.kind === 'test';

  let cls = 'break-words font-mono leading-[1.55] ' + lineTextClass(line.kind);
  if (isDiff) cls = cls + ' bg-[#16281D] pl-[1.15em] text-[#7EDFA0]';
  if (isTool) cls = cls + ' pl-[0.85em]';
  if (isTest) cls = cls + ' pl-[0.85em]';

  const shown = line.words.slice(0, visibleWords).join(' ');

  return (
    <div className={cls}>
      {isDiff && <span className="shrink-0">+ </span>}
      {isTool && <span className="shrink-0 text-[#7FA6FF]">● </span>}
      <span>{shown}</span>
      {cursorOn && (
        <span
          aria-hidden="true"
          className="ml-[1px] inline-block h-[1.05em] w-[0.55ch] animate-[cursor-blink_1.05s_step-end_infinite] bg-[#F97316] align-baseline translate-y-[0.14em]"
        >
          ▋
        </span>
      )}
    </div>
  );
}

function Pane({
  pane,
  tokenF,
  running,
  wide,
}: {
  pane: ComputedPane;
  tokenF: number; // float tokens written (0..totalTokens)
  running: boolean;
  wide: boolean; // n=1 expanded stream
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const done = tokenF >= pane.totalTokens;

  // Direct cumulative word math: map the float token position onto a float
  // word position, then onto a per-line visible-word count. No early-exit
  // line loop, so every line eventually renders as its words are revealed.
  const revealedWords = Math.max(
    1,
    Math.min(pane.totalWords, Math.floor((tokenF / Math.max(1, pane.totalTokens)) * pane.totalWords)),
  );

  const cursorLine = done
    ? pane.lines.length - 1
    : Math.max(
        0,
        ...pane.lines.map((L, li) =>
          Math.max(0, Math.min(L.words.length, revealedWords - L.startWord)) > 0 ? li : -1,
        ),
      );

  const cursorOn = running && !done;

  // Auto-scroll the pane body to the newest line as it grows.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [revealedWords]);

  const counter = Math.min(pane.totalTokens, Math.floor(tokenF));
  const paneMargin = wide ? 'm-1.5 rounded-lg' : 'm-[1.5px]';

  return (
    <div
      className={`absolute inset-0 flex min-h-0 flex-col overflow-hidden border border-white/10 bg-[#070B12] ${paneMargin}`}
    >
      {/* Pane header (sticky) */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-2.5 py-1.5">
        <p className="min-w-0 truncate font-mono text-[9.5px] leading-tight sm:text-[10px]">
          <span className="text-[#F97316]">{pane.worker}</span>
          <span className="text-[#5D6B80]"> · </span>
          <span className="text-[#A3AEBF]">{pane.file}</span>
        </p>
        <p className="shrink-0 font-mono text-[9.5px] tabular-nums sm:text-[10px]">
          <span className="text-[#F5F7FA]">{counter}</span>
          <span className="text-[#5D6B80]"> tok · </span>
          <span className="text-[#7FA6FF]">{pane.rate.toFixed(1)} tok/s</span>
        </p>
      </div>

      {/* Pane body: real words / lines / code stream top→bottom here.
          Only lines with at least one revealed word render — no invisible
          placeholder rows that would break mobile auto-scroll. */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-[3px] overflow-y-auto px-2.5 py-2 text-[10.5px] [scrollbar-width:none] sm:text-[11px] [&::-webkit-scrollbar]:hidden"
      >
        {pane.lines.map((L, li) => {
          const visibleWordsInLine = Math.max(
            0,
            Math.min(L.words.length, revealedWords - L.startWord),
          );
          if (visibleWordsInLine <= 0) return null;
          return (
            <LineView
              key={li}
              line={L}
              visibleWords={visibleWordsInLine}
              cursorOn={cursorOn && li === cursorLine}
            />
          );
        })}
      </div>
    </div>
  );
}

function SSEStreamer() {
  const reduced = usePrefersReducedMotion();
  const [mode, setMode] = useState<1 | 4>(4);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);

  // One shared stream clock for every pane (staggered per-pane offsets).
  const [, setTick] = useState(0); // rAF-driven render trigger
  const clockRef = useRef(0); // seconds since the current turn started

  // Reduced motion: render the full output statically (deterministic).
  const panes = mode === 1 ? [SINGLE_PANE] : QUAD_PANES;

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

  const running = inView && !paused && !reduced;

  // Deterministic per-mode start clock so SSR & first paint agree (0).
  useEffect(() => {
    clockRef.current = 0;
    setTick((t) => t + 1);
  }, [mode, running, reduced]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      clockRef.current += dt;
      setTick((t) => (t + 1) % 1_000_000);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  // Compute per-pane float token position from the shared clock.
  const clock = reduced ? Infinity : clockRef.current;
  const maxTurnWords =
    mode === 1
      ? SINGLE_PANE.totalWords
      : Math.max(
          ...QUAD_PANES.map((p) => p.totalWords + p.startOffsetS / WORD_INTERVAL_S),
        );
  const turnDoneS = maxTurnWords * WORD_INTERVAL_S + PAUSE_AFTER_S;

  // Wrap the turn after it has completed + held for the read pause.
  const effectiveClock = reduced ? Infinity : clock % turnDoneS;

  const tokenFor = (p: ComputedPane): number => {
    if (reduced) return p.totalTokens;
    const local = effectiveClock - p.startOffsetS;
    if (local <= 0) return 0;
    const words = local / WORD_INTERVAL_S; // float words written
    const f = (words / p.totalWords) * p.totalTokens;
    return Math.max(0, Math.min(p.totalTokens, f));
  };

  const aggregateTokens = panes.reduce((a, p) => a + tokenFor(p), 0);
  const aggregateRate = mode === 4 ? N4_RATE : N1_RATE;

  return (
    <div ref={stageRef} className="mx-auto mt-12 w-full min-w-0 max-w-5xl">
      <div
        role="figure"
        aria-label="Castor LLM streaming window: n=4 concurrent agent streams from the session KV cache at 260 tokens per second aggregate, or n=1 single stream at 70.4 tokens per second"
        className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#0A0D14]"
      >
        <div className="flex flex-col">
          {/* ── Top instrument bar — single crisp horizontal row ─────── */}
          <div className="flex min-h-[64px] items-center gap-x-4 border-b border-white/10 px-4 py-3 sm:px-5">
            {/* Session KV cache readout */}
            <p className="min-w-0 shrink truncate font-mono text-[10.5px] tracking-[0.05em] text-[#8C95A6] sm:text-[11px]">
              <span className="text-[#FB923C]">SESSION KV CACHE</span>{' '}
              · 93.8% HIT · RTX 3090 (W4A16)
            </p>

            {/* 2-mode concurrency toggle + pause/resume */}
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
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
          </div>

          {/* ── Center streaming window: 480px tall on mobile (4 stacked
              rows), strictly fixed 360px stage from sm up ── */}
          <div className="relative h-[480px] w-full shrink-0 sm:h-[360px]">
            {mode === 4 ? (
              <div className="grid h-full w-full grid-cols-1 grid-rows-4 gap-px bg-white/10 sm:grid-cols-2 sm:grid-rows-2">
                {QUAD_PANES.map((p) => (
                  <div key={p.worker} className="relative min-h-0" aria-hidden="true">
                    <Pane pane={p} tokenF={tokenFor(p)} running={running} wide={false} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full w-full">
                <Pane
                  pane={SINGLE_PANE}
                  tokenF={tokenFor(SINGLE_PANE)}
                  running={running}
                  wide
                />
              </div>
            )}
          </div>

          {/* ── Bottom telemetry & cloud-arbitrage comparison bar ────
              Four rock-solid live readouts — deterministic values,
              never starting at 0. */}
          <div className="grid grid-cols-2 gap-px border-t border-white/10 bg-white/5 lg:grid-cols-4">
            <NumberFlowGroup>
              <div className="bg-[#0A0D14] px-4 py-3 sm:px-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#5D6B80]">
                  Live Output
                </p>
                <span className="mt-0.5 font-mono text-[14px] font-semibold tabular-nums text-[#F5F7FA] sm:text-[15px]">
                  {Math.round(aggregateTokens)}
                </span>
                <span className="ml-1 font-mono text-[10.5px] text-[#5D6B80]">
                  tokens · {aggregateRate.toFixed(1)} tok/s
                </span>
              </div>
              <div className="bg-[#0A0D14] px-4 py-3 sm:px-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#5D6B80]">
                  Decode (n=4 / n=1)
                </p>
                <SafeNumberFlow
                  value={aggregateRate}
                  format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                  className="mt-0.5 font-mono text-[14px] font-semibold text-[#F5F7FA] sm:text-[15px]"
                />
                <span className="ml-1 font-mono text-[10.5px] text-[#5D6B80]">
                  tok/s
                </span>
              </div>
              <div className="bg-[#0A0D14] px-4 py-3 sm:px-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#5D6B80]">
                  Session KV Hit
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
                  Local GPU Cost
                </p>
                <span className="mt-0.5 font-mono text-[14px] font-semibold text-[#FB923C] sm:text-[15px]">
                  $0.0000
                </span>
                <span className="ml-2 font-mono text-[10.5px] text-[#5D6B80]">
                  <span className="whitespace-nowrap line-through decoration-[#FB923C]/60">
                    $1.42 cloud
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
      className="dark-surface relative -mt-14 min-h-screen w-full min-w-0 max-w-full overflow-x-clip bg-[#05070B] pb-14 pt-16 sm:pt-14"
      onMouseMove={spotlight.onMouseMove}
    >
      {/* Completely STATIC background — a subtle CSS grid + a radial
          vignette. Nothing behind the instrument spins, sweeps, or
          animates, so the streaming window stays the sole focal point. */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(90rem 44rem at 18% 12%, rgba(29,78,216,0.30), transparent 62%), radial-gradient(70rem 38rem at 82% 30%, rgba(234,88,12,0.15), transparent 64%), radial-gradient(52rem 32rem at 50% 92%, rgba(15,37,87,0.5), transparent 70%), linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: 'auto, auto, auto, 44px 44px, 44px 44px',
        }}
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
            className="font-display text-[clamp(1.85rem,4.25vw,3.85rem)] font-bold leading-[1.02] tracking-[-0.038em] text-[#F5F7FA]"
          >
            {'Keep your frontier model. '}
            <span className="block text-[#FB923C]">
              Put your local GPU to work.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[#A3AEBF] sm:text-lg">
            Pair Claude Code, Cursor, or Gemini with your own GPU — or run
            100% local and air-gapped. Open-source engine, plus turnkey GPU
            &amp; vLLM setup for teams.
          </p>
        </div>

        <InstallerBar />

        <SSEStreamer />
      </div>
    </section>
  );
}
