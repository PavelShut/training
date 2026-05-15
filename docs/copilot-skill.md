# Copilot Skill

This repo includes a small Copilot Skill CLI and workflow.

Usage (locally)
- Install Node.js (>=14)
- From repo root:
  - npm run copilot-skill -- map            # generate docs/project-map.html
  - npm run copilot-skill -- summary        # generate docs/project-summary.{json,md}
  - npm run copilot-skill -- analyze        # both map + summary
  - add --commit to auto-commit outputs (ensure git is configured)

Usage (GitHub Actions)
- Open the Actions tab, select "Copilot Skill" and Run workflow.
- Inputs:
  - `task`: `map`, `summary`, or `analyze`
  - `depth`: directory depth limit
  - `commit`: `true` to commit outputs back to the branch
