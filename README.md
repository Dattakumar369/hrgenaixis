# Employee Onboarding App

A React web app with **HR** and **Employee** login flows. HR creates employee accounts, employees submit onboarding details and documents, and HR reviews and approves to complete onboarding.

## Workflow

```
HR Login → Create employee account → Employee Login → Submit details & documents
    → HR reviews → Approve → Onboarding complete
```

| Status | Meaning |
|--------|---------|
| `invited` | HR created account; employee has not submitted yet |
| `submitted` | Employee submitted; waiting for HR review |
| `approved` | HR approved; onboarding complete |
| `rejected` | HR rejected; employee can update and resubmit |

## Features

- **HR login** — static credentials from `.env`
- **Employee login** — email + temporary password created by HR
- HR dashboard to create employees and review submissions
- Document uploads: Aadhar, PAN, previous company docs, educational certificates
- Firebase Auth, Firestore, and Storage (free Spark plan)
- Deploy free on Vercel or GitHub Pages

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/) and open your project.
2. Enable **Authentication** → Sign-in method → **Email/Password**.
3. Enable **Firestore Database**.
4. Enable **Firebase Storage**.
5. Register a **Web app** and copy config into `.env` (see `.env.example`).
6. Add HR static credentials to `.env`:

```env
VITE_HR_EMAIL=hr@company.com
VITE_HR_PASSWORD=Hr@123456
```

7. Create the HR user in Firebase Authentication:
   - Authentication → Users → **Add user**
   - Use the **same email and password** as in `.env`

8. Apply security rules:
   - Firestore → Rules → paste `firestore.rules`
   - Storage → Rules → paste `storage.rules`

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:5173

**Test flow:**
1. Login as **HR** with your static credentials
2. Create an employee account (share email + temp password with employee)
3. Logout → Login as **Employee**
4. Fill onboarding form and submit
5. Login as **HR** → select employee → review documents → **Approve**

## Deploy

### Vercel (recommended)

Add all environment variables from `.env.example` including `VITE_HR_EMAIL` and `VITE_HR_PASSWORD`.

### GitHub Pages

Add the same variables as repository secrets in GitHub Actions.

## Tech stack

- React + Vite + React Router
- Firebase Auth, Firestore, Storage
- Vercel / GitHub Pages
