import { useState } from "react";
// Import the new tournament storage hook
import { useTournamentStorage } from "@/hooks/usePersistentStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Calendar,
  Users,
  Trophy,
  BarChart3,
  Trash,
  Upload,
} from "lucide-react";
import { Toaster } from "sonner";
import { toast } from "sonner";
import TournamentSetup from "@/components/TournamentSetup";
import Fixtures from "@/components/Fixtures";
import LiveMatch from "@/components/LiveMatch";
import MatchEditor from "@/components/MatchEditor";
import Statistics from "@/components/Statistics";
import DataImporter from "@/components/DataImporter";
import MigrationStatus from "@/components/MigrationStatus";
import soccerBallImage from "@/assets/images/soccer_ball.png";

export interface Tournament {
  id: string;
  name: string;
  date: string;
  status: "setup" | "active" | "completed";
  teams: Team[];
  fixtures: Match[];
  rounds: number;
  teamSize: number; // 2v2, 3v3, 4v4, 5v5, 6v6
  hasHalfTime: boolean; // Whether matches have half-time breaks
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  stats: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
  };
}

export interface Player {
  id: string;
  name: string;
  alias: string;
  goals: number;
  hat: "first" | "second"; // first = strong, second = weak
}

export interface Match {
  id: string;
  team1: Team;
  team2: Team;
  score1: number;
  score2: number;
  status: "pending" | "live" | "completed";
  round: number;
  duration: number;
  goals: Goal[];
  comments: string;
}

export interface Goal {
  id: string;
  playerId: string;
  playerName: string;
  teamId: string;
  minute: number;
}

function App() {
  const {
    tournaments,
    loading,
    error,
    useFirestore,
    saveTournament: saveTournamentToStorage,
    deleteTournament: deleteTournamentFromStorage,
    retryCloudConnection,
    migrateToFirestore,
    cleanupData,
  } = useTournamentStorage();

  const [currentView, setCurrentView] = useState<
    "home" | "setup" | "fixtures" | "match" | "edit" | "stats"
  >("home");
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    tournamentId: string;
    tournamentName: string;
  }>({
    open: false,
    tournamentId: "",
    tournamentName: "",
  });
  const [deleteText, setDeleteText] = useState("");
  const [showImporter, setShowImporter] = useState(false);

  const createNewTournament = () => {
    const newTournament: Tournament = {
      id: Date.now().toString(),
      name: "",
      date: "",
      status: "setup",
      teams: [],
      fixtures: [],
      rounds: 1,
      teamSize: 2, // Default to 2v2
      hasHalfTime: false, // Default to no half-time
    };
    setSelectedTournament(newTournament);
    setCurrentView("setup");
  };

  const saveTournament = async (tournament: Tournament) => {
    try {
      await saveTournamentToStorage(tournament);
      setSelectedTournament(tournament);
      toast.success("Tournament saved successfully!");
    } catch (error) {
      console.error("Error saving tournament:", error);
      toast.error("Failed to save tournament");
    }
  };

  const selectTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    if (tournament.status === "setup") {
      setCurrentView("setup");
    } else {
      setCurrentView("fixtures");
    }
  };

  const startMatch = (match: Match) => {
    setSelectedMatch(match);
    setCurrentView("match");
  };

  const editMatch = (match: Match) => {
    setSelectedMatch(match);
    setCurrentView("edit");
  };

  const deleteTournament = async (tournamentId: string) => {
    try {
      await deleteTournamentFromStorage(tournamentId);

      // If we're viewing the deleted tournament, go back to home
      if (selectedTournament?.id === tournamentId) {
        setSelectedTournament(null);
        setCurrentView("home");
      }

      // Reset delete confirmation state
      setDeleteConfirmation({
        open: false,
        tournamentId: "",
        tournamentName: "",
      });
      setDeleteText("");

      toast.success("Tournament deleted successfully");
    } catch (error) {
      console.error("Error deleting tournament:", error);
      toast.error("Failed to delete tournament");
    }
  };

  const openDeleteConfirmation = (
    tournamentId: string,
    tournamentName: string
  ) => {
    setDeleteConfirmation({
      open: true,
      tournamentId,
      tournamentName,
    });
    setDeleteText("");
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      open: false,
      tournamentId: "",
      tournamentName: "",
    });
    setDeleteText("");
  };

  const confirmDelete = () => {
    if (deleteText === "DELETE") {
      deleteTournament(deleteConfirmation.tournamentId);
    }
  };

  const updateMatch = (updatedMatch: Match) => {
    if (!selectedTournament) return;

    const updatedTournament = {
      ...selectedTournament,
      fixtures: selectedTournament.fixtures.map((m) =>
        m.id === updatedMatch.id ? updatedMatch : m
      ),
    };

    saveTournament(updatedTournament);
    setSelectedMatch(updatedMatch);
  };

  const handleImportTournaments = async (importedTournaments: Tournament[]) => {
    try {
      for (const tournament of importedTournaments) {
        await saveTournamentToStorage(tournament);
      }
      setShowImporter(false);
      toast.success(
        `Successfully imported ${importedTournaments.length} tournaments`
      );
    } catch (error) {
      console.error("Error importing tournaments:", error);
      toast.error("Failed to import tournaments");
    }
  };

  const renderHomeScreen = () => (
    <div className="min-h-screen p-4 sm:p-6 bg-slate-100">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 flex items-center justify-center">
            <img
              src={soccerBallImage}
              alt="Soccer Ball"
              className="w-16 h-12 object-contain"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">DomaFocApp</h1>
            <p className="text-muted-foreground">
              Friendly Football Tournament Manager
            </p>
            <div className="flex items-center gap-2 mt-2">
              {useFirestore ? (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600">
                  ☁️ Cloud Data Sync
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-orange-600 border-orange-600">
                  📱 Offline Mode
                </Badge>
              )}
              {error && (
                <Badge variant="destructive" className="text-xs">
                  {error}
                </Badge>
              )}
              {/* Debug cleanup button - only in development */}
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={createNewTournament}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="w-5 h-5" />
                Create Tournament
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Start a new friendly tournament
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setCurrentView("stats")}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View tournament statistics
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setShowImporter(true)}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="w-5 h-5" />
                Import Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Import from Excel/CSV
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Tournaments</h2>
          {tournaments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No tournaments yet. Create your first tournament to get
                  started!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {tournaments.map((tournament) => (
                <Card
                  key={tournament.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => selectTournament(tournament)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex-1">
                        {tournament.name || "Unnamed Tournament"}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            tournament.status === "setup"
                              ? "secondary"
                              : tournament.status === "active"
                              ? "default"
                              : "outline"
                          }>
                          {tournament.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteConfirmation(
                              tournament.id,
                              tournament.name || "Unnamed Tournament"
                            );
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete tournament">
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {tournament.date || "No date set"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {tournament.teams.length} teams
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmation.open}
        onOpenChange={closeDeleteConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tournament</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "
              {deleteConfirmation.tournamentName}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="delete-text" className="text-sm font-medium">
              Type "DELETE" to confirm:
            </Label>
            <Input
              id="delete-text"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="DELETE"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteConfirmation}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteText !== "DELETE"}>
              Delete Tournament
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data Import Dialog */}
      <DataImporter
        isOpen={showImporter}
        onClose={() => setShowImporter(false)}
        onImport={handleImportTournaments}
      />
    </div>
  );

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  if (currentView === "home") return renderHomeScreen();

  return (
    <>
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                setCurrentView("home");
                setSelectedTournament(null);
                setSelectedMatch(null);
              }}
              className="text-lg font-semibold self-start">
              ← DomaFocApp
            </Button>

            {selectedTournament && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-semibold truncate max-w-[200px] sm:max-w-none">
                    {selectedTournament.name || "Unnamed Tournament"}
                  </h1>
                </div>
                <div className="flex gap-2">
                  {selectedTournament.status !== "setup" && (
                    <>
                      <Button
                        variant={
                          currentView === "fixtures" ? "default" : "ghost"
                        }
                        size="sm"
                        onClick={() => setCurrentView("fixtures")}>
                        Fixtures
                      </Button>
                      <Button
                        variant={currentView === "stats" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCurrentView("stats")}>
                        Stats
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-4 sm:p-6 pb-8 sm:pb-6">
          {currentView === "setup" && selectedTournament && (
            <TournamentSetup
              tournament={selectedTournament}
              onSave={saveTournament}
              onComplete={(tournament) => {
                saveTournament(tournament);
                setCurrentView("fixtures");
              }}
            />
          )}

          {currentView === "fixtures" && selectedTournament && (
            <Fixtures
              tournament={selectedTournament}
              onStartMatch={startMatch}
              onEditMatch={editMatch}
              onUpdateTournament={saveTournament}
            />
          )}

          {currentView === "match" && selectedMatch && selectedTournament && (
            <LiveMatch
              match={selectedMatch}
              tournament={selectedTournament}
              onUpdateMatch={updateMatch}
              onEndMatch={() => setCurrentView("fixtures")}
            />
          )}

          {currentView === "edit" && selectedMatch && selectedTournament && (
            <MatchEditor
              match={selectedMatch}
              tournament={selectedTournament}
              onSave={(updatedMatch) => {
                updateMatch(updatedMatch);
                setCurrentView("fixtures");
              }}
              onCancel={() => setCurrentView("fixtures")}
            />
          )}

          {currentView === "stats" && (
            <Statistics
              tournaments={tournaments}
              selectedTournament={selectedTournament}
            />
          )}
        </main>
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
            border: "1px solid hsl(var(--border))",
          },
        }}
      />
    </>
  );
}

export default App;
