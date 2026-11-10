# TripSplit 🌴

A mobile-first expense-sharing app built with **HTML, custom CSS, and vanilla JavaScript modules**. Firebase Authentication + Cloud Firestore provide real accounts and real-time data. One JavaScript Vercel function validates all changes. No React, TypeScript, bundler, or frontend framework.

## Start with the working demo

Install Node.js 22 or later, extract this folder, and open a terminal inside it:

```bash
npm run dev
```

Open **http://localhost:3000**. No package installation or Firebase account is required for the demo. Do not open `index.html` using `file://`; JavaScript modules need HTTP.

On Windows, if PowerShell blocks npm.ps1, use `npm.cmd run dev` (and `npm.cmd install` for installation).

The app automatically opens a clearly labeled demo while `public/js/firebase-config.js` is empty. Goa Madness contains Rahul, Priya, Amit and Neha, with five expenses totaling ₹16,000. Switch friends under **Profile → Explore as**. Record a partial payment as Amit, switch to Priya, and confirm receiving it. Pending payments do not affect balances. **Reset demo data** restores the sample.

Demo changes are stored only in the browser's localStorage under `tripsplit-demo-v1`. Tabs on the same origin receive updates. Demo invitations do **not** connect different phones; real mode does. Demo accounts are not real authentication.

## Included functionality

- Five-step trip creation; INR, GBP, USD, EUR or AED; one currency per trip.
- Secure invitation preview/join, copy/share links, WhatsApp link, administrator renewal.
- Add, inspect, edit and delete expenses; nine categories, dates, notes, chosen participants, one or several payers.
- Equal, exact-amount, percentage and integer-share splits with deterministic minor-unit rounding.
- Server-maintained balances, contributions, categories, daily totals, highest expense and food payer insights.
- Debt suggestions kept separate from the expense ledger; these are valid simplified transfers, not a guarantee of the mathematically minimum number of transfers.
- Partial external-payment records; recipient confirmation/rejection, sender cancellation, pending/history views.
- Admin transfer, safe member removal, financially permitted departure, historical member names retained.
- Real-time group/expense/payment/activity listeners; older ledger/activity rows load in batches of 50.
- Email/password registration, login, Google popup login, password reset, profile display name, logout.
- Mobile bottom navigation, accessible dialogs, live split preview, toasts, confetti, reduced-motion support.
- Installable PWA manifest, PNG icons and a private-data-free offline fallback.

## Configure Firebase

1. Create a Firebase project at https://console.firebase.google.com/. Use the **Spark** plan. Google Analytics is optional.
2. Under **Project settings → General → Your apps**, register a Web app.
3. Copy its public web configuration into **`public/js/firebase-config.js`**:

   ```js
   export const firebaseConfig = {
     apiKey: 'YOUR_PUBLIC_WEB_API_KEY',
     authDomain: 'YOUR_PROJECT.firebaseapp.com',
     projectId: 'YOUR_PROJECT_ID',
     appId: 'YOUR_WEB_APP_ID'
   };
   export const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
   ```

   These are public application identifiers, not Admin credentials. Do not paste a private key into a file under `public/`.
4. Under **Authentication → Sign-in method**, enable **Email/Password** and **Google**. Set the support email for Google. Phone authentication is not used.
5. Create the **default Cloud Firestore database**, choose **production mode**, and select a suitable location. Use the standard database, not an Enterprise database.
6. Install the project dependencies and deploy the supplied rules/indexes:

   ```bash
   npm install
   npx firebase login
   npx firebase use --add
   npx firebase deploy --only firestore:rules,firestore:indexes
   ```

   Select the same project ID as your public config. Wait for the membership/updatedAt composite index to finish building. The rules deliberately deny **all browser writes**; do not loosen them if an API request fails.
7. Create server credentials for your Firebase project. Firebase **Project settings → Service accounts → Firebase Admin SDK → Generate new private key** provides a JSON file. Keep it private and outside this repository. A dedicated service account with the necessary Firestore read/write and Firebase Auth read access can be used instead; do not grant broader IAM access than necessary.
8. In Vercel, add the entire JSON as a **server-only environment variable** named:

   ```text
   FIREBASE_SERVICE_ACCOUNT_JSON
   ```

   Paste valid JSON, including escaped newline characters in `private_key`. Do not add a `PUBLIC_` prefix or put it in browser config. The function reads it through `process.env`, verifies Firebase ID tokens and runs Firestore transactions. The service account must belong to the same project as the browser config.

## Deploy on Vercel

1. Push the extracted **tripsplit folder contents** to a private Git repository. Never commit service-account JSON or `.env` files.
2. In https://vercel.com/new, import the repository.
3. Set the **Root Directory** to the folder containing `package.json`, `vercel.json`, `api/`, and `public/`.
4. Choose **Framework Preset: Other**.
5. Leave **Build Command empty**. Set **Output Directory: public**. Install Command may be `npm ci --omit=dev`; only `firebase-admin` is needed by the deployed API. Use Node.js 22 or 24.
6. Add `FIREBASE_SERVICE_ACCOUNT_JSON` to the appropriate production/preview environment before deployment.
7. Deploy. The `api/action.js` file runs at `/api/action`. Static pages are served from `public/`; the server credentials and source outside `public/` are not static assets.
8. Copy the resulting hostname (for example, `your-project.vercel.app`). In **Firebase Authentication → Settings → Authorized domains**, add that exact hostname, and any custom domain you use. Do not include `https://` or a path.
9. If testing locally, explicitly add `localhost` to a **development** project's authorized domains. New Firebase projects may not include it by default. Use the stable production hostname for mobile sharing; ephemeral preview hostnames need separate authorization.
10. Open the deployed HTTPS URL. With public Firebase config present, it opens real sign-in. Real groups start empty; the sample trip never enters your production database.

For local real-mode/API development, run `npx vercel dev` from the repository root with the server environment configured. `npm run dev` is a static demo preview and does not implement `/api/action`.

### Two-phone acceptance test

1. Register or Google-sign-in on phone A. Create a trip and copy its invitation link.
2. Open the link on phone B; sign in using a **different** account. Preview and join.
3. Add an expense on A. Verify B sees it without refreshing, and the shares sum exactly to the entered amount.
4. Edit the same expense on both phones: the stale version should be rejected, with a message to reopen it.
5. Record a partial payment as the debtor. Balances remain unchanged until the recipient confirms.
6. Confirm on the recipient's phone. Verify both balances update once and the payment remains in history.
7. Sign in with an unrelated third account and verify it cannot open the group's data without a valid invitation.
8. Test Google login, forgot-password delivery and install-to-home-screen on actual devices. These provider/device flows need your deployed project and were not validated against your account here.

## How the data is protected

All writes go to the Vercel API with a Firebase ID token. The API verifies the token, derives the acting UID from it, checks membership/ownership, validates every split and payer, and performs an atomic transaction. The Admin SDK bypasses Firestore rules, so API authorization is mandatory and is tested separately.

The browser cannot write balances, add memberships, forge activities or confirm someone else's payment directly. Rules permit group reads only for listed members. Invitation lookup is server-only; production codes use 64 random bits, are hashed in lookup document IDs, expire in 30 days, and can be rotated. Keep codes private to the intended crew.

The API uses operation IDs for idempotency, optimistic expense versions for conflict handling, and durable per-user rate limits of 40 requests per minute. Every ledger mutation touches the group document, so transactions serialize conflicting writes. A sender may have only one pending payment at a time; resolve incoming/outgoing pending records before sending another. Confirmed external payments remain in the ledger even if an expense is later edited or deleted, which may reverse who owes whom.

A removed member must have a zero balance and no pending payment. Their history is retained. Expenses involving former members cannot be edited/deleted until those members are reinvited, preventing new debts from being silently assigned to someone without access. The admin must transfer administration before leaving.

Firestore uses **in-memory snapshots**, not persistent browser disk caching. Firebase Auth uses session persistence. The service worker caches only the offline page and icons, never API requests, Firebase responses or financial data. Offline financial edits are deliberately disabled; no hidden queue of stale payments is submitted later.

## Data layout

```text
users/{uid}                         profile name + per-minute rate counter
users/{uid}/operations/{uuid}       server-only idempotency results
inviteLookup/{sha256(code)}         server-only group lookup + expiry
groups/{groupId}                    authoritative summaries, active member IDs,
                                   member names, balances, admin, invitation code
groups/{groupId}/members/{uid}      membership mirror/history
groups/{groupId}/expenses/{id}      original expense ledger and version
groups/{groupId}/settlements/{id}   pending/confirmed/rejected/cancelled records
groups/{groupId}/activity/{id}      server-authored event timeline
groups/{groupId}/invites/current    current invitation and expiry
```

The trip list watches the 100 most recently updated memberships. Trips support up to 30 historical members. Individual expenses are limited to 1,000,000 major currency units. All supported currencies have two decimal places. No currency conversion or real payment processing is performed. At very high activity levels, move away from the shared group-summary write hotspot; this implementation is designed for small friend groups.

The home feed shows the latest event from each trip in real mode. A trip's Activity tab provides its full paginated timeline. Loading older records expands that collection's real-time query, which keeps loaded records current but can incur fresh reads.

## Free-tier operation

Core functionality uses Firebase Authentication and standard Firestore; it does not require Firebase Cloud Functions, Cloud Storage, phone SMS, scheduled tasks, or paid TTL deletion. Trusted execution is hosted by Vercel, not Firebase Functions.

Firestore's published free allowance includes **1 GiB storage, 50,000 reads/day, 20,000 writes/day, and 20,000 deletes/day** for one eligible database. Listener reconnects, transactions, rate-limit documents, and activity records all consume quota. This is not a promise of unlimited free hosting; Vercel and Firebase have their own usage limits and plan terms. Monitor both dashboards. Operation records and expired invitation documents are retained without paid automatic TTL; review storage usage as the app grows.

## Tests

```bash
npm install
npm test
npm run test:rules
npm run test:api
```

The emulator suites require Java 21 and available ports 8080/9099. They use `demo-tripsplit`, synthetic users and no production credentials. `test:api` asserts emulator environment variables before running.

- Unit/property tests: cents, rounding, all split methods, multiple payers, mutations, stale edits, access checks, settlements, removal and debt reduction.
- Rules emulator: membership reads, unauthorized/anonymous reads, forbidden direct writes and hidden invitation lookups.
- API/Auth/Firestore emulators: creation, preview/join, idempotency, simultaneous conflicting edits, summaries, payment authorization, invitation rotation and deletion after settlement.
- See **TESTING.md** for actual execution results and remaining deployment checks.

## Source organization

```text
public/index.html          app shell; all screens are vanilla JS views
public/css/app.css         custom responsive design system
public/js/app.js           navigation, auth screens, dashboard and trip views
public/js/forms.js         trip/expense/invitation/settlement dialogs
public/js/ledger.js        shared validation, split math and ledger transitions
public/js/demo.js          independent local demo adapter
public/js/firebase-store.js modular Firebase auth + real-time reads + API transport
public/js/firebase-config.js public web configuration
public/js/ui.js            escaping, currency formatting, dialogs and feedback
public/sw.js               non-sensitive offline fallback
public/manifest.webmanifest PWA metadata
public/assets/icons/       192/512px icons and maskable icon
api/action.js              trusted Vercel mutation endpoint
server/firebase.js         server-only Firebase Admin initialization
scripts/dev.mjs            dependency-free local static preview server
firestore.rules            deny-by-default client rules
firestore.indexes.json     required membership query index
firebase.json              rules/index deployment and emulator config
vercel.json                static output + response headers
```

A single entry page is intentional: navigation doesn't reload Firebase or discard listeners unnecessarily. The UI, forms, data adapters and ledger are separate modules; no framework or build step is needed.

## Troubleshooting

- **Still showing Demo mode:** fill all required public Firebase configuration fields, save, redeploy and refresh.
- **Service unavailable on save:** check the server environment JSON and matching project ID; inspect Vercel function logs privately. Do not weaken Firestore rules.
- **Missing/insufficient permissions:** deploy rules to the correct project, ensure the signed-in user joined the trip, and verify the membership index finished building.
- **Google unauthorized domain:** add the deployed hostname in Firebase Auth settings. Allow the sign-in popup and retry from a normal browser, not an in-app webview.
- **Invitation invalid:** check spelling, expiry, and whether the admin rotated it. DEMO-GOA works only in demo mode.
- **Conflict message:** reopen the expense to obtain its latest version before editing.
- **Cannot remove member:** settle their balance, resolve pending payments, and transfer admin status if needed.
- **Offline:** reconnect; this app does not expose a cached shared ledger offline.
- **Fonts blocked:** the interface falls back to the system font.

Official implementation references, checked 10 November 2026:
- https://firebase.google.com/docs/firestore/manage-data/transactions
- https://firebase.google.com/docs/firestore/security/rules-conditions
- https://firebase.google.com/docs/firestore/pricing
- https://firebase.google.com/docs/auth/faq-and-troubleshooting
- https://vercel.com/docs/functions/runtimes/node-js
- https://vercel.com/docs/builds
