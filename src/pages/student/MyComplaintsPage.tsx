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
  MapPin,
  Calendar,
  ChevronRight,
  PlusCircle,
  Clock,
  CheckCircle2,
  X
} from 'lucide-react';

interface MyComplaintsPageProps {
  complaints?: Complaint[];
  onSelectComplaint?: (docId: string) => void;
  onGoToReport?: () => void;
  onViewComplaint?: (complaint: Complaint) => void;
  onNavigateToReport?: () => void;
}

export const MyComplaintsPage: React.FC<MyComplaintsPageProps> = ({
  complaints = [],
  onSelectComplaint,
  onGoToReport,
  onViewComplaint,
  onNavigateToReport,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const handleReport = onGoToReport || onNavigateToReport || (() => {});
  const handleSelect = (complaint: Complaint) => {
    if (onViewComplaint) {
      onViewComplaint(complaint);
    } else if (onSelectComplaint) {
      onSelectComplaint(complaint.id);
    }
  };

  const safeComplaints = Array.isArray(complaints) ? complaints : [];

  const filteredComplaints = useMemo(() => {
    return safeComplaints.filter((c) => {
      // Search term
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesId = (c.complaintId || '').toLowerCase().includes(q);
        const matchesDesc = (c.description || '').toLowerCase().includes(q);
        const matchesLoc = ((c.building || '') + ' ' + (c.location || '')).toLowerCase().includes(q);
        const matchesCat = (c.category || '').toLowerCase().includes(q);
        if (!matchesId && !matchesDesc && !matchesLoc && !matchesCat) return false;
      }

      // Status
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;

      // Priority
      if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;

      // Category
      if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;

      return true;
    });
  }, [safeComplaints, search, statusFilter, priorityFilter, categoryFilter]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return format(new Date(isoString), 'MMM d, yyyy');
    } catch {
      return '';
    }
  };

  const hasActiveFilters =
    search !== '' || statusFilter !== 'All' || priorityFilter !== 'All' || categoryFilter !== 'All';

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setCategoryFilter('All');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">My Reported Complaints</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track live resolution statuses, assignments, and verified repairs for your tickets.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReport}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Problem</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID (e.g. CAMP-1001), room, keyword..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          {/* Quick Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Reported">Reported</option>
            <option value="Under Review">Under Review</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Quick Priority Dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Normal">Normal Priority</option>
          </select>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Categories</option>
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Cleanliness">Cleanliness</option>
            <option value="Furniture">Furniture</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Safety">Safety</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing {filteredComplaints.length} of {safeComplaints.length} tickets
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Complaints Grid */}
      {filteredComplaints.length === 0 ? (
        <EmptyState
          title={safeComplaints.length === 0 ? 'No Complaints Reported Yet' : 'No Matching Complaints Found'}
          description={
            safeComplaints.length === 0
              ? 'You have not reported any campus infrastructure issues yet. Notice broken equipment or cleanliness issues? File a report today.'
              : 'Try clearing your search keyword or relaxing status and priority filters.'
          }
          icon={FileText}
          actionText={safeComplaints.length === 0 ? 'Report Your First Problem' : 'Reset Filters'}
          onAction={safeComplaints.length === 0 ? handleReport : resetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredComplaints.map((complaint) => {
            const isResolved = complaint.status === 'Resolved';

            return (
              <div
                key={complaint.id}
                onClick={() => handleSelect(complaint)}
                className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${
                  isResolved
                    ? 'border-emerald-200/80 hover:border-emerald-300'
                    : complaint.priority === 'High'
                    ? 'border-red-200/80 hover:border-red-300'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                      {complaint.complaintId}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={complaint.priority} size="sm" />
                      <StatusBadge status={complaint.status} size="sm" />
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
                      <img
                        src={complaint.photoUrl}
                        alt="Issue"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">
                        {complaint.category} • {complaint.building?.replace('Building', 'Department')}
                      </h3>

                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                        <span>
                          {complaint.floor} — {complaint.location}
                        </span>
                      </p>

                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {complaint.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Reported on {formatDate(complaint.createdAt)}</span>
                  </span>

                  <span className="text-blue-600 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    <span>View Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
