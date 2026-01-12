import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App;

function getAdminApp() {
    if (getApps().length === 0) {
        // Private key needs newlines to be properly escaped
        const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

        adminApp = initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
    } else {
        adminApp = getApps()[0];
    }
    return adminApp;
}

export function getAdminFirestore() {
    const app = getAdminApp();
    return getFirestore(app);
}

export function getAdminAuth() {
    const app = getAdminApp();
    return getAuth(app);
}

export { getAdminApp };
