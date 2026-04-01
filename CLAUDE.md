# Flowness

Structured engineering workflow plugin for Claude Code.

## Structure

```
agents/        # Subagent definitions
skills/        # User-invocable skills (slash commands)
templates/     # Rule/harness templates
benchmark/     # End-to-end test projects
.claude-plugin/
  plugin.json      # Plugin manifest (agents + skills)
  marketplace.json # Marketplace listing metadata
```

## Plugin Manifest (`plugin.json`)

`plugin.json` declares which agent files and skill directories are included in the plugin. It must stay in sync with the actual files in `agents/`.

### When to update `plugin.json`

| Change | Required update |
|--------|----------------|
| Add a new agent file | Add entry to `agents` array |
| Remove or rename an agent | Remove/update the entry |
| Add a new skills directory | Add entry to `skills` array |

**If `plugin.json` references a file that doesn't exist, the plugin will fail to load with a path error.**

### Version bumping

Version format: `0.1.x` — bump the patch number only.

```bash
# Check current version
cat .claude-plugin/plugin.json | grep version

# Example: 0.1.0 → 0.1.1
```

Bump the version in `plugin.json` whenever agents or skills are added, removed, or significantly changed.

## Templates

`templates/rules/` contains the single source of truth for rule format:
- `RULES-GUIDE.md` — conventions and key principles
- `RULE.md.template` — base template for new rule folders
- `rule-detail.md.template` — base template for individual rule files

Do NOT copy these into `harness/rules/` — agents read them directly from `templates/`.
