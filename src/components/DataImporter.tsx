import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import type { Tournament, Team, Player, Match, Goal } from "@/App";

interface DataImporterProps {
  onImport: (tournaments: Tournament[]) => void;
  onClose: () => void;
  isOpen: boolean;
}

interface ImportedData {
  [key: string]: string;
}

interface MappingConfig {
  tournamentName: string;
  tournamentDate: string;
  tournamentStatus: string;
  rounds: string;
  teamSize: string;
  hasHalfTime: string;
  teamName: string;
  playerName: string;
  playerAlias: string;
  playerHat: string;
  matchId: string;
  matchTeam1: string;
  matchTeam2: string;
  matchScore1: string;
  matchScore2: string;
  matchStatus: string;
  matchRound: string;
  matchDuration: string;
  matchComments: string;
  goalScorer: string;
  goalTeam: string;
  goalMinute: string;
}

export default function DataImporter({
  onImport,
  onClose,
  isOpen,
}: DataImporterProps) {
  const [step, setStep] = useState<
    "upload" | "preview" | "mapping" | "confirm"
  >("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [importedData, setImportedData] = useState<ImportedData[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [previewTournaments, setPreviewTournaments] = useState<Tournament[]>(
    []
  );
  const [mappingConfig, setMappingConfig] = useState<MappingConfig>({
    tournamentName: "",
    tournamentDate: "",
    tournamentStatus: "",
    rounds: "",
    teamSize: "",
    hasHalfTime: "",
    teamName: "",
    playerName: "",
    playerAlias: "",
    playerHat: "",
    matchId: "",
    matchTeam1: "",
    matchTeam2: "",
    matchScore1: "",
    matchScore2: "",
    matchStatus: "",
    matchRound: "",
    matchDuration: "",
    matchComments: "",
    goalScorer: "",
    goalTeam: "",
    goalMinute: "",
  });

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (
      !file.name.endsWith(".csv") &&
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls")
    ) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }

    setIsLoading(true);

    try {
      if (file.name.endsWith(".csv")) {
        const text = await file.text();
        console.log("CSV file content preview:", text.substring(0, 500));
        
        // Handle different line endings and clean the text
        const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
        const lines = cleanText.split("\n").filter(line => line.trim() !== "");
        
        console.log("Number of lines:", lines.length);
        console.log("First line (header):", lines[0]);
        
        if (lines.length === 0) {
          toast.error("The CSV file appears to be empty.");
          return;
        }
        
        // Try different delimiters
        let delimiter = ",";
        const firstLine = lines[0];
        const commaCount = (firstLine.match(/,/g) || []).length;
        const semicolonCount = (firstLine.match(/;/g) || []).length;
        
        if (semicolonCount > commaCount) {
          delimiter = ";";
        }
        
        console.log("Using delimiter:", delimiter);
        
        // Parse headers with proper CSV handling
        const headers = firstLine
          .split(delimiter)
          .map((h) => h.trim().replace(/^["']|["']$/g, "")) // Remove surrounding quotes
          .filter((h) => h !== ""); // Filter out empty headers
          
        console.log("Parsed headers:", headers);
        
        if (headers.length === 0) {
          toast.error("No valid column headers found in the CSV file.");
          return;
        }
        
        // Parse data rows
        const data = lines
          .slice(1)
          .map((line) => {
            const values = line
              .split(delimiter)
              .map((v) => v.trim().replace(/^["']|["']$/g, "")); // Remove surrounding quotes
            const row: ImportedData = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || "";
            });
            return row;
          })
          .filter((row) => Object.values(row).some((v) => v.trim() !== ""));

        console.log("Parsed data rows:", data.length);
        console.log("Sample data:", data[0]);

        if (data.length === 0) {
          toast.error("No valid data rows found in the CSV file. Please check the file format.");
          return;
        }

        setColumns(headers.filter(h => h && h.trim() !== ""));
        setImportedData(data);
        toast.success(`Successfully loaded ${data.length} rows with ${headers.length} columns`);
        setStep("preview");
      } else {
        // For Excel files, we'll provide instructions since we can't parse them directly
        toast.error(
          "Please convert your Excel file to CSV format first. In Excel: File > Save As > CSV (Comma delimited)"
        );
      }
    } catch (error) {
      console.error("CSV parsing error:", error);
      toast.error(`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the format.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to safely get mapped values, treating "none" as empty string
  const getMappedValue = (row: ImportedData, key: string): string => {
    const mappedKey = (mappingConfig as any)[key];
    if (!mappedKey || mappedKey === "none") return "";
    return row[mappedKey] || "";
  };

  const generateTournaments = () => {
    const tournaments: Tournament[] = [];
    const tournamentMap = new Map<string, Tournament>();
    
    // Step 1: Create tournaments with enhanced settings
    importedData.forEach((row) => {
      const tournamentName = getMappedValue(row, "tournamentName") || "Imported Tournament";
      const tournamentDate = getMappedValue(row, "tournamentDate") ||
        new Date().toISOString().split("T")[0];

      if (!tournamentMap.has(tournamentName)) {
        const tournamentStatus = getMappedValue(row, "tournamentStatus")?.toLowerCase() || "completed";
        const rounds = parseInt(getMappedValue(row, "rounds")) || 1;
        const teamSize = parseInt(getMappedValue(row, "teamSize")) || 3;
        const hasHalfTime = getMappedValue(row, "hasHalfTime")?.toLowerCase() === "true" || false;

        const tournament: Tournament = {
          id: `imported_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          name: tournamentName,
          date: tournamentDate,
          status: ["setup", "active", "completed"].includes(tournamentStatus) 
            ? (tournamentStatus as "setup" | "active" | "completed") 
            : "completed",
          teams: [],
          fixtures: [],
          rounds: Math.max(1, Math.min(10, rounds)),
          teamSize: Math.max(2, Math.min(6, teamSize)),
          hasHalfTime,
        };
        tournamentMap.set(tournamentName, tournament);
        tournaments.push(tournament);
      }
    });

    // Step 2: Process teams and players
    const teamMap = new Map<string, Team>();
    const playerMap = new Map<string, Player>();

    importedData.forEach((row) => {
      const tournamentName = getMappedValue(row, "tournamentName") || "Imported Tournament";
      const teamName = getMappedValue(row, "teamName");
      const playerName = getMappedValue(row, "playerName");
      const playerAlias = getMappedValue(row, "playerAlias") || playerName;
      const playerHatValue = getMappedValue(row, "playerHat");
      const playerHat =
        playerHatValue?.toLowerCase().includes("first") ||
        playerHatValue?.toLowerCase().includes("strong")
          ? "first"
          : "second";

      if (teamName && playerName) {
        const teamKey = `${tournamentName}_${teamName}`;
        const playerKey = `${teamKey}_${playerName}`;
        
        // Create team if it doesn't exist
        if (!teamMap.has(teamKey)) {
          const team: Team = {
            id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: teamName,
            players: [],
            stats: {
              played: 0,
              won: 0,
              drawn: 0,
              lost: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              points: 0,
            },
          };
          teamMap.set(teamKey, team);

          const tournament = tournamentMap.get(tournamentName);
          tournament?.teams.push(team);
        }

        // Create player if it doesn't exist
        const team = teamMap.get(teamKey);
        if (team && !playerMap.has(playerKey)) {
          const player: Player = {
            id: `player_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            name: playerName,
            alias: playerAlias,
            goals: 0,
            hat: playerHat as "first" | "second",
          };
          team.players.push(player);
          playerMap.set(playerKey, player);
        }
      }
    });

    // Step 3: Process matches
    const matchMap = new Map<string, Match>();
    
    importedData.forEach((row) => {
      const tournamentName = getMappedValue(row, "tournamentName") || "Imported Tournament";
      const team1Name = getMappedValue(row, "matchTeam1");
      const team2Name = getMappedValue(row, "matchTeam2");
      const score1 = parseInt(getMappedValue(row, "matchScore1")) || 0;
      const score2 = parseInt(getMappedValue(row, "matchScore2")) || 0;

      if (team1Name && team2Name && team1Name !== team2Name) {
        const matchKey = `${tournamentName}_${team1Name}_${team2Name}`;
        const reverseMatchKey = `${tournamentName}_${team2Name}_${team1Name}`;
        
        // Check if match already exists (avoid duplicates)
        if (!matchMap.has(matchKey) && !matchMap.has(reverseMatchKey)) {
          const tournament = tournamentMap.get(tournamentName);
          const team1 = teamMap.get(`${tournamentName}_${team1Name}`);
          const team2 = teamMap.get(`${tournamentName}_${team2Name}`);

          if (tournament && team1 && team2) {
            const matchStatus = getMappedValue(row, "matchStatus")?.toLowerCase() || "completed";
            const matchRound = parseInt(getMappedValue(row, "matchRound")) || 1;
            const matchDuration = parseInt(getMappedValue(row, "matchDuration")) || 0;
            const matchComments = getMappedValue(row, "matchComments") || "";
            const matchId = getMappedValue(row, "matchId") || 
              `match_${Date.now()}_r${matchRound}_${matchMap.size + 1}`;

            const match: Match = {
              id: matchId,
              team1: team1,
              team2: team2,
              score1: Math.max(0, score1),
              score2: Math.max(0, score2),
              status: ["pending", "live", "completed"].includes(matchStatus)
                ? (matchStatus as "pending" | "live" | "completed")
                : "completed",
              round: Math.max(1, matchRound),
              duration: Math.max(0, Math.min(7200, matchDuration)),
              goals: [],
              comments: matchComments,
            };

            matchMap.set(matchKey, match);
            tournament.fixtures.push(match);

            // Update team stats
            if (match.status === "completed") {
              team1.stats.played++;
              team2.stats.played++;
              team1.stats.goalsFor += score1;
              team1.stats.goalsAgainst += score2;
              team2.stats.goalsFor += score2;
              team2.stats.goalsAgainst += score1;

              if (score1 > score2) {
                team1.stats.won++;
                team1.stats.points += 3;
                team2.stats.lost++;
              } else if (score2 > score1) {
                team2.stats.won++;
                team2.stats.points += 3;
                team1.stats.lost++;
              } else {
                team1.stats.drawn++;
                team2.stats.drawn++;
                team1.stats.points += 1;
                team2.stats.points += 1;
              }
            }
          }
        }
      }
    });

    // Step 4: Process goals
    importedData.forEach((row) => {
      const tournamentName = getMappedValue(row, "tournamentName") || "Imported Tournament";
      const goalPlayerName = getMappedValue(row, "goalScorer");
      const goalTeamName = getMappedValue(row, "goalTeam");
      const goalMinute = parseInt(getMappedValue(row, "goalMinute")) || 0;
      const team1Name = getMappedValue(row, "matchTeam1");
      const team2Name = getMappedValue(row, "matchTeam2");

      if (goalPlayerName && goalTeamName && goalMinute > 0 && team1Name && team2Name) {
        // Find the match this goal belongs to
        const matchKey = `${tournamentName}_${team1Name}_${team2Name}`;
        const reverseMatchKey = `${tournamentName}_${team2Name}_${team1Name}`;
        const match = matchMap.get(matchKey) || matchMap.get(reverseMatchKey);
        
        if (match) {
          // Find the player
          const playerKey = `${tournamentName}_${goalTeamName}_${goalPlayerName}`;
          const player = playerMap.get(playerKey);
          const team = teamMap.get(`${tournamentName}_${goalTeamName}`);

          if (player && team) {
            // Verify the goal team is participating in this match
            const isValidTeam = match.team1.name === goalTeamName || match.team2.name === goalTeamName;
            
            if (isValidTeam) {
              const goal: Goal = {
                id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                playerId: player.id,
                playerName: player.name,
                teamId: team.id,
                minute: Math.max(1, Math.min(999, goalMinute)),
              };

              match.goals.push(goal);
              player.goals++;
            }
          }
        }
      }
    });

    setPreviewTournaments(tournaments);
    setStep("confirm");
  };

  const handleImport = () => {
    onImport(previewTournaments);
    toast.success(
      `Successfully imported ${previewTournaments.length} tournament(s)`
    );
    resetImporter();
  };

  const resetImporter = () => {
    setImportedData([]);
    setColumns([]);
    setStep("upload");
    setMappingConfig({
      tournamentName: "",
      tournamentDate: "",
      tournamentStatus: "",
      rounds: "",
      teamSize: "",
      hasHalfTime: "",
      teamName: "",
      playerName: "",
      playerAlias: "",
      playerHat: "",
      matchId: "",
      matchTeam1: "",
      matchTeam2: "",
      matchScore1: "",
      matchScore2: "",
      matchStatus: "",
      matchRound: "",
      matchDuration: "",
      matchComments: "",
      goalScorer: "",
      goalTeam: "",
      goalMinute: "",
    });
    setPreviewTournaments([]);
  };

  const downloadSampleCSV = () => {
    const sampleData = `tournament_name,tournament_date,tournament_status,rounds,team_size,has_half_time,team_name,player_name,player_alias,player_hat,match_id,match_team1,match_team2,match_score1,match_score2,match_status,match_round,match_duration,match_comments,goal_player_name,goal_team_name,goal_minute
Summer Cup 2024,2024-08-15,completed,2,3,true,Red Eagles,John Smith,Johnny,first,,,,,,,,,,,
Summer Cup 2024,2024-08-15,completed,2,3,true,Red Eagles,Sarah Davis,Sar,first,,,,,,,,,,,
Summer Cup 2024,2024-08-15,completed,2,3,true,Blue Tigers,Emma Johnson,Em,first,,,,,,,,,,,
Summer Cup 2024,2024-08-15,completed,2,3,true,Blue Tigers,Tom Brown,Tommy,second,,,,,,,,,,,
Summer Cup 2024,2024-08-15,completed,2,3,true,,,,,,Red Eagles,Blue Tigers,2,1,completed,1,2700,Great match!,John Smith,Red Eagles,15
Summer Cup 2024,2024-08-15,completed,2,3,true,,,,,,Red Eagles,Blue Tigers,2,1,completed,1,2700,Great match!,Sarah Davis,Red Eagles,32
Summer Cup 2024,2024-08-15,completed,2,3,true,,,,,,Red Eagles,Blue Tigers,2,1,completed,1,2700,Great match!,Emma Johnson,Blue Tigers,28`;

    const blob = new Blob([sampleData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_tournament_import.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Sample file downloaded");
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Import Tournament Data</h3>
        <p className="text-muted-foreground mb-4">
          Upload a CSV file with your tournament data. Excel files should be
          converted to CSV first.
        </p>
      </div>

      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <Label htmlFor="file-upload" className="cursor-pointer">
          <span className="text-primary font-medium">Choose a file</span> or
          drag and drop
        </Label>
        <Input
          id="file-upload"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />
        <p className="text-sm text-muted-foreground mt-2">
          CSV, XLS, XLSX up to 10MB
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Expected Data Format:</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Your file can contain any combination of: tournament names, dates,
          team names, player names, match results, goal scorers, etc. The next
          step will help you map your columns to our format.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
            <Download className="w-4 h-4 mr-2" />
            Download Sample
          </Button>
        </div>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Data Preview</h3>
          <p className="text-muted-foreground">
            Found {importedData.length} rows with {columns.length} columns
          </p>
        </div>
        <Button variant="outline" onClick={() => setStep("upload")}>
          Upload Different File
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-3 py-2 text-left font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {importedData.slice(0, 5).map((row, index) => (
                <tr key={index} className="border-t">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2 truncate max-w-32">
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {importedData.length > 5 && (
          <div className="bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            ... and {importedData.length - 5} more rows
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setStep("upload")}>
          Back
        </Button>
        <Button onClick={() => setStep("mapping")}>Configure Mapping</Button>
      </div>
    </div>
  );

  const renderMappingStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Map Your Data</h3>
        <p className="text-muted-foreground">
          Map your CSV columns to tournament data fields. Only map the fields
          you have data for.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tournament Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm">Tournament Name</Label>
              <Select
                value={mappingConfig.tournamentName}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({
                    ...prev,
                    tournamentName: value,
                  }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Tournament Date</Label>
              <Select
                value={mappingConfig.tournamentDate}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({
                    ...prev,
                    tournamentDate: value,
                  }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Tournament Status</Label>
              <Select
                value={mappingConfig.tournamentStatus}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({
                    ...prev,
                    tournamentStatus: value,
                  }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Rounds</Label>
              <Select
                value={mappingConfig.rounds}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({
                    ...prev,
                    rounds: value,
                  }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Team Size</Label>
              <Select
                value={mappingConfig.teamSize}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({
                    ...prev,
                    teamSize: value,
                  }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Has Half Time</Label>
              <Select
                value={mappingConfig.hasHalfTime}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({
                    ...prev,
                    hasHalfTime: value,
                  }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Team & Player Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm">Team Name</Label>
              <Select
                value={mappingConfig.teamName}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({ ...prev, teamName: value }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Player Name</Label>
              <Select
                value={mappingConfig.playerName}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({ ...prev, playerName: value }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Player Alias (Optional)</Label>
              <Select
                value={mappingConfig.playerAlias}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({ ...prev, playerAlias: value }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">
                Player Strength (first/strong or second/weak)
              </Label>
              <Select
                value={mappingConfig.playerHat}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({ ...prev, playerHat: value }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Match Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm">Match ID (Optional)</Label>
              <Select
                value={mappingConfig.matchId}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({ ...prev, matchId: value }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Team 1</Label>
              <Select
                value={mappingConfig.matchTeam1}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({ ...prev, matchTeam1: value }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Team 2</Label>
              <Select
                value={mappingConfig.matchTeam2}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({ ...prev, matchTeam2: value }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Team 1 Score</Label>
              <Select
                value={mappingConfig.matchScore1}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({ ...prev, matchScore1: value }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Team 2 Score</Label>
              <Select
                value={mappingConfig.matchScore2}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({ ...prev, matchScore2: value }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Match Status</Label>
              <Select
                value={mappingConfig.matchStatus}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({ ...prev, matchStatus: value }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Match Round</Label>
              <Select
                value={mappingConfig.matchRound}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({ ...prev, matchRound: value }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Match Duration (seconds)</Label>
              <Select
                value={mappingConfig.matchDuration}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({ ...prev, matchDuration: value }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Match Comments</Label>
              <Select
                value={mappingConfig.matchComments}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({ ...prev, matchComments: value }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Goal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm">Goal Scorer</Label>
              <Select
                value={mappingConfig.goalScorer}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({ ...prev, goalScorer: value }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Goal Team</Label>
              <Select
                value={mappingConfig.goalTeam}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({ ...prev, goalTeam: value }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Goal Minute</Label>
              <Select
                value={mappingConfig.goalMinute}
                onValueChange={(value) =>
                  setMappingConfig((prev) => ({ ...prev, goalMinute: value }))
                }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setStep("preview")}>
          Back
        </Button>
        <Button
          onClick={generateTournaments}
          disabled={
            !mappingConfig.tournamentName &&
            !mappingConfig.teamName &&
            !mappingConfig.playerName
          }>
          Generate Preview
        </Button>
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Import Preview</h3>
        <p className="text-muted-foreground">
          Review the tournaments that will be imported and confirm to proceed.
        </p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {previewTournaments.map((tournament) => (
          <Card key={tournament.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{tournament.name}</CardTitle>
                <Badge variant="outline">{tournament.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{tournament.date}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Teams:</span>{" "}
                  {tournament.teams.length}
                </div>
                <div>
                  <span className="font-medium">Players:</span>{" "}
                  {tournament.teams.reduce(
                    (acc, team) => acc + team.players.length,
                    0
                  )}
                </div>
                <div>
                  <span className="font-medium">Matches:</span>{" "}
                  {tournament.fixtures.length}
                </div>
              </div>

              {tournament.teams.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">Teams:</p>
                  <div className="flex flex-wrap gap-1">
                    {tournament.teams.slice(0, 5).map((team) => (
                      <Badge
                        key={team.id}
                        variant="secondary"
                        className="text-xs">
                        {team.name} ({team.players.length})
                      </Badge>
                    ))}
                    {tournament.teams.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{tournament.teams.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {previewTournaments.length === 0 && (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No tournaments could be generated from your data. Please check your
            column mappings.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setStep("mapping")}>
          Back to Mapping
        </Button>
        <Button
          onClick={handleImport}
          disabled={previewTournaments.length === 0}
          className="gap-2">
          <CheckCircle className="w-4 h-4" />
          Import {previewTournaments.length} Tournament(s)
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Import Tournament Data</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DialogDescription>
            Import your existing tournament data from a CSV file
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Processing file...</p>
            </div>
          )}

          {!isLoading && step === "upload" && renderUploadStep()}
          {!isLoading && step === "preview" && renderPreviewStep()}
          {!isLoading && step === "mapping" && renderMappingStep()}
          {!isLoading && step === "confirm" && renderConfirmStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
