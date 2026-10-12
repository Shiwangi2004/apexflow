import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SlidersIcon, ShieldCheckIcon, RefreshIcon, CarIcon } from '../icons';
import { Badge } from '../primitives/Badge';
import { api } from '../../api/client';
import { QuoteResponse } from '../../api/types';
import { useToast } from '../../context/ToastContext';

// Standard loan amortization calculation
export function calculateLoanPayment(principal: number, annualRatePct: number, months: number): number {
  if (annualRatePct <= 0) return principal / months;
  const monthlyRate = annualRatePct / 100 / 12;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
}

export function calculateAprInterestSavings(msrp: number, promoApr: number, stdApr: number, months: number): number {
  const stdPayment = calculateLoanPayment(msrp, stdApr, months);
  const promoPayment = calculateLoanPayment(msrp, promoApr, months);
  const totalStd = stdPayment * months;
  const totalPromo = promoPayment * months;
  return Math.max(0, Math.round(totalStd - totalPromo));
}

export const DealBuilder: React.FC<{
  onFastClaimPrefill?: (dealData: { vin: string; model: string; msrp: number; amount: number; programId: number }) => void;
}> = ({ onFastClaimPrefill }) => {
  const { addToast } = useToast();

  // Deal Parameters
  const [model, setModel] = useState<'F-150' | 'Explorer' | 'Mustang'>('F-150');
  const [msrp, setMsrp] = useState<number>(54000);
  const [termMonths, setTermMonths] = useState<number>(36);
  const [existingOwner, setExistingOwner] = useState<boolean>(true);
  const [vin, setVin] = useState<string>('1FTFW1ED4PFA29910');

  // Backend Quote State
  const [_backendQuote, setBackendQuote] = useState<QuoteResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Model-specific promotional presets
  const modelSpecs = {
    'F-150': {
      baseCash: 2000,
      promoApr: 1.9,
      standardApr: 6.5,
      cashProgCode: 'FORD-F150-SUMMER-24',
      cashProgId: 1,
      aprProgCode: 'FORD-F150-APR-LOW',
      aprProgId: 5,
    },
    'Explorer': {
      baseCash: 1750,
      promoApr: 2.4,
      standardApr: 6.5,
      cashProgCode: 'FORD-EXPLORER-CASH',
      cashProgId: 6,
      aprProgCode: 'FORD-EXPLORER-APR-36',
      aprProgId: 2,
    },
    'Mustang': {
      baseCash: 1500,
      promoApr: 2.9,
      standardApr: 6.5,
      cashProgCode: 'FORD-MUSTANG-MATCH-24',
      cashProgId: 4,
      aprProgCode: 'FORD-MUSTANG-APR-LOW',
      aprProgId: 7,
    },
  }[model];

  // Loyalty Bonus ($500 if checked)
  const loyaltyBonus = existingOwner ? 500 : 0;

  // Lane A: Stackable Cash + Loyalty
  const laneACashSavings = modelSpecs.baseCash + loyaltyBonus;
  const laneANetPrice = msrp - laneACashSavings;
  const laneAMonthly = calculateLoanPayment(laneANetPrice, modelSpecs.standardApr, termMonths);

  // Lane B: Non-Stackable APR Subvention
  const laneBAprSavings = useMemo(() => {
    return calculateAprInterestSavings(msrp, modelSpecs.promoApr, modelSpecs.standardApr, termMonths);
  }, [msrp, modelSpecs.promoApr, modelSpecs.standardApr, termMonths]);

  const laneBMonthly = calculateLoanPayment(msrp, modelSpecs.promoApr, termMonths);

  // Winner determination
  const isLaneBWinner = laneBAprSavings > laneACashSavings;
  const savingsDelta = Math.abs(laneBAprSavings - laneACashSavings);

  // Max scale for horizontal bar animation
  const maxSavingsScale = Math.max(laneBAprSavings, laneACashSavings, 4000) * 1.15;
  const barAWidthPercent = Math.min((laneACashSavings / maxSavingsScale) * 100, 100);
  const barBWidthPercent = Math.min((laneBAprSavings / maxSavingsScale) * 100, 100);

  // Debounced API quote query
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsCalculating(true);
      try {
        const quote = await api.calculateQuote({
          vin: vin.padEnd(17, '0').substring(0, 17),
          vehicleModel: model,
          msrp: msrp,
          existingOwner: existingOwner,
        });
        setBackendQuote(quote);
      } catch {
        // use local computation
      } finally {
        setIsCalculating(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [model, msrp, termMonths, existingOwner, vin]);

  const handleGenerateVIN = () => {
    const prefixes = { 'F-150': '1FTFW1ED4PFA', 'Explorer': '1FM5K8GC8RGA', 'Mustang': '1FA6P8CF9R5' };
    const randSuffix = Math.floor(10000 + Math.random() * 89999).toString();
    setVin(prefixes[model] + randSuffix);
  };

  const handleApplyToPipeline = () => {
    if (onFastClaimPrefill) {
      onFastClaimPrefill({
        vin,
        model,
        msrp,
        amount: isLaneBWinner ? modelSpecs.baseCash : laneACashSavings,
        programId: modelSpecs.cashProgId,
      });
      addToast({
        type: 'info',
        title: 'QUOTE EXPORTED TO PIPELINE',
        description: `Staged ${model} with VIN ${vin} for Kafka submission`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Deal Builder Parameter Sliders Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Config Panel (5 cols) */}
        <div className="lg:col-span-5 bg-graphite border border-steel chamfer-box panel-ticks p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-steel pb-3">
            <div className="flex items-center gap-2">
              <SlidersIcon size={18} className="text-amber" />
              <h2 className="font-heading text-lg uppercase font-bold tracking-wider text-bone">
                CONFIGURATION DESK
              </h2>
            </div>
            <Badge variant="amber" size="sm">
              LIVE QUOTE MORPH
            </Badge>
          </div>

          {/* Model Selector */}
          <div>
            <label className="block text-xs font-mono uppercase text-titanium mb-2">
              VEHICLE LINEUP
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['F-150', 'Explorer', 'Mustang'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setModel(m);
                    handleGenerateVIN();
                  }}
                  className={`py-2 px-3 text-xs font-mono font-bold uppercase border rounded-[2px] transition-colors flex items-center justify-center gap-1.5 ${
                    model === m
                      ? 'bg-amber text-asphalt border-amber'
                      : 'bg-asphalt text-titanium border-steel hover:text-bone hover:border-titanium'
                  }`}
                >
                  <CarIcon size={14} />
                  <span>{m}</span>
                </button>
              ))}
            </div>
          </div>

          {/* VIN Specifier */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-mono uppercase text-titanium">
                VIN TELEMETRY (17 DIGITS)
              </label>
              <button
                onClick={handleGenerateVIN}
                className="text-[10px] font-mono text-amber hover:underline flex items-center gap-1"
              >
                <RefreshIcon size={10} /> RE-ROLL VIN
              </button>
            </div>
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              maxLength={17}
              className="w-full bg-asphalt p-2.5 border border-steel font-mono text-sm text-bone tracking-widest uppercase focus:border-amber rounded-[2px]"
            />
          </div>

          {/* MSRP Slider */}
          <div>
            <div className="flex items-center justify-between mb-1 font-mono text-xs">
              <span className="text-titanium uppercase">MSRP VALUATION</span>
              <span className="text-bone font-bold text-sm tabular-nums">
                ${msrp.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="28000"
              max="95000"
              step="500"
              value={msrp}
              onChange={(e) => setMsrp(Number(e.target.value))}
              className="w-full accent-amber cursor-pointer bg-steel h-1.5 rounded-lg"
            />
            <div className="flex justify-between text-[10px] font-mono text-titanium mt-1">
              <span>$28,000 BASE</span>
              <span>$95,000 PLATINUM</span>
            </div>
          </div>

          {/* Financing Term Slider */}
          <div>
            <div className="flex items-center justify-between mb-1 font-mono text-xs">
              <span className="text-titanium uppercase">FINANCING DURATION</span>
              <span className="text-mint font-bold text-sm tabular-nums">
                {termMonths} MONTHS
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[36, 48, 60, 72].map((t) => (
                <button
                  key={t}
                  onClick={() => setTermMonths(t)}
                  className={`py-1.5 font-mono text-xs border rounded-[2px] transition-colors ${
                    termMonths === t
                      ? 'bg-mint text-asphalt border-mint font-bold'
                      : 'bg-asphalt text-titanium border-steel hover:text-bone'
                  }`}
                >
                  {t} MOS
                </button>
              ))}
            </div>
          </div>

          {/* Existing Owner Loyalty Toggle */}
          <div className="p-3 bg-asphalt border border-steel rounded-[2px] flex items-center justify-between">
            <div>
              <div className="font-mono text-xs text-bone font-bold">
                OWNER LOYALTY BONUS ($500)
              </div>
              <div className="font-sans text-[11px] text-titanium">
                Current Ford brand registration on record
              </div>
            </div>
            <input
              type="checkbox"
              id="deal-loyalty"
              checked={existingOwner}
              onChange={(e) => setExistingOwner(e.target.checked)}
              className="accent-amber w-5 h-5 cursor-pointer"
            />
          </div>
        </div>

        {/* Right Offer Lanes Showdown (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 bg-graphite border border-steel chamfer-box">
            <div className="flex items-center justify-between mb-3 border-b border-steel/60 pb-2">
              <div>
                <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-bone">
                  STACKED OFFER LANES
                </h3>
                <p className="font-mono text-[11px] text-titanium">
                  HEAD-TO-HEAD SAVINGS ARBITRATION ENGINE
                </p>
              </div>
              {isCalculating && (
                <span className="font-mono text-[10px] text-amber animate-pulse">
                  RE-COMPUTING SPREAD...
                </span>
              )}
            </div>

            {/* LANE A: CASH + LOYALTY */}
            <div
              className={`p-4 border transition-all duration-300 rounded-[2px] relative mb-4 ${
                !isLaneBWinner
                  ? 'bg-graphite border-amber shadow-[0_0_12px_rgba(255,176,32,0.15)] ring-1 ring-amber/50'
                  : 'bg-asphalt/70 border-steel opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={!isLaneBWinner ? 'amber' : 'steel'} size="sm">
                    LANE A: CASH + LOYALTY
                  </Badge>
                  <span className="text-xs font-mono text-titanium">
                    {modelSpecs.baseCash} CASH + {loyaltyBonus} LOYALTY
                  </span>
                </div>
                {!isLaneBWinner && (
                  <span className="font-mono text-[10px] text-amber font-bold tracking-wider uppercase bg-amber/10 border border-amber/30 px-1.5 py-0.5 rounded-[1px]">
                    ★ OPTIMAL SELECTION
                  </span>
                )}
              </div>

              {/* Animated Horizontal Savings Bar */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-titanium">TOTAL SAVINGS VALUE</span>
                  <span className="font-bold text-bone tabular-nums text-sm">
                    ${laneACashSavings.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 w-full bg-asphalt border border-steel rounded-[1px] overflow-hidden">
                  <motion.div
                    className="h-full bg-amber shadow-[0_0_8px_#FFB020]"
                    initial={{ width: 0 }}
                    animate={{ width: `${barAWidthPercent}%` }}
                    transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                  />
                </div>
              </div>

              {/* Monthly breakdown */}
              <div className="flex items-center justify-between text-[11px] font-mono text-titanium pt-2 border-t border-steel/40">
                <span>NET INVOICE: ${laneANetPrice.toLocaleString()}</span>
                <span>EST. PAYMENT: ${Math.round(laneAMonthly)}/MO @ {modelSpecs.standardApr}%</span>
              </div>
            </div>

            {/* LANE B: APR SUBVENTION */}
            <div
              className={`p-4 border transition-all duration-300 rounded-[2px] relative ${
                isLaneBWinner
                  ? 'bg-graphite border-mint shadow-[0_0_12px_rgba(53,242,194,0.15)] ring-1 ring-mint/50'
                  : 'bg-asphalt/70 border-steel opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={isLaneBWinner ? 'mint' : 'steel'} size="sm">
                    LANE B: APR SUBVENTION
                  </Badge>
                  <span className="text-xs font-mono text-mint">
                    {modelSpecs.promoApr}% PROMO APR ({termMonths} MOS)
                  </span>
                </div>
                {isLaneBWinner && (
                  <span className="font-mono text-[10px] text-mint font-bold tracking-wider uppercase bg-mint/10 border border-mint/30 px-1.5 py-0.5 rounded-[1px]">
                    ★ OPTIMAL SELECTION
                  </span>
                )}
              </div>

              {/* Animated Horizontal Savings Bar */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-titanium">LIFETIME INTEREST SAVED</span>
                  <span className="font-bold text-mint tabular-nums text-sm">
                    ${laneBAprSavings.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 w-full bg-asphalt border border-steel rounded-[1px] overflow-hidden">
                  <motion.div
                    className="h-full bg-mint shadow-[0_0_8px_#35F2C2]"
                    initial={{ width: 0 }}
                    animate={{ width: `${barBWidthPercent}%` }}
                    transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                  />
                </div>
              </div>

              {/* Monthly breakdown */}
              <div className="flex items-center justify-between text-[11px] font-mono text-titanium pt-2 border-t border-steel/40">
                <span>MSRP FINANCED: ${msrp.toLocaleString()}</span>
                <span>EST. PAYMENT: ${Math.round(laneBMonthly)}/MO (VS ${Math.round(calculateLoanPayment(msrp, modelSpecs.standardApr, termMonths))}/MO STD)</span>
              </div>
            </div>

            {/* Winner Lock-in Diagnostic Callout */}
            <div className="mt-4 p-4 bg-asphalt border border-amber/50 rounded-[2px] chamfer-box-sm">
              <div className="flex items-center gap-2 mb-1.5 text-amber">
                <ShieldCheckIcon size={16} />
                <span className="font-heading font-bold uppercase tracking-wider text-sm">
                  {isLaneBWinner ? 'APR SUBVENTION WINS ARBITRATION' : 'CASH REBATE WINS ARBITRATION'}
                </span>
              </div>
              <p className="font-mono text-xs text-bone/90 leading-relaxed">
                {isLaneBWinner ? (
                  <>
                    At an MSRP of <span className="text-amber">${msrp.toLocaleString()}</span> over{' '}
                    <span className="text-mint">{termMonths} months</span>, financing at{' '}
                    <span className="text-mint">{modelSpecs.promoApr}% APR</span> prevents{' '}
                    <span className="text-mint font-bold">${laneBAprSavings.toLocaleString()}</span> in total finance
                    charges. This out-benefits Lane A's upfront cash package by{' '}
                    <span className="text-amber font-bold">${savingsDelta.toLocaleString()}</span>.
                  </>
                ) : (
                  <>
                    Lane A delivers <span className="text-amber font-bold">${laneACashSavings.toLocaleString()}</span> in
                    immediate off-invoice equity ($
                    {modelSpecs.baseCash} model rebate + ${loyaltyBonus} owner loyalty). At a term of{' '}
                    {termMonths} months, this exceeds APR subvention value by{' '}
                    <span className="text-amber font-bold">${savingsDelta.toLocaleString()}</span>.
                  </>
                )}
              </p>
            </div>

            {/* Action Bar */}
            <div className="mt-4 pt-3 border-t border-steel flex items-center justify-between">
              <span className="font-mono text-[11px] text-titanium">
                PROMPT VIN: {vin}
              </span>
              <button
                onClick={handleApplyToPipeline}
                className="px-4 py-2 bg-amber hover:bg-amber/90 text-asphalt font-mono text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors"
              >
                STAGE QUOTE TO PIPELINE →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
