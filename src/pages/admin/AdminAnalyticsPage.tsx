import React, { useMemo } from 'react';
import { Complaint } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Building2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Calendar,
  Layers
} from 'lucide-react';
import { format, subMonths } from 'date-fns';

interface AdminAnalyticsPageProps {
  complaints?: Complaint[];
}

const CATEGORY_COLORS = [
  '#2563eb', // blue
  '#0284c7', // sky
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#64748b', // slate
];

const STATUS_COLORS: Record<string, string> = {
  'Reported': '#3b82f6',
  'Under Review': '#8b5cf6',
  'Assigned': '#6366f1',
  'In Progress': '#f59e0b',
  'Resolved': '#10b981',
};

const PRIORITY_COLORS: Record<string, string> = {
  'High': '#ef4444',
  'Medium': '#f59e0b',
  'Normal': '#3b82f6',
};

export const AdminAnalyticsPage: React.FC<AdminAnalyticsPageProps> = ({ complaints = [] }) => {
  const safeComplaints = Array.isArray(complaints) ? complaints : [];

  // 1. Total Metrics
  const total = safeComplaints.length;
  const resolved = safeComplaints.filter((c) => c.status === 'Resolved').length;
  const inProgress = safeComplaints.filter(
    (c) => c.status === 'In Progress' || c.status === 'Assigned'
  ).length;
  const pending = safeComplaints.filter(
    (c) => c.status === 'Reported' || c.status === 'Under Review'
  ).length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // 2. Complaints by Category
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    safeComplaints.forEach((c) => {
      if (c.category) {
        counts[c.category] = (counts[c.category] || 0) + 1;
      }
    });
    return Object.keys(counts).map((name) => ({
      name,
      count: counts[name],
    }));
  }, [safeComplaints]);

  // 3. Complaints by Department
  const buildingData = useMemo(() => {
    const counts: Record<string, { total: number; resolved: number }> = {};
    safeComplaints.forEach((c) => {
      const bKey = (c.building || 'Other')
        .replace(/CSE Building/g, 'CSE Department')
        .replace(/Mechanical Building/g, 'Mechanical Department');
      if (!counts[bKey]) {
        counts[bKey] = { total: 0, resolved: 0 };
      }
      counts[bKey].total += 1;
      if (c.status === 'Resolved') {
        counts[bKey].resolved += 1;
      }
    });
    return Object.keys(counts).map((b) => ({
      building: b,
      Total: counts[b].total,
      Resolved: counts[b].resolved,
      Unresolved: counts[b].total - counts[b].resolved,
    }));
  }, [safeComplaints]);

  // 4. Complaints by Priority
  const priorityData = useMemo(() => {
    const counts: Record<string, number> = { High: 0, Medium: 0, Normal: 0 };
    safeComplaints.forEach((c) => {
      if (c.priority && counts[c.priority] !== undefined) {
        counts[c.priority] += 1;
      }
    });
    return [
      { name: 'High Priority', count: counts['High'], priority: 'High' },
      { name: 'Medium Priority', count: counts['Medium'], priority: 'Medium' },
      { name: 'Normal Priority', count: counts['Normal'], priority: 'Normal' },
    ];
  }, [safeComplaints]);

  // 5. Complaints by Status
  const statusData = useMemo(() => {
    const order = ['Reported', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];
    const counts: Record<string, number> = {};
    order.forEach((s) => (counts[s] = 0));
    safeComplaints.forEach((c) => {
      if (c.status && counts[c.status] !== undefined) {
        counts[c.status] = (counts[c.status] || 0) + 1;
      }
    });
    return order.map((status) => ({
      status,
      count: counts[status] || 0,
    }));
  }, [safeComplaints]);

  // 6. Resolved vs Unresolved
  const resolvedRatioData = useMemo(() => {
    return [
      { name: 'Resolved', value: resolved, color: '#10b981' },
      { name: 'Pending / In Progress', value: total - resolved, color: '#f59e0b' },
    ];
  }, [total, resolved]);

  // 7. Monthly Trends (Past 6 months based on actual creation dates)
  const monthlyTrendsData = useMemo(() => {
    const monthsMap: Record<string, { reported: number; resolved: number }> = {};

    // Initialize last 5 months
    for (let i = 4; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const mKey = format(d, 'MMM yyyy');
      monthsMap[mKey] = { reported: 0, resolved: 0 };
    }

    safeComplaints.forEach((c) => {
      try {
        if (c.createdAt) {
          const mKey = format(new Date(c.createdAt), 'MMM yyyy');
          if (!monthsMap[mKey]) {
            monthsMap[mKey] = { reported: 0, resolved: 0 };
          }
          monthsMap[mKey].reported += 1;
        }

        if (c.resolvedAt) {
          const rKey = format(new Date(c.resolvedAt), 'MMM yyyy');
          if (!monthsMap[rKey]) {
            monthsMap[rKey] = { reported: 0, resolved: 0 };
          }
          monthsMap[rKey].resolved += 1;
        }
      } catch {}
    });

    return Object.keys(monthsMap).map((month) => ({
      month,
      Reported: monthsMap[month].reported,
      Resolved: monthsMap[month].resolved,
    }));
  }, [safeComplaints]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Campus Infrastructure Analytics
            </h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Live Database
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time aggregate insights across facilities, response bottlenecks, and department loads.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Real-time aggregation from Firestore</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Logged"
          value={total}
          icon={BarChart3}
          subtitle="Lifetime campus tickets"
          accentColor="blue"
        />
        <StatCard
          title="Resolution Rate"
          value={`${resolutionRate}%`}
          icon={CheckCircle2}
          subtitle={`${resolved} of ${total} resolved`}
          accentColor="emerald"
        />
        <StatCard
          title="Work In Progress"
          value={inProgress}
          icon={Clock}
          subtitle="Technicians dispatched"
          accentColor="amber"
        />
        <StatCard
          title="Under Review"
          value={pending}
          icon={ShieldAlert}
          subtitle="Awaiting delegation"
          accentColor="purple"
        />
      </div>

      {/* Row 1: Category Distribution & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Complaints by Category</h3>
              <p className="text-xs text-slate-500">Distribution across maintenance domains</p>
            </div>
            <PieIcon className="w-5 h-5 text-slate-400" />
          </div>

          <div className="h-64 sm:h-72 w-full">
            {categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No complaint category data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="count"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      color: '#fff',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Department Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Complaints by Campus Department</h3>
              <p className="text-xs text-slate-500">Volume across engineering & academic departments</p>
            </div>
            <Building2 className="w-5 h-5 text-slate-400" />
          </div>

          <div className="h-64 sm:h-72 w-full">
            {buildingData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No department data logged yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buildingData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="building"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      color: '#fff',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="Unresolved" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Status Workflow Funnel & Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Workflow Progression */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Complaint Status Lifecycle</h3>
              <p className="text-xs text-slate-500">Distribution across active workflow stages</p>
            </div>
            <Layers className="w-5 h-5 text-slate-400" />
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#2563eb'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Complaints by Priority</h3>
              <p className="text-xs text-slate-500">High vs Medium vs Normal urgency breakdown</p>
            </div>
            <ShieldAlert className="w-5 h-5 text-slate-400" />
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={PRIORITY_COLORS[entry.priority] || '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Monthly Trends & Resolved vs Unresolved Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Monthly Incident Trends</h3>
              <p className="text-xs text-slate-500">
                Incoming reports vs successfully closed resolutions
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="Reported"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="Resolved"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resolved Ratio Doughnut (1 Col) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Resolved vs Unresolved</h3>
            <p className="text-xs text-slate-500">Overall campus facility resolution proportion</p>
          </div>

          <div className="h-64 sm:h-72 w-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resolvedRatioData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {resolvedRatioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
