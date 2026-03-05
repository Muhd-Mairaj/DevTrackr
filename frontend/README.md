# DevTrackr Frontend

React application for DevTrackr - built with TypeScript, Vite, and TanStack Router.

## Tech Stack

- **Runtime**: Bun
- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: TanStack Router
- **Data Fetching**: TanStack Query (React Query)
- **Formatting & Linting**: Biome
- **API Client**: Generated with Hey API (Axios)

## Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Run the development server:
   ```bash
   bun dev
   ```

## 🛠️ Development Tools

### Code Formatting & Linting

We use **Biome** for high-performance formatting and linting. While you can run individual commands, it is recommended to use the shared script from the project root:

**Project-wide fix:**
```bash
./scripts/format.sh --fix
```

**Manual Frontend-only commands:**
```bash
# Check formatting and linting
bun run check

# Fix formatting and linting
bun run check --fix

# Formatting only
bun run format [--fix]
```

### API Client Synchronization

The frontend uses a generated SDK based on the backend's OpenAPI schema. **Do not modify files in `src/client` manually.**

To sync the client after backend changes:
```bash
./scripts/generate-client.sh
```

## Structure

```
src/
├── client/          # Automatically generated API SDK (DO NOT EDIT)
├── components/      # Reusable UI components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and shared logic
├── routes/          # TanStack Router page definitions
├── App.tsx          # Main application component
└── main.tsx         # Application entry point
```
