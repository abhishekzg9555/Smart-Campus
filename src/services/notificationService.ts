import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { AppNotification, Complaint } from '../types';

const NOTIFICATIONS_COLLECTION = 'notifications';

// Helper to get local read IDs for user so each user maintains their own read status
export function getLocalReadNotifIds(userKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(`smartcampus_read_notifs_${userKey.toLowerCase()}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveLocalReadNotifId(userKey: string, id: string): void {
  try {
    const set = getLocalReadNotifIds(userKey);
    set.add(id);
    localStorage.setItem(
      `smartcampus_read_notifs_${userKey.toLowerCase()}`,
      JSON.stringify(Array.from(set))
    );
  } catch (e) {
    console.warn('Failed to save local read state:', e);
  }
}

export function saveAllLocalReadNotifIds(userKey: string, ids: string[]): void {
  try {
    const set = getLocalReadNotifIds(userKey);
    ids.forEach((id) => set.add(id));
    localStorage.setItem(
      `smartcampus_read_notifs_${userKey.toLowerCase()}`,
      JSON.stringify(Array.from(set))
    );
  } catch (e) {
    console.warn('Failed to save all local read state:', e);
  }
}

export async function createNotification(
  userId: string, // specific user UID, 'admin', 'all_students', or 'all'
  title: string,
  message: string,
  complaintId?: string,
  complaintDocId?: string,
  type: AppNotification['type'] = 'status_change',
  userEmail?: string
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId: userId || 'all_students',
      userEmail: userEmail || '',
      title,
      message,
      complaintId: complaintId || '',
      complaintDocId: complaintDocId || '',
      type,
      read: false,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Failed to create notification in Firestore:', error);
    return '';
  }
}

export function subscribeToUserNotifications(
  userId: string,
  isAdmin: boolean,
  callback: (notifications: AppNotification[]) => void,
  userEmail?: string | null
) {
  try {
    const notifsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const userKey = (userEmail || userId || 'guest').toLowerCase();

    return onSnapshot(
      notifsRef,
      (snapshot) => {
        const localReadIds = getLocalReadNotifIds(userKey);

        let notifs: AppNotification[] = snapshot.docs.map((d) => {
          const data = d.data() as Omit<AppNotification, 'id'>;
          const isLocallyRead = localReadIds.has(d.id);
          const cleanTitle = data.title
            ? data.title.replace(/CSE Building/g, 'CSE Department').replace(/Mechanical Building/g, 'Mechanical Department')
            : data.title;
          const cleanMessage = data.message
            ? data.message.replace(/CSE Building/g, 'CSE Department').replace(/Mechanical Building/g, 'Mechanical Department')
            : data.message;
          return {
            id: d.id,
            ...data,
            title: cleanTitle,
            message: cleanMessage,
            read: isLocallyRead ? true : Boolean(data.read),
          };
        });

        const cleanUid = (userId || '').toLowerCase();
        const cleanEmail = (userEmail || '').toLowerCase();

        if (isAdmin) {
          // Admins receive notifications addressed to 'admin', or their personal uid/email, or new/alert events
          notifs = notifs.filter(
            (n) =>
              n.userId === 'admin' ||
              (n.userId && n.userId.toLowerCase() === cleanUid) ||
              (cleanEmail && n.userEmail && n.userEmail.toLowerCase() === cleanEmail) ||
              n.type === 'new_complaint' ||
              n.type === 'alert' ||
              n.type === 'resolved' ||
              n.type === 'assignment'
          );
        } else {
          // Students MUST receive:
          // 1. ALL notifications of type 'resolved' (Resolved issues)
          // 2. ALL notifications of type 'assignment' (Assigned issues)
          // 3. ALL notifications of type 'status_change'
          // 4. Any broadcast notifications addressed to 'all', 'all_students', or 'student'
          // 5. Notifications specifically addressed to their UID or Email
          notifs = notifs.filter((n) => {
            // All students must get notification of all assigned and resolved issues
            if (n.type === 'resolved' || n.type === 'assignment' || n.type === 'status_change') {
              return true;
            }
            if (
              n.userId === 'all' ||
              n.userId === 'all_students' ||
              n.userId === 'student' ||
              !n.userId
            ) {
              return true;
            }
            if (cleanUid && n.userId && n.userId.toLowerCase() === cleanUid) return true;
            if (cleanEmail && n.userEmail && n.userEmail.toLowerCase() === cleanEmail) return true;
            if (cleanEmail && (n as any).studentEmail && (n as any).studentEmail.toLowerCase() === cleanEmail) return true;
            if (cleanEmail && n.userId && n.userId.toLowerCase() === cleanEmail) return true;
            // Also include demo student notifications
            if (n.userId && n.userId.startsWith('demo_student_uid')) return true;
            return false;
          });
        }

        notifs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        callback(notifs);
      },
      (error) => {
        console.error('Error subscribing to notifications snapshot:', error);
      }
    );
  } catch (error) {
    console.error('Error in subscribeToUserNotifications:', error);
    return () => {};
  }
}

export async function markNotificationAsRead(id: string, userKey?: string): Promise<void> {
  if (userKey) {
    saveLocalReadNotifId(userKey, id);
  }
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, id);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    console.warn('Error marking notification as read in Firestore:', error);
  }
}

export async function markAllNotificationsAsRead(
  notifications: AppNotification[],
  userKey?: string
): Promise<void> {
  if (userKey) {
    saveAllLocalReadNotifIds(userKey, notifications.map((n) => n.id));
  }
  try {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach((n) => {
      const docRef = doc(db, NOTIFICATIONS_COLLECTION, n.id);
      batch.update(docRef, { read: true });
    });
    await batch.commit();
  } catch (error) {
    console.warn('Error marking all notifications as read in Firestore:', error);
  }
}

let hasEnsuredNotifications = false;

/**
 * Ensures that any active complaint in 'Resolved' or 'Assigned' status has a matching notification in Firestore.
 * This guarantees that even seeded demo complaints or complaints resolved before this update immediately show notifications.
 */
export async function ensureAssignedAndResolvedNotifications(complaints: Complaint[]): Promise<void> {
  if (hasEnsuredNotifications || !complaints || complaints.length === 0) return;
  hasEnsuredNotifications = true;

  try {
    const notifsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const existingSnap = await getDocs(notifsRef);
    const existingNotifKeys = new Set(
      existingSnap.docs.map((d) => {
        const data = d.data();
        return `${data.complaintId || ''}_${data.type || ''}`;
      })
    );

    for (const c of complaints) {
      // If resolved, ensure resolved notification exists
      if (c.status === 'Resolved') {
        const key = `${c.complaintId}_resolved`;
        if (!existingNotifKeys.has(key)) {
          existingNotifKeys.add(key);
          await addDoc(notifsRef, {
            userId: c.studentUid || 'all_students',
            userEmail: c.studentEmail || '',
            title: `Problem Resolved [${c.complaintId}] 🎉`,
            message: `Maintenance repair verified for ${c.category} issue in ${c.building?.replace('Building', 'Department')} (${c.location}). Resolution notes: "${c.resolutionComment || 'Repairs completed and approved.'}". Before & after photo proof viewable.`,
            complaintId: c.complaintId,
            complaintDocId: c.id,
            type: 'resolved',
            read: false,
            createdAt: c.resolvedAt || c.updatedAt || new Date().toISOString(),
          });
        }
      }

      // If assigned or in progress, ensure assignment notification exists
      if (c.status === 'Assigned' || c.status === 'In Progress' || c.assignedDepartment) {
        const key = `${c.complaintId}_assignment`;
        if (!existingNotifKeys.has(key)) {
          existingNotifKeys.add(key);
          await addDoc(notifsRef, {
            userId: c.studentUid || 'all_students',
            userEmail: c.studentEmail || '',
            title: `Department Assigned [${c.complaintId}]`,
            message: `Maintenance crew assigned for ${c.category} in ${c.building?.replace('Building', 'Department')} (${c.location}). Handled by ${c.assignedDepartment || 'Field Operations'} (${c.assignedStaff || 'Technician'}).`,
            complaintId: c.complaintId,
            complaintDocId: c.id,
            type: 'assignment',
            read: false,
            createdAt: c.assignedAt || c.createdAt || new Date().toISOString(),
          });
        }
      }
    }
  } catch (err) {
    console.warn('ensureAssignedAndResolvedNotifications notice:', err);
  }
}
