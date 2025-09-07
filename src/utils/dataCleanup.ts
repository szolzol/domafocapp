// Manual data cleanup script for Firestore
// Run this in browser console if needed

import { firestoreService } from "../services/firestoreService";

/**
 * Manual cleanup function for browser console
 * Usage: await cleanupFirestoreData()
 */
async function cleanupFirestoreData() {
  try {
    console.log("🔧 Starting manual Firestore data cleanup...");

    // Run the cleanup
    await firestoreService.cleanupCorruptedData();

    console.log("✅ Manual cleanup completed successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Manual cleanup failed:", error);
    return { success: false, error };
  }
}

/**
 * Clean up orphaned match_events collection
 * This collection is not used by the current app
 */
async function cleanupOrphanedMatchEvents() {
  try {
    console.log("🗑️ Cleaning up orphaned match_events collection...");

    // Note: This would require direct Firestore admin access
    // For now, just log what we found
    console.warn(
      "⚠️ match_events collection detected but not used by current app"
    );
    console.warn(
      "💡 Consider manually deleting this collection from Firebase Console"
    );
    console.warn(
      "🔗 https://console.firebase.google.com/project/domafocapp/firestore"
    );

    return {
      success: true,
      message: "match_events collection cleanup requires manual intervention",
    };
  } catch (error) {
    console.error("❌ match_events cleanup failed:", error);
    return { success: false, error };
  }
}

/**
 * Check data integrity
 */
async function checkDataIntegrity() {
  try {
    console.log("🔍 Checking data integrity...");

    const tournaments = await firestoreService.getAllTournaments();

    const issues: string[] = [];

    for (const tournament of tournaments) {
      // Check for invalid tournament IDs (should not have 'team' prefix)
      if (tournament.id.startsWith("team_")) {
        issues.push(
          `Tournament "${tournament.name}" has invalid ID with 'team' prefix: ${tournament.id}`
        );
      }

      // Check teams
      if (!tournament.teams || tournament.teams.length === 0) {
        issues.push(`Tournament "${tournament.name}" has no teams`);
      }

      // Check matches
      for (const match of tournament.fixtures || []) {
        // Check for generic match IDs (should be tournament-specific now)
        if (/^\d+$/.test(match.id)) {
          issues.push(
            `Match has generic ID "${match.id}" in tournament "${tournament.name}"`
          );
        }

        // Check goals
        for (const goal of match.goals || []) {
          if (!goal.id || !goal.playerId || !goal.teamId) {
            issues.push(
              `Invalid goal in match ${match.id}: ${JSON.stringify(goal)}`
            );
          }
        }
      }
    }

    if (issues.length > 0) {
      console.warn("⚠️ Data integrity issues found:");
      issues.forEach((issue) => console.warn(`  - ${issue}`));
    } else {
      console.log("✅ Data integrity check passed");
    }

    return { issues, tournaments };
  } catch (error) {
    console.error("❌ Data integrity check failed:", error);
    return { error };
  }
}

// Make functions available globally for console use
if (typeof window !== "undefined") {
  (window as any).cleanupFirestoreData = cleanupFirestoreData;
  (window as any).cleanupOrphanedMatchEvents = cleanupOrphanedMatchEvents;
  (window as any).checkDataIntegrity = checkDataIntegrity;

  console.log(`
🔧 Data Cleanup Utilities Available:
  - await cleanupFirestoreData()        // Fix corrupted data
  - await cleanupOrphanedMatchEvents()  // Info about match_events cleanup
  - await checkDataIntegrity()          // Check for issues
  `);
}

export { cleanupFirestoreData, cleanupOrphanedMatchEvents, checkDataIntegrity };
