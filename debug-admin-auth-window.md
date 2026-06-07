[OPEN] Debug Session: admin-auth-window

## Symptom
- Authentication window does not load on `/admin.html` and production `/admin`.

## Scope
- Local development and Vercel production
- Clerk embedded authentication on admin page

## Initial Hypotheses
1. Clerk SDK loads, but embedded SignIn fails to mount due to routing or SDK mode mismatch.
2. Vercel route handling for `/admin` vs `/admin.html` changes the effective redirect or page boot path.
3. Clerk project configuration rejects the production origin or redirect settings.
4. A runtime exception before or during auth bootstrap prevents rendering of the login widget.
5. CSS/layout leaves the container visible but the Clerk component fails silently or renders outside the intended area.

## Plan
1. Reproduce locally.
2. Inspect deployment/runtime configuration.
3. Add instrumentation only.
4. Capture runtime evidence.
5. Confirm root cause.
6. Implement minimal fix.
7. Verify locally and on Vercel.

## Evidence
- Pre-fix runtime logs showed `Clerk.load()` succeeded but `mountSignIn()` threw `Clerk was not loaded with Ui components`.
- Vercel `cleanUrls` rewrites `/admin.html` to `/admin`, but the page still booted and executed scripts, so routing was not the primary cause.
- Post-fix runtime logs showed:
  - Clerk frontend domain derived successfully.
  - Clerk UI bundle loaded successfully.
  - `Clerk.load()` succeeded with UI ctor attached.
  - Delayed DOM inspection confirmed the sign-in container rendered with child content and non-zero size.

## Confirmed Root Cause
- The admin page loaded the Clerk JS SDK, but not the separate Clerk UI bundle required for `mountSignIn()` in a plain HTML / client-side integration.
- Because of that, authentication initialization completed, but the embedded sign-in component could not render.

## Fix Implemented
- Added the documented UI bundle loading step from the Clerk frontend domain derived from the publishable key.
- Passed the loaded UI constructor into `Clerk.load(...)`.
- Kept embedded/virtual routing so the auth flow stays inside the admin page.
- Retained instrumentation for verification until user confirms success.
