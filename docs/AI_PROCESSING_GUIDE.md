# AI Processing Guide: Excel to Domafocapp Import

## Objective

Convert unstructured Excel tournament data into the standardized Domafocapp import format.

## Input Expectations

Unstructured Excel files containing tournament data in various formats such as:

- Player rosters with team assignments
- Match results with scores
- Goal scorer lists with times
- Mixed tournament information

## Processing Steps

### 1. Data Recognition Patterns

**Tournament Information**:

```
- Look for: Tournament names, event titles, dates
- Common locations: First rows, headers, sheet names
- Date patterns: "DD/MM/YYYY", "Month DD, YYYY", "YYYY-MM-DD"
- Keywords: "Tournament", "Cup", "Championship", "League"
```

**Team Data**:

```
- Look for: Team names, grouped player lists
- Common patterns:
  * Column headers like "Team A", "Team B"
  * Grouped sections with team names as subheaders
  * Color-coded sections
- Player indicators: Names, sometimes with positions/roles
```

**Match Results**:

```
- Score patterns: "2-1", "2:1", "2 vs 1", "Team A 2 - 1 Team B"
- Result tables with team matchups
- Fixture lists with outcomes
- Round information: "Round 1", "Group Stage", "Final"
```

**Goal Data**:

```
- Time patterns: "15'", "15min", "15th minute", "0:15"
- Scorer patterns: Player names followed by times
- Team association: Goals grouped by team or match
```

### 2. Data Extraction Strategy

**Step 1: Identify Structure**

```python
# Pseudo-code for pattern recognition
def analyze_excel_structure(sheet):
    # Look for tournament info in first 5 rows
    tournament_info = extract_tournament_details(sheet.rows[0:5])

    # Find team groupings
    team_sections = identify_team_sections(sheet)

    # Locate match data
    match_data = find_match_results(sheet)

    # Extract goal information
    goal_data = extract_goal_details(sheet)

    return {
        'tournament': tournament_info,
        'teams': team_sections,
        'matches': match_data,
        'goals': goal_data
    }
```

**Step 2: Data Mapping**

```python
def map_to_import_format(extracted_data):
    output_rows = []

    # Create base tournament info
    tournament_name = extracted_data['tournament']['name']
    tournament_date = normalize_date(extracted_data['tournament']['date'])

    # Process teams and players
    for team in extracted_data['teams']:
        for player in team['players']:
            row = create_player_row(tournament_name, tournament_date, team, player)
            output_rows.append(row)

    # Process matches and goals
    for match in extracted_data['matches']:
        match_row = create_match_row(tournament_name, tournament_date, match)
        output_rows.append(match_row)

        # Add goal rows
        for goal in match['goals']:
            goal_row = create_goal_row(tournament_name, tournament_date, match, goal)
            output_rows.append(goal_row)

    return output_rows
```

### 3. Common Excel Patterns

**Pattern 1: Team Roster Format**

```
Tournament: Summer Cup 2024        Date: 15/08/2024

Team A          Team B          Team C
-------         -------         -------
John Smith      Emma Wilson     Alex Chen
Sarah Davis     Tom Brown       Maya Patel
Mike Johnson    Lisa Green      David Kim
```

_Mapping_: Extract team names from headers, players from columns

**Pattern 2: Match Results Table**

```
Round 1 Results
Team A vs Team B    2-1    (15' John, 32' Sarah | 28' Emma)
Team C vs Team A    0-3    (8' John, 23' Sarah, 35' Mike)
Team B vs Team C    2-2    (19' Emma, 35' Lisa | 22' Maya, 41' David)
```

_Mapping_: Parse team names, scores, and goal details from result strings

**Pattern 3: Mixed Tournament Sheet**

```
A1: Summer Football Tournament
A2: August 15, 2024
A4: Teams:
A5: Red Eagles: John(C), Sarah, Mike
A6: Blue Tigers: Emma(C), Tom, Lisa
B8: Match Results:
B9: Red Eagles 2-1 Blue Tigers
B10: Goals: John 15', Sarah 32', Emma 28'
```

_Mapping_: Parse mixed format by identifying data type indicators

### 4. Output Generation Rules

**Required Columns Order**:

```csv
tournament_name,tournament_date,tournament_status,rounds,team_size,has_half_time,
team_name,player_name,player_alias,player_hat,
match_id,match_team1,match_team2,match_score1,match_score2,match_status,match_round,match_duration,match_comments,
goal_player_name,goal_team_name,goal_minute
```

**Row Types**:

1. **Player Rows**: Fill tournament info + team info + player info, leave match/goal columns empty
2. **Match Rows**: Fill tournament info + match info, leave team/player columns empty
3. **Goal Rows**: Fill tournament info + match info + goal info, leave team/player columns empty

**Data Defaults**:

```
tournament_status: "completed"
rounds: 1
team_size: 3 (or count from largest team)
has_half_time: false
player_alias: same as player_name
player_hat: "second" (unless marked as captain/strong)
match_status: "completed"
match_round: 1
match_duration: 0
```

### 5. Validation and Error Handling

**Data Validation**:

```python
def validate_extracted_data(data):
    errors = []
    warnings = []

    # Check required data
    if not data.get('tournament_name'):
        errors.append("Tournament name not found")

    if len(data.get('teams', [])) < 2:
        errors.append("At least 2 teams required")

    # Validate dates
    if not is_valid_date(data.get('tournament_date')):
        warnings.append("Invalid or missing tournament date")

    # Check team sizes
    team_sizes = [len(team['players']) for team in data.get('teams', [])]
    if len(set(team_sizes)) > 1:
        warnings.append("Teams have different sizes")

    return errors, warnings
```

**Error Recovery**:

- Missing tournament name → Use filename or "Imported Tournament"
- Invalid dates → Use current date
- Missing player names → Generate "Player 1", "Player 2"
- Inconsistent team sizes → Use mode or prompt for correction

### 6. AI Prompt Template

```
You are an expert at converting unstructured Excel tournament data into standardized CSV format.

INPUT: Excel file with tournament data (various formats)
OUTPUT: CSV file following Domafocapp import specification

TASK:
1. Analyze the Excel structure and identify:
   - Tournament name and date
   - Team names and player lists
   - Match results with scores
   - Goal scorers and times

2. Convert to CSV with these exact columns:
   tournament_name,tournament_date,tournament_status,rounds,team_size,has_half_time,team_name,player_name,player_alias,player_hat,match_id,match_team1,match_team2,match_score1,match_score2,match_status,match_round,match_duration,match_comments,goal_player_name,goal_team_name,goal_minute

3. Create three types of rows:
   - Player rows: tournament + team + player data, empty match/goal columns
   - Match rows: tournament + match data, empty team/player columns
   - Goal rows: tournament + match + goal data, empty team/player columns

4. Use these defaults for missing data:
   - tournament_status: "completed"
   - rounds: 1, team_size: 3, has_half_time: false
   - player_hat: "second", match_status: "completed"

5. Validate that:
   - All goal players exist in teams
   - All goal teams match match participants
   - Team names are consistent

EXAMPLE OUTPUT:
[Show sample CSV rows for each type]

Please process the provided Excel file and generate the standardized CSV.
```

### 7. Testing and Validation

**Test Cases**:

1. Simple team roster → Player rows only
2. Match results only → Match rows with generated teams
3. Complete tournament → All row types
4. Mixed format → Complex parsing

**Validation Checklist**:

- [ ] Tournament name extracted correctly
- [ ] All teams have at least one player
- [ ] Match scores sum correctly with goal counts
- [ ] No orphaned goals (all reference valid players/teams)
- [ ] Date format is valid ISO format
- [ ] All required columns present

This guide provides a systematic approach for AI systems to process unstructured Excel tournament data and convert it into the standardized Domafocapp import format.
