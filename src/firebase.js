import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const missingKeys = [
  ['VITE_FIREBASE_API_KEY', firebaseConfig.apiKey],
  ['VITE_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
  ['VITE_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
  ['VITE_FIREBASE_APP_ID', firebaseConfig.appId],
].filter(([, value]) => !value).map(([key]) => key);

if (missingKeys.length > 0) {
  throw new Error(
    `Firebase config missing: ${missingKeys.join(', ')}. ` +
    'Add these in Vercel → Project → Settings → Environment Variables, then redeploy.'
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/** Secondary auth — create employee login without signing HR out */
const EMPLOYEE_AUTH_APP = 'EmployeeAuth';
const employeeAuthApp = getApps().some((a) => a.name === EMPLOYEE_AUTH_APP)
  ? getApp(EMPLOYEE_AUTH_APP)
  : initializeApp(firebaseConfig, EMPLOYEE_AUTH_APP);
export const employeeAuth = getAuth(employeeAuthApp);

if (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
  isSupported().then((supported) => {
    if (supported) getAnalytics(app);
  });
}

export const HR_EMAIL = import.meta.env.VITE_HR_EMAIL?.toLowerCase();
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId || '';

export function isHrUser(user) {
  return user?.email?.toLowerCase() === HR_EMAIL;
}
