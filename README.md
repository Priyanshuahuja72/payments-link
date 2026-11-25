# Payment Links Manager

A payment-link manager built with Vite, React, TypeScript, and a small Node validation API. Payment-link state is stored in the current browser's local storage; the API validates create and record-payment requests but does not process payments or persist authoritative financial records. Generated `pay.ledger.local` URLs are examples.

## Run locally

```sh
npm install
npm run dev
```

## Checks

```sh
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

Vitest covers frontend/domain and server validation, including minor-unit payment arithmetic. The Playwright flow creates a link, records partial and final payments, filters by status, and verifies persistence after reload.
