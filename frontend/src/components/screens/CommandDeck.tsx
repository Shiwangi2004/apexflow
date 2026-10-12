import React, { useState, useEffect } from 'react';
import { GaugeArc } from '../primitives/GaugeArc';
import { StatCard } from '../primitives/StatCard';
import { Badge } from '../primitives/Badge';
import { ShieldCheckIcon, PipelineIcon, TerminalIcon, RefreshIcon } from '../icons';
import { api } from '../../api/client';
import { Claim } from '../../api/types';

interface TickerEvent {
  id: string;
  timestamp: string;
  type: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'KAFKA';
  vin: string;
  dealerId: string;
  summary: string;
}

interface RegionTelemetry {
  code: string;
  name: string;
  dealers: number;
  claimsCount: number;
  approvedSpend: number;
  approvalRate: number;
  loadFactor: number; // 0 to 100%
}

export const CommandDeck: React.FC<{
  onNavigateToPipeline: () => void;
  onNavigateToQuote: () => void;
}> = ({ onNavigateToPipeline, onNavigateToQuote }) => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [tickerEvents, setTickerEvents] = useState<TickerEvent[]>([]);

  // Initial mock fallback events if no backend claims yet
  const initialMockEvents: TickerEvent[] = [
    {
      id: 'evt-1',
      timestamp: '12:04:18',
      type: 'APPROVED',
      vin: '1FTFW1ED8PFA29911',
      dealerId: 'D-1092',
      summary: 'INCENTIVE $2,000 APPROVED FOR F-150',
    },
    {
      id: 'evt-2',
      timestamp: '12:03:55',
      type: 'KAFKA',
      vin: '1FA6P8CF7R5112003',
      dealerId: 'D-2041',
      summary: 'PARTITION 2 CONSUMED (OFFSET 10921) KEY=VIN',
    },
    {
      id: 'evt-3',
      timestamp: '12:02:40',
      type: 'SUBMITTED',
      vin: '1FM5K8GC4RGA89201',
      dealerId: 'D-3301',
      summary: 'CLAIM INGESTED // VALIDATION PENDING',
    },
    {
      id: 'evt-4',
      timestamp: '12:01:12',
      type: 'REJECTED',
      vin: '3FA6P0HD9KR112340',
      dealerId: 'D-1092',
      summary: 'DUPLICATE CLAIM: VIN ALREADY HAS INCENTIVE DISBURSED',
    },
  ];

  // Fetch real dealer claims if available
  useEffect(() => {
    let mounted = true;
    const fetchClaims = async () => {
      try {
        const res = await api.getClaimsByDealer('DEALER-EAST-01');
        if (mounted && res.content.length > 0) {
          setClaims(res.content);
        }
      } catch {
        // backend offline or mock mode
      }
    };
    fetchClaims();
    return () => {
      mounted = false;
    };
  }, []);

  // Initialize and stream ticker events
  useEffect(() => {
    setTickerEvents(initialMockEvents);

    const streamInterval = setInterval(() => {
      const vins = [
        '1FTFW1ED4PFA' + Math.floor(10000 + Math.random() * 89999),
        '1FA6P8CF9R5' + Math.floor(10000 + Math.random() * 89999),
        '1FM5K8GC2RGA' + Math.floor(10000 + Math.random() * 89999),
      ];
      const dealers = ['D-1014', 'D-2089', 'D-3301', 'D-4412'];
      const randomVin = vins[Math.floor(Math.random() * vins.length)];
      const randomDealer = dealers[Math.floor(Math.random() * dealers.length)];
      const eventTypes: Array<TickerEvent['type']> = ['APPROVED', 'KAFKA', 'SUBMITTED'];
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      const now = new Date().toISOString().substring(11, 19);

      const summaries = {
        APPROVED: `RULE_STACK_PASS: INCENTIVE APPROVED ($${(1500 + Math.floor(Math.random() * 3) * 500).toLocaleString()})`,
        KAFKA: `KAFKA TOPIC "claims.submitted": INGEST OK (LAG 12ms)`,
        SUBMITTED: `NEW CLAIM QUEUED FOR ASYNC ENGINE PROCESSING`,
        REJECTED: `VALIDATION_FAILED: DUPLICATE_SUBMISSION`,
      };

      const newEvent: TickerEvent = {
        id: `evt-${Date.now()}`,
        timestamp: now,
        type: randomType,
        vin: randomVin,
        dealerId: randomDealer,
        summary: summaries[randomType],
      };

      setTickerEvents((prev) => [newEvent, ...prev.slice(0, 9)]);
    }, 4500);

    return () => clearInterval(streamInterval);
  }, []);

  // Regional Heat Matrix Data
  const regions: RegionTelemetry[] = [
    { code: 'R1-GL', name: 'Great Lakes Hub', dealers: 42, claimsCount: 184, approvedSpend: 368000, approvalRate: 94.2, loadFactor: 88 },
    { code: 'R2-NE', name: 'Northeast Corridor', dealers: 38, claimsCount: 142, approvedSpend: 284000, approvalRate: 91.5, loadFactor: 72 },
    { code: 'R3-SE', name: 'Southeast Metro', dealers: 51, claimsCount: 210, approvedSpend: 420000, approvalRate: 88.6, loadFactor: 95 },
    { code: 'R4-MW', name: 'Midwest Plains', dealers: 29, claimsCount: 98, approvedSpend: 196000, approvalRate: 96.0, loadFactor: 54 },
    { code: 'R5-SW', name: 'Southwest Border', dealers: 36, claimsCount: 135, approvedSpend: 270000, approvalRate: 90.4, loadFactor: 68 },
    { code: 'R6-WC', name: 'West Coast Coastal', dealers: 48, claimsCount: 195, approvedSpend: 390000, approvalRate: 93.1, loadFactor: 84 },
    { code: 'R7-PNW', name: 'Pacific Northwest', dealers: 22, claimsCount: 74, approvedSpend: 148000, approvalRate: 95.8, loadFactor: 42 },
    { code: 'R8-MT', name: 'Mountain West', dealers: 18, claimsCount: 52, approvedSpend: 104000, approvalRate: 92.3, loadFactor: 35 },
  ];

  // Derived telemetry metrics
  const totalApprovedSpend = claims.length > 0
    ? claims.reduce((acc, c) => acc + (c.approvedAmount || 0), 0) || 184500
    : 184500;
  const approvedCount = claims.filter((c) => c.status === 'APPROVED').length || 28;
  const totalClaims = claims.length || 31;
  const approvalRatePercent = Math.round((approvedCount / totalClaims) * 1000) / 10;
  const inFlightCount = 4; // claims actively validating

  return (
    <div className="space-y-6">
      {/* Telemetry Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-graphite border border-steel chamfer-box">
        <div className="flex items-center gap-3">
          <Badge variant="mint" pulse size="sm">
            KAFKA INGEST ACTIVE
          </Badge>
          <span className="font-mono text-xs text-titanium">
            TOPIC: <span className="text-bone">claims.submitted</span> // PARTITIONS: 3 // REPLICATION: 1
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToQuote}
            className="px-3 py-1 bg-graphite border border-steel text-titanium hover:text-bone font-mono text-xs uppercase tracking-wider transition-colors rounded-[2px]"
          >
            BUILD DEAL QUOTE
          </button>
          <button
            onClick={onNavigateToPipeline}
            className="px-3 py-1 bg-amber text-asphalt font-mono text-xs font-bold uppercase tracking-wider hover:bg-amber/90 transition-colors rounded-[2px]"
          >
            DISPATCH NEW CLAIM →
          </button>
        </div>
      </div>

      {/* Row of Instrument Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gauge 1: Approved Spend */}
        <GaugeArc
          value={totalApprovedSpend}
          min={0}
          max={250000}
          label="APPROVED SPEND ($)"
          sublabel="MONTH-TO-DATE"
          unit="USD"
          color="mint"
          formatValue={(v) => `$${Math.round(v).toLocaleString()}`}
        />

        {/* Gauge 2: Approval Rate */}
        <GaugeArc
          value={approvalRatePercent}
          min={50}
          max={100}
          label="ENGINE APPROVAL RATE"
          sublabel="ROLLING 7-DAY"
          unit="%"
          color="amber"
          formatValue={(v) => `${v.toFixed(1)}%`}
        />

        {/* Gauge 3: Claims in Flight */}
        <GaugeArc
          value={inFlightCount}
          min={0}
          max={20}
          label="CLAIMS IN FLIGHT"
          sublabel="KAFKA BUFFER"
          unit="QUEUE"
          color="mint"
          formatValue={(v) => `${Math.round(v)}`}
        />
      </div>

      {/* Auxiliary Telemetry Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="24H CLAIM VOLUME"
          value={142}
          prefix=""
          delta="+18.4%"
          deltaType="positive"
          subtext="Across 12 dealer regions"
          icon={<PipelineIcon size={14} />}
        />
        <StatCard
          label="KAFKA ENGINE LATENCY"
          value={18}
          suffix="ms"
          delta="NOMINAL"
          deltaType="positive"
          subtext="P99 validation response"
          icon={<ShieldCheckIcon size={14} />}
        />
        <StatCard
          label="AVG INCENTIVE PAYOUT"
          value={2150}
          prefix="$"
          delta="+4.2%"
          deltaType="positive"
          subtext="Driven by F-150 Summer Cash"
          icon={<RefreshIcon size={14} />}
        />
        <StatCard
          label="VIN REJECTION RATE"
          value={6.8}
          suffix="%"
          delta="-1.2%"
          deltaType="positive"
          subtext="Chief cause: Prior claim conflict"
          color="signal"
          icon={<TerminalIcon size={14} />}
        />
      </div>

      {/* Grid: Live Ticker + Region Heat Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Live Claim Event Ticker */}
        <div className="lg:col-span-7 bg-graphite border border-steel chamfer-box panel-ticks flex flex-col">
          <div className="p-4 border-b border-steel flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TerminalIcon size={16} className="text-amber" />
              <h2 className="font-heading text-base font-bold uppercase tracking-wider text-bone">
                LIVE CLAIM EVENT STREAM
              </h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-titanium">
              <span className="w-1.5 h-1.5 rounded-full bg-mint animate-ping" />
              <span>STREAM::REALTIME</span>
            </div>
          </div>

          <div className="p-3 font-mono text-xs divide-y divide-steel/20 max-h-96 overflow-y-auto space-y-2">
            {tickerEvents.map((evt) => (
              <div
                key={evt.id}
                className="pt-2 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 hover:bg-asphalt/50 px-2 rounded transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-titanium/70 text-[10px] tabular-nums">
                    [{evt.timestamp}]
                  </span>
                  <Badge
                    variant={
                      evt.type === 'APPROVED'
                        ? 'mint'
                        : evt.type === 'REJECTED'
                        ? 'signal'
                        : evt.type === 'KAFKA'
                        ? 'amber'
                        : 'steel'
                    }
                    size="sm"
                  >
                    {evt.type}
                  </Badge>
                  <span className="text-bone/90 text-[11px] truncate max-w-xs sm:max-w-md">
                    {evt.summary}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-titanium sm:text-right">
                  <span className="text-amber">{evt.dealerId}</span>
                  <span className="text-titanium/50">|</span>
                  <span className="tracking-widest">{evt.vin.substring(0, 8)}...</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 bg-asphalt/60 border-t border-steel flex items-center justify-between text-[11px] font-mono text-titanium">
            <span>SHOWING LAST 10 TELEMETRIC EMISSIONS</span>
            <span className="text-amber cursor-pointer hover:underline" onClick={onNavigateToPipeline}>
              VIEW FULL TOPIC PIPELINE →
            </span>
          </div>
        </div>

        {/* Right Column (5 cols): Regional Heat Matrix */}
        <div className="lg:col-span-5 bg-graphite border border-steel chamfer-box panel-ticks flex flex-col">
          <div className="p-4 border-b border-steel flex items-center justify-between">
            <div>
              <h2 className="font-heading text-base font-bold uppercase tracking-wider text-bone">
                REGIONAL INCENTIVE DENSITY
              </h2>
              <p className="font-mono text-[10px] text-titanium">
                CLAIM LOAD MATRIX & APPROVAL CONCENTRATION
              </p>
            </div>
            <span className="font-mono text-xs text-mint">8 HUBS</span>
          </div>

          <div className="p-4 flex-1 space-y-3.5">
            {regions.map((reg) => (
              <div key={reg.code} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-bone font-medium">{reg.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-titanium text-[10px]">
                      {reg.claimsCount} claims
                    </span>
                    <span className="text-mint tabular-nums">
                      {reg.approvalRate}%
                    </span>
                  </div>
                </div>

                {/* Heat Indicator Bar */}
                <div className="h-2 w-full bg-asphalt border border-steel rounded-[1px] overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-500 ${
                      reg.loadFactor > 80
                        ? 'bg-amber shadow-[0_0_8px_#FFB020]'
                        : reg.loadFactor > 50
                        ? 'bg-mint'
                        : 'bg-titanium/50'
                    }`}
                    style={{ width: `${reg.loadFactor}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-asphalt/60 border-t border-steel flex items-center justify-between text-[10px] font-mono text-titanium">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-mint inline-block" />
              <span>NORMAL (&lt;80%)</span>
              <span className="w-2 h-2 bg-amber inline-block ml-2" />
              <span>HIGH DENSITY (&gt;80%)</span>
            </div>
            <span>TOTAL: $2.18M ALLOCATED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
