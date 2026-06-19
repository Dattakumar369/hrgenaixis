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
| `.env` → `VITE_HR_EMAIL` | `hr@genaixis.com` |
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

## Live site (Vercel) — works locally but not on production

### 1. Redeploy after env vars

Vite bakes `VITE_*` values at **build time**. After adding variables in Vercel:

1. **Deployments** → **⋯** → **Redeploy** (not just save env vars)
2. Hard refresh the live URL (Ctrl+Shift+R)

### 2. Copy every Firebase variable to Vercel

All of these must match your local `.env` exactly:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID` → must be `employee-data-20218`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_HR_EMAIL` → `hr@genaixis.com`
- `VITE_HR_PASSWORD`

If `VITE_FIREBASE_PROJECT_ID` is wrong on Vercel, local and live use **different databases** — invites created locally won't exist on live.

### 3. Add Vercel domain to Firebase Auth

Firebase Console → **Authentication → Settings → Authorized domains**

Add your live URL, e.g.:

- `your-app.vercel.app`
- Your custom domain if you use one

### 4. Invite employees from the live site

After redeploy, HR must **invite again from the live URL** (not only from localhost). Old invites created only on local still work if both use the same Firebase project — but the employee login account must exist in Firebase Auth.

Check: Firebase Console → **Authentication → Users** — employee email should appear after HR invites.
