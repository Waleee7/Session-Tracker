/**
 * Main Application Entry Point
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    UI.init();
    
    console.log('🎯 ThrowTracker initialized');
    
    // Check for load warning on startup
    const sessions = Storage.getSessions();
    const thisWeekSessions = Sessions.getSessionsForWeek(sessions, 0);
    const lastWeekSessions = Sessions.getSessionsForWeek(sessions, 1);
    
    const thisWeekLoad = Sessions.calculateWeeklyLoad(thisWeekSessions);
    const lastWeekLoad = Sessions.calculateWeeklyLoad(lastWeekSessions);
    
    const { risky } = Sessions.checkLoadRisk(thisWeekLoad, lastWeekLoad);
    
    if (risky) {
        Analytics.showAlert('⚠️ Your weekly load has increased by more than 20%. Consider reducing intensity to prevent injury.');
    }
});
