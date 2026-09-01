import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth, HR_EMAIL } from '../firebase';
import {
  ensureEmployeeLinked,
  getInviteByEmail,
  getPendingInviteByEmail,
  STATUS,
} from './employeeService';
import {
  mapAuthError,
  mapStorageError,
  USER_MESSAGES,
  toUserMessage,
  isTechnicalMessage,
} from '../utils/userMessages';
import { normalizeWorkEmail } from '../utils/workEmail';

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
      throw new Error(USER_MESSAGES.hrWrongPassword);
    }

    throw new Error(mapAuthError(error));
  }
}

export async function login(email, password) {
  const { email: normalizedEmail, error } = normalizeWorkEmail(email);

  if (!normalizedEmail) {
    if (error === 'wrongDomain') throw new Error(USER_MESSAGES.workEmailOnly);
    throw new Error(USER_MESSAGES.invalidEmail);
  }

  if (!HR_EMAIL) {
    throw new Error(USER_MESSAGES.hrEmailRequired);
  }

  if (normalizedEmail === HR_EMAIL) {
    return loginHR(normalizedEmail, password);
  }

  return loginEmployee(normalizedEmail, password);
}

export async function loginHR(email, password) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!HR_EMAIL) {
    throw new Error(USER_MESSAGES.hrEmailRequired);
  }

  if (normalizedEmail !== HR_EMAIL) {
    throw new Error(USER_MESSAGES.wrongHrAccount(HR_EMAIL));
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
      if (isTechnicalMessage(lookupError?.message)) {
        throw new Error(
          'Your account may already be set up. Use the password HR shared with you. If login still fails, ask HR to reset your password.'
        );
      }

      throw new Error(
        toUserMessage(
          lookupError,
          'Could not verify your invitation. Check that you are using the same email HR used, then try again.'
        )
      );
    }

    if (!invite) {
      try {
        const existing = await getInviteByEmail(normalizedEmail);
        if (existing?.uid) {
          throw new Error(USER_MESSAGES.loginFailed);
        }
      } catch (lookupError) {
        if (lookupError.message === USER_MESSAGES.loginFailed) {
          throw lookupError;
        }

        if (isTechnicalMessage(lookupError?.message)) {
          throw new Error(USER_MESSAGES.loginFailed);
        }
      }

      throw new Error(USER_MESSAGES.inviteNotFound);
    }

    if (invite.status !== STATUS.INVITED && invite.status !== STATUS.REJECTED) {
      throw new Error(USER_MESSAGES.loginFailed);
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
