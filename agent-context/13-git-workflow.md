# Git Workflow


The original PRD requests `master`, `pre-release`, `release/v1.0.0`, and
`feature/*` branches. The repository currently uses `main` as its primary
branch. The `master` requirement remains a submission workflow difference to
resolve; changing this document does not satisfy it.

Feature development uses `feature/<name>` branches. Keep commits small and
logical. Use `<type>(<scope>): <short description>`, for example
`fix(pool): prevent overbooking`.
