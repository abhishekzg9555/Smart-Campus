import React from 'react';
import { ComplaintStatus } from '../../types';
import { AlertCircle, Clock, UserCheck, Wrench, CheckCircle2 } from 'lucide-react';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  let bgClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let IconComponent = AlertCircle;

  switch (status) {
    case 'Reported':
      bgClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      IconComponent = AlertCircle;
      break;
    case 'Under Review':
      bgClasses = 'bg-purple-50 text-purple-700 border-purple-200';
      IconComponent = Clock;
      break;
    case 'Assigned':
      bgClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      IconComponent = UserCheck;
      break;
    case 'In Progress':
      bgClasses = 'bg-amber-50 text-amber-800 border-amber-300';
      IconComponent = Wrench;
      break;
    case 'Resolved':
      bgClasses = 'bg-emerald-50 text-emerald-700 border-emerald-300';
      IconComponent = CheckCircle2;
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border whitespace-nowrap ${bgClasses} ${sizeClasses}`}
    >
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{status}</span>
    </span>
  );
};
