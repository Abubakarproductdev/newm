"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function Panel({ title, subtitle, icon: Icon, action, children }: { title: string; subtitle?: string; icon?: LucideIcon; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#e1e8e3] bg-white shadow-[0_8px_28px_rgba(37,61,44,.05)]">
      <header className="flex items-center justify-between gap-3 border-b border-[#edf1ee] px-5 py-4">
        <div className="flex items-center gap-3">
          {Icon && <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eaf5ed] text-[#4d9b65]"><Icon size={18} /></span>}
          <div>
            <h2 className="text-sm font-bold text-[#2c3a33]">{title}</h2>
            {subtitle && <p className="text-[11px] text-[#8a9990]">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-full px-4 py-2 text-xs font-bold transition ${active ? "bg-[#4d9b65] text-white shadow-[0_5px_14px_rgba(77,155,101,.22)]" : "border border-[#dfe7e1] bg-white text-[#66726c] hover:border-[#a9c8b2]"}`}>
      {children}
    </button>
  );
}

export function Badge({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "amber" | "gray" | "blue" }) {
  const tones = {
    green: "bg-[#edf6ef] text-[#428257]",
    amber: "bg-[#fbf3e6] text-[#9a7140]",
    gray: "bg-[#f0f3f1] text-[#718078]",
    blue: "bg-[#eef3fb] text-[#4a6fa5]",
  };
  return <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] ${tones[tone]}`}>{children}</span>;
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[#edf1ee]">
      <div className="h-full rounded-full bg-[#4d9b65] transition-all duration-500" style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </div>
  );
}

export function ScoreRing({ value, size = 96, caption }: { value: number; size?: number; caption?: string }) {
  const ring = Math.max(8, size / 11);
  return (
    <div className="grid shrink-0 place-items-center rounded-full bg-[#f5faf6]" style={{ width: size, height: size, border: `${ring}px solid #a4d0af` }}>
      <div className="text-center">
        <p className="font-bold text-[#3f8154]" style={{ fontSize: size / 4 }}>{value}</p>
        <p className="text-[#7e8b83]" style={{ fontSize: size / 11 }}>{caption ?? "/ 100"}</p>
      </div>
    </div>
  );
}

export function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[11px]">
        <span className="font-semibold text-[#4b5850]">{label}</span>
        <span className="text-[#6c7971]">{value}%</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

export function PrimaryButton({ children, onClick, disabled, loading, icon: Icon }: { children: ReactNode; onClick?: () => void; disabled?: boolean; loading?: boolean; icon?: LucideIcon }) {
  return (
    <button onClick={onClick} disabled={disabled || loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4d9b65] px-5 py-3 text-xs font-bold text-white shadow-[0_6px_15px_rgba(77,155,101,.2)] transition hover:bg-[#438b59] disabled:cursor-default disabled:opacity-50">
      {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : Icon ? <Icon size={14} /> : null}
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, icon: Icon, disabled }: { children: ReactNode; onClick?: () => void; icon?: LucideIcon; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#b9d1c0] px-4 py-3 text-xs font-bold text-[#438458] transition hover:bg-[#f1f7f2] disabled:opacity-50">
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-[#56645c]">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[11px] text-[#929d97]">{hint}</span>}
    </label>
  );
}

export const inputClass = "w-full rounded-xl border border-[#dfe7e1] bg-[#fbfcfb] px-4 py-3 text-sm text-[#33403a] outline-none transition placeholder:text-[#a9b2ad] focus:border-[#62a876] focus:ring-3 focus:ring-[#4d9b65]/10";
