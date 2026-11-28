// @client
/**
 * ACT 1 — HeroCinema.
 * Full-bleed #05070B dark-silicon stage: a completely STATIC background
 * (subtle CSS grid + radial vignette), a fixed-height DOM-based LLM
 * streaming window that emits real tokens / sub-word chunks / lines / tool
 * calls at authentic high-speed LLM cadence with a live amber cursor `▋` at
 * the writing head —
 *   n=4 · 2×2 split-terminal grid · ~65 tok/s per pane · 260 tok/s aggregate
 *   n=1 · single expanded stream · 70.4 tok/s
 * — rolling infinitely through 3 distinct polyglot engineering tasks per
 * pane (TypeScript/Next.js · Python/FastAPI · PostgreSQL/Prisma · Go/infra),
 * plus the liquid client installer with the page's single solid-amber
 * primary button.
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
 * overflow-x-auto` — switching to the Source tab (the longest command)
 * scrolls horizontally instead of wrapping to a second line, and the
 * page height never shifts.
 */

const CLIENTS: Array<{ id: string; label: string; cmd: string }> = [
  { id: 'all', label: 'All Clients', cmd: 'npx -y mcp-castor install --client all' },
  { id: 'claude', label: 'Claude Code', cmd: 'npx -y mcp-castor install --client claude' },
  {
    id: 'antigravity',
    label: 'Antigravity',
    cmd: 'npx -y mcp-castor install --client antigravity',
  },
  {
    id: 'source',
    label: 'Source (Cargo)',
    cmd: 'cargo build --release --no-default-features --features mcp,ast',
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

/* ── Authentic LLM token-by-token streamer ─────────────────────────────
 * A fixed-height DOM "terminal" that emits REAL sub-word token chunks,
 * lines, code, and tool calls at authentic high-speed LLM cadence —
 * ~65 tok/s per pane (260 tok/s aggregate) in n=4 mode, 70.4 tok/s in n=1
 * mode — driven by `requestAnimationFrame`, with a live amber cursor `▋` at
 * the writing head and a live ticking token counter.
 *
 * Each pane holds a rotating queue of 3 distinct polyglot engineering tasks
 * (Batches A/B/C) that stream continuously one after another in a rolling
 * window (the most recent ~18 lines stay mounted). When a task finishes
 * (`✓ tests passed`), a brief `---` separator line appears and the next
 * task's prompt immediately starts streaming from the bottom — infinite,
 * with zero dead pauses and zero jarring resets. The stream always starts
 * live (auto-streaming on initial page load); the user's Pause / Stream
 * button is the single manual control.
 */

type LineKind =
  | 'prompt'
  | 'tool'
  | 'para'
  | 'code'
  | 'diff'
  | 'test'
  | 'close'
  | 'sep';

interface StreamLine {
  kind: LineKind;
  text: string;
}

/** A source word split into 3–6-char LLM token chunks (short words stay whole). */
interface WordToken {
  parts: string[];
}

interface TokLine {
  kind: LineKind;
  words: WordToken[];
  tokens: number; // total token chunks in this line
}

interface StreamTask {
  file: string;
  lines: TokLine[];
  totalTokens: number;
}

interface PaneSpec {
  worker: string;
  rate: number; // tok/s (also shown in the pane header)
  startOffsetS: number; // deterministic stagger between concurrent workers
  tasks: StreamTask[]; // rotating queue (3 per pane)
}

/* Mutable per-pane stream cursor. Lives in a ref (never in React state)
   so the rAF loop can mutate it at 60fps without re-render churn; a single
   `setTick` drives the (cheap) re-render each frame. */
interface PaneState {
  taskIdx: number;
  lineIdx: number;
  tokenInLine: number; // float token offset within the active line
  lifetime: number; // total tokens emitted (monotonic — never resets)
  delay: number; // seconds of stagger before this pane starts
  buffer: Array<{ kind: LineKind; text: string }>; // recent completed lines
  makeInitial: () => PaneState; // pure per-pane factory (used to guard reads)
}

const N1_RATE = LEDGER_76DAY.sustainedDecodeTps; // 70.4 tok/s
const N4_RATE = LEDGER_76DAY.concurrentN4DecodeTps; // 260 tok/s aggregate
const MAX_DISPLAY = 18; // most recent lines kept mounted in each pane
const BUFFER_CAP = 24; // rolling buffer size before trimming

/* ── Tokenizer: split a line into authentic ~4-char token chunks ─────── */

function tokenizeLine(kind: LineKind, text: string): TokLine {
  const words = text.split(/\s+/).filter(Boolean);
  const tokens: WordToken[] = words.map((w) => {
    if (w.length <= 12) return { parts: [w] };
    const parts: string[] = [];
    for (let i = 0; i < w.length; i += 6) parts.push(w.slice(i, i + 6));
    return { parts };
  });
  return {
    kind,
    words: tokens,
    tokens: tokens.reduce((a, t) => a + t.parts.length, 0),
  };
}

/** Render a line with `n` tokens revealed (partial writes at the head). */
function renderPartial(line: TokLine, n: number): string {
  if (n <= 0) return '';
  let rem = Math.min(n, line.tokens);
  const out: string[] = [];
  for (const w of line.words) {
    const take = Math.min(w.parts.length, rem);
    if (take <= 0) break;
    out.push(w.parts.slice(0, take).join(''));
    rem -= take;
    if (rem <= 0) break;
  }
  return out.join(' ');
}

function buildTask(file: string, lines: StreamLine[]): StreamTask {
  const tl = lines.map((l) => tokenizeLine(l.kind, l.text));
  return {
    file,
    lines: tl,
    totalTokens: tl.reduce((a, l) => a + l.tokens, 0),
  };
}

/* ── Polyglot engineering workloads ─────────────────────────────────────
   Three rotating tasks per pane so each worker cycles endlessly through
   diverse stacks. Every task: prompt → read_file → one-sentence diagnosis
   → green `+` diff lines → green `✓` test pass. */

/* Batch A/B/C · worker-01 — TypeScript / Next.js */
const TS_TASKS: StreamTask[] = [
  buildTask('apps/web/auth/session.ts', [
    { kind: 'prompt', text: '> Fix the token refresh race in session.ts and run the auth suite' },
    { kind: 'tool', text: 'read_file apps/web/auth/session.ts (212 lines)' },
    { kind: 'para', text: 'Two concurrent refreshes rotate the same session twice inside the grace window.' },
    { kind: 'diff', text: 'if (await rotatedWithin(session, 30_000)) {' },
    { kind: 'diff', text: '  return cachedPair(session);' },
    { kind: 'diff', text: '}' },
    { kind: 'test', text: '✓ npx vitest run apps/web/auth/session.test.ts — 14 passed in 0.41s (exit 0)' },
  ]),
  buildTask('components/CheckoutForm.tsx', [
    { kind: 'prompt', text: '> Validate the checkout form card fields fully offline' },
    { kind: 'tool', text: 'read_file components/CheckoutForm.tsx (188 lines)' },
    { kind: 'para', text: 'Card number and expiry are checked client-side before any network egress.' },
    { kind: 'diff', text: 'const luhn = (n: string) => n.replace(/\\D/g, "").split("").reverse()' },
    { kind: 'diff', text: '  .reduce((s, d, i) => s + (i % 2 ? Math.min(9, +d * 2) : +d), 0) % 10 === 0;' },
    { kind: 'diff', text: 'if (!luhn(card.number)) return setError("card");' },
    { kind: 'test', text: '✓ npx vitest run components/CheckoutForm.test.tsx — 8 passed in 0.33s (exit 0)' },
  ]),
  buildTask('lib/webhook.ts', [
    { kind: 'prompt', text: '> Verify the HMAC on inbound webhooks before processing' },
    { kind: 'tool', text: 'read_file lib/webhook.ts (96 lines)' },
    { kind: 'para', text: 'The signature is compared with a constant-time check before the payload is parsed.' },
    { kind: 'diff', text: 'import { timingSafeEqual } from "crypto";' },
    { kind: 'diff', text: 'const ok = timingSafeEqual(Buffer.from(sig), Buffer.from(expected));' },
    { kind: 'diff', text: 'if (!ok) return 401;' },
    { kind: 'test', text: '✓ npx vitest run lib/webhook.test.ts — 11 passed in 0.29s (exit 0)' },
  ]),
];

/* Batch A/B/C · worker-02 — Python / FastAPI */
const PY_TASKS: StreamTask[] = [
  buildTask('api/rate_limit.py', [
    { kind: 'prompt', text: '> Replace the fixed token refill with a sliding-window bucket' },
    { kind: 'tool', text: 'read_file api/rate_limit.py (141 lines)' },
    { kind: 'para', text: 'A 100 rps burst drained the whole budget in one tick; a sliding window fixes it.' },
    { kind: 'diff', text: 'now = monotonic()' },
    { kind: 'diff', text: 'self.window = [t for t in self.window if now - t < WINDOW]' },
    { kind: 'diff', text: 'free = self.capacity - len(self.window)' },
    { kind: 'test', text: '✓ pytest tests/test_rate_limit.py — 9 passed in 0.38s' },
  ]),
  buildTask('services/billing_sync.py', [
    { kind: 'prompt', text: '> Sync invoices idempotently so replayed events never double-charge' },
    { kind: 'tool', text: 'read_file services/billing_sync.py (203 lines)' },
    { kind: 'para', text: 'Each invoice carries an idempotency key that is checked before the ledger insert.' },
    { kind: 'diff', text: 'if ledger.has(invoice.idempotency_key):' },
    { kind: 'diff', text: '    return invoice' },
    { kind: 'diff', text: 'ledger.insert(invoice)' },
    { kind: 'test', text: '✓ pytest tests/test_billing_sync.py — 12 passed in 0.52s' },
  ]),
  buildTask('jobs/ingest_queue.py', [
    { kind: 'prompt', text: '> Dedupe queued ingestion jobs by payload hash' },
    { kind: 'tool', text: 'read_file jobs/ingest_queue.py (117 lines)' },
    { kind: 'para', text: 'Jobs are keyed by the sha256 of the payload so replayed events are dropped.' },
    { kind: 'diff', text: 'import hashlib' },
    { kind: 'diff', text: 'key = hashlib.sha256(payload).hexdigest()' },
    { kind: 'diff', text: 'if key in seen: continue' },
    { kind: 'diff', text: 'queue.put((key, payload))' },
    { kind: 'test', text: '✓ pytest tests/test_ingest_queue.py — 7 passed in 0.31s' },
  ]),
];

/* Batch A/B/C · worker-03 — PostgreSQL / SQL / Prisma */
const SQL_TASKS: StreamTask[] = [
  buildTask('db/migrations/042_indexes.sql', [
    { kind: 'prompt', text: '> Add a covering index for the sessions hot path' },
    { kind: 'tool', text: 'read_file db/migrations/042_indexes.sql (58 lines)' },
    { kind: 'para', text: 'The refresh lookup seq-scans sessions; a covering index on (user_id, expires_at) kills it.' },
    { kind: 'diff', text: 'CREATE INDEX CONCURRENTLY idx_sessions_user_expires' },
    { kind: 'diff', text: 'ON sessions (user_id, expires_at) INCLUDE (token_hash);' },
    { kind: 'test', text: '✓ psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/042_indexes.sql' },
  ]),
  buildTask('db/queries/ledger_rollup.sql', [
    { kind: 'prompt', text: '> Make the daily ledger rollup avoid sequential scans' },
    { kind: 'tool', text: 'read_file db/queries/ledger_rollup.sql (74 lines)' },
    { kind: 'para', text: 'The rollup is driven by the range index on (day, account) with an incremental cursor.' },
    { kind: 'diff', text: 'WHERE day = :day AND account BETWEEN :lo AND :hi' },
    { kind: 'diff', text: 'GROUP BY account' },
    { kind: 'test', text: '✓ psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/queries/ledger_rollup.sql' },
  ]),
  buildTask('prisma/schema.prisma', [
    { kind: 'prompt', text: '> Validate the Prisma schema before regenerating the client' },
    { kind: 'tool', text: 'read_file prisma/schema.prisma (320 lines)' },
    { kind: 'para', text: 'Relations and indexes resolve cleanly; the client regenerates from the validated schema.' },
    { kind: 'diff', text: 'model Invoice {' },
    { kind: 'diff', text: '  idempotencyKey String @unique' },
    { kind: 'diff', text: '}' },
    { kind: 'test', text: '✓ npx prisma validate — schema ok' },
  ]),
];

/* Batch A/B/C · worker-04 — Go / infra */
const GO_TASKS: StreamTask[] = [
  buildTask('server/egress_proxy.go', [
    { kind: 'prompt', text: '> Deny outbound connects in the egress proxy default policy' },
    { kind: 'tool', text: 'read_file server/egress_proxy.go (244 lines)' },
    { kind: 'para', text: 'Raw dials bypass the proxy; the default rule now denies outbound connects.' },
    { kind: 'diff', text: 'if !allowlisted(host) {' },
    { kind: 'diff', text: '    return denyConn(conn, "egress denied")' },
    { kind: 'diff', text: '}' },
    { kind: 'test', text: '✓ go test ./server/... — 22 passed in 0.64s' },
  ]),
  buildTask('cmd/worker_pool.go', [
    { kind: 'prompt', text: '> Cap the worker pool to the GPU count and recycle idle workers' },
    { kind: 'tool', text: 'read_file cmd/worker_pool.go (189 lines)' },
    { kind: 'para', text: 'Pool size is pinned to the detected GPU count; idle workers are reclaimed after the TTL.' },
    { kind: 'diff', text: 'size := detectGPUs()' },
    { kind: 'diff', text: 'pool := NewWorkerPool(size)' },
    { kind: 'diff', text: 'pool.RecycleIdle(ttl)' },
    { kind: 'test', text: '✓ go test ./cmd/... — 15 passed in 0.58s' },
  ]),
  buildTask('deploy/nginx.conf', [
    { kind: 'prompt', text: '> Harden the nginx config for the air-gapped edge' },
    { kind: 'tool', text: 'read_file deploy/nginx.conf (87 lines)' },
    { kind: 'para', text: 'Server tokens are off, timeouts tightened, and the upstream pinned to the local engine.' },
    { kind: 'diff', text: 'server_tokens off;' },
    { kind: 'diff', text: 'proxy_pass http://127.0.0.1:18020;' },
    { kind: 'test', text: '✓ nginx -t — syntax ok' },
  ]),
];

/* n=4 quad panes — 4 concurrent workers · ~65 tok/s each · 260 tok/s agg. */
const QUAD_PANES: PaneSpec[] = [
  { worker: 'worker-01', rate: 66.2, startOffsetS: 0, tasks: TS_TASKS },
  { worker: 'worker-02', rate: 64.8, startOffsetS: 0.12, tasks: PY_TASKS },
  { worker: 'worker-03', rate: 65.1, startOffsetS: 0.24, tasks: SQL_TASKS },
  { worker: 'worker-04', rate: 63.9, startOffsetS: 0.36, tasks: GO_TASKS },
];

/* n=1 single stream — cycles continuously across TypeScript / Python / Go. */
const N1_TASKS: StreamTask[] = [
  buildTask('apps/web/auth/session.ts', [
    { kind: 'prompt', text: '> Fix the token refresh race and run the auth suite' },
    { kind: 'tool', text: 'read_file apps/web/auth/session.ts (212 lines)' },
    { kind: 'para', text: 'Two concurrent refreshes rotate the same session twice inside the grace window.' },
    { kind: 'diff', text: 'if (await rotatedWithin(session, 30_000)) {' },
    { kind: 'diff', text: '  return cachedPair(session);' },
    { kind: 'diff', text: '}' },
    { kind: 'tool', text: 'bash npx vitest run apps/web/auth/session.test.ts' },
    { kind: 'test', text: '✓ vitest apps/web/auth/session.test.ts — 14 passed in 0.41s (exit 0)' },
  ]),
  buildTask('api/rate_limit.py', [
    { kind: 'prompt', text: '> Replace the fixed token refill with a sliding-window bucket' },
    { kind: 'tool', text: 'read_file api/rate_limit.py (141 lines)' },
    { kind: 'para', text: 'A 100 rps burst drained the whole budget in one tick; a sliding window fixes it.' },
    { kind: 'diff', text: 'now = monotonic()' },
    { kind: 'diff', text: 'self.window = [t for t in self.window if now - t < WINDOW]' },
    { kind: 'diff', text: 'free = self.capacity - len(self.window)' },
    { kind: 'tool', text: 'bash pytest tests/test_rate_limit.py' },
    { kind: 'test', text: '✓ pytest tests/test_rate_limit.py — 9 passed in 0.38s' },
  ]),
  buildTask('server/egress_proxy.go', [
    { kind: 'prompt', text: '> Deny outbound connects in the egress proxy default policy' },
    { kind: 'tool', text: 'read_file server/egress_proxy.go (244 lines)' },
    { kind: 'para', text: 'Raw dials bypass the proxy; the default rule now denies outbound connects.' },
    { kind: 'diff', text: 'if !allowlisted(host) {' },
    { kind: 'diff', text: '    return denyConn(conn, "egress denied")' },
    { kind: 'diff', text: '}' },
    { kind: 'tool', text: 'bash go test ./server/...' },
    { kind: 'test', text: '✓ go test ./server/... — 22 passed in 0.64s' },
  ]),
];

const SINGLE_PANE: PaneSpec = {
  worker: 'worker-01',
  rate: N1_RATE,
  startOffsetS: 0,
  tasks: N1_TASKS,
};

/* ── Pure deterministic state builder (SSR === first client render) ───
   Pre-emits each pane's first prompt line so the terminal reads as a live
   console from the very first frame — identical on the server and the first
   client paint (no clock, no randomness). Each PaneState also carries a
   pure `makeInitial` factory (capturing its own pane) so a missing/stale
   slot can be regenerated synchronously during render or the rAF advance —
   this is what makes rapid n=1 ↔ n=4 toggling throw-free. */
function makeInitialFor(pane: PaneSpec): PaneState {
  const first = pane.tasks[0].lines[0];
  const st: PaneState = {
    taskIdx: 0,
    lineIdx: 1,
    tokenInLine: 0,
    lifetime: first.tokens,
    delay: pane.startOffsetS,
    buffer: [{ kind: first.kind, text: renderPartial(first, first.tokens) }],
    makeInitial: () => makeInitialFor(pane),
  };
  return st;
}

function initStates(panes: PaneSpec[]): PaneState[] {
  return panes.map((p) => makeInitialFor(p));
}

/** Advance one pane's stream cursor by `dt` seconds (mutates in place). */
function advance(pane: PaneSpec, st: PaneState, dt: number): void {
  if (st.delay > 0) {
    st.delay -= dt;
    return;
  }
  let adv = pane.rate * dt;
  let guard = 0;
  while (adv > 0 && guard++ < 2000) {
    const task = pane.tasks[st.taskIdx];
    const line = task.lines[st.lineIdx];
    const remain = line.tokens - st.tokenInLine;
    if (adv < remain) {
      st.tokenInLine += adv;
      adv = 0;
      break;
    }
    adv -= remain;
    st.lifetime += line.tokens;
    st.buffer.push({ kind: line.kind, text: renderPartial(line, line.tokens) });
    st.tokenInLine = 0;
    st.lineIdx++;
    if (st.lineIdx >= task.lines.length) {
      // Task complete → brief separator, then the next task starts at once.
      st.buffer.push({ kind: 'sep', text: '---' });
      st.taskIdx = (st.taskIdx + 1) % pane.tasks.length;
      st.lineIdx = 0;
    }
    if (st.buffer.length > BUFFER_CAP) st.buffer.shift();
  }
}

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
    case 'sep':
      return 'text-[#3A4556]';
    case 'code':
    case 'diff':
      return 'text-[#D7DEE9]';
    default:
      return 'text-[#D7DEE9]';
  }
}

function LineView({
  kind,
  text,
  cursorOn,
}: {
  kind: LineKind;
  text: string;
  cursorOn: boolean;
}) {
  const isDiff = kind === 'diff';
  const isTool = kind === 'tool';
  const isTest = kind === 'test';

  let cls = 'break-words font-mono leading-[1.55] ' + lineTextClass(kind);
  if (isDiff) cls = cls + ' bg-[#16281D] pl-[1.15em] text-[#7EDFA0]';
  if (isTool) cls = cls + ' pl-[0.85em]';
  if (isTest) cls = cls + ' pl-[0.85em]';

  return (
    <div className={cls}>
      {isDiff && <span className="shrink-0">+ </span>}
      {isTool && <span className="shrink-0 text-[#7FA6FF]">● </span>}
      <span>{text}</span>
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
  st,
  running,
  wide,
}: {
  pane: PaneSpec;
  st: PaneState;
  running: boolean;
  wide: boolean; // n=1 expanded stream
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Guard: a slot can be undefined/transiently stale the instant the
  // concurrency mode flips (the rAF resize lands after this render). Fall
  // back to a freshly-built initial state and clamp every index into its
  // valid range so a rapid n=1 → n=4 (or reverse) toggle can never throw.
  const state = st ?? makeInitialFor(pane);
  const task = pane.tasks[state.taskIdx % pane.tasks.length];
  const activeLine = task.lines[state.lineIdx % task.lines.length];
  const activeText = renderPartial(activeLine, state.tokenInLine);

  // Rolling window: completed lines + the active (partially written) line.
  // When paused and the active line is still empty, omit it so a paused
  // pane never shows a dead blank row at the writing head.
  let display = [...state.buffer];
  if (activeText !== '' || running) {
    display.push({ kind: activeLine.kind, text: activeText });
  }
  if (display.length === 0) {
    display = [
      {
        kind: task.lines[0].kind,
        text: renderPartial(task.lines[0], task.lines[0].tokens),
      },
    ];
  }
  if (display.length > MAX_DISPLAY) display = display.slice(-MAX_DISPLAY);

  const counter = Math.floor(state.lifetime);
  const paneMargin = wide ? 'm-1.5 rounded-lg' : 'm-[1.5px]';

  // Auto-scroll the pane body to the newest line as it grows.
  const scrollKey = `${state.taskIdx}:${state.lineIdx}:${state.tokenInLine.toFixed(1)}`;
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [scrollKey]);

  return (
    <div
      className={`absolute inset-0 flex min-h-0 min-w-0 flex-col overflow-hidden border border-white/10 bg-[#070B12] ${paneMargin}`}
    >
      {/* Pane header (sticky) */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-2.5 py-1.5">
        <p className="min-w-0 truncate font-mono text-[9.5px] leading-tight sm:text-[10px]">
          <span className="text-[#F97316]">{pane.worker}</span>
          <span className="text-[#5D6B80]"> · </span>
          <span className="text-[#A3AEBF]">{task.file}</span>
        </p>
        <p className="shrink-0 font-mono text-[9.5px] tabular-nums sm:text-[10px]">
          <span className="text-[#F5F7FA]">{counter}</span>
          <span className="text-[#5D6B80]"> tok · </span>
          <span className="text-[#7FA6FF]">{pane.rate.toFixed(1)} tok/s</span>
        </p>
      </div>

      {/* Pane body: tokens / lines / code stream top→bottom here. Only the
          most recent ~18 lines stay mounted; the rest scroll away. */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-[3px] overflow-y-auto px-2.5 py-2 text-[10.5px] [scrollbar-width:none] sm:text-[11px] [&::-webkit-scrollbar]:hidden"
      >
        {display.map((L, i) => (
          <LineView
            key={i}
            kind={L.kind}
            text={L.text}
            cursorOn={running && i === display.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function SSEStreamer({ base }: { base: string }) {
  const [mode, setMode] = useState<1 | 4>(4);
  // Auto-stream on initial page load: the stream is LIVE for every visitor
  // from the very first frame. Text tokens appended into a code terminal
  // carry no spinning / flashing / parallax motion, so we do NOT auto-pause
  // under `prefers-reduced-motion: reduce` (which previously left the hero
  // frozen at `45 tokens`). The Pause / Resume button stays the manual gate.
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);

  // One shared rAF loop drives every pane; per-pane cursors live in a ref.
  const [, setTick] = useState(0);

  // Two ALWAYS-initialized, mode-scoped state arrays: n=4 → 4 cursors,
  // n=1 → 1 cursor. Each is built exactly once (pure & deterministic —
  // identical on the server and the first client paint) and stays fully
  // sized at all times, so a slot for the active mode is NEVER `undefined`
  // no matter how fast the user toggles n=4 → n=1 → n=4. (This is the fix
  // for the `Cannot read properties of undefined (reading 'taskIdx')` crash:
  // a single resizable array let n=4 panes read `undefined.taskIdx` on the
  // render pass that preceded the resize effect.)
  const n4StatesRef = useRef<PaneState[] | null>(null);
  if (n4StatesRef.current === null) n4StatesRef.current = initStates(QUAD_PANES);
  const n1StatesRef = useRef<PaneState[] | null>(null);
  if (n1StatesRef.current === null) n1StatesRef.current = initStates([SINGLE_PANE]);

  const activeStates = mode === 4 ? n4StatesRef.current : n1StatesRef.current;

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

  // The user's Pause / Stream button is the sole source of truth for
  // whether the stream runs.
  const running = inView && !paused;

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    // Both mode arrays are always fully initialized during render, so this is
    // non-null here; the array is mutated in place, so one capture per effect
    // run is correct (the effect re-runs whenever `mode` or `running` changes).
    const states = (mode === 4 ? n4StatesRef.current : n1StatesRef.current)!;
    const panes = mode === 4 ? QUAD_PANES : [SINGLE_PANE];
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // Advance ONLY the active mode's cursor array; its length always
      // matches `panes.length` (4 or 1), so every slot is guaranteed set.
      for (let i = 0; i < panes.length; i++) {
        advance(panes[i], states[i], dt);
      }
      setTick((t) => (t + 1) % 1_000_000);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [running, mode]);

  const panes = mode === 4 ? QUAD_PANES : [SINGLE_PANE];
  const states = activeStates;

  return (
    <div ref={stageRef} className="mx-auto mt-12 w-full min-w-0 max-w-5xl">
      <div
        role="figure"
        aria-label="Castor LLM streaming window: n=4 concurrent agent streams from the session KV cache at 260 tokens per second aggregate, or n=1 single stream at 70.4 tokens per second"
        className="w-full max-w-full min-w-0 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#0A0D14]"
      >
        <div className="flex w-full max-w-full min-w-0 flex-col overflow-hidden">
          {/* ── Top instrument bar — single crisp horizontal row ─────── */}
          <div className="flex w-full max-w-full min-h-[64px] min-w-0 flex-wrap items-center gap-x-4 gap-y-2 overflow-hidden border-b border-white/10 px-4 py-3 sm:px-5">
            {/* Session KV cache readout */}
            <p className="min-w-0 shrink truncate font-mono text-[10.5px] tracking-[0.05em] text-[#8C95A6] sm:text-[11px]">
              <span className="text-[#FB923C]">SESSION KV CACHE</span>{' '}
              · {LEDGER_76DAY.cacheHitPct.toFixed(1)}% HIT · RTX 3090 (W4A16)
            </p>

            {/* 2-mode concurrency toggle + pause / stream control.
                On 390px mobile the bar has only ~324px of usable width, so
                the three controls must be compact: `flex-wrap` lets the group
                drop to a clean second row if a very narrow viewport still
                doesn't fit, and the n=4 / n=1 buttons show a compact label
                (`n=4 · 260` / `n=1 · 70.4`) on mobile that expands to the
                full `Parallel` / `Single · X tok/s` phrasing from `sm` up —
                keeping all three buttons inside the container with zero
                right-edge clipping at 390px. */}
            <div className="ml-auto flex shrink-0 flex-wrap items-center gap-1.5">
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
                  n=4<span className="hidden sm:inline"> Parallel </span>
                  <span className="sm:hidden">·</span>
                  260<span className="sm:hidden"> tok/s</span>
                  <span className="hidden sm:inline"> tok/s</span>
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
                  n=1<span className="hidden sm:inline"> Single </span>
                  <span className="sm:hidden">·</span>
                  70.4<span className="sm:hidden"> tok/s</span>
                  <span className="hidden sm:inline"> tok/s</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? 'Resume the live stream' : 'Pause the live stream'}
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-md px-2.5 font-mono text-[10.5px] font-semibold transition-colors ${
                  paused
                    ? 'border border-[#F97316]/60 bg-[#F97316]/10 text-[#FB923C] hover:bg-[#F97316]/20'
                    : 'border border-white/10 bg-black/40 text-[#D7DEE9] hover:border-white/25'
                }`}
              >
                {paused ? (
                  <>
                    <Play size={13} strokeWidth={2.5} />
                    <span className="whitespace-nowrap sm:hidden">Resume</span>
                    <span className="whitespace-nowrap hidden sm:inline">Resume Live Stream</span>
                  </>
                ) : (
                  <>
                    <Pause size={13} strokeWidth={2.25} />
                    <span className="whitespace-nowrap">Pause</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Center streaming window: 480px tall on mobile (4 stacked
              rows), strictly fixed 360px stage from sm up ── */}
          <div className="relative h-[480px] min-w-0 w-full shrink-0 sm:h-[360px]">
            {mode === 4 ? (
              <div
                key={mode}
                className="grid h-full min-w-0 w-full grid-cols-1 grid-rows-4 gap-px bg-white/10 sm:grid-cols-2 sm:grid-rows-2"
              >
                {panes.map((p, i) => (
                  <div key={p.worker} className="relative min-h-0 min-w-0" aria-hidden="true">
                    <Pane pane={p} st={states[i]} running={running} wide={false} />
                  </div>
                ))}
              </div>
            ) : (
              <div key={mode} className="h-full min-w-0 w-full">
                <Pane pane={panes[0]} st={states[0]} running={running} wide />
              </div>
            )}
          </div>

          {/* ── Bottom telemetry & cloud-arbitrage comparison bar ────
              Four deterministic readouts, every value sourced from the
              Nov 21, 2026 `castor stats` / vLLM snapshot. */}
          <div className="grid w-full max-w-full min-w-0 grid-cols-2 gap-px overflow-hidden border-t border-white/10 bg-white/5 lg:grid-cols-4">
            <NumberFlowGroup>
              <div className="min-w-0 bg-[#0A0D14] px-4 py-3 sm:px-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#5D6B80]">
                  Effective Prefill
                </p>
                <SafeNumberFlow
                  value={LEDGER_76DAY.effectivePrefillTps}
                  suffix=" tok/s"
                  format={{ useGrouping: true, maximumFractionDigits: 0 }}
                  className="mt-0.5 font-mono text-[14px] font-semibold tabular-nums text-[#F5F7FA] sm:text-[15px]"
                />
                <span className="ml-1 font-mono text-[10.5px] text-[#5D6B80]">
                  warm + cold
                </span>
              </div>
              <div className="min-w-0 bg-[#0A0D14] px-4 py-3 sm:px-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#5D6B80]">
                  Decode (n=4 / n=1)
                </p>
                <span className="mt-0.5 font-mono text-[14px] font-semibold tabular-nums text-[#F5F7FA] sm:text-[15px]">
                  {N4_RATE.toFixed(1)} / {N1_RATE.toFixed(1)}
                </span>
                <span className="ml-1 font-mono text-[10.5px] text-[#5D6B80]">
                  tok/s aggregate / sustained
                </span>
              </div>
              <div className="min-w-0 bg-[#0A0D14] px-4 py-3 sm:px-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#5D6B80]">
                  Session KV Hit
                </p>
                <SafeNumberFlow
                  value={LEDGER_76DAY.cacheHitPct}
                  suffix="%"
                  format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                  className="mt-0.5 font-mono text-[14px] font-semibold tabular-nums text-[#F5F7FA] sm:text-[15px]"
                />
                <span className="ml-1 font-mono text-[10.5px] text-[#5D6B80]">
                  across {LEDGER_76DAY.totalTokensDisplay} tokens
                </span>
              </div>
              <div className="min-w-0 bg-[#0A0D14] px-4 py-3 sm:px-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#5D6B80]">
                  Local GPU Cost
                </p>
                <span className="mt-0.5 font-mono text-[14px] font-semibold tabular-nums text-[#FB923C] sm:text-[15px]">
                  $0.0000
                </span>
                <span className="ml-2 font-mono text-[10.5px] text-[#5D6B80]">
                  ${LEDGER_76DAY.electricityUsd.toFixed(2)} total power (78-day)
                </span>
              </div>
            </NumberFlowGroup>
          </div>

          {/* ── Hardware footer strip ──────────────────────────────── */}
          <div className="flex w-full max-w-full min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 overflow-hidden border-t border-white/10 bg-black/30 px-4 py-3 sm:px-5">
            <p className="font-mono text-[11px] tracking-[0.03em] text-[#8C95A6]">
              {HARDWARE_SNAPSHOT.gpu.model.replace('NVIDIA GeForce ', '')} (
              {Math.round(HARDWARE_SNAPSHOT.gpu.vramTotalMiB / 1024)} GB) ·{' '}
              {HARDWARE_SNAPSHOT.engine.model.replace(/-AutoRound(-fast)?$/, '')} ·{' '}
              {HARDWARE_SNAPSHOT.engine.name} · {HARDWARE_SNAPSHOT.gpu.powerDrawW}{' '}
              W · {HARDWARE_SNAPSHOT.gpu.tempC} °C
            </p>
            <a
              href={`${base}/benchmarks/qwen3-8-27b-rtx-3090/`}
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

export default function HeroCinema({ base }: { base: string }) {
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

        <SSEStreamer base={base} />
      </div>
    </section>
  );
}
