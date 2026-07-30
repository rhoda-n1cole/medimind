# MediMind

Digital medication reminder and health tracking platform for chronic-illness patients in Rwanda (hypertension, diabetes, HIV/AIDS, tuberculosis).

Author: Nicole Rhoda Umutesi, African Leadership University

## Tech stack

- Backend: Node.js + Express
- Auth: JWT (jsonwebtoken) + bcrypt password hashing
- Database: JSON file via lowdb v1 (prototype-friendly, not for production scale)
- Frontend: Plain HTML/CSS/JS, PWA-ready, no build step
- Push notifications: web-push with VAPID keys
- Scheduler: node-cron

## Project structure

```
medimind/
├── server.js                 Express app entry point
├── db.js                     lowdb database setup
├── middleware/
│   └── auth.js               JWT verification middleware
├── routes/
│   ├── auth.js                register, login, caregiver link code, /me
│   ├── medications.js         medication CRUD
│   ├── doses.js                checklist, weekly summary, confirm, snooze
│   └── appointments.js         appointment scheduling
├── services/
│   └── notificationService.js  cron job: reminders, follow-ups, auto-missed logging
└── public/
    ├── register.html / login.html / dashboard.html
    ├── checklist.html / appointments.html / caregiver-dashboard.html
    ├── service-worker.js
    ├── manifest.json
    ├── icons/
    ├── css/
    └── js/
```

## Setup

1. Clone the repository and install dependencies:
   ```
   npm install
   ```

2. Copy the environment template and fill in real values:
   ```
   cp .env.example .env
   ```

3. **REQUIRED CHANGE — `.env` file.** Open `.env` and replace every placeholder value before running the app:

   | Variable | How to generate | Change needed |
   |---|---|---|
   | `JWT_SECRET` | Run `openssl rand -hex 32` | REQUIRED — placeholder is not secure |
   | `VAPID_PUBLIC_KEY` | Run `npx web-push generate-vapid-keys` | REQUIRED — needed for push notifications to work |
   | `VAPID_PRIVATE_KEY` | Same command as above | REQUIRED — keep this one secret, never commit it |
   | `PORT` | Defaults to `3000` | Optional — only change if port 3000 is in use |

   Do not reuse any keys that have ever been shared outside your own machine (e.g. pasted into a chat, email, or public forum). Generate fresh ones for any real deployment.

4. Start the server:
   ```
   npm start
   ```

5. Open `http://localhost:3000` in a browser (redirects to the login page automatically).

## Known limitations

- **FR 1.4 (password reset) is not implemented.** Deferred intentionally — sending a real reset code requires an email or SMS service not yet integrated.
- **Notification action buttons** ("Mark as taken" / "Snooze" directly on the push notification) are built and functional, but rendering of action buttons depends on the operating system's notification system. Confirmed not rendering on Ubuntu/GNOME during testing; the fallback "Mark as taken" button on the checklist page always works regardless.
- **Caregiver link codes are single-use** — a code stops working after one successful caregiver registration. A patient must generate a new code to link another caregiver.
- **Kinyarwanda translations** are functional but have not been reviewed by a native speaker.
- **Database is a single JSON file (`medimind.json`)**, generated automatically on first run. Fine for a prototype; not safe for concurrent multi-user production use.

## Deployment notes (Render free tier)

- **REQUIRED CHANGE when deploying** — set `JWT_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `PORT` as environment variables directly in the hosting platform's dashboard. Do not rely on the `.env` file being deployed with the code.
- The free tier filesystem is **not persistent** — `medimind.json` resets to empty on every restart or redeploy. Upgrade to a paid tier with a persistent disk if data needs to survive restarts.
- The free tier **spins down after inactivity** and takes 30-60 seconds to wake on the next request. The background notification scheduler only runs while the service is awake, so reminders will not fire while the service is asleep.

## Out of scope (future work per SRS)

FR 6.x — SMS reminders, AI health recommendations, doctor dashboard, wearable integration, emergency alerts. Explicitly listed in the SRS as future versions, not part of Version 1.0.