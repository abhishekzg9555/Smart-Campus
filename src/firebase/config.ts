import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const configObj = firebaseConfig as any;
const app = !getApps().length ? initializeApp(configObj) : getApp();

export const auth = getAuth(app);
// Use firestoreDatabaseId if configured in the JSON
export const db = configObj.firestoreDatabaseId
  ? getFirestore(app, configObj.firestoreDatabaseId)
  : getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Firestore connectivity check as mandated by Firebase skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export default app;
