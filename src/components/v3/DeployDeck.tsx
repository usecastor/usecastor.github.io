// @client
/**
 * ACT 4 — DeployDeck.
 * Warm-ivory engagement deck: grouped compatibility badges (Agents /
 * Engines / Models / Hardware), the four buyer-facing fronts in a
 * balanced grid (identical footer alignment, machined outline buttons —
 * the only solid button on the site stays the hero's amber Copy), and a
 * compact interactive Scope & Engagement Brief Builder that copies a
 * formatted project brief to the clipboard or launches a pre-filled email.
 * The email CTA is dynamically enriched from the SavingsInstrument's
 * `castor:economics-update` event so it carries the visitor's numbers.
 *
 * Zero scroll hijacking, zero stuck opacity.
 */
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy } from 'lucide-react';
import { ARCHITECTURE } from '../../data/telemetry';
import {
  ECONOMICS_UPDATE_EVENT,
  type EconomicsUpdateDetail,
} from '../../scripts/economics-calc';

const GITHUB = ARCHITECTURE.links.github;
const EMAIL_ADDR = 'm.abdullah.ali.2523@gmail.com';

/* ── Base-prefixed routes (Vercel '/' and GitHub Pages '/Castor') ───── */
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const AIRGAP_PAGE = `${base}/enterprise/air-gapped-coding-agent/`;
const BENCH_PAGE = `${base}/benchmarks/qwen3-8-27b-rtx-3090/`;

const INSTALL_CMD = 'npx -y mcp-castor install --client all';

/* ── Grouped compatibility badges ───────────────────────────────────── */
const COMPAT_GROUPS: Array<{ group: string; items: string[] }> = [
  { group: 'Agents', items: ['Claude Code', 'Cursor', 'Gemini CLI', 'Antigravity', 'Codex'] },
  { group: 'Engines', items: ['vLLM 0.33', 'llama.cpp', 'SGLang', 'Ollama', 'LM Studio'] },
  { group: 'Models', items: ['Qwen3.8-27B', 'Ternary-Bonsai', 'any 7B–70B W4A16'] },
  { group: 'Hardware', items: ['RTX 3090 · 24 GB', 'RTX 5090 · 32 GB', 'multi-GPU vLLM node'] },
];

/* ── The 4 Fronts ───────────────────────────────────────────────────── */

interface FrontDef {
  id: string;
  num: string;
  title: string;
  price: string;
  bullets: string[];
  cmd?: string;
  dark?: boolean;
}

const FRONTS: FrontDef[] = [
  {
    id: 'engine',
    num: 'Front 01',
    title: 'Open-Source Engine',
    price: '$0 · AGPL-3.0',
    cmd: INSTALL_CMD,
    bullets: [
      '3 MCP tools + 5-layer sandbox',
      '27-grammar AST syntax gate',
      'vLLM / llama.cpp / Ollama profiles',
    ],
  },
  {
    id: 'sprint',
    num: 'Front 02',
    title: 'Turnkey GPU & vLLM Setup',
    price: '$1,500 · 48-Hour Sprint',
    bullets: [
      'Hardware & W4A16 quantization sizing',
      'vLLM continuous batching — 260 tok/s at n=4',
      'Prefix-cache pinning + Claude Code / Cursor team routing',
    ],
  },
  {
    id: 'plumbing',
    num: 'Front 03',
    title: 'Custom Agent & Workflow Plumbing',
    price: 'Scoped Build / Retainer',
    bullets: [
      'Multi-developer shared GPU pool routing',
      'Custom tool sandboxes & repo-specific AST gates',
      'CI evaluation pipelines for agent work',
    ],
  },
  {
    id: 'airgap',
    num: 'Front 04',
    title: 'Private & Air-Gapped On-Prem',
    price: 'Regulated Pilot',
    dark: true,
    bullets: [
      '100% local-only, zero-egress deployment',
      '5-layer OS sandboxing + per-task audit ledgers',
      'SOC 2 / ISO 27001 / CMMC / HIPAA evidence mapping',
    ],
  },
];

/* ── Scope & Engagement Brief Builder ───────────────────────────────── */

const BRIEF_FRONTS = [
  { key: 'sprint', label: '48h Setup Sprint' },
  { key: 'plumbing', label: 'Custom Agent Plumbing' },
  { key: 'airgap', label: 'Air-Gapped On-Prem Pilot' },
];

const TEAM_SIZES = [
  { key: '1', label: '1 (solo)' },
  { key: '2-5', label: '2–5' },
  { key: '6-15', label: '6–15' },
  { key: '15+', label: '15+' },
];

const GPU_STATUSES = [
  { key: 'none', label: 'No GPU yet' },
  { key: '1', label: '1 workstation GPU' },
  { key: '2+', label: '2+ GPUs / shared server' },
];

function buildBrief(
  front: (typeof BRIEF_FRONTS)[number],
  team: (typeof TEAM_SIZES)[number],
  gpu: (typeof GPU_STATUSES)[number],
  econ: EconomicsUpdateDetail | null,
): string {
  const lines = [
    'Castor — Project Scope Brief',
    '────────────────────────────',
    `Front: ${front.label}`,
    `Team size: ${team.label}`,
    `GPU status: ${gpu.label}`,
  ];
  if (econ) {
    lines.push(
      '',
      `My workload (from your calculator):`,
      `  • ${econ.modelName} lead · ${econ.teamSize} engineer(s)`,
      `  • ${Math.round(econ.monthlyTokensM).toLocaleString('en-US')}M tokens / month`,
      `  • Est. annual net savings: ${econ.annualSavingsFmt} (castor hybrid ${econ.hybridMonthlyFmt}/mo)`,
    );
  }
  lines.push(
    '',
    'Targets:',
    '  • ',
    '  • Timeline:',
    '',
    `Please reply to ${EMAIL_ADDR}.`,
  );
  return lines.join('\n');
}

function BriefBuilder({ econ }: { econ: EconomicsUpdateDetail | null }) {
  const [front, setFront] = useState(BRIEF_FRONTS[0]);
  const [team, setTeam] = useState(TEAM_SIZES[1]);
  const [gpu, setGpu] = useState(GPU_STATUSES[1]);
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  const brief = buildBrief(front, team, gpu, econ);

  const copy = () => {
    void navigator.clipboard?.writeText(brief).catch(() => {
      /* non-secure context */
    });
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  const mailto = () =>
    `mailto:${EMAIL_ADDR}?subject=${encodeURIComponent(
      `Castor — ${front.label} — Project Scope Brief`,
    )}&body=${encodeURIComponent(brief)}`;

  const segBtn = (active: boolean) =>
    `min-h-[40px] rounded-md border px-3 font-mono text-[11.5px] transition-colors ${
      active
        ? 'border-[#101319] bg-[#101319] text-[#F5F7FA]'
        : 'border-black/12 bg-white text-[#4A5568] hover:border-black/30 hover:text-[#101319]'
    }`;

  return (
    <div className="mt-12 overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(16,19,25,0.04)]">
      <div className="border-b border-black/10 bg-[#F2F0EA] px-5 py-4 sm:px-7">
        <h3 className="font-display text-lg font-bold tracking-[-0.02em] text-[#0E1117]">
          Scope &amp; Engagement Brief Builder
        </h3>
        <p className="mt-1 text-[13px] text-[#4A5568]">
          Pick your front, team size, and GPU status — then copy the brief or
          launch a pre-filled email. Takes 20 seconds.
        </p>
      </div>

      <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#6C7484]">
            Front
          </p>
          <div className="flex flex-wrap gap-1.5">
            {BRIEF_FRONTS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFront(f)}
                aria-pressed={front.key === f.key}
                className={segBtn(front.key === f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#6C7484]">
            Team size
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TEAM_SIZES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTeam(t)}
                aria-pressed={team.key === t.key}
                className={segBtn(team.key === t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#6C7484]">
            GPU status
          </p>
          <div className="flex flex-wrap gap-1.5">
            {GPU_STATUSES.map((g) => (
              <button
                key={g.key}
                onClick={() => setGpu(g)}
                aria-pressed={gpu.key === g.key}
                className={segBtn(gpu.key === g.key)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2.5 lg:w-64">
          <button
            type="button"
            onClick={copy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-black/20 bg-white px-4 font-mono text-[12.5px] font-semibold text-[#0E1117] transition-colors hover:border-[#101319]"
          >
            {copied ? (
              <Check size={14} strokeWidth={2.5} className="text-[#15803D]" />
            ) : (
              <Copy size={14} strokeWidth={2.5} />
            )}
            {copied ? 'Copied Brief to Clipboard ✓' : 'Copy Project Scope Brief'}
          </button>
          <a
            href={mailto()}
            className="flex h-11 w-full items-center justify-center rounded-md border border-black/20 bg-white px-4 font-mono text-[12.5px] font-medium text-[#0E1117] transition-colors hover:border-[#101319]"
          >
            Launch Pre-Filled Email →
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── Machined outline button (identical across every front) ─────────── */

function OutlineBtn({
  href,
  children,
  external,
  dark,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  dark?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className={`flex h-11 items-center justify-center rounded-md border px-4 font-mono text-[12.5px] font-medium transition-colors ${
        dark
          ? 'border-white/20 text-[#C7D0DE] hover:border-[#F97316]/60 hover:text-[#FB923C]'
          : 'border-black/15 text-[#0E1117] hover:border-[#1D4ED8] hover:text-[#1D4ED8]'
      }`}
    >
      {children}
    </a>
  );
}

/* ── Copy button with instant feedback ───────────────────────────────── */

function CopyButton({ cmd, label }: { cmd: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  const copy = () => {
    void navigator.clipboard?.writeText(cmd).catch(() => {
      /* non-secure context */
    });
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy install command"
      className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-black/20 bg-white px-4 font-mono text-[12.5px] font-semibold text-[#0E1117] transition-colors hover:border-[#101319]"
    >
      {copied ? (
        <Check size={14} strokeWidth={2.5} className="text-[#15803D]" />
      ) : (
        <Copy size={14} strokeWidth={2.5} />
      )}
      {copied ? 'Copied ✓' : label}
    </button>
  );
}

/* ── Root ────────────────────────────────────────────────────────────── */

export default function DeployDeck() {
  // Dynamic mailto state (enriched by SavingsInstrument's live event).
  // On mount, first read the stashed `window.__castorEconomics` (written
  // by dispatchEconomicsUpdate before every event) so a late-mounting
  // DeployDeck never ships a mailto with a blank workload body.
  const [econ, setEcon] = useState<EconomicsUpdateDetail | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.__castorEconomics) setEcon(window.__castorEconomics);
    const handler = (e: Event) =>
      setEcon((e as CustomEvent<EconomicsUpdateDetail>).detail);
    window.addEventListener(ECONOMICS_UPDATE_EVENT, handler);
    return () => window.removeEventListener(ECONOMICS_UPDATE_EVENT, handler);
  }, []);

  const workloadBlock = econ
    ? `My workload:\n  • ${econ.modelName} lead · ${econ.teamSize} engineer(s)\n  • ${Math.round(econ.monthlyTokensM).toLocaleString('en-US')}M tokens / month\n  • Est. annual net savings: ${econ.annualSavingsFmt} (castor hybrid ${econ.hybridMonthlyFmt}/mo)\n\n`
    : 'My workload (team size & monthly token volume):\n\n';

  return (
    <section
      id="deploy"
      className="scroll-mt-20 bg-[#F7F6F2] py-24 text-[#0E1117] lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* ── Folio bar ─────────────────────────────────────────────── */}
        <div className="folio-bar">
          <span className="folio-coord">
            Engagements // 03 — Self-Serve or Done-For-You Plumbing
          </span>
          <span className="folio-index">03 / 04</span>
        </div>

        {/* ── Left-aligned asymmetric header ────────────────────────── */}
        <header className="asymmetric-spread mt-8">
          <div className="min-w-0">
            <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.035em] text-[#101319]">
              Run it yourself today.
              <br className="hidden sm:block" />
              Or bring us in to wire your stack.
            </h2>
          </div>
          <div className="prose-measure min-w-0">
            <p className="text-base leading-relaxed text-[#4A5568] sm:text-lg">
              Four fronts, one decision: take the open-source engine and go,
              or have us do the GPU sizing, vLLM tuning, and agent plumbing
              for you — including a full air-gapped on-prem deployment for
              regulated teams.
            </p>
          </div>
        </header>

        {/* ── Grouped compatibility badges ──────────────────────────── */}
        <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-black/10 bg-black/10 sm:grid-cols-4">
          {COMPAT_GROUPS.map((g) => (
            <div key={g.group} className="min-w-0 bg-white p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#9CA3AF]">
                {g.group}
              </p>
              <ul className="mt-2 space-y-1.5">
                {g.items.map((it) => (
                  <li
                    key={it}
                    className="truncate font-mono text-[11.5px] font-medium text-[#374151]"
                  >
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── The 4 Fronts — balanced grid, identical footer alignment ─ */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {FRONTS.map((f) => (
            <motion.article
              key={f.id}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className={`flex min-w-0 flex-col overflow-hidden rounded-xl border ${
                f.dark
                  ? 'border-[#0B0F17] bg-[#0B0F17] text-[#F5F7FA] shadow-[0_18px_40px_-18px_rgba(16,19,25,0.5)]'
                  : 'border-black/10 bg-white text-[#0E1117] shadow-[0_1px_2px_rgba(16,19,25,0.04)]'
              }`}
            >
              <div className="flex-1 p-6">
                <p
                  className={`font-mono text-[10.5px] uppercase tracking-[0.12em] ${
                    f.dark ? 'text-[#8C95A6]' : 'text-[#9CA3AF]'
                  }`}
                >
                  {f.num}
                </p>
                <h3
                  className={`mt-1.5 font-display text-xl font-bold tracking-[-0.02em] ${
                    f.dark ? 'text-[#F5F7FA]' : 'text-[#0E1117]'
                  }`}
                >
                  {f.title}
                </h3>
                <p
                  className={`mt-1 font-mono text-[11.5px] tracking-[0.04em] ${
                    f.dark ? 'text-[#FB923C]' : 'text-[#1D4ED8]'
                  }`}
                >
                  {f.price}
                </p>

                {/* Front 01: the exact install command in a monospace box */}
                {f.cmd && (
                  <div
                    className="mt-4 overflow-x-auto rounded-md border border-white/10 bg-black/50 px-3 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <code className="font-mono text-[11.5px] text-[#D7DEE9]">
                      <span className="text-[#FB923C]">$ </span>
                      {f.cmd}
                    </code>
                  </div>
                )}

                <ul className="mt-5 space-y-2.5">
                  {f.bullets.map((b) => (
                    <li
                      key={b}
                      className={`flex items-start gap-2.5 font-mono text-[12px] leading-snug ${
                        f.dark ? 'text-[#C7D0DE]' : 'text-[#374151]'
                      }`}
                    >
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          f.dark ? 'bg-[#F97316]' : 'bg-[#1D4ED8]'
                        }`}
                        aria-hidden="true"
                      />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Identical footer block across all fronts (fixed height,
                  buttons pinned to the bottom for aligned rows). */}
              <div className="min-h-[130px] shrink-0 space-y-2.5 border-t border-black/10 bg-[#FAF9F5] p-4">
                {f.id === 'engine' && (
                  <>
                    <CopyButton cmd={f.cmd ?? ''} label="Copy Install Command" />
                    <OutlineBtn href={BENCH_PAGE}>
                      78-Day RTX 3090 Benchmarks →
                    </OutlineBtn>
                  </>
                )}
                {f.id === 'sprint' && (
                  <>
                    <a
                      href={`mailto:${EMAIL_ADDR}?subject=${encodeURIComponent(
                        'Castor — 48h GPU & vLLM Setup Sprint',
                      )}&body=${encodeURIComponent(
                        `Hi — I want the 48h turnkey sprint: hardware sizing, vLLM continuous batching (260 tok/s at n=4), prefix-cache pinning, and team routing for Claude Code / Cursor.\n\n${workloadBlock}Stack:\nSeats:`,
                      )}`}
                      className="flex h-11 w-full items-center justify-center rounded-md border border-black/20 bg-white px-4 font-mono text-[12.5px] font-semibold text-[#0E1117] transition-colors hover:border-[#101319]"
                    >
                      Book the 48h Sprint
                    </a>
                    <OutlineBtn href={GITHUB} external>
                      usecastor/castor on GitHub
                    </OutlineBtn>
                  </>
                )}
                {f.id === 'plumbing' && (
                  <>
                    <a
                      href={`mailto:${EMAIL_ADDR}?subject=${encodeURIComponent(
                        'Castor — Custom Agent & Workflow Plumbing',
                      )}&body=${encodeURIComponent(
                        `Hi — I'd like to scope custom agent plumbing: shared GPU pool routing, custom tool sandboxes, repo-specific AST gates, and a CI evaluation pipeline.\n\n${workloadBlock}What we're building:`,
                      )}`}
                      className="flex h-11 w-full items-center justify-center rounded-md border border-black/20 bg-white px-4 font-mono text-[12.5px] font-semibold text-[#0E1117] transition-colors hover:border-[#101319]"
                    >
                      Scope My Plumbing
                    </a>
                    <OutlineBtn href={GITHUB} external>
                      Agent architecture docs
                    </OutlineBtn>
                  </>
                )}
                {f.id === 'airgap' && (
                  <>
                    <a
                      href={`mailto:${EMAIL_ADDR}?subject=${encodeURIComponent(
                        'Castor — Air-Gapped On-Prem Pilot',
                      )}&body=${encodeURIComponent(
                        `Hi — I want to scope a 100% local, zero-egress Castor on-prem deployment.\n\n${workloadBlock}Compliance framework: SOC 2 / ISO 27001 / CMMC / HIPAA (please confirm)`,
                      )}`}
                      className="flex h-11 w-full items-center justify-center rounded-md border border-[#F97316]/50 bg-[#F97316]/10 px-4 font-mono text-[12.5px] font-semibold text-[#E04F00] transition-colors hover:border-[#F97316]"
                    >
                      Request Regulated Pilot
                    </a>
                    <OutlineBtn href={AIRGAP_PAGE}>
                      Air-gap deep-dive →
                    </OutlineBtn>
                  </>
                )}
              </div>
            </motion.article>
          ))}
        </div>

        {/* ── Scope & Engagement Brief Builder ──────────────────────── */}
        <BriefBuilder econ={econ} />
      </div>
    </section>
  );
}
