Assistant Trello integration instructions

Purpose
- Monitor the Trello board (Ball_Bounce) for newly added cards and create implementation plans in the repository.

How the assistant should operate
1. Read .copilot/trello-config.yml to get board_id and plans_dir.
2. Use trello-list_boards to validate the board if board_id is missing.
3. For each list on the board, use trello-get_cards_by_list_id with the listId to fetch cards.
4. For each card, if a file does not already exist at {plans_dir}/{card.shortLink}-{card.id}.md, create that file using the template in trello-config.yml -> plan_template. Populate:
   - Title: card.name
   - Description: card.desc
   - Acceptance criteria: card.checklists and labels (if present)
   - Implementation steps: a concise plan
   - Todos: insert as rows into the session 'todos' table using the SQL tool (id: card.shortLink-<index>) if available; otherwise include as a checklist in the file.
5. Commit and push new plan files if commit_changes is true in config.

Safety and idempotence
- Treat existence of the plan file as the sync marker. Do not overwrite existing plans unless card.updated > file.mtime and a --force flag is explicitly provided.

Example run (assistant):
- trello-list_boards -> find board
- trello-get_cards_by_list_id(listId=...) -> iterate cards
- create file docs/trello-plans/{shortLink}-{id}.md
- git add/commit/push

Permissions
- Trello tools must be authorized for the assistant session. Ensure API token is configured in the environment where the assistant runs.
