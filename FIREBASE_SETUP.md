# Firestore Rules — Required for HR invite & employee login

If you see **"Firestore blocked this action"** when inviting an employee, the rules in Firebase Console are missing or outdated.

## Fix (5 minutes)

1. Open [Firebase Console](https://console.firebase.google.com/) → project **employee-data-20218**
2. Go to **Build → Firestore Database → Rules**
3. Delete everything in the editor
4. Copy **all** of `firestore.rules` from this project folder
5. Confirm line 7 says your HR email (must match `VITE_HR_EMAIL` in `.env` / Vercel):

   ```javascript
   function hrEmail() {
     return 'hr@genaixis.com';
   }
   ```

6. Click **Publish**
7. Log out of the app → log in again as HR → retry **Invite employee**

## Verify HR email matches everywhere

| Location | Value |
|----------|--------|
| `.env` → `VITE_HR_EMAIL` | `hr@company.com` |
| Vercel env vars → `VITE_HR_EMAIL` | same as above |
| `firestore.rules` → `hrEmail()` | same as above |
| Firebase Auth login email | same as above |

If any of these differ, HR login may work in the app but Firestore will still block writes.

## What the rules allow

| Action | Who |
|--------|-----|
| Invite employee (create) | HR email only |
| List / review employees | HR email only |
| Employee first login lookup | Anyone (pending invite, `uid == null`) |
| Employee onboarding update | Employee (own record) |
| Payslips | HR creates; employee reads own |

## Optional: deploy rules from terminal

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules --project employee-data-20218
```

Project is already linked in `.firebaserc`.

## Still blocked?

1. **Authentication → Sign-in method** → enable **Email/Password**
2. **Firestore Database** must exist (not only Auth)
3. Hard refresh the app (Ctrl+Shift+R) after publishing rules
4. Check browser console — error now shows which email you are signed in as
