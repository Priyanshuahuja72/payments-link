section 3 Prompt:
Implement the Payment Links Manager according to the assessment brief.

First inspect the current project and identify what is already configured.

Use the required stack:
- Vite
- React
- TypeScript
- Vitest
- React Testing Library
- Playwright

Prioritize the following:
1. Payment link creation form with all specified validation.
2. Payment links list with required information.
3. Correct status calculation, including expired links.
4. Status filtering.
5. Empty, error and validation states.
6. Keyboard accessibility and responsive mobile layout.

Keep the implementation simple and maintainable.

Use reusable components where appropriate. Keep validation and status logic testable.

Add at least:
- 2 meaningful unit tests for validation/status logic.
- 1 Playwright E2E test covering creation of a payment link followed by filtering.

Do not use a backend.

After implementation:
- Install dependencies.
- Run the application.
- Run unit tests.
- Run the E2E test.
- Fix any failures.
- Tell me exactly which files were changed and any remaining limitations.

Do not claim tests passed unless you actually ran them.


Section 4 prompt
A new requirement has been revealed: Partial Payments.

Inspect the existing Payment Links Manager and adapt the current implementation. Do not create a new project or rewrite working functionality unnecessarily.

Implement these requirements:

1. In the create payment link form, add an "Allow partial payments" checkbox.
2. When checked, show a "Minimum first payment" field.
   - Required when partial payments are enabled.
   - Must be greater than 0.
   - Must be less than or equal to the total payment amount.
3. Track the amount paid for each payment link.
4. Add a "Record payment" action for Active and Partially paid links.
   - Payment must be greater than 0.
   - Payment must not exceed the amount due.
5. Calculate status correctly:
   - Active: nothing paid.
   - Partially paid: some amount paid, but not fully paid.
   - Paid: fully paid.
   - Expired: expiry has passed and the link is not Paid.
   - Paid links must never expire.
6. Display amount paid and amount due in the list.
7. Add "Partially paid" to the status filter.
8. Persist payment links and recorded payments across page reloads.

Preserve all existing requirements and functionality.

First explain the implementation plan and identify affected files. Then implement the changes.

Add or update tests for:
- Minimum first payment validation.
- Recording a partial payment.
- Recording the final payment and changing status to Paid.
- Expiry taking precedence over Active and Partially paid.
- Paid links never expiring.
- Persistence after page reload.

Run the available build, unit tests and E2E tests. Fix failures and report the actual results. Do not claim a test passed unless it was run successfully.

section 4 requirement changes
New requirement: partial payments for payment links. Adapt the existing code and agent setup in this repo. Do not start a new repo.

Requirements:
1. Link creation: merchant can tick "Allow partial payments" and set a "Minimum first payment". If ticked, the minimum is required and must satisfy 0 < min <= amount. Validate on both frontend and backend.
2. Each link tracks amountPaid. Add a "Record payment" action, available only on Active / Partially paid links. Accepted payment must satisfy amount > 0 and <= amount due (amount - amountPaid). Enforce the min-first-payment rule on the first payment only.
3. Status is derived: Active (nothing paid), Partially paid, Paid (fully paid). Precedence: Paid > Expired > Partially paid / Active. Expired wins over Active/Partially paid once expiry passes, but Paid links never expire.
4. The list shows paid / due for each link, and the status filter gains a "Partially paid" option.
5. Links must survive a page reload (persist the new fields: allowPartial, minFirstPayment, amountPaid).

Money handling: avoid floating-point errors (e.g. 0.1 + 0.2). Store and compute amounts in integer minor units (paise/cents) or round to 2 decimals, and compare with that same method.

Tests: add or update tests for:
- Status precedence: Paid vs Expired vs Partially paid (including Paid link past expiry stays Paid; Partially paid past expiry becomes Expired)
- Payment > amount due rejected
- Payment <= 0 rejected
- Min first payment > amount rejected, min <= 0 rejected, min required when partial is ticked
- Floating-point totals like 0.1 + 0.2 reach exactly the due amount and mark Paid
- Persistence after reload

Run all tests, make sure they pass, then commit and give me the commit hash and a list of the tests you added or changed.


Section 5 prompt (supersedes the earlier no-backend constraint):
Implement partial payments in the existing Payment Links Manager; do not create a new repository.

- Keep link creation fields and validation, adding Allow partial payments and a required Minimum first payment when enabled. Enforce 0 < minimum <= total on both the frontend and the Node validation API.
- Store money as integer minor units. Persist `allowPartial`, `minFirstPayment`, `amountPaid`, and payment records across reloads while migrating existing browser records.
- Record payments only for Active and Partially paid links. Enforce payment > 0, payment <= amount due, and the minimum first payment on the first payment only.
- Derive status with precedence Paid > Expired > Partially paid / Active. Paid links never expire.
- Show paid and due amounts and add the Partially paid filter.
- Run build, unit, server validation, and Playwright E2E checks. Commit the finished change and report the commit hash and tests changed or added.

The Node API is a validation boundary for this demo only. It does not process payments or persist authoritative financial records; payment-link state remains browser-local.