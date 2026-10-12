import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../primitives/Badge';
import { SlideOver } from '../primitives/SlideOver';
import { CardSkeleton } from '../primitives/Skeleton';
import { TagIcon, SearchIcon, CheckIcon } from '../icons';
import { api } from '../../api/client';
import { Program, CreateProgramInput, ProgramType } from '../../api/types';
import { useToast } from '../../context/ToastContext';

export const ProgramsCatalog: React.FC<{
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
  onOpenCreate?: () => void;
}> = ({ isCreateOpen = false, onCloseCreate, onOpenCreate }) => {
  const { addToast } = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedModel, setSelectedModel] = useState<string>('ALL');
  const [stackableOnly, setStackableOnly] = useState(false);

  // Internal create slideover state if not controlled from props
  const [localCreateOpen, setLocalCreateOpen] = useState(false);
  const isDrawerOpen = isCreateOpen || localCreateOpen;
  const closeDrawer = () => {
    if (onCloseCreate) onCloseCreate();
    setLocalCreateOpen(false);
  };
  const openDrawer = () => {
    if (onOpenCreate) onOpenCreate();
    else setLocalCreateOpen(true);
  };

  // Form State
  const [formData, setFormData] = useState<CreateProgramInput>({
    programCode: '',
    name: '',
    type: 'CASH_REBATE',
    vehicleModel: 'F-150',
    discountAmount: 2000,
    aprRate: 1.9,
    termMonths: 36,
    standardAprRate: 6.5,
    stackable: true,
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date(Date.now() + 60 * 86400000).toISOString().substring(0, 10),
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fallback initial seeded programs if backend is starting up
  const seedPrograms: Program[] = [
    {
      id: 1,
      programCode: 'FORD-F150-SUMMER-24',
      name: 'F-150 Summer Consumer Cash',
      type: 'CASH_REBATE',
      vehicleModel: 'F-150',
      discountAmount: 2000,
      aprRate: null,
      termMonths: null,
      standardAprRate: 6.5,
      stackable: true,
      startDate: '2024-06-01',
      endDate: '2026-12-31',
    },
    {
      id: 2,
      programCode: 'FORD-EXPLORER-APR-36',
      name: 'Explorer Tier-1 APR Subvention',
      type: 'APR_OFFER',
      vehicleModel: 'Explorer',
      discountAmount: null,
      aprRate: 1.9,
      termMonths: 36,
      standardAprRate: 6.5,
      stackable: false,
      startDate: '2024-06-01',
      endDate: '2026-12-31',
    },
    {
      id: 3,
      programCode: 'FORD-LOYALTY-500',
      name: 'National Owner Loyalty Bonus',
      type: 'LOYALTY_BONUS',
      vehicleModel: null,
      discountAmount: 500,
      aprRate: null,
      termMonths: null,
      standardAprRate: 6.5,
      stackable: true,
      startDate: '2024-01-01',
      endDate: '2026-12-31',
    },
    {
      id: 4,
      programCode: 'FORD-MUSTANG-MATCH-24',
      name: 'Mustang Track Pace Rebate',
      type: 'CASH_REBATE',
      vehicleModel: 'Mustang',
      discountAmount: 1500,
      aprRate: null,
      termMonths: null,
      standardAprRate: 6.5,
      stackable: false,
      startDate: '2024-05-01',
      endDate: '2026-11-30',
    },
  ];

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await api.getPrograms();
      if (res.content && res.content.length > 0) {
        setPrograms(res.content);
      } else {
        setPrograms(seedPrograms);
      }
    } catch {
      setPrograms(seedPrograms);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  // Filter logic
  const filteredPrograms = programs.filter((p) => {
    const matchesSearch =
      p.programCode.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.vehicleModel && p.vehicleModel.toLowerCase().includes(search.toLowerCase()));

    const matchesType = selectedType === 'ALL' || p.type === selectedType;
    const matchesModel =
      selectedModel === 'ALL' || (p.vehicleModel && p.vehicleModel.toUpperCase() === selectedModel);
    const matchesStackable = !stackableOnly || p.stackable;

    return matchesSearch && matchesType && matchesModel && matchesStackable;
  });

  // Calculate validity position
  const calculateValidityProgress = (startStr: string, endStr: string) => {
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();
    const today = new Date().getTime();

    if (today < start) return { progress: 0, status: 'UPCOMING', daysLeft: Math.ceil((end - today) / 86400000) };
    if (today > end) return { progress: 100, status: 'EXPIRED', daysLeft: 0 };

    const totalSpan = end - start || 1;
    const elapsed = today - start;
    const progress = Math.min(Math.max((elapsed / totalSpan) * 100, 4), 96);
    const daysLeft = Math.ceil((end - today) / 86400000);

    return { progress, status: 'ACTIVE', daysLeft };
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.programCode.trim()) errors.programCode = 'Program code required';
    if (!formData.name.trim()) errors.name = 'Program name required';

    if (formData.type === 'CASH_REBATE' || formData.type === 'LOYALTY_BONUS') {
      if (!formData.discountAmount || formData.discountAmount <= 0) {
        errors.discountAmount = 'Discount amount must be positive';
      }
    } else if (formData.type === 'APR_OFFER') {
      if (formData.aprRate === undefined || formData.aprRate < 0) {
        errors.aprRate = 'APR rate must be non-negative';
      }
      if (!formData.termMonths || formData.termMonths <= 0) {
        errors.termMonths = 'Financing term required';
      }
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      errors.endDate = 'End date must follow start date';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const created = await api.createProgram(formData);
      setPrograms((prev) => [created, ...prev]);
      addToast({
        type: 'success',
        title: 'PROGRAM PUBLISHED',
        description: `Spec ${created.programCode} is now active in dealer catalog`,
      });
      closeDrawer();
    } catch (err: any) {
      // Local optimistic fallback
      const mockCreated: Program = {
        id: Date.now(),
        ...formData,
      };
      setPrograms((prev) => [mockCreated, ...prev]);
      addToast({
        type: 'success',
        title: 'PROGRAM PUBLISHED (OFFLINE)',
        description: `Spec ${mockCreated.programCode} created locally in cache`,
      });
      closeDrawer();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-graphite border border-steel chamfer-box">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center text-titanium pointer-events-none">
            <SearchIcon size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, model, or spec..."
            className="w-full bg-asphalt pl-9 pr-4 py-2 border border-steel text-xs font-mono text-bone rounded-[2px] placeholder-titanium/50 focus:border-amber"
          />
        </div>

        {/* Filter Badges & Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Selector */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-asphalt border border-steel text-bone font-mono text-xs px-2.5 py-1.5 rounded-[2px] focus:border-amber"
          >
            <option value="ALL">ALL TYPES</option>
            <option value="CASH_REBATE">CASH REBATE</option>
            <option value="APR_OFFER">APR SUBVENTION</option>
            <option value="LOYALTY_BONUS">LOYALTY BONUS</option>
          </select>

          {/* Model Selector */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-asphalt border border-steel text-bone font-mono text-xs px-2.5 py-1.5 rounded-[2px] focus:border-amber"
          >
            <option value="ALL">ALL MODELS</option>
            <option value="F-150">F-150</option>
            <option value="EXPLORER">EXPLORER</option>
            <option value="MUSTANG">MUSTANG</option>
          </select>

          {/* Stackable Toggle */}
          <button
            onClick={() => setStackableOnly(!stackableOnly)}
            className={`px-2.5 py-1.5 border rounded-[2px] font-mono text-xs transition-colors flex items-center gap-1.5 ${
              stackableOnly
                ? 'bg-amber/15 text-amber border-amber'
                : 'bg-asphalt text-titanium border-steel hover:text-bone'
            }`}
          >
            <span>STACKABLE ONLY</span>
            {stackableOnly && <CheckIcon size={12} />}
          </button>

          {/* New Program Button */}
          <button
            onClick={openDrawer}
            className="px-3.5 py-1.5 bg-amber hover:bg-amber/90 text-asphalt font-mono text-xs font-bold uppercase tracking-wider rounded-[2px] flex items-center gap-1.5 transition-colors"
          >
            <TagIcon size={14} />
            <span>+ NEW SPEC</span>
          </button>
        </div>
      </div>

      {/* Grid of Window-Sticker Spec Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="p-12 text-center bg-graphite border border-steel chamfer-box panel-ticks space-y-3">
          <div className="text-titanium font-mono text-sm">
            NO INCENTIVE PROGRAMS MATCHING CRITERIA
          </div>
          <p className="text-titanium/70 text-xs">
            Adjust your filters or add a new OEM vehicle program spec.
          </p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredPrograms.map((prog) => {
              const validity = calculateValidityProgress(prog.startDate, prog.endDate);
              const isCash = prog.type === 'CASH_REBATE';
              const isApr = prog.type === 'APR_OFFER';
              const isLoyalty = prog.type === 'LOYALTY_BONUS';

              return (
                <motion.div
                  key={prog.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="bg-graphite border border-steel perforated-edge pb-5 relative overflow-hidden flex flex-col justify-between"
                >
                  {/* Window Sticker Top Header */}
                  <div>
                    <div className="p-4 bg-asphalt/70 border-b border-steel/60">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {/* Type Badge */}
                        <Badge
                          variant={isCash ? 'amber' : isApr ? 'mint' : 'titanium'}
                          size="md"
                        >
                          {isCash ? 'CASH' : isApr ? 'APR' : 'LOYALTY'}
                        </Badge>

                        {/* Stackability Pill */}
                        <span
                          className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 border rounded-[2px] ${
                            prog.stackable
                              ? 'text-mint border-mint/30 bg-mint/5'
                              : 'text-titanium border-steel bg-steel/20'
                          }`}
                        >
                          {prog.stackable ? 'STACKABLE' : 'NON-STACKABLE'}
                        </span>
                      </div>

                      {/* Mock Barcode & Spec Code */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-titanium mt-1">
                        <span className="tracking-widest font-bold text-bone">
                          {prog.programCode}
                        </span>
                        <span className="font-mono opacity-50 select-none">
                          || | ||| | |||
                        </span>
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-4 space-y-4">
                      <div>
                        <h3 className="font-heading text-xl font-bold uppercase tracking-tight text-bone leading-tight">
                          {prog.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[11px] text-amber">
                            TARGET: {prog.vehicleModel || 'ALL FLEET / ELIGIBLE'}
                          </span>
                        </div>
                      </div>

                      {/* Main Spec Figure */}
                      <div className="p-3 bg-asphalt border border-steel/50 rounded-[2px] flex items-baseline justify-between">
                        <div>
                          <div className="text-[10px] font-mono text-titanium uppercase">
                            {isApr ? 'SUBVENTION RATE' : 'CUSTOMER SAVINGS'}
                          </div>
                          <div className="font-heading text-3xl font-extrabold text-bone tabular-nums">
                            {isCash || isLoyalty
                              ? `$${(prog.discountAmount || 0).toLocaleString()}`
                              : `${prog.aprRate}%`}
                          </div>
                        </div>

                        {isApr && (
                          <div className="text-right">
                            <div className="text-[10px] font-mono text-titanium uppercase">
                              TERM / STD
                            </div>
                            <div className="font-mono text-xs text-mint">
                              {prog.termMonths} MOS // {prog.standardAprRate}% STD
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Validity Timeline Track at Bottom */}
                  <div className="px-4 pb-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-titanium">
                      <span>VALIDITY: {prog.startDate.substring(5)} → {prog.endDate.substring(5)}</span>
                      <span className={validity.status === 'ACTIVE' ? 'text-mint' : 'text-signal'}>
                        {validity.status === 'ACTIVE' ? `${validity.daysLeft}d REMAINING` : validity.status}
                      </span>
                    </div>

                    {/* Timeline bar with indicator pin */}
                    <div className="relative h-2 w-full bg-asphalt border border-steel rounded-[1px]">
                      <div
                        className="h-full bg-amber/30"
                        style={{ width: `${validity.progress}%` }}
                      />
                      {/* Today Marker Pin */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-3 bg-amber border border-asphalt shadow-[0_0_6px_#FFB020]"
                        style={{ left: `calc(${validity.progress}% - 4px)` }}
                        title="Today's Timeline Marker"
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Slide-over Panel for Program Creation / Spec Specifying */}
      <SlideOver
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        title="NEW INCENTIVE SPEC CARD"
        subtitle="CONFIGURE OEM DEALER INCENTIVE RULES // D-SPEC ENGINE"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          {/* Program Code */}
          <div>
            <label className="block text-xs font-mono uppercase text-titanium mb-1">
              PROGRAM CODE (UNIQUE KEY)
            </label>
            <input
              type="text"
              value={formData.programCode}
              onChange={(e) => setFormData({ ...formData, programCode: e.target.value.toUpperCase() })}
              placeholder="e.g. FORD-F150-FALL-REBATE"
              className="w-full bg-asphalt p-2.5 border border-steel text-bone font-mono text-xs rounded-[2px] focus:border-amber"
            />
            {formErrors.programCode && (
              <span className="text-[11px] text-signal font-mono mt-1 block">
                {formErrors.programCode}
              </span>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-mono uppercase text-titanium mb-1">
              DISPLAY NAME
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. F-150 Consumer Cash Rebate"
              className="w-full bg-asphalt p-2.5 border border-steel text-bone font-mono text-xs rounded-[2px] focus:border-amber"
            />
            {formErrors.name && (
              <span className="text-[11px] text-signal font-mono mt-1 block">
                {formErrors.name}
              </span>
            )}
          </div>

          {/* Program Type */}
          <div>
            <label className="block text-xs font-mono uppercase text-titanium mb-1">
              INCENTIVE TYPE
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ProgramType })}
              className="w-full bg-asphalt p-2.5 border border-steel text-bone font-mono text-xs rounded-[2px] focus:border-amber"
            >
              <option value="CASH_REBATE">CASH REBATE (DIRECT REDUCTION)</option>
              <option value="APR_OFFER">APR SUBVENTION (LOW-RATE FINANCING)</option>
              <option value="LOYALTY_BONUS">LOYALTY BONUS (EXISTING OWNER)</option>
            </select>
          </div>

          {/* Target Vehicle Model */}
          <div>
            <label className="block text-xs font-mono uppercase text-titanium mb-1">
              TARGET VEHICLE MODEL
            </label>
            <select
              value={formData.vehicleModel || ''}
              onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value || undefined })}
              className="w-full bg-asphalt p-2.5 border border-steel text-bone font-mono text-xs rounded-[2px] focus:border-amber"
            >
              <option value="">ALL MODELS / FLEETWIDE</option>
              <option value="F-150">F-150</option>
              <option value="Explorer">Explorer</option>
              <option value="Mustang">Mustang</option>
            </select>
          </div>

          {/* Type-specific inputs */}
          {formData.type === 'APR_OFFER' ? (
            <div className="grid grid-cols-2 gap-3 p-3 bg-asphalt/60 border border-steel rounded-[2px]">
              <div>
                <label className="block text-[11px] font-mono text-titanium mb-1">
                  OFFER APR (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.aprRate || 0}
                  onChange={(e) => setFormData({ ...formData, aprRate: parseFloat(e.target.value) })}
                  className="w-full bg-graphite p-2 border border-steel text-mint font-mono text-xs rounded-[2px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-titanium mb-1">
                  TERM (MONTHS)
                </label>
                <input
                  type="number"
                  value={formData.termMonths || 36}
                  onChange={(e) => setFormData({ ...formData, termMonths: parseInt(e.target.value, 10) })}
                  className="w-full bg-graphite p-2 border border-steel text-bone font-mono text-xs rounded-[2px]"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-mono uppercase text-titanium mb-1">
                DISCOUNT AMOUNT ($ USD)
              </label>
              <input
                type="number"
                step="100"
                value={formData.discountAmount || 0}
                onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) })}
                className="w-full bg-asphalt p-2.5 border border-steel text-amber font-mono text-sm font-bold rounded-[2px]"
              />
              {formErrors.discountAmount && (
                <span className="text-[11px] text-signal font-mono mt-1 block">
                  {formErrors.discountAmount}
                </span>
              )}
            </div>
          )}

          {/* Stackable Toggle */}
          <div className="flex items-center gap-3 p-3 bg-asphalt border border-steel rounded-[2px]">
            <input
              type="checkbox"
              id="stackable-checkbox"
              checked={formData.stackable}
              onChange={(e) => setFormData({ ...formData, stackable: e.target.checked })}
              className="accent-amber w-4 h-4 cursor-pointer"
            />
            <label htmlFor="stackable-checkbox" className="text-xs font-mono text-bone cursor-pointer">
              STACKABLE WITH OTHER INCENTIVE CODES
            </label>
          </div>

          {/* Validity Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-titanium mb-1">
                START DATE
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-asphalt p-2 border border-steel text-bone font-mono text-xs rounded-[2px]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-titanium mb-1">
                END DATE
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full bg-asphalt p-2 border border-steel text-bone font-mono text-xs rounded-[2px]"
              />
              {formErrors.endDate && (
                <span className="text-[11px] text-signal font-mono mt-1 block">
                  {formErrors.endDate}
                </span>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-steel flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeDrawer}
              className="px-4 py-2 border border-steel text-titanium font-mono text-xs hover:text-bone hover:bg-steel/30 rounded-[2px]"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-amber hover:bg-amber/90 text-asphalt font-mono text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors"
            >
              {isSubmitting ? 'TRANSMITTING...' : 'COMMIT SPEC SPECIFICATION'}
            </button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
};
