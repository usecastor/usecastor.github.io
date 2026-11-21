// @client
/**
 * ACT 3 — SavingsInstrument.
 * Deep-silicon (#06080D) pointer-spotlight ROI calculator: three workload
 * presets (only one highlighted at a time, and only while its exact
 * (engineers, monthlyTokensM) pair is live), six frontier model pills
 * (verified Nov-2026 official rates), two sliders, one cache-discount
 * toggle with a clear ON/OFF badge, three dynamic comparison bars
 * (cloud burn vs Castor hybrid vs hardware break-even timeline with
 * 1st-year ROI fill), and a live NumberFlow annual-savings readout.
 * Dispatches `castor:economics-update` so the DeployDeck enriches its
 * mailto CTAs with the visitor's actual numbers.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'motion/react';
import { NumberFlowGroup } from '@number-flow/react';
import SafeNumberFlow from './SafeNumberFlow';
import { CLOUD_MODELS, type CloudModel } from '../../data/telemetry';
import {
  computeEconomics,
  dispatchEconomicsUpdate,
  fmtUsd,
  type CalcInputs,
  type EconomicsUpdateDetail,
} from '../../scripts/economics-calc';

/* ── Model selection: six frontier models from the verified ledger ────
   Opus 5.5 (default), GPT-6.2 Astra, Gemini 4 Argon, Sonnet 5.5,
   GPT-6.2 Sol, Haiku 5.5 — indices map into CLOUD_MODELS in telemetry.ts. */
const MODEL_INDICES = [0, 1, 2, 3, 4, 5];
const DEFAULT_MODEL_INDEX = 0; // Claude Opus 5.5

/* Crisp short labels for the pill face (keep the price visible at 390px).
   The full official model name stays in the `title` / aria-label and is
   what's published into the DeployDeck mailto CTA. */
const SHORT_LABELS = [
  'Opus 5.5',
  'GPT-6.2 Astra',
  'Gemini 4 Argon',
  'Sonnet 5.5',
  'GPT-6.2 Sol',
  'Haiku 5.5',
];

/* ── Workload presets ──────────────────────────────────────────────────
   A preset is highlighted ONLY while the live (team, volume) values
   actually match it; moving either slider clears the highlight at once. */
const PRESETS: Array<{
  key: string;
  label: string;
  sub: string;
  team: number;
  volume: number;
  offload: number;
  rate: number;
}> = [
  { key: 'solo', label: 'Solo', sub: '1 × 3090', team: 1, volume: 200, offload: 90, rate: 0.18 },
  { key: 'team5', label: '5-Eng Team', sub: '150M', team: 5, volume: 150, offload: 85, rate: 0.18 },
  { key: 'airgap', label: '25-Seat Air-Gap', sub: '180M', team: 25, volume: 180, offload: 90, rate: 0.14 },
];

/* ── Hardware tiers for the break-even timeline bar ───────────────────
   `label` is the full descriptive name; `rigShortName` is the crisp
   short label used in the KPI card + break-even bar so nothing
   truncates at 1440×900 or 390px. Prices are realistic Nov 2026
   street prices for the full rig / workstation. */
const HW_TIERS = [
  {
    key: 'solo',
    label: '1× RTX 3090',
    rigShortName: 'RTX 3090 Rig (~$1,400)',
    sub: 'solo dev',
    cost: 1400,
    maxTeam: 4,
  },
  {
    key: 'team',
    label: '1× RTX 5090 Workstation',
    rigShortName: 'RTX 5090 Workstation (~$4,500)',
    sub: 'small team',
    cost: 4500,
    maxTeam: 14,
  },
  {
    key: 'node',
    label: 'Multi-GPU Team vLLM Node',
    rigShortName: 'Multi-GPU Team Server (~$18,000)',
    sub: '15+ engineers',
    cost: 18000,
    maxTeam: Infinity,
  },
] as const;

function pickHwTier(team: number): (typeof HW_TIERS)[number] {
  return HW_TIERS.find((t) => team <= t.maxTeam) ?? HW_TIERS[HW_TIERS.length - 1];
}

/* ── Root ────────────────────────────────────────────────────────────── */

export default function SavingsInstrument() {
  const cardRef = useRef<HTMLDivElement>(null);

  // Pointer spotlight (useMotionValue + useMotionTemplate → silky radial)
  const sx = useMotionValue(50);
  const sy = useMotionValue(40);
  const spotlight = useMotionTemplate`radial-gradient(560px circle at ${sx}% ${sy}%, rgba(59,130,246,0.13), rgba(249,115,22,0.06) 42%, transparent 70%)`;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    sx.set(((e.clientX - r.left) / r.width) * 100);
    sy.set(((e.clientY - r.top) / r.height) * 100);
  };

  const [team, setTeam] = useState(5); // 5-Eng Team preset
  const [volume, setVolume] = useState(150);
  const [modelIdx, setModelIdx] = useState(DEFAULT_MODEL_INDEX);
  const [discount, setDiscount] = useState(true); // 90% cloud prompt-cache read discount

  const model: CloudModel = CLOUD_MODELS[MODEL_INDICES[modelIdx]];

  /* Preset highlight — value-matched, not click-matched: a preset only
     carries `aria-pressed="true"` (and its pill) while the live
     (team, volume) values actually equal that preset's. */
  const activePreset =
    PRESETS.find((p) => p.team === team && p.volume === volume) ?? null;

  /* Offload/electricity follow the active preset when one matches, and
     fall back to the 5-Eng Team calibration when the sliders are
     dragged off-preset. */
  const preset = activePreset ?? PRESETS[1];

  const inputs: CalcInputs = useMemo(
    () => ({
      model,
      teamSize: team,
      tokensPerEngineerM: volume,
      localOffloadPct: preset.offload,
      electricityRate: preset.rate,
      useRealAgenticCache: discount,
    }),
    [model, team, volume, preset, discount],
  );

  const o = useMemo(() => computeEconomics(inputs), [inputs]);

  /* ── Dynamic bar scaling ────────────────────────────────────────────
     Cloud-Only burn anchors the scale at 100%; the Castor Hybrid bar
     is proportional to it; the 3rd bar is the hardware break-even
     timeline for the team-size-matched rig, with a fill showing the
     1st-year ROI multiple (capped at the scale ceiling). */
  const hw = pickHwTier(team);
  const paybackMonths =
    o.monthlySavingsUsd > 0 ? hw.cost / o.monthlySavingsUsd : null;
  const roiYears = o.monthlySavingsUsd > 0 ? (12 * o.monthlySavingsUsd) / hw.cost : 0;
  const roiMultiple = Math.max(0, roiYears); // $ returned in year 1 per $1 of hardware
  const roiFillPct =
    paybackMonths === null ? 0 : Math.min(100, (12 / paybackMonths) * 50); // 50% scale = 1× ROI
  const paybackDisplay =
    paybackMonths === null
      ? '—'
      : paybackMonths < 1
        ? `${Math.max(1, Math.round(paybackMonths * 30.4))} days`
        : paybackMonths < 2
          ? `≈ ${(paybackMonths * 4.345).toFixed(1)} weeks`
          : paybackMonths < 12
            ? `≈ ${paybackMonths.toFixed(1)} months`
            : `≈ ${(paybackMonths / 12).toFixed(1)} years`;

  // Publish live state for the DeployDeck's dynamic mailto CTAs.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const detail: EconomicsUpdateDetail = {
      modelName: model.name,
      teamSize: team,
      monthlyTokensM: o.totalTokensM,
      annualSavingsFmt: fmtUsd(o.annualSavingsUsd),
      hybridMonthlyFmt: fmtUsd(o.hybridTotalUsd),
    };
    dispatchEconomicsUpdate(detail);
  }, [model.name, team, o.totalTokensM, o.annualSavingsUsd, o.hybridTotalUsd]);

  return (
    <section
      id="savings"
      className="dark-surface scroll-mt-20 bg-[#06080D] py-24 text-[#F5F7FA] lg:py-32"
    >
      {/* Both #savings and #economics anchors resolve to this section. */}
      <div id="economics" className="sr-only" aria-hidden="true" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* ── Folio bar ─────────────────────────────────────────────── */}
        <div className="folio-bar text-[#8C95A6]">
          <span className="folio-coord">
            02 // Team &amp; Hardware Economics
          </span>
          <span className="folio-index">02 / 04</span>
        </div>

        {/* ── Left-aligned asymmetric header (no text-center) ───────── */}
        <header className="asymmetric-spread mt-8">
          <div className="min-w-0">
            <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.035em] text-[#F5F7FA]">
              Run the math{' '}
              <br className="hidden sm:block" />
              on your team.
            </h2>
          </div>
          <div className="prose-measure min-w-0">
            <p className="max-w-[42ch] text-base leading-relaxed text-[#8C95A6] sm:text-lg">
              Estimate your monthly token burn, hybrid savings, and GPU
              hardware break-even.
            </p>
          </div>
        </header>

        {/* ── Pointer-spotlight glass card ──────────────────────────── */}
        <div
          ref={cardRef}
          onMouseMove={onMove}
          className="relative mx-auto mt-12 max-w-5xl overflow-hidden rounded-xl border border-white/10 bg-[#0B0F17] p-6 sm:p-10"
        >
          {/* Silky radial spotlight tracking the pointer */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: spotlight }}
          />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_1.1fr]">
            {/* ── Left controls ─────────────────────────────────────── */}
            <div className="min-w-0 space-y-7">
              {/* Workload presets — value-matched highlight */}
              <div>
                <p className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#5D6B80]">
                  Workload
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => {
                    const pressed = activePreset?.key === p.key;
                    return (
                      <button
                        key={p.key}
                        onClick={() => {
                          setTeam(p.team);
                          setVolume(p.volume);
                        }}
                        aria-pressed={pressed}
                        className="relative min-h-[44px] rounded-lg border border-white/12 bg-black/30 px-3.5 font-mono text-[12px] text-[#A3AEBF] transition-colors hover:text-[#F5F7FA]"
                      >
                        {pressed && (
                          <motion.span
                            layoutId="calc-preset"
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                            className="absolute inset-0 rounded-lg border border-[#3B82F6]/40 bg-[#131A26]"
                          />
                        )}
                        <span className="relative z-10 flex flex-col items-start leading-tight">
                          <span className={pressed ? 'text-[#F5F7FA]' : ''}>
                            {p.label}
                          </span>
                          <span className="text-[10px] text-[#5D6B80]">
                            {p.sub}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Model pills */}
              <div>
                <p className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#5D6B80]">
                  Frontier lead
                </p>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  {MODEL_INDICES.map((ci, i) => {
                    const m = CLOUD_MODELS[ci];
                    const active = i === modelIdx;
                    const short = SHORT_LABELS[i] ?? m.name;
                    return (
                      <button
                        key={m.name}
                        onClick={() => setModelIdx(i)}
                        aria-pressed={active}
                        title={`${m.name} · $${m.priceInPer1m} / $${m.priceOutPer1m} per 1M`}
                        aria-label={`Select ${m.name} at ${m.priceInPer1m} in, ${m.priceOutPer1m} out per million tokens`}
                        className="relative min-h-[40px] w-full rounded-lg border border-white/12 bg-black/30 px-2.5 font-mono text-[11px] leading-tight text-[#A3AEBF] transition-colors hover:text-[#F5F7FA] sm:w-auto sm:px-3 sm:text-[12px]"
                      >
                        {active && (
                          <motion.span
                            layoutId="calc-model"
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                            className="absolute inset-0 rounded-lg border border-[#3B82F6]/40 bg-[#131A26]"
                          />
                        )}
                        <span className="relative z-10 block truncate">
                          {short}
                          <span className="ml-1.5 text-[10px] text-[#5D6B80]">
                            ${m.priceInPer1m}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sliders — dragging either immediately clears any preset */}
              <div className="space-y-5">
                <Slider
                  label="Engineers"
                  min={1}
                  max={100}
                  step={1}
                  value={team}
                  display={team === 1 ? '1 engineer' : `${team} engineers`}
                  onChange={setTeam}
                />
                <Slider
                  label="Monthly volume / engineer"
                  min={20}
                  max={500}
                  step={5}
                  value={volume}
                  display={`${volume}M tokens`}
                  onChange={setVolume}
                />
              </div>

              {/* Cache-discount toggle — consistent label + ON/OFF badge */}
              <button
                type="button"
                onClick={() => setDiscount((d) => !d)}
                role="switch"
                aria-checked={discount}
                className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg border border-white/12 bg-black/30 px-4 py-2.5 font-mono text-[12px]"
              >
                <span
                  className={`min-w-0 ${discount ? 'text-[#F5F7FA]' : 'text-[#A3AEBF]'}`}
                >
                  90% Cloud Prompt-Cache Read Discount
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] ${
                      discount
                        ? 'bg-[#3B82F6]/20 text-[#5B9BFF]'
                        : 'bg-white/10 text-[#5D6B80]'
                    }`}
                  >
                    {discount ? 'ON' : 'OFF'}
                  </span>
                  <span
                    className={`relative h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${discount ? 'bg-[#3B82F6]' : 'bg-white/15'}`}
                    aria-hidden="true"
                  >
                    <span
                      className={`block h-5 w-5 rounded-full bg-white transition-transform ${discount ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </span>
                </span>
              </button>
            </div>

            {/* ── Right live readout ────────────────────────────────── */}
            <div className="min-w-0 flex flex-col justify-center">
              <NumberFlowGroup>
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#5D6B80]">
                  Annual net savings
                </p>
                <SafeNumberFlow
                  value={o.annualSavingsUsd}
                  prefix="$"
                  format={{ maximumFractionDigits: 0 }}
                  className="mt-1 font-display text-[clamp(3rem,7vw,5rem)] font-bold leading-none tracking-[-0.04em] text-[#FB923C]"
                />

                {/* 3-stat strip */}
                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Stat label="Cloud-Only / Mo" value={o.cloudOnlyUsd} color="text-[#5B9BFF]" />
                  <Stat label="Castor Hybrid / Mo" value={o.hybridTotalUsd} color="text-[#F5F7FA]" />
                  <Stat
                    label={`1× ${hw.rigShortName}`}
                    value={undefined}
                    text={paybackDisplay}
                    color="text-[#FB923C]"
                  />
                </div>

                {/* ── Dynamic comparison bars ─────────────────────────
                    All three bars rescale live from the same cloud-burn
                    anchor whenever any input changes. */}
                <div className="mt-8 space-y-3">
                  {/* 1 · Cloud-only monthly burn (anchor, 100%) */}
                  <div>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3 font-mono text-[10.5px] text-[#5D6B80]">
                      <span className="shrink-0">Cloud-Only Monthly Burn</span>
                      <SafeNumberFlow
                        value={o.cloudOnlyUsd}
                        prefix="$"
                        format={{ maximumFractionDigits: 0 }}
                        className="tabular text-[#8C95A6]"
                      />
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full bg-[#3B82F6]"
                        initial={false}
                        animate={{ width: '100%' }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                      />
                    </div>
                  </div>

                  {/* 2 · Castor hybrid (proportional to the anchor) */}
                  <div>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3 font-mono text-[10.5px] text-[#5D6B80]">
                      <span className="shrink-0">Castor Hybrid (Cloud + $0 Local)</span>
                      <SafeNumberFlow
                        value={o.hybridTotalUsd}
                        prefix="$"
                        format={{ maximumFractionDigits: 0 }}
                        className="tabular text-[#8C95A6]"
                      />
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full bg-[#F97316]"
                        initial={false}
                        animate={{
                          width: `${o.cloudOnlyUsd > 0 ? Math.max((o.hybridTotalUsd / o.cloudOnlyUsd) * 100, 2) : 2}%`,
                        }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                      />
                    </div>
                  </div>

                  {/* 3 · Hardware break-even timeline + 1st-year ROI fill */}
                  <div>
                    <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 font-mono text-[10.5px] text-[#5D6B80]">
                      <span className="whitespace-nowrap">
                        Hardware Payback · {hw.rigShortName}
                      </span>
                      <span className="shrink-0 whitespace-nowrap tabular text-[#8C95A6]">
                        {paybackDisplay} · Year-1 ROI {roiMultiple.toFixed(1)}×
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full bg-[#22C55E]"
                        initial={false}
                        animate={{ width: `${Math.max(roiFillPct, 2)}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                      />
                    </div>
                  </div>
                </div>
              </NumberFlowGroup>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Small controls ──────────────────────────────────────────────────── */

function Slider({
  label,
  min,
  max,
  step,
  value,
  display,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between font-mono text-[12px]">
        <span className="text-[#8C95A6]">{label}</span>
        <span className="text-[#F5F7FA]">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#F97316]"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  text,
  color,
}: {
  label: string;
  value?: number;
  text?: string;
  color: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/30 px-3.5 py-3">
      <p className="font-mono text-[10.5px] uppercase leading-snug tracking-[0.06em] text-[#5D6B80]">
        {label}
      </p>
      {value !== undefined ? (
        <SafeNumberFlow
          value={value}
          prefix="$"
          format={{ maximumFractionDigits: 0 }}
          className={`mt-1 font-mono text-[19px] font-semibold ${color}`}
        />
      ) : (
        <p className={`mt-1 font-mono text-[13px] font-semibold leading-snug ${color}`}>
          {text}
        </p>
      )}
    </div>
  );
}
