import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

import { mapUploadError as mapUploadStorageError, USER_MESSAGES } from '../utils/userMessages';

const MAX_FILE_SIZE = 700 * 1024;
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];


function mapUploadError(error) {
  return mapUploadStorageError(error);
}

export function validateFile(file) {
  if (!file) return 'Please select a file';
  if (!ALLOWED_TYPES.includes(file.type)) {
    return USER_MESSAGES.fileTypeInvalid;
  }
  if (file.size > MAX_FILE_SIZE) {
    return USER_MESSAGES.fileTooLarge;
  }
  return null;
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('Could not read the selected file. Please try another file.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadDocument(file, employeeId, employeeUid, category) {
  const error = validateFile(file);
  if (error) throw new Error(error);

  try {
    const base64 = await readFileAsBase64(file);
    const docsRef = collection(db, 'employees', employeeId, 'documents');

    const docRef = await addDoc(docsRef, {
      employeeUid,
      category,
      fileName: file.name,
      fileType: file.type,
      data: base64,
      createdAt: serverTimestamp(),
    });

    return {
      fileName: file.name,
      fileType: file.type,
      documentId: docRef.id,
    };
  } catch (err) {
    throw new Error(mapUploadError(err));
  }
}

export async function uploadDocuments(files, employeeId, employeeUid, category) {
  return Promise.all(
    Array.from(files).map((file) => uploadDocument(file, employeeId, employeeUid, category))
  );
}

export async function getDocumentUrl(employeeId, documentId) {
  if (!employeeId || !documentId) return null;

  try {
    const snapshot = await getDoc(
      doc(db, 'employees', employeeId, 'documents', documentId)
    );

    if (!snapshot.exists()) return null;

    const { fileType, data } = snapshot.data();
    return `data:${fileType};base64,${data}`;
  } catch (err) {
    console.error('Failed to load document:', err);
    return null;
  }
}
