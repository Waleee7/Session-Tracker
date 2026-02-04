/**
 * Analytics Module
 * Handles analytics calculations and updates
 */
const Analytics = {
    /**
     * Update all analytics displays
     */
    update() {
        const sessions = Storage.getSessions();
        
        this.updateLoadIndicator(sessions);
        this.updateStats(sessions);
        this.updateSeasonComparison(sessions);
        this.updateEventBreakdown(sessions);
        this.updateWeeklyChart(sessions);
    },

    /**
     * Update load indicator with injury risk warning
     */
    updateLoadIndicator(sessions) {
        const thisWeekSessions = Sessions.getSessionsForWeek(sessions, 0);
        const lastWeekSessions = Sessions.getSessionsForWeek(sessions, 1);
        
        const thisWeekLoad = Sessions.calculateWeeklyLoad(thisWeekSessions);
        const lastWeekLoad = Sessions.calculateWeeklyLoad(lastWeekSessions);
        
        const { risky, percentage } = Sessions.checkLoadRisk(thisWeekLoad, lastWeekLoad);
        
        // Update display values
        document.getElementById('thisWeekLoad').textContent = thisWeekLoad;
        document.getElementById('lastWeekLoad').textContent = lastWeekLoad;
        
        // Update percentage change
        const loadChange = document.getElementById('loadChange');
        const prefix = percentage >= 0 ? '+' : '';
        loadChange.querySelector('span').textContent = `${prefix}${percentage}%`;
        
        loadChange.classList.remove('increase', 'decrease', 'neutral');
        if (percentage > 0) {
            loadChange.classList.add('increase');
        } else if (percentage < 0) {
            loadChange.classList.add('decrease');
        } else {
            loadChange.classList.add('neutral');
        }
        
        // Update status indicator
        const loadStatus = document.getElementById('loadStatus');
        loadStatus.classList.remove('safe', 'warning', 'danger');
        
        if (risky) {
            loadStatus.classList.add('danger');
            loadStatus.querySelector('.status-icon').textContent = '⚠️';
            loadStatus.querySelector('.status-text').textContent = 'Load increased >20% - Injury risk elevated!';
            this.showAlert('Weekly load increased by more than 20%. Consider reducing intensity to prevent injury.');
        } else if (percentage > 10) {
            loadStatus.classList.add('warning');
            loadStatus.querySelector('.status-icon').textContent = '⚡';
            loadStatus.querySelector('.status-text').textContent = 'Moderate load increase - Monitor closely';
        } else {
            loadStatus.classList.add('safe');
            loadStatus.querySelector('.status-icon').textContent = '✅';
            loadStatus.querySelector('.status-text').textContent = 'Load is within safe range';
        }
    },

    /**
     * Show alert banner
     */
    showAlert(message) {
        const banner = document.getElementById('alertBanner');
        const text = document.getElementById('alertText');
        text.textContent = message;
        banner.classList.add('show');
    },

    /**
     * Hide alert banner
     */
    hideAlert() {
        const banner = document.getElementById('alertBanner');
        banner.classList.remove('show');
    },

    /**
     * Update overall stats
     */
    updateStats(sessions) {
        const stats = Sessions.getStats(sessions);
        
        document.getElementById('totalSessions').textContent = stats.totalSessions;
        document.getElementById('totalThrows').textContent = stats.totalThrows;
        document.getElementById('avgRPE').textContent = stats.avgRPE;
        document.getElementById('prCount').textContent = stats.prCount;
    },

    /**
     * Update season comparison
     */
    updateSeasonComparison(sessions) {
        const indoorStats = Sessions.getSeasonStats(sessions, 'indoor');
        const outdoorStats = Sessions.getSeasonStats(sessions, 'outdoor');
        
        document.getElementById('indoorSessions').textContent = indoorStats.totalSessions;
        document.getElementById('indoorThrows').textContent = indoorStats.totalThrows;
        document.getElementById('indoorRPE').textContent = indoorStats.avgRPE;
        document.getElementById('indoorPRs').textContent = indoorStats.prCount;
        
        document.getElementById('outdoorSessions').textContent = outdoorStats.totalSessions;
        document.getElementById('outdoorThrows').textContent = outdoorStats.totalThrows;
        document.getElementById('outdoorRPE').textContent = outdoorStats.avgRPE;
        document.getElementById('outdoorPRs').textContent = outdoorStats.prCount;
    },

    /**
     * Update event breakdown bars
     */
    updateEventBreakdown(sessions) {
        const breakdown = Sessions.getEventBreakdown(sessions);
        const maxCount = Math.max(...Object.values(breakdown), 1);
        
        Object.entries(breakdown).forEach(([event, count]) => {
            const barId = 'bar' + event.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
            const countId = 'count' + event.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
            
            const bar = document.getElementById(barId);
            const countEl = document.getElementById(countId);
            
            if (bar) {
                bar.style.width = `${(count / maxCount) * 100}%`;
            }
            if (countEl) {
                countEl.textContent = count;
            }
        });
    },

    /**
     * Update weekly chart
     */
    updateWeeklyChart(sessions) {
        const weeklyLoads = Sessions.getWeeklyLoads(sessions, 8);
        const maxLoad = Math.max(...weeklyLoads.map(w => w.load), 1);
        
        const chartContainer = document.getElementById('weeklyChart');
        const labelsContainer = document.getElementById('chartLabels');
        
        chartContainer.innerHTML = '';
        labelsContainer.innerHTML = '';
        
        weeklyLoads.forEach((week, index) => {
            const height = (week.load / maxLoad) * 100;
            
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.height = `${Math.max(height, 2)}%`;
            
            if (week.load > 0) {
                const value = document.createElement('span');
                value.className = 'chart-bar-value';
                value.textContent = week.load;
                bar.appendChild(value);
            }
            
            chartContainer.appendChild(bar);
            
            const label = document.createElement('span');
            label.className = 'chart-label';
            label.textContent = week.week;
            labelsContainer.appendChild(label);
        });
    }
};