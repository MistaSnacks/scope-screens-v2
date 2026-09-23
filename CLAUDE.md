# Scope Screenings

## Branches and deploys

`ALT` is the production branch. The live site (scopescreenings.com) deploys from
`main` of the **v2** remote (`scope-screens-v2`), and local `ALT` tracks `v2/main`.

- Ship: commit on `ALT`, then a bare `git push` (goes to `v2/main`, deploys live).
- Mirror to v1 (optional): `git push origin ALT:ALT`, always with the explicit refspec.
- Never `git push origin ALT` or `git push origin`: `push.default=upstream` maps it to
  v1's `main` (the old single-page site), not `ALT`.
- Local `main` is the old SPA. Don't branch from or merge it into `ALT` unless asked.
