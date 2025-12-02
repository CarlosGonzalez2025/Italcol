
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    try {
      // 1. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      let role = UserRole.SOLICITANTE; // Default role
      let name = fbUser.displayName || 'Usuario';

      // 2. Try Fetch User Profile from Firestore
      // Wrap in try-catch to handle "Missing permissions" if Rules aren't set up yet
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          role = userData.role as UserRole;
          name = userData.name || name;
        }
      } catch (firestoreError) {
        console.warn("Firestore access failed (check security rules). Falling back to local logic.", firestoreError);
      }
      
      // 3. Fallback: Check MOCK_USERS for role assignment based on email if Firestore failed or didn't have data
      // This allows the predefined demo users to work even if Firestore rules block reading the 'users' collection
      const configUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (configUser) {
          // If we are still using the default role (Solicitante), try to upgrade using the Mock config
          // This ensures that if the DB read failed, 'admin@sgtc.com' still gets Admin role locally
          if (role === UserRole.SOLICITANTE && configUser.role !== UserRole.SOLICITANTE) {
             role = configUser.role;
             name = configUser.name;
          }
      }

      const avatar = `https://ui-avatars.com/api/?name=${name}&background=random`;

      const appUser: User = {
        id: fbUser.uid,
        email: fbUser.email || '',
        name: name,
        role: role,
        avatar: avatar
      };

      // Persist user session data
      localStorage.setItem('sgtc_user', JSON.stringify(appUser));
      return appUser;
    } catch (error: any) {
      console.error("Firebase Login Error:", error);
      throw new Error(getFirebaseErrorMessage(error.code));
    }
  },

  logout: async () => {
    await signOut(auth);
    localStorage.removeItem('sgtc_user');
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem('sgtc_user');
    return stored ? JSON.parse(stored) : null;
  }
};

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found': return 'Usuario no encontrado.';
    case 'auth/wrong-password': return 'Contraseña incorrecta.';
    case 'auth/invalid-email': return 'Formato de email inválido.';
    case 'auth/too-many-requests': return 'Demasiados intentos. Intente más tarde.';
    case 'auth/invalid-credential': return 'Credenciales inválidas.';
    case 'auth/missing-android-pkg-name': return 'Error de configuración (Android Pkg).';
    default: return 'Error al iniciar sesión. Verifique sus credenciales.';
  }
}
