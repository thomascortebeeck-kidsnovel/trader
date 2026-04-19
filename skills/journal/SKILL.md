# Skill: journal

**Purpose.** Persist what just happened so the next routine wakes up informed.

## When to invoke

At the end of every routine, before commit + push. Non-negotiable.

## What to write

Append a dated block to `memory/reasoning.md`:

```
## YYYY-MM-DD HH:MM <bot> <routine-name>

**Saw:** one paragraph on market state / news / signals observed.
**Did:** bulleted list of actions taken (or "no action — reason").
**Why:** one paragraph on the reasoning, including any dissenting evidence.
**Watch:** what the next routine should look at first.
```

If trades were placed, **also** append a row to `memory/trade-log.md`:

```
| timestamp | symbol | side | qty | price | order_id | thesis |
```

## Rules

- Write before you commit. The commit message references this entry.
- Don't rewrite history — only append.
- If an entry would be empty ("nothing happened"), still write it. The absence of action is itself a data point.
