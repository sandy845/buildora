# Buildora Firebase Migration & Setup Guide

This guide walks you through connecting your Firebase project to Buildora for **Authentication** and **Cloud Firestore Database**.

---

## 1. Enable Firebase Authentication

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. In the left navigation, click **Build** -> **Authentication**.
4. Click **Get Started**.
5. Under the **Sign-in method** tab, enable:
   - **Email/Password**: Toggle **Enable** and save.
   - **Google**: Toggle **Enable**, choose your support email, and save.

---

## 2. Create Cloud Firestore Database

1. In the left navigation, click **Build** -> **Firestore Database**.
2. Click **Create database**.
3. Choose a location (e.g. `asia-south1` for Mumbai / India, or your preferred region).
4. Start in **Production mode** (or test mode for quick prototyping).
5. Copy the contents of [`firestore.rules`](./firestore.rules) into the **Rules** tab in the Firebase Console and click **Publish**.

---

## 3. Get Firebase Client Configuration (Web App)

1. In the Firebase Console, click the gear icon ⚙️ next to **Project Overview** -> **Project settings**.
2. Under the **General** tab, scroll down to **Your apps**.
3. If you haven't created a web app yet, click the **Web icon `</>`**, register the app (e.g., `Buildora Web`).
4. Copy the values into your `.env` (or `.env.local`):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="1234567890"
NEXT_PUBLIC_FIREBASE_APP_ID="1:1234567890:web:abcdef123456"
```

---

## 4. Get Firebase Admin SDK Credentials (Server-side)

1. In **Project settings**, click the **Service accounts** tab.
2. Select **Node.js** and click **Generate new private key**.
3. A JSON file will download (e.g., `your-project-id-firebase-adminsdk-xxxxx.json`).
4. You have two options in `.env`:

### Option A: Individual Variables (Recommended for Vercel/Production)
Open the downloaded JSON file and copy:
```bash
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----\n"
```

### Option B: Full JSON String
Or paste the entire JSON string into:
```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"..."}'
```

---

## 5. Configure the Vercel deployment

In Vercel, open the Buildora project, then go to **Settings -> Environment Variables**. Add the Firebase client variables from section 3 and the Firebase Admin credentials from section 4. Also add:

```text
AUTH_SECRET=<a unique random value of at least 32 characters>
RESEND_API_KEY=<your Resend API key>
EMAIL_FROM=<a sender address verified with your email provider>
NEXT_PUBLIC_APP_URL=https://your-production-domain
```

Use a verified Resend sender, or configure Postmark (`POSTMARK_SERVER_TOKEN`) or SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) instead. Keep all Admin credentials, `AUTH_SECRET`, and email-provider tokens server-only; do not use the `NEXT_PUBLIC_` prefix for them or paste them into chat. Apply these variables to **Production** (and Preview if needed), save, and redeploy the latest commit so the deployment picks them up.

Before trying registration, open `https://your-production-domain/api/health`. The database should report `connected`; a missing or invalid Firestore configuration must be fixed in Vercel/Firebase before account registration can persist. Registration sends a verification code and users must complete `/auth/verify` before logging in.

---

## 6. Authorization & Roles

Buildora enforces role-based access control (RBAC):
- **`customer`**: Access to `/client/dashboard`, their project status, quotations, documents, and messages.
- **`admin`**: Access to `/admin/dashboard`, all projects, leads, quotations, approvals, and financial reports.

When a user registers or logs in via Google:
- The user record is created in Firestore under the `users` collection (`/users/{uid}`).
- The user's role is stored in Firestore and attached as a custom claim (`role: "customer"` or `"admin"`).
- To make any user an administrator, update their document in Firestore under `users/{uid}`:
  ```json
  {
    "role": "admin"
  }
  ```

---

## 7. Testing & Running Locally

1. Run the development server:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:3000/auth/login`.
3. You can now log in using:
   - **Google Sign-In**: Click "Continue with Google"
   - **Email & Password**: Register a new account or log in with existing credentials.
