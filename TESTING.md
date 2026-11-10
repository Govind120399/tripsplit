# TripSplit validation — 10 November 2026

## Automated results

| Suite | Result | Coverage |
|---|---:|---|
| `npm test` | 27 passed | Currency parsing, deterministic rounding, equal/unequal/percent/share splits, zero shares, multiple payers, expense edits/deletion, versions, membership, debt suggestions, payment state transitions |
| `npm run test:rules` | 7 passed | Member-only reads, unauthenticated/outsider denial, direct writes blocked, invitation lookup hidden |
| `npm run test:api` | 12 passed | Actual Vercel handler against Auth + Firestore emulators: trip creation, invitation preview/join, duplicate prevention, conflicting edits, payment authorization, renewal, delete-after-payment |
| JavaScript syntax | 10 modules passed | Browser modules, API, server adapter, service worker |
| Configuration parsing | 5 JSON files passed | Package, Vercel, Firebase, Firestore indexes, PWA manifest |

**46 automated tests passed; no failures.** Emulator permission-denied messages in the rules test output are expected assertions that invalid writes are rejected.

## Browser observations

Tested in Chromium using the running application, including a mobile-sized iframe with measured client widths:

| Dashboard width | Document scroll width | Horizontal overflow |
|---:|---:|---|
| 360px | 360px | None |
| 375px | 375px | None |
| 390px | 390px | None |
| 430px | 430px | None |

Also visually inspected the desktop dashboard and mobile bottom navigation. Trip membership view was checked at 360px with no horizontal overflow.

Observed workflows:

- Added “Sunset snacks” for ₹100.01 equally across four friends. The author received a ₹25.01 share and the trip total became ₹16,100.01.
- Edited it to ₹200, with Rahul/Priya paying ₹120/₹80 and percentages of 40/30/20/10. The list displayed both payers, a ₹80 author share and ₹16,200 trip total.
- Switched to Amit, recorded a ₹100 payment to Priya, and verified balances did not change while pending.
- Switched to Priya and confirmed receipt. Priya's balance changed from ₹4,020 to ₹3,920; Amit's debt changed from ₹2,840 to ₹2,740. The payment showed confirmed.
- Completed all five trip-creation steps for “Mountain Weekend”; the invite dialog displayed a generated code.
- Switched to another demo member, previewed the invitation, joined, and verified both members appeared in the crew list.
- Reset the demo back to the original Goa sample and verified the final mobile dashboard.

The responsive QA harness was temporary and is not shipped as a public application page.

## Requires the owner's deployed environment

These are not represented as completed live tests:

- The user's Firebase project configuration, service account IAM and deployed rules/indexes.
- Real Google OAuth popup behavior, actual email/password account creation and password-reset email delivery.
- Two physical phones receiving real Firestore updates on the final Vercel hostname.
- iOS/Android installation, standalone-mode behavior and offline transitions on real devices.
- An actual Vercel deployment/build under the user's account and its production environment variables.

The Auth/Firestore emulators exercised API authentication, database transactions and security rules with synthetic accounts. They do not substitute for the two-phone acceptance checklist in README.md.
