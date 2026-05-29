# Secret Santa Backend

This backend is a minimal Node/Express service that handles authenticated requests for private user data.

## Purpose

- Keep private fields like addresses outside public Firestore reads
- Allow only the owner, an admin, or an assigned giftee to retrieve sensitive information
- Provide a backend API that can be called from the frontend with a Firebase ID token

## Setup

1. Copy `backend/.env.example` to `backend/.env`
2. Set `GOOGLE_APPLICATION_CREDENTIALS` to point to a Firebase service account JSON file, or use `FIREBASE_SERVICE_ACCOUNT_JSON`
3. Install dependencies:

```bash
cd backend
npm install
```

## Run

```bash
cd backend
npm run dev
```

## API endpoints

- `GET /api/users` — list safe public profiles (no addresses)
- `GET /api/users/:userId` — safe public profile for a single user
- `GET /api/me` — safe profile of the authenticated user
- `GET /api/me/private` — private fields for the authenticated user
- `GET /api/users/:userId/private` — private fields for another user if allowed
- `GET /api/preview?url=<site_url>` — fetch the preview image URL for a remote link via the backend
- `PATCH /api/me/private` — update the authenticated user's private address fields
- `PATCH /api/users/:userId/private` — update another user's private fields if you are an admin

## Auth

Send a Firebase ID token in the `Authorization` header:

```http
Authorization: Bearer <idToken>
```

The token is verified with Firebase Admin and access is granted only when the user is:

- the document owner
- assigned to the target user
- an admin
