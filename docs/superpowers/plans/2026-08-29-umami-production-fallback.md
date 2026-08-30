# TodoPlástico Umami production fallback plan

**Goal:** Ensure TodoPlástico always emits its Agama Umami tracker after a Coolify build, even when the two public build variables are missing.

**Root cause:** Production CSP already allows the Agama host and the layout mounts the analytics component, but the deployed HTML contains neither the tracker URL nor the public website ID. The component returned `null` because `NEXT_PUBLIC_*` values were absent at build time.

**Architecture:** Keep `next/script`, centralize the non-secret Agama URL and TodoPlástico website ID in a validated public resolver, and reuse it in the tracker and server statistics clients. Environment overrides remain accepted only for the same Agama host and a valid UUID.

## Completed tasks

- [x] Add failing tests for missing build variables and accidental personal-VPS configuration.
- [x] Add the public Umami resolver with safe Agama defaults.
- [x] Reuse the resolver in the tracker and both statistics clients.
- [x] Restrict tracker collection to the canonical TodoPlástico domains.
- [x] Update the changelog.
- [x] Verify unit tests, typecheck, lint, production build, and emitted tracker configuration.

## Deployment follow-up

- Merge and let Coolify rebuild `main`.
- Confirm the production HTML contains the Agama script and website ID, then record one controlled pageview.
