// src/features/landing/components/DeviceSpecBar.jsx
import React from 'react';
import { Laptop, Monitor, Cpu, Check, Filter } from 'lucide-react';
import { DEVICE_SPEC_LEVELS, DEVICE_SPEC_LABELS } from '../hooks/useDeviceSpec';

const SPEC_BUTTONS = [
  { id: DEVICE_SPEC_LEVELS.ALL, icon: Monitor, label: 'Semua Spek', desc: 'Lihat semua' },
  { id: DEVICE_SPEC_LEVELS.LOW, icon: Laptop, label: 'Device Low Spek', desc: 'RAM 4-8 GB' },
  { id: DEVICE_SPEC_LEVELS.MID, icon: Monitor, label: 'Device Menengah', desc: 'GTX / RX' },
  { id: DEVICE_SPEC_LEVELS.HIGH, icon: Cpu, label: 'Device High-End', desc: 'RTX / AAA' },
];

const DeviceSpecBar = ({
  activeSpec = DEVICE_SPEC_LEVELS.ALL,
  onSelectSpec,
  onlyCompatible = false,
  onToggleOnlyCompatible,
  className = '',
}) => {
  return (
    <div className={`bg-[#0B0F17] border border-white/10 rounded-2xl p-3 sm:p-4 shadow-lg ${className}`}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        
        {/* Left Side: Header & Explainer */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 shrink-0">
            <Laptop size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-white tracking-tight">
                Can I Run It Checker
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-400 border border-amber-400/30 uppercase tracking-wider">
                Fitur Cepat
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Pilih spek device kamu untuk cek langsung apakah game lancar dimainkan:
            </p>
          </div>
        </div>

        {/* Right Side: Quick Spec Selector Chips */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {SPEC_BUTTONS.map((btn) => {
            const Icon = btn.icon;
            const isActive = activeSpec === btn.id;

            return (
              <button
                key={btn.id}
                onClick={() => onSelectSpec(btn.id)}
                type="button"
                className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? btn.id === DEVICE_SPEC_LEVELS.LOW
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : btn.id === DEVICE_SPEC_LEVELS.MID
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                      : btn.id === DEVICE_SPEC_LEVELS.HIGH
                      ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                      : 'bg-white text-slate-950 shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                }`}
              >
                <Icon size={13} className="shrink-0" />
                <span>{btn.label}</span>
                <span className={`text-[10px] hidden sm:inline opacity-75 font-normal`}>
                  ({btn.desc})
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Optional Only-Compatible Toggle when a spec is chosen */}
      {activeSpec !== DEVICE_SPEC_LEVELS.ALL && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span>
              Mode aktif: <strong className="text-white">{DEVICE_SPEC_LABELS[activeSpec]?.label}</strong>
              {' — '}{DEVICE_SPEC_LABELS[activeSpec]?.hint}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onToggleOnlyCompatible(!onlyCompatible)}
            className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${
              onlyCompatible
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${onlyCompatible ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-500'}`}>
              {onlyCompatible && <Check size={11} strokeWidth={3} />}
            </div>
            <span>Hanya game yang lancar di device saya</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DeviceSpecBar;
