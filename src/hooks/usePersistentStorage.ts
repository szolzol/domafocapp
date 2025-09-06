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
      setTournaments(cloudTournaments);
      setUseFirestore(true);

      // If we have local data but no cloud data, migrate to cloud
      if (cloudTournaments.length === 0 && localTournaments.length > 0) {
        console.log("Migrating local tournaments to Firestore...");
        await migrateToFirestore(localTournaments);
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
  };
}
