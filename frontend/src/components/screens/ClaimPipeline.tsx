import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PipelineIcon, ShieldCheckIcon, AlertOctagonIcon, TerminalIcon, CheckIcon } from '../icons';
import { Badge } from '../primitives/Badge';
import { api } from '../../api/client';
import { Claim, SubmitClaimInput } from '../../api/types';
import { useToast } from '../../context/ToastContext';

type PipelineStage = 'IDLE' | 'SUBMITTED' | 'KAFKA' | 'VALIDATING' | 'COMPLETED';

interface PipelineProps {
  initialPrefill?: {
    vin: string;
    model: string;
    msrp: number;
    amount: number;
    programId: number;
  } | null;
}

export const ClaimPipeline: React.FC<PipelineProps> = ({ initialPrefill }) => {
  const { addToast, showRejectReceipt } = useToast();

  // Submission Form State
  const [formData, setFormData] = useState<SubmitClaimInput>({
    vin: initialPrefill?.vin || '1FTFW1ED8PFA33012',
    dealerId: 'DEALER-EAST-01',
    programId: initialPrefill?.programId || 1,
    vehicleModel: initialPrefill?.model || 'F-150',
    msrp: initialPrefill?.msrp || 54000,
    claimedAmount: initialPrefill?.amount || 2000,
  });

  // Track active pipeline animation and claim state
  const [activeStage, setActiveStage] = useState<PipelineStage>('IDLE');
  const [activeClaim, setActiveClaim] = useState<Claim | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claimHistory, setClaimHistory] = useState<Claim[]>([]);
  const [shakeReject, setShakeReject] = useState(false);

  // Prefill updates when passed from DealBuilder
  useEffect(() => {
    if (initialPrefill) {
      setFormData((prev) => ({
        ...prev,
        vin: initialPrefill.vin,
        vehicleModel: initialPrefill.model,
        msrp: initialPrefill.msrp,
        claimedAmount: initialPrefill.amount,
        programId: initialPrefill.programId,
      }));
    }
  }, [initialPrefill]);

  // Initial Seed history
  useEffect(() => {
    const seedClaims: Claim[] = [
      {
        id: 101,
        claimReference: 'CLM-2024-8801',
        vin: '1FTFW1ED4PFA10928',
        dealerId: 'DEALER-EAST-01',
        programId: 1,
        programCode: 'FORD-F150-SUMMER-24',
        vehicleModel: 'F-150',
        msrp: 52000,
        claimedAmount: 2000,
        approvedAmount: 2000,
        status: 'APPROVED',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 102,
        claimReference: 'CLM-2024-8802',
        vin: '1FA6P8CF9R5110992',
        dealerId: 'DEALER-EAST-01',
        programId: 4,
        programCode: 'FORD-MUSTANG-MATCH-24',
        vehicleModel: 'Mustang',
        msrp: 46000,
        claimedAmount: 1500,
        approvedAmount: 1500,
        status: 'APPROVED',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 103,
        claimReference: 'CLM-2024-8803',
        vin: '1FTFW1ED4PFA10928', // duplicate VIN
        dealerId: 'DEALER-EAST-01',
        programId: 1,
        programCode: 'FORD-F150-SUMMER-24',
        vehicleModel: 'F-150',
        msrp: 52000,
        claimedAmount: 2000,
        approvedAmount: null,
        status: 'REJECTED',
        rejectionReason: 'DUPLICATE_CLAIM: VIN 1FTFW1ED4PFA10928 already processed for program FORD-F150-SUMMER-24',
        createdAt: new Date(Date.now() - 600000).toISOString(),
      },
    ];

    setClaimHistory(seedClaims);
  }, []);

  // Preset quick testers
  const handleLoadScenario = (scenario: 'clean' | 'duplicate' | 'excess') => {
    if (scenario === 'clean') {
      const randSuffix = Math.floor(10000 + Math.random() * 89999);
      setFormData({
        vin: `1FTFW1ED7PFA${randSuffix}`,
        dealerId: 'DEALER-EAST-01',
        programId: 1,
        vehicleModel: 'F-150',
        msrp: 54000,
        claimedAmount: 2000,
      });
    } else if (scenario === 'duplicate') {
      // Use existing known VIN to provoke duplicate rejection rule
      setFormData({
        vin: '1FTFW1ED4PFA10928',
        dealerId: 'DEALER-EAST-01',
        programId: 1,
        vehicleModel: 'F-150',
        msrp: 52000,
        claimedAmount: 2000,
      });
    } else if (scenario === 'excess') {
      const randSuffix = Math.floor(10000 + Math.random() * 89999);
      setFormData({
        vin: `1FM5K8GC2RGA${randSuffix}`,
        dealerId: 'DEALER-EAST-01',
        programId: 2,
        vehicleModel: 'Explorer',
        msrp: 42000,
        claimedAmount: 9500, // exceeds max limit
      });
    }
  };

  // Submit Claim Flow
  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setShakeReject(false);

    // Sequence stages: SUBMITTED -> KAFKA -> VALIDATING
    setActiveStage('SUBMITTED');

    try {
      // Step 1: Submit to Spring Boot / Kafka
      const submittedClaim = await api.submitClaim(formData);
      setActiveClaim(submittedClaim);

      // Animate packet to KAFKA stage after 600ms
      setTimeout(() => {
        setActiveStage('KAFKA');
      }, 700);

      // Animate packet to VALIDATING stage after 1400ms
      setTimeout(() => {
        setActiveStage('VALIDATING');
      }, 1500);

      // Poll for resolved status (poll every 1s)
      const pollId = setInterval(async () => {
        try {
          const updated = await api.getClaimById(submittedClaim.id);
          if (updated.status === 'APPROVED' || updated.status === 'REJECTED') {
            clearInterval(pollId);
            setActiveClaim(updated);
            setActiveStage('COMPLETED');
            setIsSubmitting(false);

            setClaimHistory((prev) => [updated, ...prev.filter((c) => c.id !== updated.id)]);

            if (updated.status === 'APPROVED') {
              addToast({
                type: 'success',
                title: 'CLAIM APPROVAL DISBURSED',
                description: `Ref ${updated.claimReference} approved for $${updated.approvedAmount}`,
              });
            } else {
              setShakeReject(true);
              showRejectReceipt({
                vin: updated.vin,
                program: updated.programCode || 'SPEC_P1',
                dealerId: updated.dealerId,
                reason: updated.rejectionReason || 'Duplicate or policy conflict',
              });
            }
          }
        } catch {
          // fallback resolution
        }
      }, 1000);

      // Safety timeout in case backend takes > 6s
      setTimeout(() => {
        clearInterval(pollId);
        if (isSubmitting) setIsSubmitting(false);
      }, 8000);

    } catch (err: any) {
      // Offline / Test Simulation Mode if backend isn't up
      setTimeout(() => setActiveStage('KAFKA'), 600);
      setTimeout(() => setActiveStage('VALIDATING'), 1300);

      setTimeout(() => {
        setIsSubmitting(false);
        setActiveStage('COMPLETED');

        const isDuplicate = formData.vin === '1FTFW1ED4PFA10928';
        const isExcess = formData.claimedAmount > 8000;

        let status: 'APPROVED' | 'REJECTED' = 'APPROVED';
        let reason: string | null = null;

        if (isDuplicate) {
          status = 'REJECTED';
          reason = `DUPLICATE_CLAIM: VIN ${formData.vin} already claimed under program ID ${formData.programId}`;
        } else if (isExcess) {
          status = 'REJECTED';
          reason = `AMOUNT_EXCEEDED: Claimed $${formData.claimedAmount} exceeds max program cap of $5,000`;
        }

        const simulated: Claim = {
          id: Date.now(),
          claimReference: `CLM-${Date.now().toString().slice(-4)}`,
          vin: formData.vin,
          dealerId: formData.dealerId,
          programId: formData.programId,
          programCode: formData.programId === 1 ? 'FORD-F150-SUMMER-24' : 'FORD-EXPLORER-CASH',
          vehicleModel: formData.vehicleModel,
          msrp: formData.msrp,
          claimedAmount: formData.claimedAmount,
          approvedAmount: status === 'APPROVED' ? formData.claimedAmount : null,
          status,
          rejectionReason: reason,
          createdAt: new Date().toISOString(),
        };

        setActiveClaim(simulated);
        setClaimHistory((prev) => [simulated, ...prev]);

        if (status === 'APPROVED') {
          addToast({
            type: 'success',
            title: 'CLAIM APPROVAL DISBURSED',
            description: `Ref ${simulated.claimReference} approved for $${simulated.approvedAmount}`,
          });
        } else {
          setShakeReject(true);
          showRejectReceipt({
            vin: simulated.vin,
            program: simulated.programCode || 'SPEC_P1',
            dealerId: simulated.dealerId,
            reason: simulated.rejectionReason || 'Duplicate submission detected',
          });
        }
      }, 2200);
    }
  };

  // Pipeline stage layout percentages for packet transit
  const packetPositions: Record<PipelineStage, string> = {
    IDLE: '0%',
    SUBMITTED: '12%',
    KAFKA: '38%',
    VALIDATING: '65%',
    COMPLETED: '92%',
  };

  return (
    <div className="space-y-6">
      {/* THE HERO: Horizontal Pipeline Diagram */}
      <div className="bg-graphite border border-steel chamfer-box panel-ticks p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-steel/60 pb-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-mint rounded-full shadow-[0_0_8px_#35F2C2] animate-pulse" />
              <h2 className="font-heading text-xl uppercase font-bold tracking-wider text-bone">
                EVENT-DRIVEN CLAIM PIPELINE
              </h2>
            </div>
            <p className="font-mono text-xs text-titanium mt-0.5">
              REALTIME PARTITION TELEMETRY: TOPIC <span className="text-bone font-bold">"claims.submitted"</span> (KEY=VIN)
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-titanium">
            <span>PIPELINE ENGINE:</span>
            <Badge variant="mint" size="sm">
              KRaft CLUSTER LIVE
            </Badge>
          </div>
        </div>

        {/* The Pipeline Conduit & Stages */}
        <div className="relative py-8 px-2 sm:px-6">
          {/* Base Conduit Tube */}
          <div className="absolute top-1/2 left-4 right-4 h-2 -translate-y-1/2 bg-asphalt border border-steel rounded-full z-0 overflow-hidden">
            {/* Pulsing data flow pattern */}
            <div className="h-full w-full bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,rgba(53,242,194,0.15)_20px,rgba(53,242,194,0.15)_40px)] animate-[pulse_2s_ease-in-out_infinite]" />
          </div>

          {/* Traveling Glowing Packet (Framer Motion) */}
          {activeStage !== 'IDLE' && (
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none"
              initial={{ left: '12%' }}
              animate={{ left: packetPositions[activeStage] }}
              transition={{ type: 'spring', stiffness: 90, damping: 14 }}
            >
              {/* Glowing Orb */}
              <div
                className={`w-5 h-5 rounded-full border-2 shadow-lg ${
                  activeClaim?.status === 'REJECTED' && activeStage === 'COMPLETED'
                    ? 'bg-signal border-bone shadow-[0_0_16px_#FF4D4D]'
                    : 'bg-amber border-bone shadow-[0_0_16px_#FFB020]'
                }`}
              />
              <span className="mt-1 font-mono text-[9px] uppercase px-1.5 py-0.5 bg-asphalt border border-steel text-bone rounded whitespace-nowrap">
                PKT::{formData.vin.substring(0, 7)}...
              </span>
            </motion.div>
          )}

          {/* 4 Pipeline Node Stations */}
          <div className="relative z-10 grid grid-cols-4 gap-2 sm:gap-6 text-center">
            {/* Stage 1: SUBMITTED */}
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-[2px] border-2 flex items-center justify-center transition-all duration-300 ${
                  activeStage === 'SUBMITTED'
                    ? 'bg-amber/20 border-amber shadow-[0_0_12px_#FFB020] text-amber'
                    : activeStage !== 'IDLE'
                    ? 'bg-graphite border-mint text-mint'
                    : 'bg-graphite border-steel text-titanium'
                }`}
              >
                <TerminalIcon size={20} />
              </div>
              <span className="mt-3 font-heading text-xs sm:text-sm font-bold uppercase tracking-wider text-bone">
                1. SUBMITTED
              </span>
              <span className="font-mono text-[10px] text-titanium hidden sm:block">
                HTTP DEALER POST
              </span>
            </div>

            {/* Stage 2: KAFKA TOPIC */}
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-[2px] border-2 flex items-center justify-center transition-all duration-300 ${
                  activeStage === 'KAFKA'
                    ? 'bg-amber/20 border-amber shadow-[0_0_12px_#FFB020] text-amber'
                    : ['VALIDATING', 'COMPLETED'].includes(activeStage)
                    ? 'bg-graphite border-mint text-mint'
                    : 'bg-graphite border-steel text-titanium'
                }`}
              >
                <PipelineIcon size={20} />
              </div>
              <span className="mt-3 font-heading text-xs sm:text-sm font-bold uppercase tracking-wider text-bone">
                2. KAFKA TOPIC
              </span>
              <span className="font-mono text-[10px] text-titanium hidden sm:block">
                KEY=VIN // ORDERED
              </span>
            </div>

            {/* Stage 3: VALIDATING */}
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-[2px] border-2 flex items-center justify-center transition-all duration-300 ${
                  activeStage === 'VALIDATING'
                    ? 'bg-amber/20 border-amber shadow-[0_0_12px_#FFB020] text-amber animate-pulse'
                    : activeStage === 'COMPLETED'
                    ? 'bg-graphite border-mint text-mint'
                    : 'bg-graphite border-steel text-titanium'
                }`}
              >
                <ShieldCheckIcon size={20} />
              </div>
              <span className="mt-3 font-heading text-xs sm:text-sm font-bold uppercase tracking-wider text-bone">
                3. VALIDATING
              </span>
              <span className="font-mono text-[10px] text-titanium hidden sm:block">
                ASYNC RULE ENGINE
              </span>
            </div>

            {/* Stage 4: RESOLUTION (APPROVED / REJECTED) */}
            <motion.div
              className="flex flex-col items-center"
              animate={shakeReject ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <div
                className={`w-12 h-12 rounded-[2px] border-2 flex items-center justify-center transition-all duration-300 ${
                  activeStage === 'COMPLETED' && activeClaim?.status === 'APPROVED'
                    ? 'bg-mint/20 border-mint shadow-[0_0_14px_#35F2C2] text-mint'
                    : activeStage === 'COMPLETED' && activeClaim?.status === 'REJECTED'
                    ? 'bg-signal/20 border-signal shadow-[0_0_14px_#FF4D4D] text-signal'
                    : 'bg-graphite border-steel text-titanium'
                }`}
              >
                {activeStage === 'COMPLETED' && activeClaim?.status === 'REJECTED' ? (
                  <AlertOctagonIcon size={20} />
                ) : (
                  <CheckIcon size={20} />
                )}
              </div>
              <span className="mt-3 font-heading text-xs sm:text-sm font-bold uppercase tracking-wider text-bone">
                4. DISPOSITION
              </span>
              <span className="font-mono text-[10px] text-titanium hidden sm:block">
                {activeClaim ? activeClaim.status : 'APPROVED / REJECT'}
              </span>
            </motion.div>
          </div>
        </div>

        {/* Live Rejection Receipt Box (if rejected) */}
        <AnimatePresence>
          {activeClaim?.status === 'REJECTED' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 p-4 bg-asphalt border-2 border-signal chamfer-box font-mono text-xs text-bone"
            >
              <div className="flex items-center justify-between border-b border-signal/40 pb-2 mb-2 text-signal">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <AlertOctagonIcon size={16} />
                  VALIDATION ENGINE REJECT RECEIPT
                </span>
                <span className="text-titanium text-[10px]">
                  REF: {activeClaim.claimReference}
                </span>
              </div>
              <div className="space-y-1.5 text-titanium">
                <div className="flex justify-between">
                  <span>TARGET VIN:</span>
                  <span className="text-amber font-bold">{activeClaim.vin}</span>
                </div>
                <div className="flex justify-between">
                  <span>DISPOSITION CODE:</span>
                  <span className="text-signal font-bold">REJECT_VIN_CONFLICT</span>
                </div>
                <div className="p-2.5 bg-signal/10 border border-signal/30 text-bone rounded-[2px] mt-2">
                  <div className="text-signal font-bold uppercase text-[10px] mb-0.5">
                    DIAGNOSTIC EXPLANATION:
                  </div>
                  {activeClaim.rejectionReason}
                </div>
                <p className="text-[11px] text-titanium/80 font-sans mt-2">
                  ℹ️ Duplicate VIN Protection: Under OEM rules, a vehicle identification number can only receive one rebate per promotional campaign.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Two Column Section: Claim Dispatch Form + Recent Audit Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Dispatch Terminal Form */}
        <div className="lg:col-span-5 bg-graphite border border-steel chamfer-box panel-ticks p-5 space-y-4">
          <div className="border-b border-steel pb-3 flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-bone">
              DISPATCH TERMINAL
            </h3>
            <span className="text-titanium font-mono text-xs">DEALER INTAKE</span>
          </div>

          {/* Quick Scenario Buttons */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-titanium mb-1.5">
              PRESET INCENTIVE SCENARIOS
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleLoadScenario('clean')}
                className="p-1.5 bg-asphalt border border-steel hover:border-mint text-[11px] font-mono text-titanium hover:text-mint rounded-[2px] transition-colors"
              >
                1. CLEAN F-150
              </button>
              <button
                type="button"
                onClick={() => handleLoadScenario('duplicate')}
                className="p-1.5 bg-asphalt border border-steel hover:border-signal text-[11px] font-mono text-titanium hover:text-signal rounded-[2px] transition-colors"
              >
                2. DUPLICATE VIN
              </button>
              <button
                type="button"
                onClick={() => handleLoadScenario('excess')}
                className="p-1.5 bg-asphalt border border-steel hover:border-amber text-[11px] font-mono text-titanium hover:text-amber rounded-[2px] transition-colors"
              >
                3. EXCESS CAP
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmitClaim} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-titanium mb-1">
                VEHICLE IDENTIFICATION NUMBER (VIN)
              </label>
              <input
                type="text"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                maxLength={17}
                className="w-full bg-asphalt p-2.5 border border-steel font-mono text-xs text-bone tracking-widest uppercase focus:border-amber rounded-[2px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-titanium mb-1">
                  DEALER CODE
                </label>
                <input
                  type="text"
                  value={formData.dealerId}
                  onChange={(e) => setFormData({ ...formData, dealerId: e.target.value })}
                  className="w-full bg-asphalt p-2 border border-steel font-mono text-xs text-bone rounded-[2px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-titanium mb-1">
                  MODEL
                </label>
                <input
                  type="text"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  className="w-full bg-asphalt p-2 border border-steel font-mono text-xs text-bone rounded-[2px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-titanium mb-1">
                  MSRP ($)
                </label>
                <input
                  type="number"
                  value={formData.msrp}
                  onChange={(e) => setFormData({ ...formData, msrp: parseFloat(e.target.value) })}
                  className="w-full bg-asphalt p-2 border border-steel font-mono text-xs text-bone rounded-[2px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-titanium mb-1">
                  CLAIMED ($)
                </label>
                <input
                  type="number"
                  value={formData.claimedAmount}
                  onChange={(e) => setFormData({ ...formData, claimedAmount: parseFloat(e.target.value) })}
                  className="w-full bg-asphalt p-2 border border-steel font-mono text-xs text-amber font-bold rounded-[2px]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors flex items-center justify-center gap-2 ${
                isSubmitting
                  ? 'bg-steel text-titanium cursor-not-allowed'
                  : 'bg-amber hover:bg-amber/90 text-asphalt shadow-[0_0_12px_rgba(255,176,32,0.3)]'
              }`}
            >
              <PipelineIcon size={16} />
              <span>{isSubmitting ? 'DISPATCHING TO KAFKA PIPE...' : 'SUBMIT CLAIM INTO KAFKA PIPE'}</span>
            </button>
          </form>
        </div>

        {/* Right Column (7 cols): Audit Ledger Table */}
        <div className="lg:col-span-7 bg-graphite border border-steel chamfer-box panel-ticks flex flex-col">
          <div className="p-4 border-b border-steel flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-bone">
              PROCESSED CLAIM AUDIT TRAIL
            </h3>
            <span className="font-mono text-xs text-titanium">
              {claimHistory.length} ENTRIES
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-asphalt text-titanium uppercase text-[10px] border-b border-steel">
                <tr>
                  <th className="p-3">REF / VIN</th>
                  <th className="p-3">MODEL</th>
                  <th className="p-3">AMOUNT</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">INSPECT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel/20 text-bone">
                {claimHistory.map((clm) => (
                  <tr
                    key={clm.id}
                    onClick={() => {
                      setActiveClaim(clm);
                      setActiveStage('COMPLETED');
                    }}
                    className="hover:bg-asphalt/60 cursor-pointer transition-colors"
                  >
                    <td className="p-3">
                      <div className="font-bold text-bone">{clm.claimReference}</div>
                      <div className="text-[10px] text-titanium tracking-wider">{clm.vin}</div>
                    </td>
                    <td className="p-3 text-titanium">{clm.vehicleModel}</td>
                    <td className="p-3 tabular-nums font-bold">
                      ${clm.claimedAmount.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={clm.status === 'APPROVED' ? 'mint' : 'signal'}
                        size="sm"
                      >
                        {clm.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <button className="text-[10px] text-amber hover:underline uppercase">
                        LOAD →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
