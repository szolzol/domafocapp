# Domafocapp Firestore Import Format Specification

## Overview
This document defines the comprehensive import file format for the Domafocapp football tournament management system. Use this specification to convert unstructured tournament data into a format compatible with Firestore mass import.

## Database Schema Structure

### Firestore Collections
```
tournaments/          # Main tournament documents
teams/               # Team documents with tournamentId reference
players/             # Player documents with teamId reference  
matches/             # Match documents with tournamentId reference
goals/               # Goal documents with matchId and tournamentId references
```

### Data Relationships
```
Tournament (1) → Teams (N) → Players (N)
Tournament (1) → Matches (N) → Goals (N)
Match (1) → Team1, Team2 (references)
Goal (1) → Player, Team, Match (references)
```

## Import File Formats

### Option 1: Single CSV File (Recommended for AI Processing)

**Filename**: `tournament_import.csv`

**Required Columns**:
```csv
tournament_name,tournament_date,tournament_status,rounds,team_size,has_half_time,
team_name,player_name,player_alias,player_hat,
match_id,match_team1,match_team2,match_score1,match_score2,match_status,match_round,match_duration,match_comments,
goal_player_name,goal_team_name,goal_minute
```

**Column Definitions**:

| Column | Type | Required | Values | Description |
|--------|------|----------|--------|-------------|
| `tournament_name` | string | Yes | Any text | Tournament display name |
| `tournament_date` | string | Yes | YYYY-MM-DD | Tournament date in ISO format |
| `tournament_status` | string | No | setup/active/completed | Default: "completed" |
| `rounds` | number | No | 1-10 | Number of rounds, Default: 1 |
| `team_size` | number | No | 2-6 | Players per team (2v2, 3v3, etc.), Default: 2 |
| `has_half_time` | boolean | No | true/false | Whether matches have half-time, Default: false |
| `team_name` | string | Yes | Any text | Team display name |
| `player_name` | string | Yes | Any text | Player full name |
| `player_alias` | string | No | Any text | Player nickname/alias, Default: player_name |
| `player_hat` | string | No | first/second/strong/weak | Player skill level, Default: "second" |
| `match_id` | string | No | Any text | Optional match identifier for grouping |
| `match_team1` | string | No | Team name | First team in match |
| `match_team2` | string | No | Team name | Second team in match |
| `match_score1` | number | No | 0-999 | Goals scored by team1, Default: 0 |
| `match_score2` | number | No | 0-999 | Goals scored by team2, Default: 0 |
| `match_status` | string | No | pending/live/completed | Default: "completed" |
| `match_round` | number | No | 1-10 | Match round number, Default: 1 |
| `match_duration` | number | No | 0-7200 | Match duration in seconds, Default: 0 |
| `match_comments` | string | No | Any text | Additional match notes |
| `goal_player_name` | string | No | Player name | Goal scorer (must match player_name) |
| `goal_team_name` | string | No | Team name | Goal scorer's team (must match team_name) |
| `goal_minute` | number | No | 1-999 | Minute when goal was scored |

**Sample Data**:
```csv
tournament_name,tournament_date,tournament_status,rounds,team_size,has_half_time,team_name,player_name,player_alias,player_hat,match_id,match_team1,match_team2,match_score1,match_score2,match_status,match_round,match_duration,match_comments,goal_player_name,goal_team_name,goal_minute
Summer Cup 2024,2024-08-15,completed,2,3,true,Red Eagles,John Smith,Johnny,first,,,,,,,,,,,
Summer Cup 2024,2024-08-15,completed,2,3,true,Red Eagles,Sarah Davis,Sar,first,,,,,,,,,,,
Summer Cup 2024,2024-08-15,completed,2,3,true,Red Eagles,Mike Wilson,Mike,second,,,,,,,,,,,
Summer Cup 2024,2024-08-15,completed,2,3,true,Blue Tigers,Emma Johnson,Em,first,,,,,,,,,,,
Summer Cup 2024,2024-08-15,completed,2,3,true,Blue Tigers,Tom Brown,Tommy,second,,,,,,,,,,,
Summer Cup 2024,2024-08-15,completed,2,3,true,Blue Tigers,Lisa Green,Lisa,second,,,,,,,,,,,
Summer Cup 2024,2024-08-15,completed,2,3,true,,,,,,Red Eagles,Blue Tigers,2,1,completed,1,2700,Great match!,John Smith,Red Eagles,15
Summer Cup 2024,2024-08-15,completed,2,3,true,,,,,,Red Eagles,Blue Tigers,2,1,completed,1,2700,Great match!,Sarah Davis,Red Eagles,32
Summer Cup 2024,2024-08-15,completed,2,3,true,,,,,,Red Eagles,Blue Tigers,2,1,completed,1,2700,Great match!,Emma Johnson,Blue Tigers,28
```

### Option 2: Multi-Sheet Excel Format

**Filename**: `tournament_import.xlsx`

**Sheet 1: tournaments**
```
tournament_id,name,date,status,rounds,team_size,has_half_time
summer_2024,Summer Cup 2024,2024-08-15,completed,2,3,true
```

**Sheet 2: teams**
```
team_id,tournament_id,name
team_red,summer_2024,Red Eagles
team_blue,summer_2024,Blue Tigers
```

**Sheet 3: players**
```
player_id,team_id,name,alias,hat,goals
p1,team_red,John Smith,Johnny,first,5
p2,team_red,Sarah Davis,Sar,first,3
p3,team_blue,Emma Johnson,Em,first,2
```

**Sheet 4: matches**
```
match_id,tournament_id,team1_id,team2_id,score1,score2,status,round,duration,comments
m1,summer_2024,team_red,team_blue,2,1,completed,1,2700,Great match!
```

**Sheet 5: goals**
```
goal_id,match_id,tournament_id,player_id,player_name,team_id,minute
g1,m1,summer_2024,p1,John Smith,team_red,15
g2,m1,summer_2024,p2,Sarah Davis,team_red,32
```

## ID Generation Rules

### Current System IDs
- **Tournament ID**: `Date.now().toString()` (e.g., "1735139234567")
- **Team ID**: `team_${Date.now()}_${index}` (e.g., "team_1735139234567_0")
- **Player ID**: `${Date.now()}_${teamIndex}_${playerIndex}_${hat}` (e.g., "1735139234567_0_1_first")
- **Match ID**: `match_${tournamentTimestamp}_r${round}_${counter}` (e.g., "match_1735139234567_r1_1")
- **Goal ID**: `Date.now().toString()` (e.g., "1735139234568")

### Import ID Strategy
1. **If IDs provided**: Use provided IDs with validation
2. **If IDs missing**: Auto-generate using current system patterns
3. **Duplicate handling**: Add random suffix to prevent conflicts

## Data Validation Rules

### Required Data
- Tournament must have: name, date, at least 2 teams
- Team must have: name, at least 1 player
- Player must have: name (alias defaults to name)
- Match must have: two different teams
- Goal must have: valid player, team, and minute

### Data Constraints
- `tournament_date`: Valid ISO date format
- `team_size`: 2-6 players
- `rounds`: 1-10 rounds
- `player_hat`: "first" (strong) or "second" (weak)
- `match_score1/2`: Non-negative integers
- `match_status`: "pending", "live", or "completed"
- `goal_minute`: 1-999 minutes

### Data Integrity
- Goal player must exist in goal team
- Goal team must be one of the match teams
- Match teams must exist in tournament
- Player names must be unique within team

## AI Processing Instructions

### For Unstructured Excel Processing:

1. **Identify Data Types**:
   ```
   - Tournament info: Names, dates, locations
   - Team info: Team names, player lists
   - Match results: Scores, dates, team matchups
   - Goal data: Scorer names, times, teams
   ```

2. **Data Mapping Strategy**:
   ```
   - Look for tournament identifiers in headers/titles
   - Identify team groupings (often in columns or sections)
   - Find player lists (usually name columns)
   - Locate match results (score patterns like "2-1", "3 vs 2")
   - Extract goal details (player names + minutes/times)
   ```

3. **Common Patterns to Recognize**:
   ```
   - Date formats: "15/08/2024", "Aug 15, 2024", "2024-08-15"
   - Score formats: "2-1", "2:1", "2 vs 1", "Team A 2 Team B 1"
   - Time formats: "15'", "15min", "15th minute", "0:15"
   - Player skill: "strong/weak", "good/average", "A/B team"
   ```

4. **Output Generation**:
   ```
   - Always include required columns even if empty
   - Use consistent tournament_name across all rows
   - Generate unique team_name and player_name combinations
   - Create match rows separate from player rows
   - Link goals to matches via match teams
   ```

## Firestore Import Commands

### Using Firebase CLI
```bash
# Import tournaments collection
firebase firestore:import ./import_data/tournaments --collection-ids tournaments

# Import all collections
firebase firestore:import ./import_data/
```

### Batch Import Structure
```
import_data/
├── tournaments/
│   └── tournament_id.json
├── teams/
│   └── team_id.json
├── players/
│   └── player_id.json
├── matches/
│   └── match_id.json
└── goals/
    └── goal_id.json
```

## Example JSON Documents

### Tournament Document
```json
{
  "name": "Summer Cup 2024",
  "date": "2024-08-15",
  "status": "completed",
  "rounds": 2,
  "teamSize": 3,
  "hasHalfTime": true,
  "updatedAt": "2024-08-15T10:00:00Z"
}
```

### Team Document
```json
{
  "tournamentId": "1735139234567",
  "name": "Red Eagles",
  "stats": {
    "played": 4,
    "won": 3,
    "drawn": 1,
    "lost": 0,
    "goalsFor": 8,
    "goalsAgainst": 3,
    "points": 10
  }
}
```

### Player Document
```json
{
  "teamId": "team_1735139234567_0",
  "name": "John Smith",
  "alias": "Johnny",
  "hat": "first",
  "goals": 5
}
```

### Match Document
```json
{
  "tournamentId": "1735139234567",
  "team1": {
    "id": "team_1735139234567_0",
    "name": "Red Eagles"
  },
  "team2": {
    "id": "team_1735139234567_1", 
    "name": "Blue Tigers"
  },
  "score1": 2,
  "score2": 1,
  "status": "completed",
  "round": 1,
  "duration": 2700,
  "comments": "Great match!"
}
```

### Goal Document
```json
{
  "matchId": "match_1735139234567_r1_1",
  "tournamentId": "1735139234567",
  "playerId": "1735139234567_0_0_first",
  "playerName": "John Smith",
  "teamId": "team_1735139234567_0",
  "minute": 15
}
```

## Error Handling

### Common Issues
1. **Missing required fields**: Auto-generate or use defaults
2. **Invalid references**: Create missing entities or skip invalid data
3. **Duplicate data**: Use latest version or merge intelligently
4. **Format mismatches**: Convert to expected format or flag for review

### Validation Warnings
- Non-standard date formats
- Unknown player skill levels
- Missing match participants
- Goals without corresponding matches
- Negative scores or invalid minutes

This specification provides a complete framework for importing tournament data into Domafocapp's Firestore database while maintaining data integrity and relationships.
