import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, sanitizeFirestoreData } from '../firebase/config';
import { Complaint, ComplaintStatus, MaintenanceDepartment, Priority, Building, ProblemCategory } from '../types';
import { createNotification } from './notificationService';

const COMPLAINTS_COLLECTION = 'complaints';

/**
 * Generates a clean readable sequential Complaint ID like CAMP-2024-8392 instantly
 */
export async function generateComplaintId(): Promise<string> {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CAMP-${randomSuffix}`;
}

export interface CreateComplaintInput {
  studentUid: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  building: Building;
  floor: string;
  location: string;
  category: ProblemCategory;
  priority: Priority;
  title?: string;
  description: string;
  photoUrl: string;
}

export async function createComplaint(input: CreateComplaintInput): Promise<{ id: string; complaintId: string }> {
  const complaintId = await generateComplaintId();
  const now = new Date().toISOString();
  
  const derivedTitle = input.title?.trim() || `${input.category} Issue in ${input.building} (${input.location})`;

  // Instant ID generation
  const docRef = doc(collection(db, COMPLAINTS_COLLECTION));
  const docId = docRef.id;

  const complaintData: Complaint = {
    id: docId,
    complaintId,
    studentUid: input.studentUid,
    studentId: input.studentId,
    studentName: input.studentName,
    studentEmail: input.studentEmail,
    building: input.building,
    floor: input.floor,
    location: input.location,
    category: input.category,
    priority: input.priority,
    title: derivedTitle,
    description: input.description,
    photoUrl: input.photoUrl,
    status: 'Reported',
    createdAt: now,
    updatedAt: now,
    isDemoData: false,
  };

  // High-speed write (non-blocking for UI, with cloud sync)
  const savePromise = setDoc(docRef, sanitizeFirestoreData(complaintData)).catch((err) => {
    console.warn('Firestore complaint write warning:', err);
  });

  // Parallel asynchronous notifications
  Promise.allSettled([
    savePromise,
    createNotification(
      input.studentUid,
      `Complaint Registered [${complaintId}]`,
      `Your issue in ${input.building} (${input.location}) was successfully filed with status: Reported.`,
      complaintId,
      docId,
      'new_complaint',
      input.studentEmail
    ),
    createNotification(
      'admin',
      `New Complaint [${complaintId}] - ${input.category}`,
      `Reported by ${input.studentName} at ${input.building}, ${input.location}. Priority: ${input.priority}.`,
      complaintId,
      docId,
      input.priority === 'High' ? 'alert' : 'new_complaint'
    ),
  ]).catch((err) => console.warn('Non-blocking notification error:', err));

  return { id: docId, complaintId };
}


function normalizeComplaintData(data: Omit<Complaint, 'id'>, id: string): Complaint {
  const normalizedBuilding = data.building
    ? ((data.building as string).replace(/CSE Building/g, 'CSE Department').replace(/Mechanical Building/g, 'Mechanical Department') as Building)
    : data.building;
  const normalizedTitle = data.title
    ? data.title.replace(/CSE Building/g, 'CSE Department').replace(/Mechanical Building/g, 'Mechanical Department')
    : data.title;
  return {
    ...data,
    id,
    building: normalizedBuilding,
    title: normalizedTitle,
  };
}

export function subscribeToComplaints(
  studentUid: string | null, // If null or 'admin', subscribes to all
  callback: (complaints: Complaint[]) => void,
  studentEmail?: string | null
) {
  const compRef = collection(db, COMPLAINTS_COLLECTION);

  return onSnapshot(
    compRef,
    (snapshot) => {
      let list: Complaint[] = snapshot.docs.map((d) =>
        normalizeComplaintData(d.data() as Omit<Complaint, 'id'>, d.id)
      );

      // Filter for student if studentUid is provided (and not admin)
      if (studentUid && studentUid !== 'admin') {
        const cleanUid = studentUid.toLowerCase();
        const cleanEmail = (studentEmail || '').toLowerCase();

        list = list.filter((c) => {
          if (c.studentUid && c.studentUid.toLowerCase() === cleanUid) return true;
          if (cleanEmail && c.studentEmail && c.studentEmail.toLowerCase() === cleanEmail) return true;
          // Also include if no studentUid assigned (e.g. demo data or anon)
          if (!c.studentUid && (!c.studentEmail || c.studentEmail.toLowerCase() === cleanEmail)) return true;
          return false;
        });
      }

      // Sort in-memory by createdAt desc
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(list);
    },
    (error) => {
      console.error('Complaints snapshot listener error:', error);
    }
  );
}

export async function getComplaintByDocId(docId: string): Promise<Complaint | null> {
  try {
    const docRef = doc(db, COMPLAINTS_COLLECTION, docId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return normalizeComplaintData(snap.data() as Omit<Complaint, 'id'>, snap.id);
  } catch (err) {
    console.error('Error fetching complaint:', err);
    return null;
  }
}

export async function findComplaintByCustomId(complaintId: string): Promise<Complaint | null> {
  try {
    const cleanId = complaintId.trim().toUpperCase();
    const q = query(collection(db, COMPLAINTS_COLLECTION), where('complaintId', '==', cleanId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docData = snap.docs[0];
    return normalizeComplaintData(docData.data() as Omit<Complaint, 'id'>, docData.id);
  } catch (err) {
    console.error('Error searching complaint by ID:', err);
    return null;
  }
}

export const ASSIGNED_AUTO_ADVANCE_DELAY_MS = 5 * 60 * 1000; // 5 minutes

export async function updateComplaintStatus(
  docId: string,
  newStatus: ComplaintStatus,
  adminComment?: string,
  fallbackComplaint?: Complaint
): Promise<void> {
  const docRef = doc(db, COMPLAINTS_COLLECTION, docId);
  const currentSnap = await getDoc(docRef);
  const currentData = currentSnap.exists()
    ? (currentSnap.data() as Complaint)
    : fallbackComplaint;
  const now = new Date().toISOString();

  const updatePayload: Partial<Complaint> = {
    status: newStatus,
    updatedAt: now,
  };

  if (newStatus === 'Assigned' && !currentData?.assignedAt) {
    updatePayload.assignedAt = now;
  }

  if (newStatus === 'In Progress' && !currentData?.inProgressAt) {
    updatePayload.inProgressAt = now;
  }

  if (adminComment !== undefined) {
    updatePayload.adminComment = adminComment;
  }

  if (newStatus === 'Resolved' && !currentData?.resolvedAt) {
    updatePayload.resolvedAt = now;
  }

  await updateDoc(docRef, updatePayload);

  if (currentData) {
    const isResolved = newStatus === 'Resolved';
    const isAssigned = newStatus === 'Assigned';
    const notifType = isResolved ? 'resolved' : isAssigned ? 'assignment' : 'status_change';

    const notifTitle = isResolved
      ? `Problem Resolved [${currentData.complaintId}] 🎉`
      : isAssigned
      ? `Department Assigned [${currentData.complaintId}]`
      : `Status Update [${currentData.complaintId}]: ${newStatus}`;

    const notifMsg = isResolved
      ? `Maintenance work has completed for ${currentData.category} issue in ${currentData.building?.replace('Building', 'Department')} (${currentData.location}). ${adminComment ? `Note: ${adminComment}` : 'Repairs verified.'}`
      : isAssigned
      ? `Your issue in ${currentData.building?.replace('Building', 'Department')} (${currentData.location}) has been assigned to maintenance crew.`
      : `Your complaint status has moved to "${newStatus}". ${adminComment ? `Note: ${adminComment}` : ''}`;

    // Notify student and campus broadcast
    await createNotification(
      currentData.studentUid || 'all_students',
      notifTitle,
      notifMsg,
      currentData.complaintId,
      docId,
      notifType,
      currentData.studentEmail
    );
  }
}

export async function assignDepartmentAndStaff(
  docId: string,
  department: MaintenanceDepartment | string,
  staffName: string,
  adminComment?: string,
  fallbackComplaint?: Complaint
): Promise<void> {
  const docRef = doc(db, COMPLAINTS_COLLECTION, docId);
  const currentSnap = await getDoc(docRef);
  const currentData = currentSnap.exists()
    ? (currentSnap.data() as Complaint)
    : fallbackComplaint;
  const now = new Date().toISOString();

  const updatePayload: Partial<Complaint> = {
    assignedDepartment: department,
    assignedStaff: staffName,
    status: 'Assigned',
    assignedAt: now,
    updatedAt: now,
  };

  if (adminComment) {
    updatePayload.adminComment = adminComment;
  }

  await updateDoc(docRef, updatePayload);

  if (currentData) {
    await createNotification(
      currentData.studentUid || 'all_students',
      `Department Assigned [${currentData.complaintId}]`,
      `Your ${currentData.category} issue in ${currentData.building?.replace('Building', 'Department')} (${currentData.location}) has been assigned to ${department} (${staffName || 'Field Team'}). Work will transition to In Progress in 5 minutes.`,
      currentData.complaintId,
      docId,
      'assignment',
      currentData.studentEmail
    );
  }
}

/**
 * Automatically advances any complaint that has remained in 'Assigned' status
 * for 5 minutes or more to 'In Progress'.
 */
export async function checkAndAutoAdvanceAssignedComplaints(complaints: Complaint[]): Promise<number> {
  let count = 0;
  const now = Date.now();

  for (const c of complaints) {
    if (c.status === 'Assigned') {
      const assignedTime = c.assignedAt || c.updatedAt || c.createdAt;
      const assignedTimestamp = new Date(assignedTime).getTime();
      const elapsedMs = now - assignedTimestamp;

      if (elapsedMs >= ASSIGNED_AUTO_ADVANCE_DELAY_MS) {
        try {
          await updateComplaintStatus(
            c.id,
            'In Progress',
            'Auto-advanced: 5 minutes elapsed post-assignment. Field technician work in progress.',
            c
          );
          count++;
        } catch (err) {
          console.warn(`Could not auto-advance complaint ${c.complaintId}:`, err);
        }
      }
    }
  }

  return count;
}

export async function updatePriority(
  docId: string,
  priority: Priority
): Promise<void> {
  const docRef = doc(db, COMPLAINTS_COLLECTION, docId);
  await updateDoc(docRef, {
    priority,
    updatedAt: new Date().toISOString(),
  });
}

export async function resolveComplaint(
  docId: string,
  resolutionPhotoUrl: string,
  resolutionComment: string,
  adminComment?: string,
  fallbackComplaint?: Complaint
): Promise<void> {
  const docRef = doc(db, COMPLAINTS_COLLECTION, docId);
  const currentSnap = await getDoc(docRef);
  const currentData = currentSnap.exists()
    ? (currentSnap.data() as Complaint)
    : fallbackComplaint;
  const now = new Date().toISOString();

  const updatePayload: Partial<Complaint> = {
    status: 'Resolved',
    resolutionPhotoUrl,
    resolutionComment,
    resolvedAt: now,
    updatedAt: now,
  };

  if (adminComment) {
    updatePayload.adminComment = adminComment;
  }

  await updateDoc(docRef, updatePayload);

  if (currentData) {
    await createNotification(
      currentData.studentUid || 'all_students',
      `Problem Resolved [${currentData.complaintId}] 🎉`,
      `Maintenance work has completed with resolution notes: "${resolutionComment}". Before and after resolution photos are now viewable for ${currentData.category} in ${currentData.building?.replace('Building', 'Department')} (${currentData.location}).`,
      currentData.complaintId,
      docId,
      'resolved',
      currentData.studentEmail
    );
  }
}

/**
 * Seed initial standard CEP engineering demo complaints for quick assessment.
 */
export async function seedDemoComplaints(): Promise<void> {
  const batch = writeBatch(db);

  const demoItems: Omit<Complaint, 'id'>[] = [
    {
      complaintId: 'CAMP-1001',
      studentUid: 'demo_student_uid_1',
      studentId: 'STU-2024-001',
      studentName: 'Aditya Sharma',
      studentEmail: 'aditya.s@campuscare.edu',
      building: 'CSE Department',
      floor: '2nd Floor',
      location: 'Room 204 (Lab 3)',
      category: 'Electrical',
      priority: 'High',
      title: 'Broken Ceiling Fan & Exposed Wire',
      description: 'The ceiling fan near bench 4 is vibrating violently and sparking with exposed wiring. Poses immediate hazard for students during lab sessions.',
      photoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      status: 'In Progress',
      assignedDepartment: 'Electrical Maintenance',
      assignedStaff: 'Ramesh Verma (Senior Electrician)',
      adminComment: 'Technician dispatched with replacement capacitor and safety insulation kit.',
      createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      isDemoData: true,
    },
    {
      complaintId: 'CAMP-1002',
      studentUid: 'demo_student_uid_2',
      studentId: 'STU-2024-015',
      studentName: 'Priya Patel',
      studentEmail: 'priya.p@campuscare.edu',
      building: 'Mechanical Department',
      floor: 'Ground Floor',
      location: 'Workshop Corridor East',
      category: 'Plumbing',
      priority: 'High',
      title: 'Water Leakage & Slippery Floor',
      description: 'Main pipe connector has a major leak causing continuous water pooling near workshop entrance. Heavy risk of slipping.',
      photoUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      status: 'Reported',
      createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      isDemoData: true,
    },
    {
      complaintId: 'CAMP-1003',
      studentUid: 'demo_student_uid_1',
      studentId: 'STU-2024-001',
      studentName: 'Aditya Sharma',
      studentEmail: 'aditya.s@campuscare.edu',
      building: 'CSE Department',
      floor: '1st Floor',
      location: 'Room 102',
      category: 'Furniture',
      priority: 'Normal',
      title: 'Broken Bench & Loose Desk Panel',
      description: 'The wooden plank on row 3 bench is cracked and has exposed screws that tore a student backpack.',
      photoUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=800&q=80',
      status: 'Resolved',
      assignedDepartment: 'Furniture/Maintenance',
      assignedStaff: 'Suresh Kumar (Carpenter)',
      adminComment: 'Wood panel replaced and reinforced with stainless steel brackets.',
      resolutionPhotoUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
      resolutionComment: 'Full desk surface replaced, sanded, and secured with heavy-duty rivets. Inspected and approved.',
      createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      isDemoData: true,
    },
    {
      complaintId: 'CAMP-1004',
      studentUid: 'demo_student_uid_3',
      studentId: 'STU-2024-033',
      studentName: 'Kavita Singh',
      studentEmail: 'kavita.s@campuscare.edu',
      building: 'Admin Block',
      floor: 'Ground Floor',
      location: 'Visitors Washroom',
      category: 'Cleanliness',
      priority: 'Medium',
      title: 'Washroom Sanitation Required',
      description: 'Lack of water pressure and sanitization needed in ground floor washroom. Dispensers are empty.',
      photoUrl: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80',
      status: 'Under Review',
      adminComment: 'Reviewing housekeeping log and replenishing hygiene inventory.',
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      isDemoData: true,
    },
    {
      complaintId: 'CAMP-1005',
      studentUid: 'demo_student_uid_4',
      studentId: 'STU-2024-049',
      studentName: 'Rahul Mehta',
      studentEmail: 'rahul.m@campuscare.edu',
      building: 'Library',
      floor: '1st Floor',
      location: 'Quiet Reading Zone Entrance',
      category: 'Infrastructure',
      priority: 'Normal',
      title: 'Damaged Door Latch & Hinge Creaking',
      description: 'The hydraulic closer on the library entrance door is broken, slamming loudly whenever patrons enter or exit.',
      photoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      status: 'Assigned',
      assignedDepartment: 'Infrastructure',
      assignedStaff: 'Manish Rawat (Facility Eng.)',
      adminComment: 'Scheduled hydraulic closer replacement during evening hours to avoid reading disruption.',
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      isDemoData: true,
    },
  ];

  for (const item of demoItems) {
    const newDocRef = doc(collection(db, COMPLAINTS_COLLECTION));
    batch.set(newDocRef, item);

    // Also seed corresponding demo notifications
    if (item.status === 'Resolved') {
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        userId: item.studentUid || 'all_students',
        userEmail: item.studentEmail || '',
        title: `Problem Resolved [${item.complaintId}] 🎉`,
        message: `Maintenance work has completed with resolution notes: "${item.resolutionComment}". Full before & after proof is published for ${item.category} in ${item.building?.replace('Building', 'Department')} (${item.location}).`,
        complaintId: item.complaintId,
        complaintDocId: newDocRef.id,
        type: 'resolved',
        read: false,
        createdAt: item.resolvedAt || item.updatedAt,
      });
    } else if (item.status === 'Assigned' || item.status === 'In Progress') {
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        userId: item.studentUid || 'all_students',
        userEmail: item.studentEmail || '',
        title: `Department Assigned [${item.complaintId}]`,
        message: `Your ${item.category} issue in ${item.building?.replace('Building', 'Department')} (${item.location}) has been assigned to ${item.assignedDepartment || 'Maintenance'} (${item.assignedStaff || 'Field Team'}).`,
        complaintId: item.complaintId,
        complaintDocId: newDocRef.id,
        type: 'assignment',
        read: false,
        createdAt: item.createdAt,
      });
    }
  }

  await batch.commit();
}

/**
 * Clears demo complaints marked with isDemoData == true
 */
export async function clearDemoComplaints(): Promise<number> {
  const q = query(collection(db, COMPLAINTS_COLLECTION), where('isDemoData', '==', true));
  const snap = await getDocs(q);
  if (snap.empty) return 0;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return snap.size;
}
