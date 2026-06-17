# Firestore Rules — Copy to Firebase Console

Your previous rules blocked employee login because the app queries `email + uid==null` but the rule required `status == 'invited'` too. Firestore rejects queries that could return unreadable documents.

## Paste this in Firebase Console → Firestore → Rules → Publish

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /employees/{employeeId} {
      allow read: if request.auth != null
        || resource.data.get('uid', null) == null;

      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if false;

      match /documents/{docId} {
        allow read, create: if request.auth != null;
        allow update, delete: if false;
      }
    }
  }
}
```

## What each rule does

| Action | Who | Rule |
|--------|-----|------|
| HR invites employee | HR (logged in) | `create` if authenticated |
| Employee first login | Not logged in yet | `read` if `uid` is null |
| Employee submits form | Employee (logged in) | `update` + upload `documents` |
| HR reviews | HR (logged in) | `read` all employees |

## If HR invite still fails

1. Log out → log in again as HR (session must be active)
2. Confirm **Authentication → Email/Password** is enabled
3. Confirm **Firestore Database** exists (not only Auth)
4. Click **Publish** after pasting rules

## Temporary test rules (if still blocked)

Use only for debugging, then switch back:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
