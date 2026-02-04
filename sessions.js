/**
 * Sessions Module
 * Handles session-related logic and calculations
 */
const Sessions = {
    eventIcons: {
        'shot-put': '🔴',
        'discus': '🟠',
        'hammer': '🟡',
        'javelin': '🟢'
    },

    eventNames: {
        'shot-put': 'Shot Put',
        'discus': 'Discus',
        'hammer': 'Hammer',
        'javelin': 'Javelin'
    },

    typeIcons: {
        'technique': '🎯',
        'power': '💪',
        'competition': '🏆',
        'recovery': '🧘'
    },

    rpeDescriptors: {
        1: 'Very Light',
        2: 'Light',
        3: 'Light',
        4: 'Moderate',
        5: 'Moderate',
        6: 'Moderate',
        7: 'Hard',
        8: 'Hard',
        9: 'Very Hard',
        10: 'Maximum'
    },

    weightPresets: {
        'shot-put': [
            { value: 7.26, unit: 'kg', label: '7.26kg (M)' },
            { value: 4, unit: 'kg', label: '4kg (W)' },
            { value: 6, unit: 'kg', label: '6kg (HS)' },
            { value: 5, unit: 'kg', label: '5kg (Train)' }
        ],
        'discus': [
            { value: 2, unit: 'kg', label: '2kg (M)' },
            { value: 1, unit: 'kg', label: '1kg (W)' },
            { value: 1.75, unit: 'kg', label: '1.75kg (HS)' },
            { value: 1.5, unit: 'kg', label: '1.5kg (Train)' }
        ],
        'hammer': [
            { value: 7.26, unit: 'kg', label: '7.26kg (M)' },
            { value: 4, unit: 'kg', label: '4kg (W)' },
            { value: 6, unit: 'kg', label: '6kg (Train)' },
            { value: 5, unit: 'kg', label: '5kg (Train)' }
        ],
        'javelin': [
            { value: 800, unit: 'g', label: '800g (M)' },
            { value: 600, unit: 'g', label: '600g (W)' },
            { value: 700, unit: 'g', label: '700g (Train)' },
            { value: 500, unit: 'g', label: '500g (Train)' }
        ]
    },

    /**
     * Calculate session load (throws × RPE)
     */
    calculateLoad(session) {
        return session.throwCount * session.rpe;
    },

    /**
     * Get sessions for a specific week
     */
    getSessionsForWeek(sessions, weeksAgo = 0) {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() - (weeksAgo * 7));
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        
        return sessions.filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate >= startOfWeek && sessionDate < endOfWeek;
        });
    },

    /**
     * Calculate total load for a week
     */
    calculateWeeklyLoad(sessions) {
        return sessions.reduce((total, session) => {
            return total + this.calculateLoad(session);
        }, 0);
    },

    /**
     * Check if load increase is risky (>20%)
     */
    checkLoadRisk(currentWeekLoad, lastWeekLoad) {
        if (lastWeekLoad === 0) return { risky: false, percentage: 0 };
        
        const percentChange = ((currentWeekLoad - lastWeekLoad) / lastWeekLoad) * 100;
        
        return {
            risky: percentChange > 20,
            percentage: Math.round(percentChange)
        };
    },

    /**
     * Filter sessions based on criteria
     */
    filterSessions(sessions, filters) {
        return sessions.filter(session => {
            if (filters.event && filters.event !== 'all' && session.event !== filters.event) {
                return false;
            }
            if (filters.season && filters.season !== 'all' && session.season !== filters.season) {
                return false;
            }
            if (filters.type && filters.type !== 'all' && session.sessionType !== filters.type) {
                return false;
            }
            if (filters.prOnly && !session.prDay) {
                return false;
            }
            return true;
        });
    },

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    },

    /**
     * Format date for input field
     */
    formatDateForInput(date = new Date()) {
        return date.toISOString().split('T')[0];
    },

    /**
     * Get stats for sessions
     */
    getStats(sessions) {
        const totalSessions = sessions.length;
        const totalThrows = sessions.reduce((sum, s) => sum + s.throwCount, 0);
        const avgRPE = totalSessions > 0 
            ? (sessions.reduce((sum, s) => sum + s.rpe, 0) / totalSessions).toFixed(1)
            : 0;
        const prCount = sessions.filter(s => s.prDay).length;
        
        return { totalSessions, totalThrows, avgRPE, prCount };
    },

    /**
     * Get event breakdown
     */
    getEventBreakdown(sessions) {
        const breakdown = {
            'shot-put': 0,
            'discus': 0,
            'hammer': 0,
            'javelin': 0
        };
        
        sessions.forEach(session => {
            if (breakdown.hasOwnProperty(session.event)) {
                breakdown[session.event]++;
            }
        });
        
        return breakdown;
    },

    /**
     * Get season stats
     */
    getSeasonStats(sessions, season) {
        const seasonSessions = sessions.filter(s => s.season === season);
        return this.getStats(seasonSessions);
    },

    /**
     * Get weekly loads for chart (last 8 weeks)
     */
    getWeeklyLoads(sessions, weeks = 8) {
        const loads = [];
        
        for (let i = weeks - 1; i >= 0; i--) {
            const weekSessions = this.getSessionsForWeek(sessions, i);
            const load = this.calculateWeeklyLoad(weekSessions);
            
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() - (i * 7));
            
            loads.push({
                week: i === 0 ? 'This Week' : `${i}w ago`,
                load: load,
                date: weekStart
            });
        }
        
        return loads;
    }
};
