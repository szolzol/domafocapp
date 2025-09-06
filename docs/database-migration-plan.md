# 🗄️ Database Migration Strategy: Free Local to Cloud Solutions

## Current State: localStorage Fallback
- **Storage**: Browser localStorage (5-10MB limit)
- **Format**: JSON serialization
- **Persistence**: Local browser only
- **Backup**: Manual export/import

## Phase 1: Local File-Based SQL (SQLite)
### Implementation Plan

#### Option A: SQL.js (Browser-based SQLite)
```bash
npm install sql.js
npm install @types/sql.js --save-dev
```

**Benefits:**
- ✅ Pure client-side, no server required
- ✅ Full SQL capabilities with relationships
- ✅ Can export/import .db files
- ✅ 100% free
- ✅ Works offline

**Setup:**
```typescript
// src/services/sqliteService.ts
import initSqlJs from 'sql.js';

export class SQLiteService {
  private db: any;
  
  async initialize() {
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
    
    // Try to load existing database from localStorage
    const savedDb = localStorage.getItem('domafoc_database');
    if (savedDb) {
      const dbArray = new Uint8Array(JSON.parse(savedDb));
      this.db = new SQL.Database(dbArray);
    } else {
      this.db = new SQL.Database();
      this.createTables();
    }
  }
  
  private createTables() {
    this.db.exec(`
      CREATE TABLE tournaments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        rounds INTEGER NOT NULL,
        teamSize INTEGER NOT NULL,
        hasHalfTime BOOLEAN NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE teams (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL,
        name TEXT NOT NULL,
        played INTEGER DEFAULT 0,
        won INTEGER DEFAULT 0,
        drawn INTEGER DEFAULT 0,
        lost INTEGER DEFAULT 0,
        goals_for INTEGER DEFAULT 0,
        goals_against INTEGER DEFAULT 0,
        points INTEGER DEFAULT 0,
        FOREIGN KEY (tournament_id) REFERENCES tournaments (id)
      );
      
      CREATE TABLE players (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        name TEXT NOT NULL,
        alias TEXT NOT NULL,
        hat TEXT NOT NULL,
        goals INTEGER DEFAULT 0,
        FOREIGN KEY (team_id) REFERENCES teams (id)
      );
      
      CREATE TABLE matches (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL,
        team1_id TEXT NOT NULL,
        team2_id TEXT NOT NULL,
        score1 INTEGER DEFAULT 0,
        score2 INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        round INTEGER NOT NULL,
        duration INTEGER DEFAULT 0,
        comments TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tournament_id) REFERENCES tournaments (id),
        FOREIGN KEY (team1_id) REFERENCES teams (id),
        FOREIGN KEY (team2_id) REFERENCES teams (id)
      );
      
      CREATE TABLE goals (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        team_id TEXT NOT NULL,
        minute INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (match_id) REFERENCES matches (id),
        FOREIGN KEY (player_id) REFERENCES players (id),
        FOREIGN KEY (team_id) REFERENCES teams (id)
      );
    `);
  }
  
  saveToLocalStorage() {
    const data = this.db.export();
    localStorage.setItem('domafoc_database', JSON.stringify(Array.from(data)));
  }
}
```

#### Option B: Dexie.js (IndexedDB Wrapper)
```bash
npm install dexie
```

**Benefits:**
- ✅ Larger storage capacity (hundreds of MB)
- ✅ Better performance than localStorage
- ✅ Automatic indexing and queries
- ✅ TypeScript support built-in

**Setup:**
```typescript
// src/services/dexieService.ts
import Dexie, { Table } from 'dexie';

export interface Tournament {
  id: string;
  name: string;
  date: string;
  status: 'setup' | 'active' | 'completed';
  rounds: number;
  teamSize: number;
  hasHalfTime: boolean;
}

export interface Team {
  id: string;
  tournamentId: string;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export class DomaFocDatabase extends Dexie {
  tournaments!: Table<Tournament>;
  teams!: Table<Team>;
  players!: Table<Player>;
  matches!: Table<Match>;
  goals!: Table<Goal>;

  constructor() {
    super('DomaFocDatabase');
    this.version(1).stores({
      tournaments: 'id, name, date, status',
      teams: 'id, tournamentId, name',
      players: 'id, teamId, name, hat',
      matches: 'id, tournamentId, team1Id, team2Id, status, round',
      goals: 'id, matchId, playerId, teamId, minute'
    });
  }
}

export const db = new DomaFocDatabase();
```

## Phase 2: Cloud Migration Options

### Option A: Firestore (Google Firebase) - FREE TIER
**Free Limits:**
- 1 GB storage
- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day

**Setup:**
```bash
npm install firebase
```

**Benefits:**
- ✅ Real-time synchronization
- ✅ Offline support with automatic sync
- ✅ Generous free tier
- ✅ Easy authentication
- ✅ Automatic scaling

### Option B: Supabase (PostgreSQL) - FREE TIER
**Free Limits:**
- 500 MB database storage
- 50,000 monthly active users
- 2 GB bandwidth per month

**Setup:**
```bash
npm install @supabase/supabase-js
```

**Benefits:**
- ✅ Full PostgreSQL with SQL queries
- ✅ Real-time subscriptions
- ✅ Built-in authentication
- ✅ Row Level Security
- ✅ Auto-generated APIs

### Option C: PlanetScale (MySQL) - FREE TIER
**Free Limits:**
- 1 database
- 1 GB storage
- 1 billion row reads/month
- 10 million row writes/month

**Benefits:**
- ✅ Serverless MySQL
- ✅ Database branching (like Git)
- ✅ No connection limits
- ✅ Global replicas

## Migration Implementation Strategy

### Step 1: Create Abstraction Layer
```typescript
// src/services/dataService.ts
export interface DataService {
  getTournaments(): Promise<Tournament[]>;
  saveTournament(tournament: Tournament): Promise<void>;
  deleteTournament(id: string): Promise<void>;
  // ... other methods
}

export class LocalStorageService implements DataService {
  // Current localStorage implementation
}

export class SQLiteService implements DataService {
  // Local SQLite implementation
}

export class FirestoreService implements DataService {
  // Cloud Firestore implementation
}
```

### Step 2: Migration Utilities
```typescript
// src/utils/migrationUtils.ts
export class DataMigrator {
  static async migrateFromLocalStorage(newService: DataService) {
    const localData = localStorage.getItem('tournaments');
    if (localData) {
      const tournaments = JSON.parse(localData);
      for (const tournament of tournaments) {
        await newService.saveTournament(tournament);
      }
    }
  }
  
  static async exportData(service: DataService): Promise<string> {
    const tournaments = await service.getTournaments();
    return JSON.stringify(tournaments, null, 2);
  }
  
  static async importData(service: DataService, jsonData: string) {
    const tournaments = JSON.parse(jsonData);
    for (const tournament of tournaments) {
      await service.saveTournament(tournament);
    }
  }
}
```

## Recommended Implementation Timeline

### Week 1: Local SQLite/Dexie
1. Implement Dexie.js for better local storage
2. Create migration utility from localStorage
3. Add export/import functionality

### Week 2: Cloud Preparation
1. Set up Firestore project
2. Implement cloud service interface
3. Add sync/offline capabilities

### Week 3: Cloud Migration
1. Deploy cloud backend
2. Implement real-time sync
3. Add user authentication
4. Test migration process

### Week 4: Production
1. Add backup/restore features
2. Implement conflict resolution
3. Performance optimization
4. Documentation updates

## Cost Analysis (Estimated Monthly)

| Solution | Storage | Bandwidth | Concurrent Users | Monthly Cost |
|----------|---------|-----------|------------------|--------------|
| localStorage | 5-10MB | N/A | 1 (local only) | FREE |
| SQLite/Dexie | 100MB+ | N/A | 1 (local only) | FREE |
| Firestore | 1GB | Included | 50K MAU | FREE |
| Supabase | 500MB | 2GB | 50K MAU | FREE |
| PlanetScale | 1GB | Included | Unlimited | FREE |

## Next Steps

1. **Immediate**: Fix rate limiting with localStorage fallback ✅
2. **Short-term**: Implement Dexie.js for better local storage
3. **Medium-term**: Set up Firestore for cloud sync
4. **Long-term**: Add multi-user features and real-time collaboration

All solutions have generous free tiers that should handle thousands of tournaments before requiring paid plans.
