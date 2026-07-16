import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth, HR_EMAIL, FIREBASE_PROJECT_ID } from '../firebase';
import {
  ensureEmployeeLinked,
  getInviteByEmail,
  getPendingInviteByEmail,
  STATUS,
} from './employeeService';

function mapAuthError(error) {
  const code = error?.code || '';

  switch (code) {
    case 'auth/configuration-not-found':
      return 'Firebase Authentication is not set up yet. Open Firebase Console → Authentication → Get started → enable Email/Password.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try logging in with the same password HR shared with you.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Use the credentials HR shared when you were invited.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection.';
    default:
      return error?.message || 'Login failed. Check Firebase Authentication setup.';
  }
}

async function signInOrCreateHR(email, password) {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    if (error.code === 'auth/user-not-found' && email === HR_EMAIL) {
      try {
        return await createUserWithEmailAndPassword(auth, email, password);
      } catch (createError) {
        throw new Error(mapAuthError(createError));
      }
    }

    if (
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/wrong-password'
    ) {
      throw new Error(
        'Incorrect HR password. Reset it in Firebase Console → Authentication → Users → ' +
        `${HR_EMAIL} → reset password, then sign in with the new password.`
      );
    }

    throw new Error(mapAuthError(error));
  }
}

export async function login(email, password) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!HR_EMAIL) {
    throw new Error('HR email not configured. Set VITE_HR_EMAIL in .env / Vercel, then redeploy.');
  }

  if (normalizedEmail === HR_EMAIL) {
    return loginHR(normalizedEmail, password);
  }

  return loginEmployee(normalizedEmail, password);
}

export async function loginHR(email, password) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!HR_EMAIL) {
    throw new Error('HR email not configured. Set VITE_HR_EMAIL in .env / Vercel, then redeploy.');
  }

  if (normalizedEmail !== HR_EMAIL) {
    throw new Error(`Invalid HR email. Use ${HR_EMAIL}.`);
  }

  return signInOrCreateHR(normalizedEmail, password);
}

export async function loginEmployee(email, password) {
  const normalizedEmail = email.trim().toLowerCase();

  let credential;

  try {
    credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  } catch (error) {
    const isMissingAccount =
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/wrong-password';

    if (!isMissingAccount) {
      throw new Error(mapAuthError(error));
    }

    let invite;
    try {
      invite = await getPendingInviteByEmail(normalizedEmail);
    } catch (lookupError) {
      const blocked = lookupError?.message?.includes('Firestore blocked')
        || lookupError?.message?.includes('permission');

      if (blocked) {
        throw new Error(
          'Your account may already be set up. Use the exact password HR shared. ' +
          'If login still fails, ask HR to reset your password in Firebase Console → Authentication → Users.'
        );
      }

      throw new Error(
        lookupError?.message ||
          'Could not verify your invite. Check the email matches what HR used exactly, then try again.'
      );
    }

    if (!invite) {
      try {
        const existing = await getInviteByEmail(normalizedEmail);
        if (existing?.uid) {
          throw new Error('Invalid email or password. Use the credentials HR shared when you were invited.');
        }
      } catch (lookupError) {
        if (lookupError.message.includes('Invalid email or password')) {
          throw lookupError;
        }

        const blocked = lookupError?.message?.includes('Firestore blocked')
          || lookupError?.message?.includes('permission');

        if (blocked) {
          throw new Error(
            'Invalid email or password. Your invite is already linked — use the password HR shared.'
          );
        }
      }

      throw new Error(
        `No invite found for ${normalizedEmail}. Ask HR to invite you from the live portal ` +
        `(project: ${FIREBASE_PROJECT_ID || 'unknown'}). Use the exact email, e.g. @genaixis.com.`
      );
    }

    if (invite.status !== STATUS.INVITED && invite.status !== STATUS.REJECTED) {
      throw new Error('Invalid email or password. Use the credentials HR shared when you were invited.');
    }

    try {
      credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    } catch (createError) {
      if (createError.code === 'auth/email-already-in-use') {
        credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      } else {
        throw new Error(mapAuthError(createError));
      }
    }
  }

  await ensureEmployeeLinked(credential.user);
  return credential;
}

export function logout() {
  return signOut(auth);
}
