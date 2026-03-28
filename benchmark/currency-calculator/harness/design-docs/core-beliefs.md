# Core Beliefs

## Adaptive Complexity
Every harness component encodes an assumption about what the model can't do on its own.
These assumptions must be periodically stress-tested.
When a model improves, re-evaluate the harness — remove structures that are no longer load-bearing.
Find the simplest possible solution, and only increase complexity when needed.

## Agent Readability
Optimize the codebase for agent readability first.
What an agent can't see doesn't exist.
Prefer dependencies and abstractions that can be fully internalized and reasoned about within the repository.

## Mechanical Enforcement
Enforce invariants mechanically (linters, structural tests), not just through documentation.
Lint error messages should include fix instructions — the agent reading them must know exactly how to resolve the issue.

## Incremental Quality
Technical debt is a high-interest loan — pay it off incrementally rather than letting it accumulate.
Once a human taste preference is captured, apply it consistently across all code.
