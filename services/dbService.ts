
import { Permit, PermitStatus, UserRole, Signature, User } from '../types';
import { db, firebaseConfig } from '../lib/firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc,
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';

const COLLECTION_NAME = 'permits';
const USERS_COLLECTION = 'users';

export const dbService = {
  // --- PERMITS ---

  getPermits: async (role: UserRole, userId: string): Promise<Permit[]> => {
    try {
      let q;
      if (role === UserRole.SOLICITANTE) {
        // Users only see their own permits
        q = query(collection(db, COLLECTION_NAME), where("createdBy", "==", userId));
      } else {
        // Admins/Approvers see all
        q = query(collection(db, COLLECTION_NAME));
      }

      const querySnapshot = await getDocs(q);
      const permits: Permit[] = [];
      
      querySnapshot.forEach((doc) => {
        permits.push({ id: doc.id, ...doc.data() } as Permit);
      });

      // Sort by date desc (client side sorting for simplicity with basic indexes)
      return permits.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error("Error fetching permits:", error);
      return [];
    }
  },

  getPermitById: async (id: string): Promise<Permit | undefined> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Permit;
      }
      return undefined;
    } catch (error) {
      console.error("Error fetching permit:", error);
      return undefined;
    }
  },

  createPermit: async (permitData: Partial<Permit>, userId: string, userName: string): Promise<string> => {
    try {
      const newPermitData = {
        ...permitData,
        number: `PT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        createdAt: new Date().toISOString(),
        createdBy: userId,
        requesterName: userName,
        status: PermitStatus.PENDING_REVISION,
        signatures: {},
        closingSignatures: {},
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), newPermitData);
      return docRef.id;
    } catch (error) {
      console.error("Error creating permit:", error);
      throw error;
    }
  },

  signPermit: async (permitId: string, user: { id: string, name: string, role: UserRole }, isClosing: boolean = false): Promise<Permit> => {
    try {
      const permitRef = doc(db, COLLECTION_NAME, permitId);
      const permitSnap = await getDoc(permitRef);
      
      if (!permitSnap.exists()) throw new Error('Permiso no encontrado');
      
      const permitData = permitSnap.data() as Permit;
      
      const newSignature: Signature = {
        signedBy: user.id,
        signerName: user.name,
        signedAt: new Date().toISOString(),
        role: user.role
      };

      const fieldToUpdate = isClosing ? 'closingSignatures' : 'signatures';
      const currentSignatures = isClosing ? permitData.closingSignatures || {} : permitData.signatures || {};
      
      let key = '';
      if (user.role === UserRole.SOLICITANTE) key = 'requester';
      else if (user.role === UserRole.AUTORIZANTE) key = 'authorizer';
      else if (user.role === UserRole.LIDER_SST) key = 'sst';
      else if (user.role === UserRole.MANTENIMIENTO) key = 'maintenance';

      if (!key) throw new Error('Rol no autorizado para firmar');

      const updatedSignatures = { ...currentSignatures, [key]: newSignature };

      await updateDoc(permitRef, {
        [fieldToUpdate]: updatedSignatures
      });

      return { ...permitData, id: permitId, [fieldToUpdate]: updatedSignatures };
    } catch (error) {
      console.error("Error signing permit:", error);
      throw error;
    }
  },

  updateStatus: async (permitId: string, status: PermitStatus, closingData?: any): Promise<Permit> => {
    try {
      const permitRef = doc(db, COLLECTION_NAME, permitId);
      const updateData: any = { status };
      
      if (closingData) {
        updateData.closingChecks = closingData;
        // Merge closing signatures if provided in closingData context
        if (closingData.signatures) {
             const snap = await getDoc(permitRef);
             const currentClosing = snap.data()?.closingSignatures || {};
             updateData.closingSignatures = { ...currentClosing, ...closingData.signatures };
        }
      }

      await updateDoc(permitRef, updateData);
      
      const updatedSnap = await getDoc(permitRef);
      return { id: updatedSnap.id, ...updatedSnap.data() } as Permit;
    } catch (error) {
      console.error("Error updating status:", error);
      throw error;
    }
  },

  // --- USERS ---

  getUsers: async (): Promise<User[]> => {
    try {
      const q = query(collection(db, USERS_COLLECTION));
      const querySnapshot = await getDocs(q);
      const users: User[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as User);
      });
      return users;
    } catch (error) {
      console.error("Error getting users:", error);
      return [];
    }
  },

  /**
   * Creates a user in Firebase Auth AND Firestore without logging out the current admin.
   * Uses a secondary Firebase App instance to handle the creation.
   */
  registerUser: async (user: Partial<User>, password: string): Promise<void> => {
    // 1. Initialize a secondary app to avoid logging out the current user (Admin)
    const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
    const secondaryAuth = getAuth(secondaryApp);

    try {
      // 2. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, user.email!, password);
      const uid = userCredential.user.uid;

      // 3. Create user profile in Firestore (using the MAIN app instance 'db')
      // We use the UID from Auth to match the Document ID
      await setDoc(doc(db, USERS_COLLECTION, uid), {
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`
      });

      // 4. Sign out from secondary app to be safe
      await signOut(secondaryAuth);
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    } finally {
      // 5. Clean up the secondary app instance
      await deleteApp(secondaryApp);
    }
  },

  createUserProfile: async (user: Partial<User>): Promise<void> => {
    try {
      if (!user.id) throw new Error("User ID (Auth UID) is required to link profile.");
      await setDoc(doc(db, USERS_COLLECTION, user.id), {
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`
      }, { merge: true });
    } catch (error) {
      console.error("Error creating user profile:", error);
      throw error;
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, USERS_COLLECTION, userId));
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
};
