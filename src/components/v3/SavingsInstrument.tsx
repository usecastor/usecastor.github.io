// @client
/**
 * ACT 3 — SavingsInstrument.
 * Deep-silicon (#06080D) pointer-spotlight ROI calculator: three workload
 * presets, six frontier model pills (verified Nov-2026 official rates), two
 * sliders, one cache-rate toggle, and a live NumberFlow annual-savings
 * readout. Dispatches `castor:economics-update` so the DeployDeck enriches
 * its mailto CTAs with the visitor's actual numbers.
 *
 * Zero scroll hijacking, zero stuck opacity.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
} from 'motion/react';
import { NumberFlowGroup } from '@number-flow/react';
import SafeNumberFlow from './SafeNumberFlow';
import { CLOUD_MODELS, type CloudModel } from '../../data/telemetry';
import {
  computeEconomics,
  dispatchEconomicsUpdate,
  fmtPayback,
  fmtUsd,
  type CalcInputs,
  type EconomicsUpdateDetail,
} from '../../scripts/economics-calc';

/* ── Model selection: six frontier models from the verified ledger ────
   Fable 5.2, GPT-6.2 Astra, Opus 5.5 (default), Gemini 4, Sonnet 5.5,
   Haiku 5.5 — indices map into CLOUD_MODELS in telemetry.ts. */
const MODEL_INDICES = [0, 1, 2, 3, 4, 6];
const DEFAULT_MODEL_INDEX = 2; // Claude Opus 5.5

/* Crisp short labels for the pill face (keep the price visible at 390px).
   The full official model name stays in the `title` / aria-label and is
   what's published into the DeployDeck mailto CTA. */
const SHORT_LABELS = [
  'Fable 5.2',
  'GPT-6.2 Astra',
  'Opus 5.5',
  'Gemini 4',
  'Sonnet 5.5',
  'Haiku 5.5',
];

const PRESETS: Array<{
  key: string;
  label: string;
  sub: string;
  team: number;
  volume: number;
  offload: number;
  rate: number;
}> = [
  { key: 'solo', label: 'Solo', sub: '1× 3090', team: 1, volume: 200, offload: 90, rate: 0.18 },
  { key: 'team5', label: '5-Eng Team', sub: '150M', team: 5, volume: 150, offload: 85, rate: 0.18 },
  { key: 'airgap', label: '25-Seat Air-Gap', sub: '180M', team: 25, volume: 180, offload: 90, rate: 0.14 },
];
const DEFAULT_PRESET_KEY = 'team5';

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

  const [presetKey, setPresetKey] = useState(DEFAULT_PRESET_KEY);
  const [modelIdx, setModelIdx] = useState(DEFAULT_MODEL_INDEX);
  const preset = PRESETS.find((p) => p.key === presetKey) ?? PRESETS[1];

  const [team, setTeam] = useState(preset.team);
  const [volume, setVolume] = useState(preset.volume);
  const [discount, setDiscount] = useState(true); // 70% cloud-cache discount

  const model: CloudModel = CLOUD_MODELS[MODEL_INDICES[modelIdx]];

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

  const cloudPct = o.cloudOnlyUsd > 0 ? 100 : 100;
  const hybridPct = o.cloudOnlyUsd > 0 ? (o.hybridTotalUsd / o.cloudOnlyUsd) * 100 : 0;
  const isHaiku = model.name === 'Claude Haiku 5.5';

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

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setPresetKey(p.key);
    setTeam(p.team);
    setVolume(p.volume);
  };

  return (
    <section
      id="savings"
      className="scroll-mt-20 bg-[#06080D] py-24 text-[#F5F7FA] lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* ── Crisp header ──────────────────────────────────────────── */}
        <header className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.035em] text-[#F5F7FA]">
            Run the math on your team.
          </h2>
          <p className="mx-auto mt-4 text-base text-[#8C95A6] sm:text-lg">
            Verified November 2026 official API rates.
          </p>
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
              {/* Workload presets */}
              <div>
                <p className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#5D6B80]">
                  Workload
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => applyPreset(p)}
                      aria-pressed={p.key === presetKey}
                      className="relative min-h-[44px] rounded-lg border border-white/12 bg-black/30 px-3.5 font-mono text-[12px] text-[#A3AEBF] transition-colors hover:text-[#F5F7FA]"
                    >
                      {p.key === presetKey && (
                        <motion.span
                          layoutId="calc-preset"
                          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          className="absolute inset-0 rounded-lg border border-[#3B82F6]/40 bg-[#131A26]"
                        />
                      )}
                      <span className="relative z-10 flex flex-col items-start leading-tight">
                        <span className={p.key === presetKey ? 'text-[#F5F7FA]' : ''}>{p.label}</span>
                        <span className="text-[10px] text-[#5D6B80]">{p.sub}</span>
                      </span>
                    </button>
                  ))}
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
                        title={`${m.name} · ${m.priceInPer1m} / ${m.priceOutPer1m} per 1M`}
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

              {/* Sliders */}
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

              {/* Cache-rate toggle */}
              <button
                type="button"
                onClick={() => setDiscount((d) => !d)}
                role="switch"
                aria-checked={discount}
                className="flex min-h-[44px] w-full items-center justify-between rounded-lg border border-white/12 bg-black/30 px-4 py-2.5 font-mono text-[12px]"
              >
                <span className={discount ? 'text-[#F5F7FA]' : 'text-[#A3AEBF]'}>
                  {discount ? '70% Cloud Cache Discount' : 'List Rate'}
                </span>
                <span
                  className={`relative h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${discount ? 'bg-[#3B82F6]' : 'bg-white/15'}`}
                  aria-hidden="true"
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-white transition-transform ${discount ? 'translate-x-5' : 'translate-x-0'}`}
                  />
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

                {/* 3-stat strip — single-line labels on every viewport */}
                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Stat label="Cloud-Only / Mo" value={o.cloudOnlyUsd} color="text-[#5B9BFF]" />
                  <Stat label="Hybrid / Mo" value={o.hybridTotalUsd} color="text-[#F5F7FA]" />
                  <Stat
                    label="3090 Payback"
                    value={undefined}
                    text={fmtPayback(o.paybackMonths)}
                    color="text-[#FB923C]"
                  />
                </div>

                {/* Cloud-only vs hybrid comparison bar */}
                <div className="mt-8">
                  <div className="mb-1.5 flex items-center justify-between font-mono text-[10.5px] text-[#5D6B80]">
                    <span>Cloud-only</span>
                    <span>Castor hybrid</span>
                  </div>
                  {/* Cloud-only bar (full) */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full bg-[#3B82F6]"
                      initial={false}
                      animate={{ width: `${cloudPct}%` }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                  </div>
                  {/* Hybrid bar (proportional) */}
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full bg-[#F97316]"
                      initial={false}
                      animate={{ width: `${Math.max(hybridPct, 3)}%` }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                  </div>
                </div>

                {/* Calm Haiku compliance callout */}
                {isHaiku && (
                  <p className="mt-6 rounded-lg border border-white/10 bg-black/30 px-4 py-3 font-mono text-[11.5px] leading-relaxed text-[#8C95A6]">
                    At Haiku 5.5&apos;s budget rates the savings shrink — for
                    most agentic workloads, keep the frontier lead in the cloud
                    and offload only the high-volume local loop.
                  </p>
                )}
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
      <p className="whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#5D6B80]">
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
        <p className={`mt-1 font-mono text-[14px] font-semibold leading-snug ${color}`}>
          {text}
        </p>
      )}
    </div>
  );
}
