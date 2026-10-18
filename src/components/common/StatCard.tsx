import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  subtitle?: string;
  accentColor?: 'blue' | 'amber' | 'emerald' | 'red' | 'purple' | 'slate';
  onClick?: () => void;
  isActive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  accentColor = 'blue',
  onClick,
  isActive = false,
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50/70 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-600 text-white',
      ring: 'ring-2 ring-blue-500 border-blue-400',
    },
    amber: {
      bg: 'bg-amber-50/70 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-500 text-white',
      ring: 'ring-2 ring-amber-500 border-amber-400',
    },
    emerald: {
      bg: 'bg-emerald-50/70 text-emerald-800 border-emerald-200',
      iconBg: 'bg-emerald-600 text-white',
      ring: 'ring-2 ring-emerald-500 border-emerald-400',
    },
    red: {
      bg: 'bg-red-50/70 text-red-800 border-red-200',
      iconBg: 'bg-red-600 text-white',
      ring: 'ring-2 ring-red-500 border-red-400',
    },
    purple: {
      bg: 'bg-purple-50/70 text-purple-800 border-purple-200',
      iconBg: 'bg-purple-600 text-white',
      ring: 'ring-2 ring-purple-500 border-purple-400',
    },
    slate: {
      bg: 'bg-slate-50 text-slate-800 border-slate-200',
      iconBg: 'bg-slate-700 text-white',
      ring: 'ring-2 ring-slate-500 border-slate-400',
    },
  };

  const currentTheme = colorMap[accentColor];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-4 sm:p-5 shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      } ${isActive ? currentTheme.ring : 'border-slate-200'}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 font-mono tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${currentTheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
          {subtitle}
        </p>
      )}
    </div>
  );
};
