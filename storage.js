/**
 * Storage Module
 * Handles all localStorage operations
 */
const Storage = {
    KEYS: {
        SESSIONS: 'throwtracker_sessions',
        SETTINGS: 'throwtracker_settings',
        STREAK: 'throwtracker_streak'
    },

    /**
     * Get sessions from storage
     */
    getSessions() {
        try {
            const data = localStorage.getItem(this.KEYS.SESSIONS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading sessions:', error);
            return [];
        }
    },

    /**
     * Save sessions to storage
     */
    saveSessions(sessions) {
        try {
            localStorage.setItem(this.KEYS.SESSIONS, JSON.stringify(sessions));
            return true;
        } catch (error) {
            console.error('Error saving sessions:', error);
            return false;
        }
    },

    /**
     * Add a new session
     */
    addSession(session) {
        const sessions = this.getSessions();
        const newSession = {
            ...session,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
        };
        sessions.unshift(newSession);
        this.saveSessions(sessions);
        return newSession;
    },

    /**
     * Delete a session by ID
     */
    deleteSession(id) {
        const sessions = this.getSessions();
        const filtered = sessions.filter(s => s.id !== id);
        this.saveSessions(filtered);
    },

    /**
     * Get settings from storage
     */
    getSettings() {
        try {
            const data = localStorage.getItem(this.KEYS.SETTINGS);
            return data ? JSON.parse(data) : {
                weightUnit: 'kg',
                distanceUnit: 'm',
                athleteName: '',
                primaryEvent: ''
            };
        } catch (error) {
            console.error('Error reading settings:', error);
            return {};
        }
    },

    /**
     * Save settings to storage
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    },

    /**
     * Get streak data from storage
     */
    getStreak() {
        try {
            const data = localStorage.getItem(this.KEYS.STREAK);
            return data ? JSON.parse(data) : {
                current: 0,
                lastLogDate: null
            };
        } catch (error) {
            console.error('Error reading streak:', error);
            return { current: 0, lastLogDate: null };
        }
    },

    /**
     * Save streak data
     */
    saveStreak(streak) {
        try {
            localStorage.setItem(this.KEYS.STREAK, JSON.stringify(streak));
            return true;
        } catch (error) {
            console.error('Error saving streak:', error);
            return false;
        }
    },

    /**
     * Clear all data
     */
    clearAll() {
        try {
            localStorage.removeItem(this.KEYS.SESSIONS);
            localStorage.removeItem(this.KEYS.STREAK);
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }
};