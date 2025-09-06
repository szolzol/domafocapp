import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Target,
  Users,
  Calendar,
  Zap,
  Clock,
  Star,
} from "lucide-react";
import { Tournament, Player } from "../App";

interface StatisticsProps {
  tournaments: Tournament[];
  selectedTournament?: Tournament | null;
}

function Statistics({ tournaments, selectedTournament }: StatisticsProps) {
  const [viewMode, setViewMode] = useState<"current" | "all" | string>(
    "current"
  );

  const activeTournaments = tournaments.filter(
    (t) => t.status === "active" || t.status === "completed"
  );
  const currentTournament =
    selectedTournament || activeTournaments[activeTournaments.length - 1];

  const calculatePlayerStats = (tournament?: Tournament) => {
    const tournamentsToAnalyze = tournament
      ? [tournament]
      : viewMode === "all"
      ? activeTournaments
      : viewMode === "current"
      ? currentTournament
        ? [currentTournament]
        : []
      : activeTournaments.filter((t) => t.id === viewMode);

    const playerStats = new Map<
      string,
      {
        player: Player;
        tournaments: number;
        goals: number;
        matches: number;
        wins: number;
        draws: number;
        losses: number;
      }
    >();

    tournamentsToAnalyze.forEach((t) => {
      t.teams.forEach((team) => {
        team.players.forEach((player) => {
          const existing = playerStats.get(player.id) || {
            player,
            tournaments: 0,
            goals: 0,
            matches: 0,
            wins: 0,
            draws: 0,
            losses: 0,
          };

          const teamMatches = t.fixtures.filter(
            (m) =>
              m.status === "completed" &&
              (m.team1.id === team.id || m.team2.id === team.id)
          );

          const playerGoals = t.fixtures.reduce((acc, match) => {
            return (
              acc + match.goals.filter((g) => g.playerId === player.id).length
            );
          }, 0);

          teamMatches.forEach((match) => {
            const isTeam1 = match.team1.id === team.id;
            const teamScore = isTeam1 ? match.score1 : match.score2;
            const opponentScore = isTeam1 ? match.score2 : match.score1;

            if (teamScore > opponentScore) existing.wins++;
            else if (teamScore === opponentScore) existing.draws++;
            else existing.losses++;
          });

          existing.tournaments = tournament ? 1 : existing.tournaments + 1;
          existing.goals += playerGoals;
          existing.matches += teamMatches.length;

          playerStats.set(player.id, existing);
        });
      });
    });

    return Array.from(playerStats.values()).sort((a, b) => b.goals - a.goals);
  };

  const calculateTeamStats = (tournament?: Tournament) => {
    const tournamentsToAnalyze = tournament
      ? [tournament]
      : viewMode === "all"
      ? activeTournaments
      : viewMode === "current"
      ? currentTournament
        ? [currentTournament]
        : []
      : activeTournaments.filter((t) => t.id === viewMode);

    const teamStats = new Map();

    tournamentsToAnalyze.forEach((t) => {
      t.teams.forEach((team) => {
        const matches = t.fixtures.filter(
          (m) =>
            m.status === "completed" &&
            (m.team1.id === team.id || m.team2.id === team.id)
        );

        let wins = 0,
          draws = 0,
          losses = 0,
          goalsFor = 0,
          goalsAgainst = 0;

        matches.forEach((match) => {
          const isTeam1 = match.team1.id === team.id;
          const teamScore = isTeam1 ? match.score1 : match.score2;
          const opponentScore = isTeam1 ? match.score2 : match.score1;

          goalsFor += teamScore;
          goalsAgainst += opponentScore;

          if (teamScore > opponentScore) wins++;
          else if (teamScore === opponentScore) draws++;
          else losses++;
        });

        const points = wins * 3 + draws;

        teamStats.set(team.id, {
          team,
          matches: matches.length,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          goalDifference: goalsFor - goalsAgainst,
          points,
        });
      });
    });

    return Array.from(teamStats.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
  };

  const calculateFunFacts = () => {
    const tournamentsToAnalyze =
      viewMode === "all"
        ? activeTournaments
        : viewMode === "current"
        ? currentTournament
          ? [currentTournament]
          : []
        : activeTournaments.filter((t) => t.id === viewMode);

    if (tournamentsToAnalyze.length === 0) return null;

    let earliestGoal = Infinity;
    let latestGoal = -1;
    let highestScoringMatch = { score: 0, match: null as any };
    let mostGoalsInMatch = { goals: 0, playerName: "", count: 0 };
    let longestMatch = { duration: 0, match: null as any };
    let shortestMatch = { duration: Infinity, match: null as any };
    let biggestWin = { margin: 0, match: null as any };
    let mostGoalsPlayer = { playerName: "", goals: 0 };
    let cleanSheets = { playerName: "", count: 0 };
    let hatTricks = [] as Array<{ playerName: string; matchInfo: string }>;

    const playerGoalTotals = new Map<string, number>();

    tournamentsToAnalyze.forEach((tournament) => {
      tournament.fixtures.forEach((match) => {
        if (match.status === "completed") {
          // Check earliest and latest goals
          match.goals.forEach((goal) => {
            if (goal.minute < earliestGoal) earliestGoal = goal.minute;
            if (goal.minute > latestGoal) latestGoal = goal.minute;

            // Track total goals per player
            const currentTotal = playerGoalTotals.get(goal.playerId) || 0;
            playerGoalTotals.set(goal.playerId, currentTotal + 1);
          });

          // Check highest scoring match
          const totalScore = match.score1 + match.score2;
          if (totalScore > highestScoringMatch.score) {
            highestScoringMatch = { score: totalScore, match };
          }

          // Check biggest win margin
          const margin = Math.abs(match.score1 - match.score2);
          if (margin > biggestWin.margin) {
            biggestWin = { margin, match };
          }

          // Check most goals by single player in a match
          const playerGoalCounts = new Map();
          match.goals.forEach((goal) => {
            const current = playerGoalCounts.get(goal.playerId) || 0;
            playerGoalCounts.set(goal.playerId, current + 1);
          });

          for (const [playerId, count] of playerGoalCounts) {
            if (count > mostGoalsInMatch.count) {
              const goal = match.goals.find((g) => g.playerId === playerId);
              mostGoalsInMatch = {
                goals: count,
                playerName: goal?.playerName || "",
                count: count,
              };
            }

            // Check for hat tricks (3+ goals)
            if (count >= 3) {
              const goal = match.goals.find((g) => g.playerId === playerId);
              hatTricks.push({
                playerName: goal?.playerName || "",
                matchInfo: `${match.team1.name} vs ${match.team2.name}`,
              });
            }
          }

          // Check match duration
          if (match.duration > longestMatch.duration) {
            longestMatch = { duration: match.duration, match };
          }
          if (match.duration < shortestMatch.duration && match.duration > 0) {
            shortestMatch = { duration: match.duration, match };
          }

          // Check clean sheets (no goals conceded)
          if (match.score1 === 0) {
            // Team 2 kept clean sheet
            match.team2.players.forEach((player) => {
              // This is simplified - in real scenario you'd track goalkeepers
            });
          }
          if (match.score2 === 0) {
            // Team 1 kept clean sheet
            match.team1.players.forEach((player) => {
              // This is simplified - in real scenario you'd track goalkeepers
            });
          }
        }
      });
    });

    // Find player with most goals overall
    for (const [playerId, goals] of playerGoalTotals) {
      if (goals > mostGoalsPlayer.goals) {
        // Find player name from any tournament
        let playerName = "";
        for (const tournament of tournamentsToAnalyze) {
          for (const team of tournament.teams) {
            const player = team.players.find((p) => p.id === playerId);
            if (player) {
              playerName = player.alias;
              break;
            }
          }
          if (playerName) break;
        }
        mostGoalsPlayer = { playerName, goals };
      }
    }

    return {
      earliestGoal: earliestGoal === Infinity ? null : earliestGoal,
      latestGoal: latestGoal === -1 ? null : latestGoal,
      highestScoringMatch:
        highestScoringMatch.score === 0 ? null : highestScoringMatch,
      mostGoalsInMatch: mostGoalsInMatch.count === 0 ? null : mostGoalsInMatch,
      longestMatch: longestMatch.duration === 0 ? null : longestMatch,
      shortestMatch: shortestMatch.duration === Infinity ? null : shortestMatch,
      biggestWin: biggestWin.margin === 0 ? null : biggestWin,
      mostGoalsPlayer: mostGoalsPlayer.goals === 0 ? null : mostGoalsPlayer,
      hatTricks: hatTricks.length > 0 ? hatTricks : null,
      totalMatches: tournamentsToAnalyze.reduce(
        (acc, t) =>
          acc + t.fixtures.filter((m) => m.status === "completed").length,
        0
      ),
      totalGoals: Array.from(playerGoalTotals.values()).reduce(
        (acc, goals) => acc + goals,
        0
      ),
    };
  };

  const playerStats = calculatePlayerStats();
  const teamStats = calculateTeamStats();
  const funFacts = calculateFunFacts();

  const totalGoals = activeTournaments.reduce(
    (acc, t) =>
      acc +
      t.fixtures.reduce((matchAcc, m) => matchAcc + m.score1 + m.score2, 0),
    0
  );

  const totalMatches = activeTournaments.reduce(
    (acc, t) => acc + t.fixtures.filter((m) => m.status === "completed").length,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Tournament Statistics
        </h1>

        <div className="flex items-center gap-4">
          <Select
            value={viewMode}
            onValueChange={(value) => setViewMode(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Tournament</SelectItem>
              <SelectItem value="all">All Tournaments</SelectItem>
              {activeTournaments.map((tournament) => (
                <SelectItem key={tournament.id} value={tournament.id}>
                  {tournament.name} ({tournament.date})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {viewMode === "current" && currentTournament && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {currentTournament.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {currentTournament.teams.length}
                </div>
                <div className="text-sm text-muted-foreground">Teams</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {
                    currentTournament.fixtures.filter(
                      (m) => m.status === "completed"
                    ).length
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  Matches Played
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {currentTournament.fixtures.reduce(
                    (acc, m) => acc + m.score1 + m.score2,
                    0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Total Goals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {currentTournament.date}
                </div>
                <div className="text-sm text-muted-foreground">Date</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode !== "current" && viewMode !== "all" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {activeTournaments.find((t) => t.id === viewMode)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {activeTournaments.find((t) => t.id === viewMode)?.teams
                    .length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Teams</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {activeTournaments
                    .find((t) => t.id === viewMode)
                    ?.fixtures.filter((m) => m.status === "completed").length ||
                    0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Matches Played
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {activeTournaments
                    .find((t) => t.id === viewMode)
                    ?.fixtures.reduce(
                      (acc, m) => acc + m.score1 + m.score2,
                      0
                    ) || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Goals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {activeTournaments.find((t) => t.id === viewMode)?.date ||
                    "N/A"}
                </div>
                <div className="text-sm text-muted-foreground">Date</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === "all" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Overall Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {activeTournaments.length}
                </div>
                <div className="text-sm text-muted-foreground">Tournaments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {totalMatches}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Matches
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {totalGoals}
                </div>
                <div className="text-sm text-muted-foreground">Total Goals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {totalMatches > 0
                    ? (totalGoals / totalMatches).toFixed(1)
                    : "0"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Goals per Match
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {funFacts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Fun Facts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {funFacts.earliestGoal !== null && (
                <div className="text-center p-4 bg-accent/10 rounded-lg">
                  <Zap className="w-8 h-8 mx-auto text-accent mb-2" />
                  <div className="text-2xl font-bold text-accent">
                    {funFacts.earliestGoal}'
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Earliest Goal
                  </div>
                </div>
              )}

              {funFacts.latestGoal !== null && (
                <div className="text-center p-4 bg-accent/10 rounded-lg">
                  <Clock className="w-8 h-8 mx-auto text-accent mb-2" />
                  <div className="text-2xl font-bold text-accent">
                    {funFacts.latestGoal}'
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Latest Goal
                  </div>
                </div>
              )}

              {funFacts.highestScoringMatch && (
                <div className="text-center p-4 bg-accent/10 rounded-lg">
                  <Trophy className="w-8 h-8 mx-auto text-accent mb-2" />
                  <div className="text-2xl font-bold text-accent">
                    {funFacts.highestScoringMatch.score}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Most Goals in Match
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {funFacts.highestScoringMatch.match.team1.name} vs{" "}
                    {funFacts.highestScoringMatch.match.team2.name}
                  </div>
                </div>
              )}

              {funFacts.mostGoalsInMatch && (
                <div className="text-center p-4 bg-accent/10 rounded-lg">
                  <Target className="w-8 h-8 mx-auto text-accent mb-2" />
                  <div className="text-2xl font-bold text-accent">
                    {funFacts.mostGoalsInMatch.goals}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Most Goals by Player
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {funFacts.mostGoalsInMatch.playerName}
                  </div>
                </div>
              )}

              {funFacts.longestMatch && (
                <div className="text-center p-4 bg-accent/10 rounded-lg">
                  <Clock className="w-8 h-8 mx-auto text-accent mb-2" />
                  <div className="text-2xl font-bold text-accent">
                    {Math.floor(funFacts.longestMatch.duration / 60)}:
                    {(funFacts.longestMatch.duration % 60)
                      .toString()
                      .padStart(2, "0")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Longest Match
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {funFacts.longestMatch.match.team1.name} vs{" "}
                    {funFacts.longestMatch.match.team2.name}
                  </div>
                </div>
              )}

              {funFacts.shortestMatch &&
                funFacts.shortestMatch.duration > 0 && (
                  <div className="text-center p-4 bg-accent/10 rounded-lg">
                    <Zap className="w-8 h-8 mx-auto text-accent mb-2" />
                    <div className="text-2xl font-bold text-accent">
                      {Math.floor(funFacts.shortestMatch.duration / 60)}:
                      {(funFacts.shortestMatch.duration % 60)
                        .toString()
                        .padStart(2, "0")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Shortest Match
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {funFacts.shortestMatch.match.team1.name} vs{" "}
                      {funFacts.shortestMatch.match.team2.name}
                    </div>
                  </div>
                )}

              {funFacts.biggestWin && (
                <div className="text-center p-4 bg-accent/10 rounded-lg">
                  <Trophy className="w-8 h-8 mx-auto text-accent mb-2" />
                  <div className="text-2xl font-bold text-accent">
                    {funFacts.biggestWin.margin}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Biggest Win Margin
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {funFacts.biggestWin.match.team1.name}{" "}
                    {funFacts.biggestWin.match.score1}-
                    {funFacts.biggestWin.match.score2}{" "}
                    {funFacts.biggestWin.match.team2.name}
                  </div>
                </div>
              )}

              {funFacts.mostGoalsPlayer && (
                <div className="text-center p-4 bg-accent/10 rounded-lg">
                  <Star className="w-8 h-8 mx-auto text-accent mb-2" />
                  <div className="text-2xl font-bold text-accent">
                    {funFacts.mostGoalsPlayer.goals}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Top Scorer
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {funFacts.mostGoalsPlayer.playerName}
                  </div>
                </div>
              )}

              {funFacts.hatTricks && funFacts.hatTricks.length > 0 && (
                <div className="text-center p-4 bg-accent/10 rounded-lg">
                  <Target className="w-8 h-8 mx-auto text-accent mb-2" />
                  <div className="text-2xl font-bold text-accent">
                    {funFacts.hatTricks.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Hat Tricks
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {funFacts.hatTricks[0].playerName}
                    {funFacts.hatTricks.length > 1 &&
                      ` +${funFacts.hatTricks.length - 1} more`}
                  </div>
                </div>
              )}

              {funFacts.totalMatches > 0 && (
                <div className="text-center p-4 bg-accent/10 rounded-lg">
                  <Calendar className="w-8 h-8 mx-auto text-accent mb-2" />
                  <div className="text-2xl font-bold text-accent">
                    {(funFacts.totalGoals / funFacts.totalMatches).toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Goals per Match
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6 lg:grid lg:gap-6 lg:grid-cols-2 lg:space-y-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Top Scorers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {playerStats.slice(0, 10).map((stat, index) => (
                <div
                  key={stat.player.id}
                  className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0
                          ? "bg-accent text-accent-foreground"
                          : index === 1
                          ? "bg-secondary text-secondary-foreground"
                          : index === 2
                          ? "bg-muted text-muted-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium truncate max-w-[150px] sm:max-w-none">
                        {stat.player.alias}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-none">
                        {stat.player.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{stat.goals}</div>
                    <div className="text-xs text-muted-foreground">
                      {stat.matches} matches
                    </div>
                  </div>
                </div>
              ))}

              {playerStats.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No player statistics available yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamStats.slice(0, 10).map((stat, index) => (
                <div
                  key={stat.team.id}
                  className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0
                          ? "bg-accent text-accent-foreground"
                          : index === 1
                          ? "bg-secondary text-secondary-foreground"
                          : index === 2
                          ? "bg-muted text-muted-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium truncate max-w-[150px] sm:max-w-none">
                        {stat.team.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stat.wins}W {stat.draws}D {stat.losses}L
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{stat.points}</div>
                    <div className="text-xs text-muted-foreground">
                      {stat.goalDifference > 0 ? "+" : ""}
                      {stat.goalDifference} GD
                    </div>
                  </div>
                </div>
              ))}

              {teamStats.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No team statistics available yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Statistics;
