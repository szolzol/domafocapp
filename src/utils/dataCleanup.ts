// Manual data cleanup script for Firestore
// Run this in browser console if needed

import { firestoreService } from '../services/firestoreService';

/**
 * Manual cleanup function for browser console
 * Usage: await cleanupFirestoreData()
 */
async function cleanupFirestoreData() {
  try {
    console.log('🔧 Starting manual Firestore data cleanup...');
    
    // Run the cleanup
    await firestoreService.cleanupCorruptedData();
    
    console.log('✅ Manual cleanup completed successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Manual cleanup failed:', error);
    return { success: false, error };
  }
}

/**
 * Check data integrity
 */
async function checkDataIntegrity() {
  try {
    console.log('🔍 Checking data integrity...');
    
    const tournaments = await firestoreService.getAllTournaments();
    
    const issues: string[] = [];
    
    for (const tournament of tournaments) {
      // Check teams
      if (!tournament.teams || tournament.teams.length === 0) {
        issues.push(`Tournament "${tournament.name}" has no teams`);
      }
      
      // Check matches
      for (const match of tournament.fixtures || []) {
        // Check goals
        for (const goal of match.goals || []) {
          if (!goal.id || !goal.playerId || !goal.teamId) {
            issues.push(`Invalid goal in match ${match.id}: ${JSON.stringify(goal)}`);
          }
        }
      }
    }
    
    if (issues.length > 0) {
      console.warn('⚠️ Data integrity issues found:');
      issues.forEach(issue => console.warn(`  - ${issue}`));
    } else {
      console.log('✅ Data integrity check passed');
    }
    
    return { issues, tournaments };
  } catch (error) {
    console.error('❌ Data integrity check failed:', error);
    return { error };
  }
}

// Make functions available globally for console use
if (typeof window !== 'undefined') {
  (window as any).cleanupFirestoreData = cleanupFirestoreData;
  (window as any).checkDataIntegrity = checkDataIntegrity;
  
  console.log(`
🔧 Data Cleanup Utilities Available:
  - await cleanupFirestoreData()  // Fix corrupted data
  - await checkDataIntegrity()    // Check for issues
  `);
}

export { cleanupFirestoreData, checkDataIntegrity };
