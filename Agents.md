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