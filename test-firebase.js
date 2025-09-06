// Firebase Connection Test
// Run this in browser console to test Firebase integration

console.log('🔥 Testing Firebase Connection...');

async function testFirebaseConnection() {
  try {
    // Test Firestore connection
    const { firestoreService } = await import('./services/firestoreService.js');
    
    console.log('✅ Firebase SDK loaded successfully');
    
    // Test getting tournaments (should work even if empty)
    const tournaments = await firestoreService.getAllTournaments();
    console.log('✅ Firestore connection successful');
    console.log(`📊 Found ${tournaments.length} tournaments in Firestore`);
    
    // Test creating a simple test tournament
    const testTournament = {
      id: 'test_' + Date.now(),
      name: 'Firebase Test Tournament',
      date: new Date().toISOString().split('T')[0],
      status: 'setup',
      teams: [],
      fixtures: [],
      rounds: 1,
      teamSize: 2,
      hasHalfTime: false
    };
    
    await firestoreService.saveTournament(testTournament);
    console.log('✅ Tournament saved to Firestore successfully');
    
    // Clean up test tournament
    await firestoreService.deleteTournament(testTournament.id);
    console.log('✅ Test tournament cleaned up');
    
    console.log('🎉 Firebase integration is working perfectly!');
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    console.log('📱 App will fall back to localStorage');
  }
}

// Run the test
testFirebaseConnection();
