import React from 'react';
import { Link } from 'react-router-dom';
import { useDashboardData } from './hooks/useDashboardData';
import {
  PuzzlePieceIcon,
  ClipboardDocumentListIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  MegaphoneIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

// ─── Helpers ─────────────────────────────────────────────────
const formatDeadline = (date) => {
  if (!date) return 'No Deadline';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

const formatCurrency = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n || 0);

const timeAgo = (date) => {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  const seconds = Math.floor((new Date() - d) / 1000);
  if (seconds < 60) return 'Baru saja';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bulan lalu`;
  return `${Math.floor(months / 12)} tahun lalu`;
};

const priorityConfig = {
  Urgent: {
    dot: 'bg-red-400',
    text: 'text-red-400',
    bg: 'bg-red-400/10',
    hex: '#f87171',
  },
  High: {
    dot: 'bg-orange-400',
    text: 'text-orange-400',
    bg: 'bg-orange-400/10',
    hex: '#fb923c',
  },
  Medium: {
    dot: 'bg-amber-400',
    text: 'text-amber-400',
    bg: 'bg-amber-400/10',
    hex: '#fbbf24',
  },
  Low: {
    dot: 'bg-emerald-400',
    text: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    hex: '#34d399',
  },
};

const requestPriorityConfig = (count) => {
  if (count > 10)
    return {
      label: 'Critical',
      color: 'text-red-400',
      bar: 'bg-red-400',
      hex: '#f87171',
    };
  if (count > 5)
    return {
      label: 'High',
      color: 'text-orange-400',
      bar: 'bg-orange-400',
      hex: '#fb923c',
    };
  if (count > 3)
    return {
      label: 'Medium',
      color: 'text-amber-400',
      bar: 'bg-amber-400',
      hex: '#fbbf24',
    };
  return {
    label: 'Low',
    color: 'text-emerald-400',
    bar: 'bg-emerald-400',
    hex: '#34d399',
  };
};

// ─── Activity Item ───────────────────────────────────────────
const ActivityItem = ({ activity }) => {
  const configs = {
    GAME_ADDED: {
      icon: PuzzlePieceIcon,
      color: 'text-blue-400',
      bg: 'bg-blue-500/15',
      border: 'border-blue-500/20',
      verb: 'Game ditambahkan',
    },
    TASK_CREATED: {
      icon: BriefcaseIcon,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/15',
      border: 'border-emerald-500/20',
      verb: 'Task baru',
    },
    REQUEST_RECEIVED: {
      icon: ClipboardDocumentListIcon,
      color: 'text-orange-400',
      bg: 'bg-orange-500/15',
      border: 'border-orange-500/20',
      verb: 'Request diterima',
    },
  };

  const cfg = configs[activity.type];
  if (!cfg) return null;
  const Icon = cfg.icon;
  const name =
    activity.data?.name || activity.data?.title || activity.data?.game || '';

  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#2A2F39]/60 last:border-b-0">
      <div
        className={`mt-0.5 w-9 h-9 rounded-xl ${cfg.bg} border ${cfg.border} grid place-items-center flex-shrink-0`}
      >
        <Icon className={`w-[18px] h-[18px] ${cfg.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[#C8CFDA]">
          <span className={`font-semibold ${cfg.color}`}>{cfg.verb}</span>
          {': '}
          <span className="font-semibold text-[#F3F4F6]">{name}</span>
        </p>
        <p className="text-xs text-[#7E8796] mt-0.5">
          {timeAgo(activity.date)}
        </p>
      </div>
    </div>
  );
};

// ─── Stat Card ───────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, href }) => {
  const inner = (
    <div
      className="group relative rounded-xl overflow-hidden p-4 h-full transition-all hover:scale-[1.02] hover:shadow-lg"
      style={{
        background: `linear-gradient(135deg, ${color}22 0%, ${color}08 100%)`,
        border: `1px solid ${color}30`,
      }}
    >
      {/* Glow dot */}
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-20 blur-2xl"
        style={{ backgroundColor: color }}
      />
      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0"
            style={{
              backgroundColor: `${color}25`,
              boxShadow: `0 0 12px ${color}15`,
            }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <span className="text-xs font-semibold text-[#C8CFDA] uppercase tracking-wider">
            {label}
          </span>
        </div>
        <p className="text-2xl font-bold tabular-nums" style={{ color }}>
          {value}
        </p>
      </div>
    </div>
  );

  return href ? (
    <Link to={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
};

// ─── Section Card wrapper ────────────────────────────────────
const SectionCard = ({ title, children, className = '' }) => (
  <div
    className={`rounded-xl border border-[#2A2F39] bg-[#1A1F27] p-5 ${className}`}
  >
    <h2 className="text-sm font-bold text-[#F3F4F6] uppercase tracking-wider mb-4">
      {title}
    </h2>
    {children}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
const DashboardPage = () => {
  const {
    summaryStats,
    priorityTasks,
    importantRequests,
    recentActivities,
    loading,
    error,
  } = useDashboardData();

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-5">
        {/* Skeleton stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#2A2F39] bg-[#1A1F27] p-4 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#2A2F39]" />
                <div className="h-3 w-16 bg-[#2A2F39] rounded" />
              </div>
              <div className="h-7 w-12 bg-[#2A2F39] rounded" />
            </div>
          ))}
        </div>
        {/* Skeleton sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#2A2F39] bg-[#1A1F27] p-5 animate-pulse"
            >
              <div className="h-4 w-32 bg-[#2A2F39] rounded mb-4" />
              <div className="space-y-3">
                <div className="h-10 bg-[#2A2F39]/60 rounded-lg" />
                <div className="h-10 bg-[#2A2F39]/60 rounded-lg" />
                <div className="h-10 bg-[#2A2F39]/60 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-400 text-center">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* ── Reminder ── */}
      <div className="rounded-xl border border-[#FFD100]/20 bg-[#FFD100]/[0.06] px-4 py-3 flex items-start gap-3">
        <MegaphoneIcon className="w-5 h-5 text-[#FFD100] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[#C8CFDA]">
          <span className="font-semibold text-[#FFD100]">Reminder:</span> Pantau
          task aktif dan request yang menunggu review.
        </p>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={PuzzlePieceIcon}
          label="Games"
          value={summaryStats.totalGames}
          color="#3B82F6"
          href="/games"
        />
        <StatCard
          icon={BriefcaseIcon}
          label="Tasks"
          value={summaryStats.totalTasks}
          color="#22C55E"
          href="/task"
        />
        <StatCard
          icon={ClipboardDocumentListIcon}
          label="Requests"
          value={summaryStats.totalRequests}
          color="#F59E0B"
          href="/requests"
        />
        <StatCard
          icon={CurrencyDollarIcon}
          label="Revenue Bulan Ini"
          value={formatCurrency(summaryStats.monthlyRevenue)}
          color="#A855F7"
          href="/operational"
        />
      </div>

      {/* ── Operational Mini Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-semibold text-emerald-400/70 uppercase tracking-wider">
              Net Revenue
            </span>
          </div>
          <p className="text-base font-bold text-emerald-400 tabular-nums">
            {formatCurrency(summaryStats.monthlyNetRevenue)}
          </p>
        </div>
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.07] px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <ChartBarIcon className="w-4 h-4 text-orange-400" />
            <span className="text-[10px] font-semibold text-orange-400/70 uppercase tracking-wider">
              Ad Spend
            </span>
          </div>
          <p className="text-base font-bold text-orange-400 tabular-nums">
            {formatCurrency(summaryStats.monthlyAdSpend)}
          </p>
        </div>
      </div>

      {/* ── Middle Row: Tasks + Requests ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Priority Tasks */}
        <SectionCard title="Task Prioritas">
          {priorityTasks.length > 0 ? (
            <div className="space-y-2.5">
              {priorityTasks.map((task) => {
                const pCfg =
                  priorityConfig[task.priority] || priorityConfig.Low;
                const progress =
                  task.status === 'In Progress'
                    ? 50
                    : task.status === 'Todo'
                      ? 10
                      : 0;

                return (
                  <div
                    key={task.id}
                    className="rounded-lg bg-[#111317] border border-[#2A2F39]/60 p-3.5 border-l-[3px]"
                    style={{ borderLeftColor: pCfg.hex }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p
                        className="text-sm font-medium text-[#F3F4F6] truncate"
                        title={task.title}
                      >
                        {task.title}
                      </p>
                      <span className="text-[11px] text-[#7E8796] flex-shrink-0 whitespace-nowrap">
                        {task.dueDate ? formatDeadline(task.dueDate) : '—'}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-[#2A2F39] mb-2">
                      <div
                        className={`h-1.5 rounded-full ${pCfg.dot} transition-all`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#7E8796]">
                        {task.status}
                      </span>
                      {task.priority && (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${pCfg.bg} ${pCfg.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${pCfg.dot}`}
                          />
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <BriefcaseIcon className="w-8 h-8 mx-auto text-[#7E8796] opacity-40 mb-2" />
              <p className="text-sm text-[#7E8796]">Tidak ada task aktif.</p>
            </div>
          )}
        </SectionCard>

        {/* Important Requests */}
        <SectionCard title="Request Penting">
          {importantRequests.length > 0 ? (
            <div className="space-y-2.5">
              {importantRequests.map((item) => {
                const rCfg = requestPriorityConfig(item.requestCount || 1);
                const barWidth = Math.min(
                  100,
                  ((item.requestCount || 1) / 15) * 100
                );

                return (
                  <div
                    key={item.id}
                    className="rounded-lg bg-[#111317] border border-[#2A2F39]/60 p-3.5 border-l-[3px]"
                    style={{ borderLeftColor: rCfg.hex }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p
                        className="text-sm font-medium text-[#F3F4F6] truncate"
                        title={item.game}
                      >
                        {item.game}
                      </p>
                      <span
                        className="text-xs font-bold tabular-nums flex-shrink-0"
                        style={{ color: rCfg.hex }}
                      >
                        {item.requestCount}
                        <span className="font-normal text-[#7E8796]">
                          {' '}
                          votes
                        </span>
                      </span>
                    </div>
                    {/* Vote bar */}
                    <div className="h-1.5 rounded-full bg-[#2A2F39] mb-2">
                      <div
                        className={`h-1.5 rounded-full ${rCfg.bar} transition-all`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-semibold ${rCfg.color}`}>
                      {rCfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <ClipboardDocumentListIcon className="w-8 h-8 mx-auto text-[#7E8796] opacity-40 mb-2" />
              <p className="text-sm text-[#7E8796]">Tidak ada request game.</p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Recent Activity ── */}
      <SectionCard title="Aktivitas Terbaru">
        {recentActivities.length > 0 ? (
          <div>
            {recentActivities.map((activity, index) => (
              <ActivityItem key={activity.id || index} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CalendarDaysIcon className="w-8 h-8 mx-auto text-[#7E8796] opacity-40 mb-2" />
            <p className="text-sm text-[#7E8796]">
              Belum ada aktivitas terbaru.
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default DashboardPage;
