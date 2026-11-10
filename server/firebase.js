import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
export function firebase() { if (!getApps().length) { const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON; if (!raw) throw new Error('Server configuration is missing.'); initializeApp({ credential: cert(JSON.parse(raw)) }); } return { auth: getAuth(), db: getFirestore() }; }
