# Payment Links Manager

A client-only payment-link manager built with Vite, React, and TypeScript. Links are stored in the current browser's local storage; the generated `pay.ledger.local` URLs are examples and do not process payments.

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

Vitest covers validation and status calculation, and the Playwright flow creates a link and filters the list by status.
