import React, { useState, useEffect } from 'react';
import { Complaint, ComplaintStatus } from '../../types';
import { Check, Clock, UserCheck, Wrench, CheckCircle2, AlertCircle, Timer } from 'lucide-react';
import { format } from 'date-fns';

interface TimelineProps {
  complaint: Complaint;
  orientation?: 'horizontal' | 'vertical';
}

const STAGES: { status: ComplaintStatus; title: string; description: string; icon: any }[] = [
  {
    status: 'Reported',
    title: 'Reported',
    description: 'Complaint submitted by student',
    icon: AlertCircle,
  },
  {
    status: 'Under Review',
    title: 'Under Review',
    description: 'Admin verifying severity & location',
    icon: Clock,
  },
  {
    status: 'Assigned',
    title: 'Assigned',
    description: 'Delegated to maintenance team',
    icon: UserCheck,
  },
  {
    status: 'In Progress',
    title: 'In Progress',
    description: 'Field technicians executing repair',
    icon: Wrench,
  },
  {
    status: 'Resolved',
    title: 'Resolved',
    description: 'Work completed & verified with photos',
    icon: CheckCircle2,
  },
];

const STATUS_ORDER: Record<ComplaintStatus, number> = {
  'Reported': 0,
  'Under Review': 1,
  'Assigned': 2,
  'In Progress': 3,
  'Resolved': 4,
};

export const Timeline: React.FC<TimelineProps> = ({ complaint, orientation = 'horizontal' }) => {
  const currentStepIndex = STATUS_ORDER[complaint.status] ?? 0;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (complaint.status !== 'Assigned') {
      setSecondsLeft(null);
      return;
    }

    const assignedTime = complaint.assignedAt || complaint.updatedAt || complaint.createdAt;
    const assignedTimestamp = new Date(assignedTime).getTime();

    const calculateRemaining = () => {
      const elapsed = Date.now() - assignedTimestamp;
      const remainingMs = 5 * 60 * 1000 - elapsed;
      return Math.max(0, Math.ceil(remainingMs / 1000));
    };

    setSecondsLeft(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [complaint.status, complaint.assignedAt, complaint.updatedAt, complaint.createdAt]);

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return null;
    try {
      return format(new Date(isoString), 'MMM d, yyyy h:mm a');
    } catch {
      return isoString;
    }
  };

  return (
    <div className="w-full">
      {/* Horizontal on Desktop / Tablets */}
      <div className="hidden md:block">
        <div className="relative flex items-center justify-between">
          {/* Connecting Track */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500"
            style={{
              width: `${(currentStepIndex / (STAGES.length - 1)) * 100}%`,
            }}
          />

          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isPending = idx > currentStepIndex;
            const Icon = stage.icon;

            return (
              <div key={stage.status} className="relative z-10 flex flex-col items-center group">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all shadow-sm ${
                    isCompleted
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                      : 'bg-white text-slate-400 border-2 border-slate-300'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>

                <div className="mt-3 text-center max-w-[125px]">
                  <p
                    className={`text-xs font-semibold ${
                      isCurrent
                        ? 'text-blue-700'
                        : isCompleted
                        ? 'text-emerald-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {stage.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight line-clamp-2">
                    {stage.description}
                  </p>
                  {idx === 0 && (
                    <p className="text-[9px] text-slate-400 mt-1 font-mono">
                      {formatDate(complaint.createdAt)}
                    </p>
                  )}
                  {stage.status === 'Assigned' && isCurrent && secondsLeft !== null && (
                    <div className="mt-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-[9px] font-bold text-indigo-700">
                      <Timer className="w-2.5 h-2.5 animate-spin" />
                      <span>In Progress in {formatCountdown(secondsLeft)}</span>
                    </div>
                  )}
                  {idx === 4 && complaint.resolvedAt && (
                    <p className="text-[9px] text-emerald-600 mt-1 font-mono font-medium">
                      {formatDate(complaint.resolvedAt)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vertical for Mobile */}
      <div className="md:hidden space-y-4">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const isPending = idx > currentStepIndex;
          const Icon = stage.icon;

          return (
            <div key={stage.status} className="flex items-start space-x-3">
              <div className="relative flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-slate-100 text-slate-400 border border-slate-300'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                {idx < STAGES.length - 1 && (
                  <div
                    className={`w-0.5 h-10 my-1 ${
                      idx < currentStepIndex ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>

              <div className="pt-0.5 pb-2">
                <div className="flex items-center space-x-2">
                  <h4
                    className={`text-sm font-semibold ${
                      isCurrent
                        ? 'text-blue-700'
                        : isCompleted
                        ? 'text-emerald-700'
                        : 'text-slate-600'
                    }`}
                  >
                    {stage.title}
                  </h4>
                  {isCurrent && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{stage.description}</p>
                {idx === 0 && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Submitted: {formatDate(complaint.createdAt)}
                  </p>
                )}
                {stage.status === 'Assigned' && (
                  <div className="mt-1 space-y-1">
                    {complaint.assignedDepartment && (
                      <p className="text-xs text-indigo-700 font-medium bg-indigo-50 px-2 py-1 rounded inline-block">
                        Dept: {complaint.assignedDepartment} {complaint.assignedStaff && `• ${complaint.assignedStaff}`}
                      </p>
                    )}
                    {isCurrent && secondsLeft !== null && (
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50/90 border border-indigo-200 px-2 py-0.5 rounded-md">
                        <Timer className="w-3 h-3 text-indigo-600 animate-spin" />
                        <span>Transitions to In Progress in {formatCountdown(secondsLeft)}</span>
                      </div>
                    )}
                  </div>
                )}
                {idx === 4 && complaint.resolvedAt && (
                  <p className="text-xs text-emerald-700 font-medium mt-1 bg-emerald-50 px-2 py-1 rounded inline-block">
                    Resolved: {formatDate(complaint.resolvedAt)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
