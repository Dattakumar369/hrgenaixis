import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db, auth, HR_EMAIL } from '../firebase';
import { uploadDocument, uploadDocuments } from './documentService';

export const STATUS = {
  INVITED: 'invited',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const EMPLOYMENT_STATUS = {
  ACTIVE: 'active',
  RESIGNED: 'resigned',
  ABSCONDED: 'absconded',
};

export const EMPLOYMENT_STATUS_LABELS = {
  [EMPLOYMENT_STATUS.ACTIVE]: 'Active',
  [EMPLOYMENT_STATUS.RESIGNED]: 'Resigned',
  [EMPLOYMENT_STATUS.ABSCONDED]: 'Absconded',
};

function mapFirestoreError(error, contextEmail) {
  const code = error?.code || '';
  const message = error?.message || '';
  const signedInAs = auth.currentUser?.email || contextEmail || 'not signed in';

  if (code === 'permission-denied' || message.includes('permission-denied') || message.includes('insufficient permissions')) {
    return (
      `Firestore blocked this action (signed in as ${signedInAs}). ` +
      `Publish firestore.rules in Firebase Console → Firestore → Rules. ` +
      `Set hrEmail() to "${HR_EMAIL || 'hr@company.com'}" (same as VITE_HR_EMAIL), then click Publish.`
    );
  }
  if (message.includes('not-found') || message.includes('Unavailable')) {
    return 'Firestore is not set up. Enable it in Firebase Console → Build → Firestore Database.';
  }

  return message || 'Failed to save employee invite.';
}

export async function getInviteByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const q = query(collection(db, 'employees'), where('email', '==', normalizedEmail));

  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const employeeDoc = snapshot.docs[0];
    return { id: employeeDoc.id, ...employeeDoc.data() };
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}

/** Lookup invite before login — query must match Firestore security rules */
export async function getPendingInviteByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const q = query(
    collection(db, 'employees'),
    where('email', '==', normalizedEmail),
    where('uid', '==', null)
  );

  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const employeeDoc = snapshot.docs[0];
    return { id: employeeDoc.id, ...employeeDoc.data() };
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}

export async function createEmployeeRecord(data, hrEmail) {
  if (!auth.currentUser) {
    throw new Error('HR session expired. Log out and log in again as HR.');
  }

  if (auth.currentUser.email?.toLowerCase() !== HR_EMAIL) {
    throw new Error(
      `You are signed in as ${auth.currentUser.email}. HR actions require ${HR_EMAIL}. Log out and sign in with the HR account.`
    );
  }

  const email = data.email.trim().toLowerCase();

  try {
    const existing = await getInviteByEmail(email);
    if (existing) {
      throw new Error('An employee with this email is already invited or registered.');
    }

    const docRef = await addDoc(collection(db, 'employees'), {
      email,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      department: data.department,
      jobTitle: data.jobTitle.trim(),
      startDate: data.startDate,
      employeeCode: data.employeeCode?.trim() || '',
      status: STATUS.INVITED,
      uid: null,
      createdBy: hrEmail,
      createdAt: serverTimestamp(),
      salary: {
        grossMonthly: 0,
        pfRate: 0.12,
        professionalTax: 200,
        employeeCode: data.employeeCode?.trim() || '',
        uan: '',
        bankName: '',
        bankAccount: '',
      },
    });

    return docRef.id;
  } catch (error) {
    if (error.message?.includes('already invited')) throw error;
    throw new Error(mapFirestoreError(error));
  }
}

export async function linkEmployeeUid(employeeId, uid) {
  await updateDoc(doc(db, 'employees', employeeId), { uid });
}

export async function getEmployeeByEmail(email) {
  return getInviteByEmail(email);
}

/** Links invite to auth uid if missing — fixes first login / orphaned auth accounts */
export async function ensureEmployeeLinked(authUser) {
  if (!authUser?.uid || !authUser?.email) return null;

  try {
    const byUid = await getEmployeeByUid(authUser.uid);
    if (byUid) return byUid;

    const invite = await getEmployeeByEmail(authUser.email);
    if (!invite) return null;

    if (!invite.uid || invite.uid !== authUser.uid) {
      await linkEmployeeUid(invite.id, authUser.uid);
    }

    return { ...invite, uid: authUser.uid };
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}

export async function getEmployeeByUid(uid) {
  const q = query(collection(db, 'employees'), where('uid', '==', uid));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const employeeDoc = snapshot.docs[0];
  return { id: employeeDoc.id, ...employeeDoc.data() };
}

export async function getAllEmployees() {
  try {
    const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((employeeDoc) => ({
      id: employeeDoc.id,
      ...employeeDoc.data(),
    }));
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}

export async function submitOnboarding(employeeId, uid, formData, documents) {
  if (!employeeId || !uid) {
    throw new Error('Account not linked. Log out and log in again with your HR invite credentials.');
  }

  const { aadharNumber, panNumber, existingGrossMonthly, employeeCode, uan, bankName, bankAccount, ...employeeData } = formData;
  const { currentCompany, previousCompanies, ...identityDocs } = documents;

  const payrollFields = {
    employeeCode: employeeCode?.trim() || '',
    uan: uan?.trim() || '',
    bankName: bankName?.trim() || '',
    bankAccount: bankAccount?.trim() || '',
  };

  try {
    const [aadharFile, panFile, offerLetter, joiningLetter, appointmentLetter, educationalFiles, ...previousUploads] =
      await Promise.all([
        uploadDocument(identityDocs.aadhar, employeeId, uid, 'aadhar'),
        uploadDocument(identityDocs.pan, employeeId, uid, 'pan'),
        uploadDocument(currentCompany.offerLetter, employeeId, uid, 'current-offer-letter'),
        uploadDocument(currentCompany.joiningLetter, employeeId, uid, 'current-joining-letter'),
        uploadDocument(currentCompany.appointmentLetter, employeeId, uid, 'current-appointment-letter'),
        uploadDocuments(identityDocs.educational, employeeId, uid, 'educational'),
        ...previousCompanies.map((company, index) =>
          uploadPreviousCompany(employeeId, uid, company, index)
        ),
      ]);

    await updateDoc(doc(db, 'employees', employeeId), {
      ...employeeData,
      ...payrollFields,
      uid,
      salary: {
        grossMonthly: Number(existingGrossMonthly) || 0,
        ...payrollFields,
      },
      documents: {
        aadhar: { number: aadharNumber, ...aadharFile },
        pan: { number: panNumber, ...panFile },
        currentCompany: {
          offerLetter,
          joiningLetter,
          appointmentLetter,
        },
        previousCompanies: previousUploads,
        educational: educationalFiles,
      },
      status: STATUS.SUBMITTED,
      submittedAt: serverTimestamp(),
    });
  } catch (error) {
    if (error.message && !error.code) throw error;
    throw new Error(mapFirestoreError(error));
  }
}

async function uploadPreviousCompany(employeeId, uid, company, index) {
  const prefix = `previous-company-${index}`;

  const [offerLetter, relievingLetter, paySlips, form16] = await Promise.all([
    uploadDocument(company.offerLetter, employeeId, uid, `${prefix}-offer`),
    uploadDocument(company.relievingLetter, employeeId, uid, `${prefix}-relieving`),
    uploadDocuments(company.paySlips, employeeId, uid, `${prefix}-payslips`),
    uploadDocuments(company.form16, employeeId, uid, `${prefix}-form16`),
  ]);

  return {
    companyName: company.companyName.trim(),
    offerLetter,
    relievingLetter,
    paySlips,
    form16,
  };
}

export async function approveEmployee(employeeId, hrEmail) {
  await updateDoc(doc(db, 'employees', employeeId), {
    status: STATUS.APPROVED,
    employmentStatus: EMPLOYMENT_STATUS.ACTIVE,
    approvedAt: serverTimestamp(),
    approvedBy: hrEmail,
    rejectionReason: null,
  });
}

export async function rejectEmployee(employeeId, hrEmail, reason) {
  await updateDoc(doc(db, 'employees', employeeId), {
    status: STATUS.REJECTED,
    rejectedAt: serverTimestamp(),
    rejectedBy: hrEmail,
    rejectionReason: reason.trim(),
  });
}

/** Set lifecycle status (active / resigned / absconded) for an onboarded employee. */
export async function updateEmploymentStatus(employeeId, employmentStatus, hrEmail) {
  if (!Object.values(EMPLOYMENT_STATUS).includes(employmentStatus)) {
    throw new Error('Invalid employment status.');
  }
  try {
    await updateDoc(doc(db, 'employees', employeeId), {
      employmentStatus,
      employmentStatusUpdatedAt: serverTimestamp(),
      employmentStatusUpdatedBy: hrEmail,
    });
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}

/** HR edits core employee details. */
export async function updateEmployeeDetails(employeeId, data) {
  const allowed = ['firstName', 'lastName', 'phone', 'department', 'jobTitle', 'startDate'];
  const payload = {};
  allowed.forEach((key) => {
    if (data[key] !== undefined) payload[key] = typeof data[key] === 'string' ? data[key].trim() : data[key];
  });

  if (Object.keys(payload).length === 0) return;

  try {
    await updateDoc(doc(db, 'employees', employeeId), {
      ...payload,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}

export async function deleteEmployee(employeeId) {
  try {
    await deleteDoc(doc(db, 'employees', employeeId));
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}
