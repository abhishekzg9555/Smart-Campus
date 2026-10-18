export type UserRole = 'student' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  studentId?: string;
  role: UserRole;
  department?: string;
  phone?: string;
  createdAt: string;
}

export type Building =
  | 'CSE Department'
  | 'Mechanical Department'
  | 'Library'
  | 'Admin Block'
  | 'Hostel'
  | 'Other'
  | 'CSE Building'
  | 'Mechanical Building';

export type Department = Building;

export type ProblemCategory =
  | 'Electrical'
  | 'Plumbing'
  | 'Cleanliness'
  | 'Furniture'
  | 'Infrastructure'
  | 'Safety'
  | 'Other';

export type Priority = 'Normal' | 'Medium' | 'High';

export type ComplaintStatus =
  | 'Reported'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved';

export type MaintenanceDepartment =
  | 'Electrical Maintenance'
  | 'Plumbing Maintenance'
  | 'Cleaning Staff'
  | 'Furniture/Maintenance'
  | 'Infrastructure'
  | 'Security'
  | 'Other';

export interface Complaint {
  id: string; // Firestore document ID
  complaintId: string; // E.g., CAMP-1001
  studentUid: string;
  studentId: string; // E.g., STU-2024-089
  studentName: string;
  studentEmail: string;
  building: Building;
  floor: string;
  location: string; // E.g. Room 204 or East Wing Corridor
  category: ProblemCategory;
  priority: Priority;
  title: string;
  description: string;
  photoUrl: string;
  status: ComplaintStatus;
  assignedDepartment?: MaintenanceDepartment | string;
  assignedStaff?: string;
  adminComment?: string;
  resolutionPhotoUrl?: string;
  resolutionComment?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  assignedAt?: string; // ISO string when complaint was assigned
  inProgressAt?: string; // ISO string when complaint moved to In Progress
  resolvedAt?: string; // ISO string
  isDemoData?: boolean;
}

export interface AppNotification {
  id: string;
  userId: string; // student UID or 'admin' / admin UID
  userEmail?: string;
  title: string;
  message: string;
  complaintId?: string;
  complaintDocId?: string;
  read: boolean;
  type?: 'status_change' | 'assignment' | 'new_complaint' | 'resolved' | 'alert';
  createdAt: string;
}

export interface ComplaintFilter {
  search?: string;
  building?: Building | 'All';
  category?: ProblemCategory | 'All';
  priority?: Priority | 'All';
  status?: ComplaintStatus | 'All';
  sortBy?: 'newest' | 'oldest' | 'priority';
}

export interface SystemStats {
  total: number;
  reported: number;
  underReview: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  highPriority: number;
  mediumPriority: number;
  normalPriority: number;
  byCategory: Record<string, number>;
  byBuilding: Record<string, number>;
  monthlyTrends: { month: string; reported: number; resolved: number }[];
}
