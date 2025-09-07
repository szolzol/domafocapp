import { useState, useEffect } from "react";
import { firestoreService } from "../services/firestoreService";
import { Tournament } from "../App";

// Custom hook that uses localStorage as primary storage
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}

// Simple localStorage-based replacement for useKV
export function useKVFallback(key: string, defaultValue: string) {
  const [value, setValue] = useLocalStorage(key, defaultValue);

  return [value, setValue] as const;
}

// Enhanced hook for tournament storage with Firestore integration
export function useTournamentStorage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFirestore, setUseFirestore] = useState(false);

  // Local storage fallback
  const [localTournaments, setLocalTournaments] = useLocalStorage<Tournament[]>(
    "tournaments",
    []
  );

  useEffect(() => {
    initializeStorage();
  }, []);

  const initializeStorage = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to load from Firestore first
      const cloudTournaments = await firestoreService.getAllTournaments();
      
      // Validate loaded data
      const validTournaments = cloudTournaments.filter(tournament => {
        if (!tournament.id || !tournament.name) {
          console.warn("Invalid tournament found:", tournament);
          return false;
        }
        return true;
      });
      
      setTournaments(validTournaments);
      setUseFirestore(true);

      // If we have local data but no cloud data, migrate to cloud
      if (validTournaments.length === 0 && localTournaments.length > 0) {
        console.log("Migrating local tournaments to Firestore...");
        await migrateToFirestore(localTournaments);
      }
      
      // Run data cleanup if we have cloud data (only in dev mode)
      if (validTournaments.length > 0 && import.meta.env.DEV) {
        try {
          await firestoreService.cleanupCorruptedData();
        } catch (error) {
          console.warn("Data cleanup failed:", error);
        }
      }
    } catch (error) {
      console.warn("Firestore unavailable, using localStorage:", error);
      setTournaments(localTournaments);
      setUseFirestore(false);
      setError("Using offline mode - changes will not sync");
    } finally {
      setLoading(false);
    }
  };

  const migrateToFirestore = async (localTournaments: Tournament[]) => {
    try {
      for (const tournament of localTournaments) {
        await firestoreService.saveTournament(tournament);
      }
      console.log(
        `Successfully migrated ${localTournaments.length} tournaments to Firestore`
      );

      // Clear local storage after successful migration
      setLocalTournaments([]);
      localStorage.removeItem("tournaments");

      // Reload from Firestore
      const updatedTournaments = await firestoreService.getAllTournaments();
      setTournaments(updatedTournaments);
    } catch (error) {
      console.error("Migration to Firestore failed:", error);
      throw error;
    }
  };

  const saveTournament = async (tournament: Tournament) => {
    try {
      // Validate tournament data before saving
      if (!tournament.id || !tournament.name) {
        throw new Error("Invalid tournament data: missing ID or name");
      }
      
      // Validate teams
      for (const team of tournament.teams) {
        if (!team.id || !team.name) {
          throw new Error(`Invalid team data: ${team.name || 'unnamed team'}`);
        }
      }
      
      // Validate matches and goals
      for (const match of tournament.fixtures) {
        if (!match.id || !match.team1?.id || !match.team2?.id) {
          throw new Error(`Invalid match data: ${match.id || 'unnamed match'}`);
        }
        
        // Validate goals
        for (const goal of match.goals) {
          if (!goal.id || !goal.playerId || !goal.teamId) {
            console.warn("Invalid goal found and will be skipped:", goal);
            // Remove invalid goals
            match.goals = match.goals.filter(g => g.id && g.playerId && g.teamId);
          }
        }
      }

      if (useFirestore) {
        await firestoreService.saveTournament(tournament);
        // Reload tournaments to get updated data
        const updatedTournaments = await firestoreService.getAllTournaments();
        setTournaments(updatedTournaments);
      } else {
        // Fallback to localStorage
        const updatedTournaments = tournaments.map((t) =>
          t.id === tournament.id ? tournament : t
        );
        if (!updatedTournaments.find((t) => t.id === tournament.id)) {
          updatedTournaments.push(tournament);
        }
        setTournaments(updatedTournaments);
        setLocalTournaments(updatedTournaments);
      }
    } catch (error) {
      console.error("Error saving tournament:", error);
      setError("Failed to save tournament");
      throw error;
    }
  };

  const deleteTournament = async (tournamentId: string) => {
    try {
      if (useFirestore) {
        await firestoreService.deleteTournament(tournamentId);
        setTournaments(tournaments.filter((t) => t.id !== tournamentId));
      } else {
        // Fallback to localStorage
        const updatedTournaments = tournaments.filter(
          (t) => t.id !== tournamentId
        );
        setTournaments(updatedTournaments);
        setLocalTournaments(updatedTournaments);
      }
    } catch (error) {
      console.error("Error deleting tournament:", error);
      setError("Failed to delete tournament");
      throw error;
    }
  };

  const retryCloudConnection = async () => {
    await initializeStorage();
  };

  return {
    tournaments,
    loading,
    error,
    useFirestore,
    saveTournament,
    deleteTournament,
    retryCloudConnection,
    migrateToFirestore: () => migrateToFirestore(localTournaments),
    cleanupData: async () => {
      if (useFirestore) {
        try {
          await firestoreService.cleanupCorruptedData();
          // Reload tournaments after cleanup
          const updatedTournaments = await firestoreService.getAllTournaments();
          setTournaments(updatedTournaments);
          return { success: true, message: "Data cleanup completed" };
        } catch (error) {
          console.error("Cleanup failed:", error);
          return { success: false, message: "Cleanup failed" };
        }
      }
      return { success: false, message: "Firestore not available" };
    },
  };
}
