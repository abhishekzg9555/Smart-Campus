import React from 'react';
import { Priority } from '../../types';
import { ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'md',
  showIcon = true,
}) => {
  let styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let IconComp = ShieldCheck;

  switch (priority) {
    case 'High':
      styleClasses = 'bg-red-50 text-red-700 border-red-200 font-semibold ring-1 ring-red-400/30';
      IconComp = ShieldAlert;
      break;
    case 'Medium':
      styleClasses = 'bg-orange-50 text-orange-700 border-orange-200 font-medium';
      IconComp = AlertTriangle;
      break;
    case 'Normal':
      styleClasses = 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
      IconComp = ShieldCheck;
      break;
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border whitespace-nowrap ${styleClasses} ${sizeClasses}`}
    >
      {showIcon && (
        <IconComp className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      )}
      <span>{priority} Priority</span>
    </span>
  );
};
