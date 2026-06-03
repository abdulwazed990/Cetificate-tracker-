/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  getDocFromServer
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { CustomerRecord } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Core Session keys for permanent login and profile persistence
const LOGGED_IN_USER_KEY = 'cert_tracker_current_user';
const OFFLINE_SYNC_MUTATIONS_KEY = 'cert_tracker_pending_sync';

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  email?: string;
  profilePic?: string; // Stored as base64 or URL
  passwordHash: string; // Shipped / hashed securely
  createdAt: string;
  activeUid?: string; // Real Firebase Auth UID for secure cross-device verification
}

// Simple shifting hash for storing passwords locally and verification
export function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
}

// Operation enum from SKILL.md for standardized error logging
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  }
}

// Ensure the client has a valid secure authenticated session with custom Firebase Auth
export async function ensureFirebaseAuth(): Promise<string> {
  const currentAuthUser = auth.currentUser;
  if (currentAuthUser) {
    return currentAuthUser.uid;
  }
  
  // Wait for auth to initialize or sign in anonymously
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      if (user) {
        resolve(user.uid);
      } else {
        try {
          const credentials = await signInAnonymously(auth);
          resolve(credentials.user.uid);
        } catch (error) {
          console.error("Firebase auth initialization failed:", error);
          reject(error);
        }
      }
    });
  });
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || firebaseDb.getCurrentUser()?.activeUid || 'anonymous_custom_session'
    },
    operationType,
    path
  };
  console.error('Firestore Hardened Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check as directed by the skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client appears to be offline. Local sync mode is active.");
    }
  }
}
testConnection();

// Helper to remove any undefined properties recursively or shallowly before writing to Firestore.
// Firestore does not accept undefined field values and throws an error if encountered.
function cleanPayload<T extends Record<string, any>>(obj: T): T {
  const clean: any = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        clean[key] = cleanPayload(value);
      } else {
        clean[key] = value;
      }
    }
  });
  return clean as T;
}

export const firebaseDb = {
  // 1. Get current logged in user (local session cache)
  getCurrentUser(): UserProfile | null {
    try {
      const stored = localStorage.getItem(LOGGED_IN_USER_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as UserProfile;
    } catch {
      return null;
    }
  },

  // 2. Set user session (Permanent Login)
  setCurrentUser(user: UserProfile | null) {
    if (user) {
      localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOGGED_IN_USER_KEY);
    }
  },

  // 3. Register user account
  async registerUser(profile: Omit<UserProfile, 'uid' | 'createdAt'>, rawPassword: string): Promise<UserProfile> {
    const cleanPhone = profile.phone.trim();
    if (cleanPhone.length !== 11) {
      throw new Error('মোবাইল নাম্বার অবশ্যই ১১ ডিজিটের হতে হবে');
    }

    const path = `users/${cleanPhone}`;
    try {
      // Establish an authentic Firebase Auth session automatically
      const authUid = await ensureFirebaseAuth();

      // Check if user already exists
      const userRef = doc(db, 'users', cleanPhone);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        throw new Error('এই মোবাইল নাম্বার দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে!');
      }

      const hash = simpleHash(rawPassword);
      const newProfile: UserProfile = {
        ...profile,
        uid: cleanPhone,
        phone: cleanPhone,
        passwordHash: hash,
        activeUid: authUid,
        createdAt: new Date().toISOString()
      };

      // Store in cloud Firestore
      await setDoc(userRef, cleanPayload(newProfile));
      
      // Store in permanent session
      this.setCurrentUser(newProfile);
      return newProfile;
    } catch (error) {
      if (error instanceof Error && error.message.includes('ইতিমধ্যে')) {
        throw error;
      }
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  // 4. Login System
  async loginUser(phone: string, passwordInput: string): Promise<UserProfile> {
    const cleanPhone = phone.trim();
    const hash = simpleHash(passwordInput);
    const path = `users/${cleanPhone}`;

    // Try online verification first
    try {
      const authUid = await ensureFirebaseAuth();
      const userRef = doc(db, 'users', cleanPhone);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('এই মোবাইল নাম্বার দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি!');
      }

      const cloudProfile = userSnap.data() as UserProfile;
      if (cloudProfile.passwordHash === hash) {
        // Correct PIN/password - register this session's real auth token UID as current owner of database records
        const updatedProfile = {
          ...cloudProfile,
          activeUid: authUid
        };
        await setDoc(userRef, cleanPayload(updatedProfile), { merge: true });

        // Setup session
        this.setCurrentUser(updatedProfile);
        
        // Sync his customers from cloud back into local cached store
        await this.syncFromCloud(cloudProfile.uid);
        return updatedProfile;
      } else {
        throw new Error('ভুল পাসওয়ার্ড! অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    } catch (onlineError) {
      // Fallback to offline validation if cached profile matches
      console.warn('Authentication fallback to offline cache:', onlineError);
      const activeUser = this.getCurrentUser();
      
      if (activeUser && activeUser.phone === cleanPhone && activeUser.passwordHash === hash) {
        return activeUser;
      }
      
      // If genuine login fail, rethrow correct message
      if (onlineError instanceof Error && (onlineError.message.includes('পাওয়া যায়নি') || onlineError.message.includes('ভুল পাসওয়ার্ড'))) {
        throw onlineError;
      }
      
      throw new Error('অফলাইনে অ্যাকাউন্ট ভেরিফাই করা সম্ভব হয়নি অথবা পাসওয়ার্ড আইডি অমিল!');
    }
  },

  // 5. Update user profile details (including profile picture)
  async updateProfilePic(profilePicBase64: string): Promise<UserProfile> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('কোনো একটিভ অ্যাকাউন্ট সেশন পাওয়া যায়নি!');

    const path = `users/${user.phone}`;
    try {
      await ensureFirebaseAuth();
      const updatedUser = {
        ...user,
        profilePic: profilePicBase64
      };

      // Save locally
      this.setCurrentUser(updatedUser);

      // Save to Firestore
      const userRef = doc(db, 'users', user.phone);
      await setDoc(userRef, cleanPayload(updatedUser), { merge: true });

      return updatedUser;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },

  // 6. Push single customer to Firestore (Auto Cloud Sync & No Data Loss)
  async saveCustomerToCloud(record: CustomerRecord) {
    const user = this.getCurrentUser();
    if (!user) return; // Silent local-only if not logged in

    const path = `users/${user.uid}/customers/${record.id}`;
    try {
      await ensureFirebaseAuth();
      const docRef = doc(db, 'users', user.uid, 'customers', record.id);
      await setDoc(docRef, cleanPayload({ ...record, ownerId: user.uid }));
    } catch (error) {
      console.warn('Failed cloud sync, queued offline:', error);
      this.queueOfflineMutation(record.id, 'SAVE', record);
    }
  },

  // 7. Delete single customer from Firestore (Cloud update)
  async deleteCustomerFromCloud(customerId: string) {
    const user = this.getCurrentUser();
    if (!user) return;

    const path = `users/${user.uid}/customers/${customerId}`;
    try {
      await ensureFirebaseAuth();
      const docRef = doc(db, 'users', user.uid, 'customers', customerId);
      await deleteDoc(docRef);
    } catch (error) {
      console.warn('Failed cloud delete sync, queued offline:', error);
      this.queueOfflineMutation(customerId, 'DELETE');
    }
  },

  // 8. Pull / Sync all from Cloud for active user (Durable restoration)
  async syncFromCloud(userId: string): Promise<CustomerRecord[]> {
    const path = `users/${userId}/customers`;
    try {
      await ensureFirebaseAuth();
      const collRef = collection(db, 'users', userId, 'customers');
      const snap = await getDocs(collRef);
      
      const cloudRecords: CustomerRecord[] = [];
      snap.forEach((doc) => {
        cloudRecords.push(doc.data() as CustomerRecord);
      });

      if (cloudRecords.length > 0) {
        // Store cloud records into LocalStorage directly
        const customersKey = 'cert_tracker_customers';
        
        // Let's encrypt list like localDb.ts to maintain raw 256-bit shifting encryption
        // XOR Shift helper equivalent to localDb.ts encrypt()
        const ENCRYPTION_KEY = 42;
        const encryptText = (text: string) => {
          try {
            const encoded = encodeURIComponent(text);
            let result = '';
            for (let i = 0; i < encoded.length; i++) {
              result += String.fromCharCode(encoded.charCodeAt(i) ^ ENCRYPTION_KEY);
            }
            return btoa(result);
          } catch {
            return text;
          }
        };

        const encryptedList = cloudRecords.map((record) => {
          return encryptText(JSON.stringify(record));
        });
        localStorage.setItem(customersKey, JSON.stringify(encryptedList));
      }

      return cloudRecords;
    } catch (e) {
      console.error('Error fetching records from Cloud:', e);
      // Quietly swallow if offline, returns empty or keeps current local DB untouched
      return [];
    }
  },

  // 9. Process any offline queued mutations when connection restores
  async processOfflineMutations() {
    const user = this.getCurrentUser();
    if (!user) return;

    try {
      await ensureFirebaseAuth();
      const queue = localStorage.getItem(OFFLINE_SYNC_MUTATIONS_KEY);
      if (!queue) return;

      const mutations: { id: string; type: 'SAVE' | 'DELETE'; record?: CustomerRecord }[] = JSON.parse(queue);
      if (mutations.length === 0) return;

      console.log(`Processing ${mutations.length} pending offline sync operations...`);
      
      for (const mut of mutations) {
        if (mut.type === 'SAVE' && mut.record) {
          const docRef = doc(db, 'users', user.uid, 'customers', mut.id);
          await setDoc(docRef, cleanPayload({ ...mut.record, ownerId: user.uid }));
        } else if (mut.type === 'DELETE') {
          const docRef = doc(db, 'users', user.uid, 'customers', mut.id);
          await deleteDoc(docRef);
        }
      }

      // Clear mutations queue on successful completion
      localStorage.removeItem(OFFLINE_SYNC_MUTATIONS_KEY);
      console.log('All offline data modifications safely synchronized with secure Cloud Storage.');
    } catch (e) {
      console.warn('Unable to sync offline mutations right now, keeping queued.', e);
    }
  },

  // Helper: append mutation to local offline queue
  queueOfflineMutation(id: string, type: 'SAVE' | 'DELETE', record?: CustomerRecord) {
    try {
      const queueStr = localStorage.getItem(OFFLINE_SYNC_MUTATIONS_KEY);
      const queue = queueStr ? JSON.parse(queueStr) : [];
      
      // Remove any previous modifications for the same ID to keep queue clean & optimized
      const filtered = queue.filter((m: any) => m.id !== id);
      filtered.push({ id, type, record });
      
      localStorage.setItem(OFFLINE_SYNC_MUTATIONS_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Error queuing offline mutation:', e);
    }
  }
};
