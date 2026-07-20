# CRITICAL RULES - MUST FOLLOW

## RESPONSES

- Keep responses concise and to the point - unless the user asks otherwise

## PLANNING MODE

- Always ask clarifying questions
- Never assume design, tech stack or features
- Use deep-dive sub-agents to assist with research
- Use deep-dive sub-agents to review the different aspects of your plan before presenting to the user

## CHANGE / EDIT MODE

- Never implement features yourself when possible - use sub-agents!
- Identify changes from the plan that can be implemented in parallel, and use sub-agents to implement the features efficiently
- When using sub-agents to implement features, act as a coordinator only
- Use the best model for the task - premium models for complex tasks (like coding) and mid-tier models for simpler tasks, like documentation
- After completing features (large or small), always run commands like lint, type check and next build to check code quality
- **All changes must be committed to git at the end of the session.** Before committing, review `git status`, `git diff`, and `git log --oneline -5`. Stage only intended files and write a concise commit message matching repo style.
- **Full-stack requirement: all features must be implemented end-to-end across the entire stack.** Backend API changes (routes, models, schemas, middleware) and frontend UI changes (pages, components, forms, API integration) must always be done together. A feature is not complete until both backend and frontend are updated and working. Never implement backend-only or frontend-only — always update both sides of the stack in the same session.

## TESTING

- Use any testing tools, libraries available to the project for testing your changes
- Never assume your changes simply work, always test!
- If the project does not have any testing tools, scripts, MCP tools, skills, etc. available for testing, ask the user whether testing should be skipped.

## UI DESIGN

- Always follow the UI design system when creating or reviewing components or pages.
- Design System: @DESIGN.md

## Documentation

- Always use Context7 when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.
- If changes are made to the project configuration or deployment then properly document them in @README.md
