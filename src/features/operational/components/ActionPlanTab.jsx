import React from 'react';
import {
  Scissors,
  Rocket,
  Settings,
  Lightbulb,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

const formatRupiah = (num) => {
  if (!num && num !== 0) return null;
  if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}jt`;
  if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)}rb`;
  return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
};

const PRIORITY_CONFIG = {
  high: {
    label: 'High',
    badge: 'bg-red-500/15 text-red-400 border-red-500/25',
  },
  medium: {
    label: 'Medium',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  },
  low: {
    label: 'Low',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  },
};

const CATEGORY_CONFIG = {
  cut: { label: 'Cut', icon: Scissors, color: 'text-red-400' },
  scale: { label: 'Scale Up', icon: Rocket, color: 'text-emerald-400' },
  optimize: { label: 'Optimize', icon: Settings, color: 'text-amber-400' },
  strategic: { label: 'Strategic', icon: Lightbulb, color: 'text-purple-400' },
};

const ActionPlanTab = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="text-center py-12 text-[#7E8796]">
        <p>
          Belum ada rekomendasi. Import data lengkap untuk generate action plan.
        </p>
      </div>
    );
  }

  const highCount = recommendations.filter((r) => r.priority === 'high').length;
  const mediumCount = recommendations.filter(
    (r) => r.priority === 'medium'
  ).length;
  const totalImpact = recommendations.reduce((s, r) => s + (r.impact || 0), 0);

  return (
    <div className="space-y-6">
      <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle size={18} className="text-[#FFD100]" />
          <h3 className="text-sm font-semibold text-[#F3F4F6]">
            Action Plan Summary
          </h3>
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="text-[#C8CFDA]">
            <strong className="text-red-400">{highCount}</strong> high priority
          </span>
          <span className="text-[#C8CFDA]">
            <strong className="text-amber-400">{mediumCount}</strong> medium
            priority
          </span>
          <span className="text-[#C8CFDA]">
            <strong className="text-[#F3F4F6]">{recommendations.length}</strong>{' '}
            total actions
          </span>
          {totalImpact > 0 && (
            <span className="text-[#C8CFDA]">
              Potential impact:{' '}
              <strong className="text-emerald-400">
                {formatRupiah(totalImpact)}
              </strong>
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, i) => {
          const priority = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.low;
          const category =
            CATEGORY_CONFIG[rec.category] || CATEGORY_CONFIG.optimize;
          const CategoryIcon = category.icon;

          return (
            <div
              key={i}
              className="bg-[#111317] border border-[#2A2F39] rounded-xl p-4 hover:border-[#2A2F39]/80 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg bg-[#1A1F27] shrink-0 ${category.color}`}
                >
                  <CategoryIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-sm font-semibold text-[#F3F4F6]">
                      {rec.title}
                    </h4>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${priority.badge}`}
                    >
                      {priority.label}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1A1F27] text-[#7E8796] border border-[#2A2F39]">
                      {category.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#C8CFDA] leading-relaxed">
                    {rec.description}
                  </p>

                  {rec.campaigns && rec.campaigns.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {rec.campaigns.slice(0, 3).map((c, j) => (
                        <span
                          key={j}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#1A1F27] text-[#7E8796] border border-[#2A2F39] truncate max-w-[180px]"
                        >
                          {c}
                        </span>
                      ))}
                      {rec.campaigns.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#1A1F27] text-[#7E8796]">
                          +{rec.campaigns.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {rec.impact > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                      <ArrowRight size={10} />
                      <span>
                        Potential saving/gain: {formatRupiah(rec.impact)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActionPlanTab;
