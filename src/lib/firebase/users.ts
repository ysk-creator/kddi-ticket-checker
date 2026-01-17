import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
} from 'firebase/firestore';
import { db } from './config';
import { User, FirestoreUser } from '@/types';

const USERS_COLLECTION = 'users';

// Convert Firestore document to User
function convertFirestoreUser(id: string, data: FirestoreUser): User {
    return {
        id,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        department: data.department,
        createdAt: data.createdAt.toDate(),
    };
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    return convertFirestoreUser(docSnap.id, docSnap.data() as FirestoreUser);
}

// Get all partner users (for dropdown selection)
export async function getPartnerUsers(): Promise<User[]> {
    const q = query(
        collection(db, USERS_COLLECTION),
        where('role', '==', 'partner')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) =>
        convertFirestoreUser(doc.id, doc.data() as FirestoreUser)
    );
}

// Get all users
export async function getAllUsers(): Promise<User[]> {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    return querySnapshot.docs.map((doc) =>
        convertFirestoreUser(doc.id, doc.data() as FirestoreUser)
    );
}
