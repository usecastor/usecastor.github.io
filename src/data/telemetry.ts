/**
 * Castor — Telemetry & Architecture Data Layer
 * Source: `castor stats` 78-day snapshot (Sep 4 → Nov 21, 2026),
 * `nvidia-smi` + vLLM 0.33.0 runtime snapshot, `docs/engine-profiles.md`,
 * `scripts/bonsai/README.md`, Qwen3.8-27B model card (Aug 14, 2026),
 * and the Castor `src/` codebase.
 *
 * NOTE on the `LEDGER_76DAY` export name: kept verbatim for API stability
 * (every v3 island and subpage imports it); the underlying window is the
 * 78-day snapshot (2026-09-04 → 2026-11-21).
 */

/* ── Types ─────────────────────────────────────────────────────────── */

export interface Ledger76Day {
  windowStart: string;
  windowEnd: string;
  snapshotDate: string;
  days: number;
  totalTokens: number;
  totalTokensDisplay: string;
  promptTokens: number;
  promptTokensDisplay: string;
  cachedTokens: number;
  cachedTokensDisplay: string;
  cacheHitPct: number;
  completionTokens: number;
  completionTokensDisplay: string;
  reasoningTokens: number;
  reasoningTokensDisplay: string;
  reasoningSharePct: number;
  turns: number;
  sessions: number;
  tasks: number;
  toolCalls: number;
  toolSuccessPct: number;
  surgicalEditRatio: number;
  surgicalEditDetail: string;
  gpuComputeHours: number;
  gpuComputeDisplay: string;
  sessionWallClock: string;
  sustainedDecodeTps: number;
  /** Aggregate decode across n=4 concurrent streams sharing a warm KV prefix. */
  concurrentN4DecodeTps: number;
  effectivePrefillTps: number;
  /** Human-readable source note for the `concurrentN4DecodeTps` figure. */
  benchmarkNote: string;
  cloudCounterfactualUsd: number;
  electricityUsd: number;
  electricityKwh: number;
  electricityRateUsdPerKwh: number;
  gpuTdpW: number;
  netSavingsUsd: number;
  netSavingsPct: number;
}

export interface HardwareSnapshot {
  asOf: string;
  gpu: {
    model: string;
    vramTotalMiB: number;
    vramUsedMiB: number;
    powerDrawW: number;
    powerLimitW: number;
    tempC: number;
    driver: string;
  };
  engine: {
    name: string;
    model: string;
    maxModelLen: number;
    liveDraftAcceptancePct: number;
    meanAcceptanceLen: number;
    liveAvgTtftS: number;
    livePrefixHitPct: number;
  };
}

export interface VramTier {
  vram: string;
  engine: string;
  context: string;
  decode: string;
  highlight?: boolean;
}

export interface CloudModel {
  name: string;
  vendor: 'anthropic' | 'openai' | 'google';
  priceInPer1m: number;
  priceOutPer1m: number;
  priceNote?: string;
  note?: string;
}

export interface QwenBench {
  suite: string;
  score: number;
}

export interface ArchitectureSpec {
  pathLayers: number;
  securityTestVectors: number;
  securityBlocked: number;
  securityAllowed: number;
  treeSitterGrammars: number;
  mcpTools: number;
  toolCount: {
    leanCore: number;
    ast: number;
    paper: number;
  };
  ports: {
    engine: number;
    status: number;
    proxy: number;
  };
  links: {
    github: string;
    releases: string;
    npm: string;
    email: string;
  };
}

export interface PositioningFront {
  id: string;
  title: string;
  description: string;
}

/* ── Data: 78-day ledger (Sep 4 – Nov 21, 2026, `castor stats`) ─────── */

export const LEDGER_76DAY: Ledger76Day = {
  windowStart: '2026-09-04',
  windowEnd: '2026-11-21',
  snapshotDate: '2026-11-21',
  days: 78,
  totalTokens: 2_770_000_000,
  totalTokensDisplay: '2.77B',
  promptTokens: 2_710_000_000,
  promptTokensDisplay: '2.71B',
  cachedTokens: 2_530_000_000,
  cachedTokensDisplay: '2.53B',
  cacheHitPct: 93.8,
  completionTokens: 62_150_000,
  completionTokensDisplay: '62.15M',
  reasoningTokens: 52_580_000,
  reasoningTokensDisplay: '52.58M',
  reasoningSharePct: 84.6,
  turns: 49_414,
  sessions: 1_187,
  tasks: 228,
  toolCalls: 67_506,
  toolSuccessPct: 97.0,
  surgicalEditRatio: 3.67,
  surgicalEditDetail: 'surgical edit_file vs full write_file rewrites',
  gpuComputeHours: 224.93,
  gpuComputeDisplay: '224h 56m',
  sessionWallClock: '160h 30m',
  sustainedDecodeTps: 70.4,
  concurrentN4DecodeTps: 260,
  effectivePrefillTps: 3_247,
  benchmarkNote:
    '260 tok/s aggregate decode across n=4 concurrent streams sharing a warm KV prefix. 70.4 tok/s sustained single-stream decode.',
  cloudCounterfactualUsd: 6_044.48,
  electricityUsd: 10.12,
  electricityKwh: 56.2,
  electricityRateUsdPerKwh: 0.18,
  gpuTdpW: 250,
  netSavingsUsd: 6_034.36,
  netSavingsPct: 99.83,
};

/* ── Data: Hardware & vLLM 0.33.0 snapshot (Nov 21, 2026) ──────────── */

export const HARDWARE_SNAPSHOT: HardwareSnapshot = {
  asOf: '2026-11-21',
  gpu: {
    model: 'NVIDIA GeForce RTX 3090',
    vramTotalMiB: 24_576,
    vramUsedMiB: 23_869,
    powerDrawW: 244.6,
    powerLimitW: 262.5,
    tempC: 56,
    driver: '616.92',
  },
  engine: {
    name: 'vLLM 0.33.0',
    model: 'Qwen3.8-27B-W4A16-AutoRound-fast',
    maxModelLen: 150_000,
    liveDraftAcceptancePct: 70.5,
    meanAcceptanceLen: 3.45,
    liveAvgTtftS: 3.22,
    livePrefixHitPct: 93.8,
  },
};

/* ── Data: VRAM hardware tiers ─────────────────────────────────────── */

export const VRAM_TIERS: VramTier[] = [
  {
    vram: '8–12 GB GPUs',
    engine: 'llama.cpp / Ollama',
    context: '7B–14B coding models (W4A16 / Q4_K_M)',
    decode: '~22–53 tok/s depending on model & quant',
  },
  {
    vram: '16 GB GPUs',
    engine: 'llama.cpp / Ollama',
    context: '14B–22B local models or heavily quantized 27B (Ternary-Bonsai-2-27B-PQ2_0)',
    decode: '~38–53 tok/s',
  },
  {
    vram: '24 GB+ Desktop GPUs (RTX 3090, RTX 4090, RTX A5000 Desktop, RTX 5090)',
    engine: 'vLLM 0.33.0 + Qwen3.8-27B-W4A16',
    context: '150K KV pool',
    decode: '70.4 tok/s sustained n=1 · 260 tok/s n=4 concurrent',
    highlight: true,
  },
];

/* ── Data: Nov 2026 cloud frontier models & API pricing (per 1M tokens) ─ */

export const CLOUD_MODELS: CloudModel[] = [
  {
    name: 'Claude Opus 5.5',
    vendor: 'anthropic',
    priceInPer1m: 4,
    priceOutPer1m: 20,
  },
  {
    name: 'GPT-6.2 Astra',
    vendor: 'openai',
    priceInPer1m: 8,
    priceOutPer1m: 40,
  },
  {
    name: 'Gemini 4 Argon',
    vendor: 'google',
    priceInPer1m: 2,
    priceOutPer1m: 10,
    priceNote: 'intro rate (active Nov 2026); $4/$20 standard from Dec 1, 2026',
  },
  {
    name: 'Claude Sonnet 5.5',
    vendor: 'anthropic',
    priceInPer1m: 2,
    priceOutPer1m: 10,
  },
  {
    name: 'GPT-6.2 Sol',
    vendor: 'openai',
    priceInPer1m: 2,
    priceOutPer1m: 10,
  },
  {
    name: 'Claude Haiku 5.5',
    vendor: 'anthropic',
    priceInPer1m: 0.1,
    priceOutPer1m: 0.5,
    priceNote: '≤100K context; $0.50/$2.50 per 1M above 100K',
  },
];

export const CLOUD_MODELS_VERIFIED_ON = '2026-11-16';

/* ── Data: Qwen3.8-27B Apache-2.0 vendor benchmarks (Aug 14, 2026 model card) ─ */

export const QWEN38_BENCHMARKS: QwenBench[] = [
  { suite: 'SWE-bench Pro', score: 61.7 },
  { suite: 'LiveCodeBench v6', score: 90.3 },
  { suite: 'Terminal-Bench 2.1', score: 73.0 },
  { suite: 'OSWorld-Verified', score: 84.3 },
];

export const QWEN38_MODEL_CARD_DATE = '2026-08-14';
export const QWEN38_LICENSE = 'Apache-2.0';

/* ── Data: Sandbox & architecture specs ─────────────────────────────── */

export const ARCHITECTURE: ArchitectureSpec = {
  pathLayers: 5,
  securityTestVectors: 137,
  securityBlocked: 123,
  securityAllowed: 14,
  treeSitterGrammars: 27,
  mcpTools: 3,
  toolCount: {
    leanCore: 8,
    ast: 2,
    paper: 1,
  },
  ports: {
    engine: 18_020,
    status: 18_021,
    proxy: 18_022,
  },
  links: {
    github: 'https://github.com/usecastor/castor',
    releases: 'https://github.com/usecastor/castor/releases',
    npm: 'https://www.npmjs.com/package/mcp-castor',
    email: 'mailto:m.abdullah.ali.2523@gmail.com',
  },
};

/* ── Data: Four buyer-facing positioning fronts ────────────────────── */

export const POSITIONING_FRONTS: PositioningFront[] = [
  {
    id: 'wing-hybrid',
    title: 'Wing 1 · Cloud + Local Hybrid',
    description:
      'Keep Claude Code, Antigravity, Cursor, or Codex as your frontier architect for the hard reasoning — while the 90% of file reads, code searches, AST edits, and test runs route to your local GPU at $0 per token.',
  },
  {
    id: 'wing-local',
    title: 'Wing 2 · 100% Local-Only & Air-Gapped',
    description:
      'Run coding agents entirely on your own GPU workstations or on-prem servers — zero cloud API calls, zero code egress, fully self-contained for regulated and offline environments.',
  },
  {
    id: 'service-inference',
    title: 'Turnkey GPU & Inference Setup · vLLM / KV-Cache Tuning',
    description:
      'We stand up your dedicated inference hardware in a day and tune vLLM KV-cache, MTP/DFlash2 speculative decode, and quantization to your exact model, GPU, and workload.',
  },
  {
    id: 'service-plumbing',
    title: 'Custom Agent Workflow Plumbing',
    description:
      'Agent orchestration, sandbox & shell-policy hardening, and team IDE rollout for engineering teams — wired directly into the tool loop your agents already run.',
  },
];

/* ── Formatting helpers ─────────────────────────────────────────────── */

export function formatInt(n: number): string {
  return n.toLocaleString('en-US');
}

export function formatUsd(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPct(n: number): string {
  return `${n.toLocaleString('en-US')}%`;
}

export function formatTps(n: number): string {
  return n.toLocaleString('en-US');
}
