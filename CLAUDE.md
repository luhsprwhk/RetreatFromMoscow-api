# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the API backend for "Retreat from Moscow", a historical survival game set during Napoleon's 1812 retreat from Russia. Players control Captain Armand, making grim survival choices while managing resources and morale.

## Development Commands

```bash
# Development
npm run dev           # Start development server with hot reload
npm run build         # Compile TypeScript to JavaScript
npm start            # Run production server from dist/

# Code Quality
npm run lint         # Lint TypeScript files
npm run lint:fix     # Lint and auto-fix issues
npm run format       # Format code with Prettier
npm run type-check   # Type check without compilation
```

## Architecture

### Core Components

- **Express API Server** (`src/main.ts`): RESTful API with PostgreSQL integration
- **Database**: PostgreSQL with tables for players, game_state, and events_log
- **GPT Integration**: OpenAPI spec and system prompt for AI game master

### API Endpoints

- `POST /start-game`: Initialize new game session with player_id and initial state
- `GET /state/:playerId`: Retrieve current game state
- `POST /update-state`: Update player's game state with partial updates
- `POST /log-event`: Log game events for history/analytics

### Game State Management

GameState interface tracks: day, location, honor, morale, rations, firewood, special_items, men_alive, joubert_status, weather. All state changes should preserve game integrity and historical context.

### Database Connection

Uses PostgreSQL connection string from `DATABASE_URL` environment variable, falls back to local development database. Special items stored as JSON strings in database.

## Key Technical Details

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ES Modules**: Project uses `"type": "module"` configuration
- **Database**: PostgreSQL with pg driver, manual SQL queries (no ORM)
- **Error Handling**: 500 status codes for server errors, 404 for missing resources
- **JSON Parsing**: Special items field requires JSON.stringify/parse for database storage

## GPT System Integration

The `src/gpt/` directory contains:
- `system-prompt.md`: Game master personality and behavior guidelines
- `openapi.yaml`: API specification for GPT tool integration
- `tool-definitions.json`: Tool definitions for AI game master

Game master should maintain sparse, grave, lyrical tone while tracking all game stats inline after each turn.