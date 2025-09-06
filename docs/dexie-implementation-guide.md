# 🚀 Quick Start: Implementing Dexie.js for Better Local Storage

## Why Dexie.js?

- **Capacity**: 100MB+ vs 5-10MB localStorage limit
- **Performance**: Indexed queries vs linear search
- **Relationships**: Proper foreign keys and joins
- **Future-proof**: Easy migration path to cloud databases

## Installation Commands

```bash
# Install Dexie.js
npm install dexie

# Install types for better TypeScript support
npm install @types/dexie --save-dev
```

## Implementation Steps

### 1. Create Database Schema

Create `src/services/database.ts`:

```typescript
import Dexie, { Table } from "dexie";
import { Tournament, Team, Player, Match, Goal } from "../App";

export class DomaFocDatabase extends Dexie {
  tournaments!: Table<Tournament>;
  teams!: Table<Team & { tournamentId: string }>;
  players!: Table<Player & { teamId: string }>;
  matches!: Table<Match & { tournamentId: string }>;
  goals!: Table<Goal & { matchId: string }>;

  constructor() {
    super("DomaFocDatabase");

    // Define schemas
    this.version(1).stores({
      tournaments: "id, name, date, status, rounds, teamSize",
      teams: "id, tournamentId, name",
      players: "id, teamId, name, hat, goals",
      matches: "id, tournamentId, team1.id, team2.id, status, round",
      goals: "id, matchId, playerId, teamId, minute",
    });
  }
}

export const db = new DomaFocDatabase();
```

### 2. Create Data Service

Create `src/services/dataService.ts`:

```typescript
import { db } from "./database";
import { Tournament } from "../App";

export class DexieDataService {
  async getAllTournaments(): Promise<Tournament[]> {
    const tournaments = await db.tournaments.toArray();

    // Populate related data
    for (const tournament of tournaments) {
      tournament.teams = await db.teams
        .where("tournamentId")
        .equals(tournament.id)
        .toArray();

      for (const team of tournament.teams) {
        team.players = await db.players
          .where("teamId")
          .equals(team.id)
          .toArray();
      }

      tournament.fixtures = await db.matches
        .where("tournamentId")
        .equals(tournament.id)
        .toArray();

      for (const match of tournament.fixtures) {
        match.goals = await db.goals
          .where("matchId")
          .equals(match.id)
          .toArray();
      }
    }

    return tournaments;
  }

  async saveTournament(tournament: Tournament): Promise<void> {
    await db.transaction(
      "rw",
      [db.tournaments, db.teams, db.players, db.matches, db.goals],
      async () => {
        // Save tournament
        await db.tournaments.put(tournament);

        // Save teams
        for (const team of tournament.teams) {
          await db.teams.put({ ...team, tournamentId: tournament.id });

          // Save players
          for (const player of team.players) {
            await db.players.put({ ...player, teamId: team.id });
          }
        }

        // Save matches
        for (const match of tournament.fixtures) {
          await db.matches.put({ ...match, tournamentId: tournament.id });

          // Save goals
          for (const goal of match.goals) {
            await db.goals.put({ ...goal, matchId: match.id });
          }
        }
      }
    );
  }

  async deleteTournament(tournamentId: string): Promise<void> {
    await db.transaction(
      "rw",
      [db.tournaments, db.teams, db.players, db.matches, db.goals],
      async () => {
        // Delete in reverse order of dependencies
        const matches = await db.matches
          .where("tournamentId")
          .equals(tournamentId)
          .toArray();
        for (const match of matches) {
          await db.goals.where("matchId").equals(match.id).delete();
        }
        await db.matches.where("tournamentId").equals(tournamentId).delete();

        const teams = await db.teams
          .where("tournamentId")
          .equals(tournamentId)
          .toArray();
        for (const team of teams) {
          await db.players.where("teamId").equals(team.id).delete();
        }
        await db.teams.where("tournamentId").equals(tournamentId).delete();

        await db.tournaments.delete(tournamentId);
      }
    );
  }
}
```

### 3. Migration Hook

Create `src/hooks/useDexieStorage.ts`:

```typescript
import { useState, useEffect } from "react";
import { DexieDataService } from "../services/dataService";
import { Tournament } from "../App";

const dataService = new DexieDataService();

export function useDexieStorage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const data = await dataService.getAllTournaments();
      setTournaments(data);
    } catch (error) {
      console.error("Failed to load tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveTournament = async (tournament: Tournament) => {
    try {
      await dataService.saveTournament(tournament);
      await loadTournaments(); // Refresh data
    } catch (error) {
      console.error("Failed to save tournament:", error);
    }
  };

  const deleteTournament = async (tournamentId: string) => {
    try {
      await dataService.deleteTournament(tournamentId);
      await loadTournaments(); // Refresh data
    } catch (error) {
      console.error("Failed to delete tournament:", error);
    }
  };

  return {
    tournaments,
    loading,
    saveTournament,
    deleteTournament,
    refresh: loadTournaments,
  };
}
```

### 4. Migration Utility

Create `src/utils/migrateFromLocalStorage.ts`:

```typescript
import { DexieDataService } from "../services/dataService";
import { Tournament } from "../App";

export async function migrateFromLocalStorage(): Promise<boolean> {
  try {
    // Check if localStorage has data
    const localData = localStorage.getItem("tournaments");
    if (!localData) return false;

    const tournaments: Tournament[] = JSON.parse(localData);
    if (tournaments.length === 0) return false;

    // Check if Dexie already has data
    const dataService = new DexieDataService();
    const existingTournaments = await dataService.getAllTournaments();
    if (existingTournaments.length > 0) return false; // Already migrated

    // Migrate data
    for (const tournament of tournaments) {
      await dataService.saveTournament(tournament);
    }

    console.log(
      `Successfully migrated ${tournaments.length} tournaments from localStorage`
    );

    // Optionally backup localStorage data before clearing
    localStorage.setItem("tournaments_backup", localData);
    localStorage.removeItem("tournaments");

    return true;
  } catch (error) {
    console.error("Migration failed:", error);
    return false;
  }
}
```

### 5. Update App.tsx

Replace current storage with Dexie:

```typescript
// Replace useKVFallback with useDexieStorage
import { useDexieStorage } from "@/hooks/useDexieStorage";
import { migrateFromLocalStorage } from "@/utils/migrateFromLocalStorage";

function App() {
  const { tournaments, loading, saveTournament, deleteTournament } =
    useDexieStorage();

  useEffect(() => {
    // Auto-migrate on first load
    migrateFromLocalStorage();
  }, []);

  if (loading) {
    return <div className="p-8">Loading tournaments...</div>;
  }

  // Rest of component...
}
```

## Benefits After Implementation

1. **Storage Capacity**: 100MB+ vs 5-10MB localStorage
2. **Performance**: Indexed queries for large datasets
3. **Relationships**: Proper foreign keys and joins
4. **Future-ready**: Easy path to cloud migration
5. **Reliability**: ACID transactions and data integrity

## Next Phase: Cloud Migration

Once Dexie.js is implemented, the path to cloud migration becomes straightforward:

1. **Firestore**: Copy the same data structure to cloud
2. **Sync**: Implement bidirectional sync between local and cloud
3. **Offline**: Dexie provides offline support while cloud syncs
4. **Backup**: Regular cloud backups with local fallback

This gives you the best of both worlds: fast local performance with cloud persistence and sharing capabilities.
