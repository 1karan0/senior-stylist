# Firebase Storage Rules

## Rules File Location
The Firebase Storage rules are in `firebase-storage.rules`

## Deploying Rules

### Option 1: Using Firebase CLI
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy storage rules
firebase deploy --only storage
```

### Option 2: Using Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `senior-stylist-t`
3. Navigate to **Storage** → **Rules** tab
4. Copy the contents of `firebase-storage.rules`
5. Paste into the rules editor
6. Click **Publish**

## Rules Overview

The rules allow:
- **`consultation_requests/{userId}/{imageName}`**: Authenticated users can upload/read consultation request images (max 10MB, images only)
- **`consultations/{consultationId}/images/{imageName}`**: Authenticated users can upload/read consultation chat images (max 10MB, images only)

## Important Note About Signed URLs

**When using signed URLs from Laravel backend, Firebase Storage rules DO NOT apply.**

Signed URLs are pre-authorized Google Cloud Storage URLs that bypass Firebase Storage rules. The authorization is built into the signed URL itself via query parameters.

However, it's still good practice to have these rules in place for:
1. Direct SDK uploads (if you use them elsewhere)
2. Security best practices
3. Future-proofing

## Folder Structure

The rules expect this structure:
```
consultation_requests/
  └── {userId}/
      └── {imageName}

consultations/
  └── {consultationId}/
      └── images/
          └── {imageName}
```

