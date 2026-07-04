# Frontend UI Plan: DB Tables Visibility (AG-UI Mandatory)

## Core Constraint (Must Keep)
This feature must remain inside the AG-UI architecture.
- No standalone hardcoded React-only flow for table discovery
- UI for DB tables must be generated from backend AG-UI schema
- Frontend should only render AG-UI config via `DynamicRenderer`

## Goal
Help HR users see available DB tables and columns so they know what to ask, while preserving dynamic AG-UI generation.

## Current Architecture Rule
`User intent -> Agent/Backend -> AG-UI JSON -> DynamicRenderer -> Interactive UI`

This rule remains unchanged.

## Proposed AG-UI Design

### 1) New AG-UI component type
Add a new AG-UI type: `data_explorer`

Example:
```json
{
  "type": "data_explorer",
  "title": "Available Data Tables",
  "tables": [
    {
      "name": "candidates",
      "label": "Candidates",
      "description": "Candidate profiles and hiring status",
      "columns": [
        {"name": "id", "type": "integer", "pk": true},
        {"name": "name", "type": "string"},
        {"name": "role", "type": "string"},
        {"name": "status", "type": "string"}
      ],
      "example_prompts": [
        "Show applied candidates",
        "List frontend candidates in screening"
      ]
    }
  ],
  "actions": [
    {"label": "Use Table", "event": "use_table_context"},
    {"label": "Ask About Table", "event": "ask_about_table"}
  ]
}
```

### 2) Renderer support
`DynamicRenderer` should route `data_explorer` -> `DynamicDataExplorer` component.

### 3) Event loop stays AG-UI-driven
When HR clicks explorer actions:
- emit AG-UI events (`use_table_context`, `ask_about_table`)
- frontend sends event payload through existing action pipeline
- backend/agent returns next AG-UI state (table view/form/card/etc.)

## Backend Changes (Required)

### Endpoint/agent output
Backend must provide table metadata in AG-UI output, either:
1. via existing `/api/ui-schema/...` flow, or
2. via agent-generated `last_ui` response

### Suggested metadata source
Use SQLAlchemy models (single source of truth):
- candidates
- employees
- interviews
- offer_letters
- conversation_memory
- agent_state

## Frontend Components (AG-UI-Compatible)
- `DynamicDataExplorer.tsx` (new)
- `DynamicRenderer.tsx` update (new switch case)
- reuse existing `onAction(event, payload)` contract

## UX (Within AG-UI)

### Data Explorer card/panel
- Search tables
- Table cards with label + description
- "View Schema" interaction
- "Ask AI about this" interaction

### Schema section
- Column name + type
- PK/FK badges
- Example prompt shortcuts

### Chat assist
- Inject selected table context into event payload
- Optionally show context chips in UI if AG-UI provides them

## Non-Goals
- No direct SQL editor in frontend
- No bypass of AG-UI pipeline
- No static-only table list disconnected from backend metadata

## Implementation Phases

### Phase 1 (Mandatory)
- Add `data_explorer` AG-UI type
- Render table list + schema + example prompts
- Emit AG-UI events and keep current event pipeline

### Phase 2
- Add row counts + relationship hints
- Better context chips in chat area

### Phase 3
- Add role-specific prompt templates
- Save frequent prompts

## Acceptance Criteria
- [ ] Data tables are visible through AG-UI-generated UI
- [ ] Explorer interactions emit AG-UI events (no hardcoded shortcut path)
- [ ] Selected table context flows to backend/agent correctly
- [ ] Existing CRUD AG-UI behavior continues to work
- [ ] Works on desktop and mobile layouts

## Verification Checklist
- [ ] Backend returns valid `data_explorer` schema
- [ ] Renderer supports `data_explorer`
- [ ] Event payload includes selected table + optional columns
- [ ] Agent can respond with next AG-UI component after explorer action

