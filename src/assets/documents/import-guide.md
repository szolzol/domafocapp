# Data Import Guide

## Overview
The Data Import feature allows you to import existing tournament data from CSV files. This is perfect for migrating data from Excel spreadsheets or other tournament management systems.

## Supported File Formats
- **CSV files** (.csv) - Recommended
- **Excel files** (.xlsx, .xls) - Must be converted to CSV first

## How to Convert Excel to CSV
1. Open your Excel file
2. Go to **File > Save As**
3. Choose **CSV (Comma delimited)** format
4. Save the file

## Data Structure
Your CSV can contain any combination of the following information:

### Tournament Information
- **Tournament Name** - Name of the tournament
- **Tournament Date** - Date when the tournament took place

### Team & Player Information
- **Team Name** - Name of the team
- **Player Name** - Real name of the player
- **Player Alias** - Nickname or alias (optional)
- **Player Strength** - "strong"/"first" or "weak"/"second" to indicate skill level

### Match Results (Optional)
- **Team 1** - First team in the match
- **Team 2** - Second team in the match
- **Team 1 Score** - Goals scored by team 1
- **Team 2 Score** - Goals scored by team 2

### Goal Information (Optional)
- **Goal Scorer** - Name/alias of the player who scored
- **Goal Team** - Team the scorer belongs to
- **Goal Minute** - Minute when the goal was scored

## Sample CSV Format

Here are some example CSV structures:

### Simple Player List
```csv
Tournament Name,Tournament Date,Team Name,Player Name,Player Alias,Player Strength
Doma Football Day,2024-08-23,Red Eagles,John Smith,Johnny,strong
Doma Football Day,2024-08-23,Red Eagles,Mike Johnson,Mikey,weak
Doma Football Day,2024-08-23,Blue Tigers,Sarah Davis,Sar,strong
Doma Football Day,2024-08-23,Blue Tigers,Tom Wilson,Tommy,weak
```

### Complete Match Data
```csv
Tournament Name,Tournament Date,Team 1,Team 2,Team 1 Score,Team 2 Score,Goal Scorer,Goal Team,Goal Minute
Summer Cup,2024-07-15,Red Eagles,Blue Tigers,2,1,Johnny,Red Eagles,15
Summer Cup,2024-07-15,Red Eagles,Blue Tigers,2,1,Mikey,Red Eagles,45
Summer Cup,2024-07-15,Red Eagles,Blue Tigers,2,1,Sar,Blue Tigers,60
```

### Mixed Data (Recommended)
You can combine different types of data in the same file. The import tool will intelligently map and organize the data.

## Import Process

1. **Upload File** - Select your CSV file
2. **Preview Data** - Review the imported rows and columns
3. **Map Columns** - Tell the system which columns contain which type of data
4. **Confirm Import** - Review the generated tournaments and confirm

## Tips for Best Results

1. **Use Clear Column Headers** - Name your columns clearly (e.g., "Team Name", "Player Name")
2. **Consistent Data** - Use consistent naming for teams and players throughout the file
3. **One Tournament Per File** - For best results, import one tournament at a time
4. **Clean Data** - Remove empty rows and ensure data consistency

## Troubleshooting

### No Tournaments Generated
- Check that you've mapped at least the Tournament Name or Team Name columns
- Ensure your data has consistent tournament names

### Missing Players
- Verify that Player Name column is mapped correctly
- Check that team names are consistent

### Incorrect Scores
- Ensure score columns contain only numbers
- Check that team names in match data match team names in player data

## Data Privacy
All imported data is stored locally in your browser. No data is sent to external servers during the import process.