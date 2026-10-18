import React, { useState, useMemo } from 'react';
import { Complaint, ComplaintStatus, Priority, ProblemCategory, Building } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { format } from 'date-fns';
import {
  Search,
  Filter,
  FileText,
  Building2,
  Calendar,
  User,
  MapPin,
  ArrowUpDown,
  Wrench,
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface AdminComplaintsPageProps {
  complaints?: Complaint[];
  onSelectComplaintToManage?: (docId: string) => void;
  onViewComplaint?: (complaint: Complaint) => void;
  onManageComplaint?: (complaint: Complaint) => void;
  initialFilter?: { priority?: string; status?: string };
}

const BUILDINGS: (Building | 'All')[] = [
  'All',
  'CSE Department',
  'Mechanical Department',
  'Library',
  'Admin Block',
  'Hostel',
  'Other',
];

const CATEGORIES: (ProblemCategory | 'All')[] = [
  'All',
  'Electrical',
  'Plumbing',
  'Cleanliness',
  'Furniture',
  'Infrastructure',
  'Safety',
  'Other',
];

const STATUSES: (ComplaintStatus | 'All')[] = [
  'All',
  'Reported',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
];

const PRIORITIES: (Priority | 'All')[] = ['All', 'High', 'Medium', 'Normal'];

export const AdminComplaintsPage: React.FC<AdminComplaintsPageProps> = ({
  complaints = [],
  onSelectComplaintToManage,
  onViewComplaint,
  onManageComplaint,
  initialFilter,
}) => {
  const handleManage = (complaint: Complaint) => {
    if (onManageComplaint) {
      onManageComplaint(complaint);
    } else if (onViewComplaint) {
      onViewComplaint(complaint);
    } else if (onSelectComplaintToManage) {
      onSelectComplaintToManage(complaint.id);
    }
  };

  const safeComplaints = Array.isArray(complaints) ? complaints : [];
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter?.status || 'All');
  const [priorityFilter, setPriorityFilter] = useState<string>(initialFilter?.priority || 'All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');

  const filteredAndSorted = useMemo(() => {
    let result = safeComplaints.filter((c) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesId = (c.complaintId || '').toLowerCase().includes(q);
        const matchesDesc = (c.description || '').toLowerCase().includes(q);
        const matchesStudent = ((c.studentName || '') + ' ' + (c.studentId || '') + ' ' + (c.studentEmail || ''))
          .toLowerCase()
          .includes(q);
        const matchesLoc = ((c.building || '') + ' ' + (c.location || '') + ' ' + (c.floor || '')).toLowerCase().includes(q);
        const matchesCat = (c.category || '').toLowerCase().includes(q);
        if (!matchesId && !matchesDesc && !matchesStudent && !matchesLoc && !matchesCat) {
          return false;
        }
      }

      // Department
      if (buildingFilter !== 'All') {
        const normFilter = buildingFilter.replace('Building', 'Department');
        const normBuilding = (c.building || '').replace('Building', 'Department');
        if (normBuilding !== normFilter) return false;
      }

      // Category
      if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;

      // Status
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;

      // Priority
      if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === 'priority') {
        const pOrder: Record<Priority, number> = { High: 3, Medium: 2, Normal: 1 };
        return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
      }
      return 0;
    });

    return result;
  }, [safeComplaints, search, buildingFilter, categoryFilter, statusFilter, priorityFilter, sortBy]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return format(new Date(isoString), 'MMM d, yyyy');
    } catch {
      return '';
    }
  };

  const hasFilters =
    search !== '' ||
    buildingFilter !== 'All' ||
    categoryFilter !== 'All' ||
    statusFilter !== 'All' ||
    priorityFilter !== 'All';

  const resetFilters = () => {
    setSearch('');
    setBuildingFilter('All');
    setCategoryFilter('All');
    setStatusFilter('All');
    setPriorityFilter('All');
    setSortBy('newest');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Campus Complaints Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Filter by department, assign technician crews, inspect photographs, and progress ticket lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          <span>Total Database: {complaints.length} tickets</span>
        </div>
      </div>

      {/* Search & Multi-Filters Toolbar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID (e.g. CAMP-1001), student name, room 204, keyword..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Department */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Department
            </label>
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              {BUILDINGS.map((b) => (
                <option key={b} value={b}>
                  {b === 'All' ? 'All Departments' : b}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p === 'All' ? 'All Priorities' : `${p} Priority`}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Statuses' : s}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Highest Priority</option>
            </select>
          </div>
        </div>

        {hasFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing {filteredAndSorted.length} matching complaints
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Complaints Table (Desktop) / Cards (Mobile) */}
      {filteredAndSorted.length === 0 ? (
        <EmptyState
          title="No Matching Complaints Found"
          description="Try adjusting your keyword search or resetting the department and status filters."
          actionText="Reset All Filters"
          onAction={resetFilters}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Problem & Photo</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Department & Location</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredAndSorted.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                    onClick={() => handleManage(c)}
                  >
                    {/* ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-blue-700">
                      {c.complaintId}
                    </td>

                    {/* Problem Thumbnail & Snippet */}
                    <td className="py-3.5 px-4 max-w-[240px]">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
                          <img
                            src={c.photoUrl}
                            alt="thumb"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {c.title || c.category}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {c.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Student */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-bold text-slate-900">{c.studentName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{c.studentId}</p>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-bold text-slate-800">{c.building?.replace('Building', 'Department')}</p>
                      <p className="text-[11px] text-slate-500">
                        {c.floor} • {c.location}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                        {c.category}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={c.priority} size="sm" />
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={c.status} size="sm" />
                      {c.assignedDepartment && (
                        <p className="text-[10px] text-indigo-700 font-semibold mt-0.5 truncate max-w-[120px]">
                          {c.assignedDepartment}
                        </p>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {formatDate(c.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onSelectComplaintToManage(c.id)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card List */}
          <div className="lg:hidden divide-y divide-slate-100">
            {filteredAndSorted.map((c) => (
              <div
                key={c.id}
                onClick={() => handleManage(c)}
                className="p-4 hover:bg-slate-50 cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {c.complaintId}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <PriorityBadge priority={c.priority} size="sm" />
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
                    <img
                      src={c.photoUrl}
                      alt="thumbnail"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900 text-sm">
                      {c.category} • {c.building?.replace('Building', 'Department')}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {c.floor} ({c.location}) — {c.studentName}
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">{c.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-400 font-mono">{formatDate(c.createdAt)}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManage(c);
                    }}
                    className="text-xs font-bold text-blue-600 flex items-center gap-1"
                  >
                    <span>Manage Complaint</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
