# Cartographer

This repo includes a small Cartographer CLI and workflow.

Usage (locally)
- Install Node.js (>=14)
- From repo root:
  - npm run cartographer -- map            # generate docs/project-map.html
  - npm run cartographer -- summary        # generate docs/project-summary.{json,md}
  - npm run cartographer -- analyze        # both map + summary
  - add --commit to auto-commit outputs (ensure git is configured)

Usage (GitHub Actions)
- Open the Actions tab, select "Cartographer" and Run workflow.
- Inputs:
  - `task`: `map`, `summary`, or `analyze`
  - `depth`: directory depth limit
  - `commit`: `true` to commit outputs back to the branch
