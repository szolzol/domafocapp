import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  writeBatch,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Tournament, Team, Player, Match, Goal } from "../App";

export class FirestoreService {
  // Collections
  private readonly tournamentsCollection = "tournaments";
  private readonly teamsCollection = "teams";
  private readonly playersCollection = "players";
  private readonly matchesCollection = "matches";
  private readonly goalsCollection = "goals";

  // Tournament operations
  async getAllTournaments(): Promise<Tournament[]> {
    try {
      const tournamentsRef = collection(db, this.tournamentsCollection);
      const querySnapshot = await getDocs(
        query(tournamentsRef, orderBy("date", "desc"))
      );

      const tournaments: Tournament[] = [];

      for (const tourDoc of querySnapshot.docs) {
        const tournamentData = {
          id: tourDoc.id,
          ...tourDoc.data(),
        } as Tournament;

        // Get teams for this tournament
        const teamsRef = collection(db, this.teamsCollection);
        const teamsQuery = query(
          teamsRef,
          where("tournamentId", "==", tourDoc.id)
        );
        const teamsSnapshot = await getDocs(teamsQuery);

        tournamentData.teams = [];
        for (const teamDoc of teamsSnapshot.docs) {
          const teamData = { id: teamDoc.id, ...teamDoc.data() } as Team;

          // Get players for this team
          const playersRef = collection(db, this.playersCollection);
          const playersQuery = query(
            playersRef,
            where("teamId", "==", teamDoc.id)
          );
          const playersSnapshot = await getDocs(playersQuery);

          teamData.players = playersSnapshot.docs.map((playerDoc) => ({
            id: playerDoc.id,
            ...playerDoc.data(),
          })) as Player[];

          tournamentData.teams.push(teamData);
        }

        // Get matches for this tournament
        const matchesRef = collection(db, this.matchesCollection);
        const matchesQuery = query(
          matchesRef,
          where("tournamentId", "==", tourDoc.id)
        );
        const matchesSnapshot = await getDocs(matchesQuery);

        tournamentData.fixtures = [];
        for (const matchDoc of matchesSnapshot.docs) {
          const matchData = { id: matchDoc.id, ...matchDoc.data() } as Match;

          // Get goals for this match
          const goalsRef = collection(db, this.goalsCollection);
          const goalsQuery = query(
            goalsRef,
            where("matchId", "==", matchDoc.id),
            where("tournamentId", "==", tourDoc.id) // FIX: Add tournament filter for data integrity
          );
          const goalsSnapshot = await getDocs(goalsQuery);

          matchData.goals = goalsSnapshot.docs.map((goalDoc) => ({
            id: goalDoc.id,
            ...goalDoc.data(),
          })) as Goal[];

          // Find team objects
          matchData.team1 =
            tournamentData.teams.find((t) => t.id === matchData.team1?.id) ||
            matchData.team1;
          matchData.team2 =
            tournamentData.teams.find((t) => t.id === matchData.team2?.id) ||
            matchData.team2;

          tournamentData.fixtures.push(matchData);
        }

        tournaments.push(tournamentData);
      }

      return tournaments;
    } catch (error) {
      console.error("Error getting tournaments:", error);
      throw error;
    }
  }

  async saveTournament(tournament: Tournament): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Save tournament
      const tournamentRef = doc(db, this.tournamentsCollection, tournament.id);
      const tournamentData = {
        name: tournament.name,
        date: tournament.date,
        status: tournament.status,
        rounds: tournament.rounds,
        teamSize: tournament.teamSize,
        hasHalfTime: tournament.hasHalfTime,
        updatedAt: Timestamp.now(),
      };
      batch.set(tournamentRef, tournamentData);

      // Save teams
      for (const team of tournament.teams) {
        const teamRef = doc(db, this.teamsCollection, team.id);
        const teamData = {
          tournamentId: tournament.id,
          name: team.name,
          stats: team.stats,
        };
        batch.set(teamRef, teamData);

        // Save players
        for (const player of team.players) {
          const playerRef = doc(db, this.playersCollection, player.id);
          const playerData = {
            teamId: team.id,
            name: player.name,
            alias: player.alias,
            hat: player.hat,
            goals: player.goals,
          };
          batch.set(playerRef, playerData);
        }
      }

      // Save matches
      for (const match of tournament.fixtures) {
        const matchRef = doc(db, this.matchesCollection, match.id);
        const matchData = {
          tournamentId: tournament.id,
          team1: { id: match.team1.id, name: match.team1.name },
          team2: { id: match.team2.id, name: match.team2.name },
          score1: match.score1,
          score2: match.score2,
          status: match.status,
          round: match.round,
          duration: match.duration,
          comments: match.comments || "",
        };
        batch.set(matchRef, matchData);

        // Save goals
        for (const goal of match.goals) {
          const goalRef = doc(db, this.goalsCollection, goal.id);
          const goalData = {
            matchId: match.id,
            tournamentId: tournament.id, // FIX: Add missing tournament ID
            playerId: goal.playerId,
            playerName: goal.playerName,
            teamId: goal.teamId,
            minute: goal.minute,
          };
          batch.set(goalRef, goalData);
        }
      }

      await batch.commit();
      console.log("Tournament saved successfully to Firestore");
    } catch (error) {
      console.error("Error saving tournament:", error);
      throw error;
    }
  }

  async deleteTournament(tournamentId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Delete goals - use tournament ID for better data integrity
      const goalsRef = collection(db, this.goalsCollection);
      const goalsQuery = query(
        goalsRef,
        where("tournamentId", "==", tournamentId)
      );
      const goalsSnapshot = await getDocs(goalsQuery);
      goalsSnapshot.docs.forEach((goalDoc) => {
        batch.delete(goalDoc.ref);
      });

      // Also delete goals by match ID as fallback for existing data
      const matchesRef = collection(db, this.matchesCollection);
      const matchesQuery = query(
        matchesRef,
        where("tournamentId", "==", tournamentId)
      );
      const matchesSnapshot = await getDocs(matchesQuery);

      for (const matchDoc of matchesSnapshot.docs) {
        const goalsByMatchQuery = query(
          goalsRef,
          where("matchId", "==", matchDoc.id)
        );
        const goalsByMatchSnapshot = await getDocs(goalsByMatchQuery);
        goalsByMatchSnapshot.docs.forEach((goalDoc) => {
          batch.delete(goalDoc.ref);
        });
      }

      // Delete matches
      matchesSnapshot.docs.forEach((matchDoc) => {
        batch.delete(matchDoc.ref);
      });

      // Delete players
      const playersRef = collection(db, this.playersCollection);
      const teamsRef = collection(db, this.teamsCollection);
      const teamsQuery = query(
        teamsRef,
        where("tournamentId", "==", tournamentId)
      );
      const teamsSnapshot = await getDocs(teamsQuery);

      for (const teamDoc of teamsSnapshot.docs) {
        const playersQuery = query(
          playersRef,
          where("teamId", "==", teamDoc.id)
        );
        const playersSnapshot = await getDocs(playersQuery);
        playersSnapshot.docs.forEach((playerDoc) => {
          batch.delete(playerDoc.ref);
        });
      }

      // Delete teams
      teamsSnapshot.docs.forEach((teamDoc) => {
        batch.delete(teamDoc.ref);
      });

      // Delete tournament
      const tournamentRef = doc(db, this.tournamentsCollection, tournamentId);
      batch.delete(tournamentRef);

      await batch.commit();
      console.log("Tournament deleted successfully from Firestore");
    } catch (error) {
      console.error("Error deleting tournament:", error);
      throw error;
    }
  }

  // Real-time subscription for tournaments
  subscribeToTournaments(
    callback: (tournaments: Tournament[]) => void
  ): () => void {
    const tournamentsRef = collection(db, this.tournamentsCollection);
    const q = query(tournamentsRef, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const tournaments = await this.getAllTournaments();
        callback(tournaments);
      } catch (error) {
        console.error("Error in tournament subscription:", error);
      }
    });

    return unsubscribe;
  }

  // Data cleanup utility to fix corrupted data
  async cleanupCorruptedData(): Promise<void> {
    try {
      console.log("Starting data cleanup...");

      // 1. Fix goals without tournament ID
      const goalsRef = collection(db, this.goalsCollection);
      const allGoalsSnapshot = await getDocs(goalsRef);

      const batch = writeBatch(db);
      let fixedGoals = 0;

      for (const goalDoc of allGoalsSnapshot.docs) {
        const goalData = goalDoc.data();

        // If goal has no tournamentId, try to find it from the match
        if (!goalData.tournamentId && goalData.matchId) {
          const matchRef = doc(db, this.matchesCollection, goalData.matchId);
          const matchSnapshot = await getDoc(matchRef);

          if (matchSnapshot.exists()) {
            const matchData = matchSnapshot.data();
            if (matchData.tournamentId) {
              // Update goal with tournament ID
              batch.update(goalDoc.ref, {
                tournamentId: matchData.tournamentId,
              });
              fixedGoals++;
            }
          }
        }
      }

      if (fixedGoals > 0) {
        await batch.commit();
        console.log(`Fixed ${fixedGoals} goals with missing tournament IDs`);
      }

      // 2. Remove orphaned goals (goals with non-existent match or tournament)
      await this.removeOrphanedGoals();

      console.log("Data cleanup completed");
    } catch (error) {
      console.error("Error during data cleanup:", error);
      throw error;
    }
  }

  private async removeOrphanedGoals(): Promise<void> {
    const goalsRef = collection(db, this.goalsCollection);
    const allGoalsSnapshot = await getDocs(goalsRef);

    const batch = writeBatch(db);
    let removedGoals = 0;

    for (const goalDoc of allGoalsSnapshot.docs) {
      const goalData = goalDoc.data();

      // Check if match exists
      if (goalData.matchId) {
        const matchRef = doc(db, this.matchesCollection, goalData.matchId);
        const matchSnapshot = await getDoc(matchRef);

        if (!matchSnapshot.exists()) {
          // Match doesn't exist, remove goal
          batch.delete(goalDoc.ref);
          removedGoals++;
          continue;
        }
      }

      // Check if tournament exists
      if (goalData.tournamentId) {
        const tournamentRef = doc(
          db,
          this.tournamentsCollection,
          goalData.tournamentId
        );
        const tournamentSnapshot = await getDoc(tournamentRef);

        if (!tournamentSnapshot.exists()) {
          // Tournament doesn't exist, remove goal
          batch.delete(goalDoc.ref);
          removedGoals++;
        }
      }
    }

    if (removedGoals > 0) {
      await batch.commit();
      console.log(`Removed ${removedGoals} orphaned goals`);
    }
  }
}

export const firestoreService = new FirestoreService();
