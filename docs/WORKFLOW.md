# Development workflow

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production. Never commit directly. |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `chore/*` | Maintenance (deps, config) |

## Day-to-day flow

```
git checkout -b feature/my-thing
# work, commit often with clear messages
git commit -m "feat: add experiment board filter by status"
# when ready for review:
firebase hosting:channel:deploy preview-my-thing
# smoke test, then:
git push origin feature/my-thing
# merge to main via PR or direct if solo
```

## Pre-deploy checklist

Before merging to main, verify:

- [ ] Tested on preview URL (not just localhost)
- [ ] Tested on mobile (resize or real device)
- [ ] No console errors in browser devtools
- [ ] Environment variables set in production (Firebase console / host dashboard)
- [ ] Firebase security rules unchanged or intentionally updated
- [ ] Entry added to `docs/changelogs/CHANGELOG.md`
- [ ] If a breaking change: rollback plan noted in changelog

## Commit message format

```
type: short description (max 72 chars)

Optional body: why this change, not what (the diff shows what).
```

Types: `feat` `fix` `chore` `docs` `refactor` `style` `test`

## Rollback

If production breaks:
1. Find the last good commit: `git log --oneline`
2. `git revert HEAD` (preferred — keeps history) or
3. `git checkout <good-commit> -- src/` + push if revert is too complex
