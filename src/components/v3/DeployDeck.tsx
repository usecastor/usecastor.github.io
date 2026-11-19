// @client
/**
 * ACT 4 — DeployDeck.
 * Silky infinite CSS marquee of the full engine/client matrix, then three
 * clean modern motion cards (Open Core / Turnkey Sprint / Air-Gap Pilot).
 * The Air-Gap mailto CTA is dynamically enriched from the SavingsInstrument's
 * `castor:economics-update` event so the email carries the visitor's own
 * workload and savings numbers.
 *
 * Zero scroll hijacking, zero stuck opacity.
 */
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check } from 'lucide-react';
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

const INSTALL_CMD = 'npx -y mcp-castor install --client all';

/* ── Marquee items (the full matrix, duplicated for a seamless loop) ── */
const MARQUEE_ITEMS = [
  'Claude Code',
  'Antigravity',
  'Cursor',
  'vLLM 0.33',
  'llama.cpp',
  'SGLang',
  'Ollama',
  'LM Studio',
  'Qwen3.8-27B',
  'Ternary-Bonsai',
  'RTX 3090',
  'Rust AGPL-3.0',
];

/* ── Card definitions ────────────────────────────────────────────────── */

interface CardDef {
  title: string;
  price: string;
  tag: string;
  bullets: string[];
  dark?: boolean;
}

const CARDS: CardDef[] = [
  {
    title: 'Open Core',
    price: '$0',
    tag: 'AGPL-3.0',
    bullets: [
      '3 MCP tools + 5-layer sandbox',
      '27-grammar AST syntax gate',
      'vLLM / llama.cpp / Ollama profiles',
    ],
  },
  {
    title: 'Turnkey Sprint',
    price: '$1,500',
    tag: '48h One-Time',
    bullets: [
      'Custom vLLM / MTP GPU tuning',
      'Sandbox & shell policy hardening',
      'Team IDE rollout',
    ],
  },
  {
    title: 'Air-Gap Pilot',
    price: 'Custom',
    tag: '10–50 Seats',
    bullets: [
      'Commercial dual-license (AGPL opt-out)',
      'Zero-egress air-gap build',
      'CMMC L2 / ITAR / SCIF ledger',
    ],
    dark: true,
  },
];

/* ── Copy button with instant feedback ───────────────────────────────── */

function CopyButton({
  cmd,
  label,
}: {
  cmd: string;
  label: string;
}) {
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
      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#F97316] px-5 font-mono text-[13px] font-semibold text-[#0B0F17] transition-colors hover:bg-[#FB923C]"
    >
      {copied ? (
        <Check size={15} strokeWidth={2.5} />
      ) : (
        <Copy size={15} strokeWidth={2.5} />
      )}
      {copied ? 'Copied' : label}
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

  const buildAirGapMailto = () => {
    const subject = encodeURIComponent('Castor Air-Gap Pilot Inquiry');
    let body = 'Hi — I want to scope a zero-egress Castor air-gap pilot.\n\n';
    if (econ) {
      body += `My workload:\n  • ${econ.modelName} lead · ${econ.teamSize} engineer(s)\n  • ${Math.round(
        econ.monthlyTokensM,
      ).toLocaleString('en-US')}M tokens / month\n  • Est. annual net savings: ${econ.annualSavingsFmt} (castor hybrid ${econ.hybridMonthlyFmt}/mo)\n\n`;
    } else {
      body += 'Team size & monthly token volume: \n\n';
    }
    body += 'Target seats: \nCompliance: CMMC L2 / ITAR / SCIF (please confirm)\n';
    return `mailto:${EMAIL_ADDR}?subject=${subject}&body=${encodeURIComponent(body)}`;
  };

  return (
    <section
      id="deploy"
      className="scroll-mt-20 bg-[#F7F6F2] py-24 text-[#0E1117] lg:py-32"
    >
      {/* ── Silky infinite CSS marquee (full-bleed, edge-masked) ────── */}
      <div
        className="relative mb-16 overflow-hidden border-y border-black/10 bg-[#F2F0EA]"
        style={{
          maskImage:
            'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
        }}
      >
        <div className="marquee-track py-4">
          {[0, 1].map((half) => (
            <span
              key={half}
              aria-hidden={half === 1}
              className="inline-flex items-center"
            >
              {MARQUEE_ITEMS.map((item) => (
                <span
                  key={item}
                  className="mx-6 whitespace-nowrap font-mono text-[13px] font-medium tracking-[0.04em] text-[#4A5568]"
                >
                  {item}
                  <span className="ml-6 text-[#C9C5BA]">·</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* ── Centered header ───────────────────────────────────────── */}
        <header className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.035em]">
            Start free. Scale air-gapped.
          </h2>
        </header>

        {/* ── Three clean motion cards ───────────────────────────────── */}
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-3">
          {CARDS.map((card, i) => (
            <motion.article
              key={card.title}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className={`flex min-w-0 flex-col overflow-hidden rounded-xl border p-6 ${
                card.dark
                  ? 'border-[#0B0F17] bg-[#0B0F17] text-[#F5F7FA] shadow-[0_18px_40px_-18px_rgba(16,19,25,0.5)]'
                  : 'border-black/10 bg-white text-[#0E1117] shadow-[0_1px_2px_rgba(16,19,25,0.04)]'
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3
                  className={`font-display text-xl font-bold tracking-[-0.02em] ${
                    card.dark ? 'text-[#F5F7FA]' : 'text-[#0E1117]'
                  }`}
                >
                  {card.title}
                </h3>
                <span
                  className={`font-mono text-[15px] font-semibold ${
                    card.dark ? 'text-[#FB923C]' : 'text-[#101319]'
                  }`}
                >
                  {card.price}
                </span>
              </div>
              <p
                className={`mt-1 font-mono text-[11.5px] tracking-[0.06em] ${
                  card.dark ? 'text-[#8C95A6]' : 'text-[#6C7484]'
                }`}
              >
                {card.tag}
              </p>

              <ul className="mt-5 flex-1 space-y-2.5">
                {card.bullets.map((b) => (
                  <li
                    key={b}
                    className={`flex items-start gap-2.5 font-mono text-[12.5px] leading-snug ${
                      card.dark ? 'text-[#C7D0DE]' : 'text-[#374151]'
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        card.dark ? 'bg-[#F97316]' : 'bg-[#1D4ED8]'
                      }`}
                      aria-hidden="true"
                    />
                    {b}
                  </li>
                ))}
              </ul>

              {/* CTAs (max 2 per card, 40px+ touch targets) */}
              <div className="mt-7 space-y-2.5">
                {i === 0 && (
                  <>
                    <CopyButton cmd={INSTALL_CMD} label="Copy Install Command" />
                    <a
                      href={GITHUB}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-11 items-center justify-center rounded-lg border border-black/15 font-mono text-[13px] font-medium text-[#0E1117] transition-colors hover:border-[#1D4ED8] hover:text-[#1D4ED8]"
                    >
                      usecastor/castor on GitHub
                    </a>
                  </>
                )}
                {i === 1 && (
                  <a
                    href={`mailto:${EMAIL_ADDR}?subject=${encodeURIComponent(
                      'Castor Turnkey Sprint (48h)',
                    )}&body=${encodeURIComponent('Hi — I want the 48h turnkey sprint: vLLM/MTP tuning, sandbox hardening, team IDE rollout.\n\nStack:\nSeats:')}`}
                    className="flex h-11 w-full items-center justify-center rounded-lg bg-[#0B0F17] px-5 font-mono text-[13px] font-semibold text-[#F5F7FA] transition-colors hover:bg-[#161C28]"
                  >
                    Book the sprint
                  </a>
                )}
                {i === 2 && (
                  <>
                    <a
                      href={buildAirGapMailto()}
                      className="flex h-11 w-full items-center justify-center rounded-lg bg-[#F97316] px-5 font-mono text-[13px] font-semibold text-[#0B0F17] transition-colors hover:bg-[#FB923C]"
                    >
                      Request air-gap pilot
                    </a>
                    <a
                      href={AIRGAP_PAGE}
                      className="flex h-11 items-center justify-center rounded-lg border border-white/15 font-mono text-[13px] font-medium text-[#C7D0DE] transition-colors hover:border-[#F97316]/60 hover:text-[#FB923C]"
                    >
                      Air-gap deep-dive →
                    </a>
                  </>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
