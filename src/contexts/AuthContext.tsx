'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User as FirebaseUser,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { User, UserRole } from '@/types';

interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);

            if (fbUser) {
                // Fetch user data from Firestore
                const userDoc = await getDoc(doc(db, 'users', fbUser.uid));

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUser({
                        id: fbUser.uid,
                        email: fbUser.email || '',
                        displayName: userData.displayName || fbUser.displayName || '',
                        role: userData.role as UserRole,
                        department: userData.department,
                        createdAt: userData.createdAt?.toDate() || new Date(),
                    });
                } else {
                    // Create new user with default 'sales' role
                    // In production, admins would update roles manually
                    const newUser: Omit<User, 'id'> = {
                        email: fbUser.email || '',
                        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || '',
                        role: 'sales', // default role
                        createdAt: new Date(),
                    };

                    await setDoc(doc(db, 'users', fbUser.uid), {
                        ...newUser,
                        createdAt: new Date(),
                    });

                    setUser({
                        id: fbUser.uid,
                        ...newUser,
                    });
                }
            } else {
                setUser(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signInWithEmail = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setFirebaseUser(null);
    };

    const value = {
        user,
        firebaseUser,
        loading,
        signInWithEmail,
        signInWithGoogle,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
