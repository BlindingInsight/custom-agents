# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**custom-agents.ai** is Summit AI Group LLC's consulting services website. It's a static GitHub Pages site (plain HTML/CSS, no build step) that serves as the brand presence for Custom AI Agents — an enterprise AI consulting practice focused on building custom GenAI platforms, agentic workflows, and internal copilots.

When AI-for-metadata launches as a service (ADR-001: service-first model via subbu-ideas#25), this site becomes the primary sales channel.

## Coordinator Scope

This is a **website maintenance** coordinator — not a software product coordinator.

### Coordinator does
- Content updates: service offerings, case studies, pricing, testimonials
- Fix typos and broken HTML
- Add new pages when business needs change (e.g., dedicated PE page, AI-for-metadata service page)
- Update messaging when consulting engagements produce reference customers
- Coordinate with ideas coordinator (subbu-ideas) on cross-repo strategy changes

### Coordinator does NOT do
- Write application code (this is a static site, not a product)
- Run tests or builds (there are none)
- Deploy directly (PR to main triggers GitHub Pages auto-deployment)

## Strategic Context

Summit AI Group positions itself as a "product-led AI services company" — not traditional consulting. The consulting model uses 1 principal + AI agent teams to deliver enterprise-grade platforms in weeks instead of months. Key verticals: manufacturing, private equity / rollup funds, oil & gas EPC.

**Key dependencies:**
- **AI-for-metadata (subbu-ideas#25)** — first productized service offering; when it launches, this site needs a dedicated service/sales page
- **Manufacturing Twin (MT)** — reference implementation and case study source for the site
- **summitaigroup.com** — corporate site (separate entity, not this repo)

**Strategy docs (in subbu-ideas on dev/coordinator branch):**
- `strategy/custom-agents-next-gen-consulting.md` — full business strategy, pricing, GTM, competitive positioning
- `strategy/ai-for-metadata-two-tracks.md` — the service to be sold through this site

## Architecture

This is a **static site** — no framework, no build tool, no JavaScript dependencies.

- **Hosting:** GitHub Pages with custom domain (`custom-agents.ai` via CNAME)
- **Styling:** Single `style.css` with Google Fonts (Playfair Display + Inter), dark mode via `prefers-color-scheme`, responsive breakpoints at 768px
- **Navigation:** Shared `navbar.html` loaded via `fetch()` into each page's `<div id="navbar">`
- **Contact form:** Formspree (`formspree.io/f/mvgbolpa`) with redirect to `thanks.html`
- **Brand colors:** Gold accent `#d4af37`, light background `#f8f8f6`, dark text `#1a1a1a`

### Pages

| File | Nav label | Purpose |
|------|-----------|---------|
| `index.html` | Home | Hero + value props + tagline ("Always Day One") |
| `platform.html` | Why | Platform philosophy, $2-to-$10 strategy |
| `what-we-build.html` | What | Service offerings (agents, platforms, RAG, PoC) |
| `clients.html` | You | Ideal client profile, anti-patterns |
| `poc.html` | How | Zero-risk PoC engagement model |
| `contact.html` | Us | Contact form + founder bio + expertise list |
| `thanks.html` | — | Post-submission confirmation |
| `navbar.html` | — | Shared nav component (not a full HTML page) |

## Development

No build step required. To preview locally:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

Then visit `http://localhost:8000`. The navbar `fetch()` requires serving via HTTP (won't work as `file://`).

## Deployment

Push to `main` branch. GitHub Pages auto-deploys. Custom domain configured via `CNAME` file.

## Known Issues

None — all previously tracked issues (typos, broken HTML, copyright years, missing quotes) were fixed on 2026-02-21.

## Pending Content Work

From the strategy doc's immediate actions list:
- Add dedicated "AI for Private Equity" section/page
- Write MT case study: "From paper to prediction in 90 days" (when MT demo is ready)
- Align messaging with summitaigroup.com when that site is polished

## Key Policies

### Commits
Format: `type(scope): description`

Types: `feat`, `fix`, `docs`, `chore`, `style`

Always include: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

### Branches
Format: `feature/<issue-number>-<description>`

### Multi-Agent Worktrees
Switch to standby branch (`dev/<agent-name>`) after PR merge. Do NOT use `--delete-branch` with `gh pr merge` in worktrees.

## Cross-Repo Coordination

- **Ideas coordinator (subbu-ideas)** — central hub for all cross-repo strategy. Route cross-project questions there.
- **Handoff format:** Write `<target>-coordinator-handoff-<topic>.md` files in the worktree.
- **Portfolio tracking:** Summit AI Group is tracked under subbu-ideas#17.
