/** Plain-language messages shown in the app — no technical stack details. */

export const USER_MESSAGES = {
  generic: 'Something went wrong. Please try again or contact HR for help.',
  network: 'Unable to connect. Please check your internet connection and try again.',
  permission: 'You do not have permission to do this. Please sign in again or contact HR.',
  serviceUnavailable: 'The service is temporarily unavailable. Please try again in a few minutes.',
  loginFailed: 'Invalid email or password. Please check your credentials and try again.',
  hrSessionExpired: 'Your session has expired. Please sign out and sign in again as HR.',
  employeeSessionExpired: 'Your session has expired. Please sign out and sign in again.',
  accountNotLinked: 'Your account could not be linked. Please sign out and sign in with the email and password HR shared with you.',
  inviteNotFound: 'No invitation was found for this email. Please ask HR to invite you using the same work email address.',
  alreadyRegistered: 'This email is already registered. Sign in with the password HR shared with you.',
  weakPassword: 'Password is too weak. Use at least 6 characters.',
  tooManyAttempts: 'Too many sign-in attempts. Please wait a few minutes and try again.',
  invalidEmail: 'Please enter a valid email address.',
  workEmailOnly: 'Only @genaixis.com work emails can sign in. Use your company email.',
  hrEmailRequired: 'HR sign-in is not set up yet. Please contact your administrator.',
  wrongHrAccount: (expected) => `Please sign in with the HR account (${expected}).`,
  hrWrongPassword: 'Incorrect password for the HR account. Contact your administrator if you need a reset.',
  duplicateEmployee: 'An employee with this email already exists.',
  tempPasswordShort: 'Temporary password must be at least 6 characters.',
  uploadFailed: 'Could not upload the file. Please try again.',
  uploadPermission: 'Could not upload the file. Please sign in again or contact HR.',
  fileTooLarge: 'Each file must be 700 KB or smaller. Please choose a smaller file.',
  fileTypeInvalid: 'Only PDF, JPG, and PNG files are allowed.',
  loadEmployeesFailed: 'Could not load employees. Please refresh the page.',
  loadPayslipsFailed: 'Could not load payslips. Please try again later.',
  loadOnboardingFailed: 'Could not load your onboarding details. Please try again or contact HR.',
  saveFailed: 'Could not save your changes. Please try again.',
  deleteFailed: 'Could not delete this employee. Please try again.',
  payslipFailed: 'Could not generate the payslip. Please try again.',
  holidaySaveFailed: 'Could not save the company holiday. Please try again or contact your administrator.',
  appNotConfigured: 'PeopleHub is not fully set up yet. Please contact your administrator.',
};

const TECHNICAL_PATTERN = /firebase|firestore|vercel|vite_|auth\/|permission-denied|console|\.env|project:|insufficient permissions|firestore\.rules/i;

export function isTechnicalMessage(message) {
  return TECHNICAL_PATTERN.test(String(message || ''));
}

export function toUserMessage(error, fallback = USER_MESSAGES.generic) {
  const message = error?.message?.trim();
  if (!message || isTechnicalMessage(message)) return fallback;
  if (message.length > 160) return fallback;
  return message;
}

export function mapAuthError(error) {
  const code = error?.code || '';

  switch (code) {
    case 'auth/configuration-not-found':
    case 'auth/operation-not-allowed':
      return USER_MESSAGES.serviceUnavailable;
    case 'auth/email-already-in-use':
      return USER_MESSAGES.alreadyRegistered;
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return USER_MESSAGES.loginFailed;
    case 'auth/invalid-email':
      return USER_MESSAGES.invalidEmail;
    case 'auth/weak-password':
      return USER_MESSAGES.weakPassword;
    case 'auth/too-many-requests':
      return USER_MESSAGES.tooManyAttempts;
    case 'auth/network-request-failed':
      return USER_MESSAGES.network;
    default:
      return toUserMessage(error, USER_MESSAGES.loginFailed);
  }
}

export function mapStorageError(error, fallback = USER_MESSAGES.saveFailed) {
  const code = error?.code || '';
  const message = error?.message || '';

  if (code === 'permission-denied' || message.includes('permission-denied')) {
    return USER_MESSAGES.permission;
  }
  if (message.includes('not-found') || message.includes('Unavailable')) {
    return USER_MESSAGES.serviceUnavailable;
  }

  return toUserMessage(error, fallback);
}

export function mapUploadError(error) {
  const code = error?.code || '';
  const message = error?.message || '';

  if (code === 'permission-denied') {
    return USER_MESSAGES.uploadPermission;
  }
  if (code === 'invalid-argument' || message.includes('size')) {
    return USER_MESSAGES.fileTooLarge;
  }

  return toUserMessage(error, USER_MESSAGES.uploadFailed);
}
