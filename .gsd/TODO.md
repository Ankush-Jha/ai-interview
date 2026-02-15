# TODO.md — Quick Capture

> Items to address later. Not blocking current work.

- [ ] Clean up `.next/` directory (leftover from old Next.js setup)
- [ ] Remove duplicate `@huggingface/inference` from frontend package.json (only needed on server)
- [ ] Reconcile `src/utils/prompts.js` with `server/lib/prompts.js` (potential overlap)
- [ ] Add server-side tests (jest configured but no test files)
- [ ] Set up CI/CD pipeline
- [ ] Upgrade rate limiter from in-memory to Redis for production
- [ ] Add proper error tracking (Sentry or similar free tier)
