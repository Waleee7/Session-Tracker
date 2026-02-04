/**
 * UI Module
 * Handles all UI updates and interactions
 */
const UI = {
    currentSessionId: null,

    /**
     * Initialize UI components
     */
    init() {
        this.initTabs();
        this.initForm();
        this.initFilters();
        this.initModal();
        this.initSettings();
        this.updateStreak();
        this.updateSessionList();
        Analytics.update();
    },

    /**
     * Initialize tab navigation
     */
    initTabs() {
        const tabs = document.querySelectorAll('.nav-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`tab-${tabId}`).classList.add('active');
                
                if (tabId === 'analytics') {
                    Analytics.update();
                }
            });
        });
    },

    /**
     * Initialize form interactions
     */
    initForm() {
        const form = document.getElementById('sessionForm');
        
        document.getElementById('sessionDate').value = Sessions.formatDateForInput();
        
        // Event selection
        document.querySelectorAll('.event-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.event-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('selectedEvent').value = btn.dataset.event;
                this.updateWeightPresets(btn.dataset.event);
            });
        });
        
        // Session type selection
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('selectedType').value = btn.dataset.type;
            });
        });
        
        // Season selection
        document.querySelectorAll('.season-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('selectedSeason').value = btn.dataset.season;
            });
        });
        
        // Stepper buttons
        document.querySelectorAll('.stepper-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = document.getElementById(btn.dataset.target);
                const step = btn.classList.contains('plus') ? 1 : -1;
                const newValue = parseInt(target.value) + step;
                target.value = Math.max(1, Math.min(100, newValue));
            });
        });
        
        // RPE slider
        const rpeSlider = document.getElementById('rpeSlider');
        rpeSlider.addEventListener('input', () => {
            const value = rpeSlider.value;
            document.getElementById('rpeDisplay').textContent = value;
            document.getElementById('rpeDescriptor').textContent = Sessions.rpeDescriptors[value];
        });
        
        // PR Day toggle
        const prDayToggle = document.getElementById('prDay');
        prDayToggle.addEventListener('change', () => {
            document.getElementById('prDistanceGroup').style.display = 
                prDayToggle.checked ? 'block' : 'none';
        });
        
        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSession();
        });

        // Load settings
        const settings = Storage.getSettings();
        document.getElementById('weightUnit').value = settings.weightUnit || 'kg';
        document.getElementById('distanceUnit').value = settings.distanceUnit || 'm';
    },

    /**
     * Update weight presets based on event
     */
    updateWeightPresets(event) {
        const container = document.getElementById('weightPresets');
        const presets = Sessions.weightPresets[event] || [];
        
        container.innerHTML = presets.map(preset => 
            `<button type="button" class="weight-preset" data-value="${preset.value}" data-unit="${preset.unit}">
                ${preset.label}
            </button>`
        ).join('');
        
        container.querySelectorAll('.weight-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('implementWeight').value = btn.dataset.value;
            });
        });
    },

    /**
     * Save session from form
     */
    saveSession() {
        const event = document.getElementById('selectedEvent').value;
        const sessionType = document.getElementById('selectedType').value;
        
        if (!event) {
            this.showToast('Please select an event', 'error');
            return;
        }
        
        if (!sessionType) {
            this.showToast('Please select a session type', 'error');
            return;
        }
        
        const session = {
            date: document.getElementById('sessionDate').value,
            event: event,
            sessionType: sessionType,
            season: document.getElementById('selectedSeason').value,
            throwCount: parseInt(document.getElementById('throwCount').value),
            implementWeight: parseFloat(document.getElementById('implementWeight').value),
            weightUnit: document.getElementById('weightUnit').value,
            rpe: parseInt(document.getElementById('rpeSlider').value),
            prDay: document.getElementById('prDay').checked,
            prDistance: document.getElementById('prDistance').value || null,
            distanceUnit: document.getElementById('distanceUnit').value,
            notes: document.getElementById('sessionNotes').value,
            coachNotes: document.getElementById('coachNotes').value
        };
        
        Storage.addSession(session);
        this.updateStreak();
        this.resetForm();
        this.updateSessionList();
        Analytics.update();
        this.showToast('Session saved!', 'success');
    },

    /**
     * Reset form to defaults
     */
    resetForm() {
        document.getElementById('sessionForm').reset();
        document.getElementById('sessionDate').value = Sessions.formatDateForInput();
        document.querySelectorAll('.event-btn, .type-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.season-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.season === 'indoor');
        });
        document.getElementById('selectedEvent').value = '';
        document.getElementById('selectedType').value = '';
        document.getElementById('selectedSeason').value = 'indoor';
        document.getElementById('throwCount').value = 20;
        document.getElementById('rpeSlider').value = 5;
        document.getElementById('rpeDisplay').textContent = '5';
        document.getElementById('rpeDescriptor').textContent = 'Moderate';
        document.getElementById('prDistanceGroup').style.display = 'none';
        document.getElementById('weightPresets').innerHTML = '';
    },

    /**
     * Initialize filters
     */
    initFilters() {
        const filterIds = ['filterEvent', 'filterSeason', 'filterType', 'filterPR'];
        
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            element.addEventListener('change', () => this.updateSessionList());
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            const sessions = this.getFilteredSessions();
            Export.toCSV(sessions);
        });
    },

    /**
     * Get filtered sessions
     */
    getFilteredSessions() {
        const sessions = Storage.getSessions();
        const filters = {
            event: document.getElementById('filterEvent').value,
            season: document.getElementById('filterSeason').value,
            type: document.getElementById('filterType').value,
            prOnly: document.getElementById('filterPR').checked
        };
        
        return Sessions.filterSessions(sessions, filters);
    },

    /**
     * Update session list display
     */
    updateSessionList() {
        const container = document.getElementById('sessionList');
        const sessions = this.getFilteredSessions();
        
        if (sessions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📋</span>
                    <p>No sessions found</p>
                    <p class="empty-hint">Try adjusting your filters or log a new session</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = sessions.map(session => this.createSessionCard(session)).join('');
        
        container.querySelectorAll('.session-item').forEach(item => {
            item.addEventListener('click', () => {
                this.showSessionDetail(item.dataset.id);
            });
        });
    },

    /**
     * Create session card HTML
     */
    createSessionCard(session) {
        const rpeClass = session.rpe <= 4 ? 'low' : session.rpe <= 7 ? 'medium' : 'high';
        const eventIcon = Sessions.eventIcons[session.event] || '🎯';
        const eventName = Sessions.eventNames[session.event] || session.event;
        
        return `
            <div class="session-item" data-id="${session.id}">
                <div class="session-event-icon ${session.event}">
                    ${eventIcon}
                </div>
                <div class="session-details">
                    <div class="session-title">
                        ${eventName}
                        ${session.prDay ? '<span class="badge pr">PR</span>' : ''}
                    </div>
                    <div class="session-meta">
                        <span>${Sessions.formatDate(session.date)}</span>
                        <span>${session.throwCount} throws</span>
                        <span>${session.sessionType}</span>
                    </div>
                    <div class="session-badges">
                        <span class="badge season">${session.season}</span>
                    </div>
                </div>
                <div class="session-rpe">
                    <div class="rpe-circle ${rpeClass}">${session.rpe}</div>
                    <span class="rpe-label">RPE</span>
                </div>
            </div>
        `;
    },

    /**
     * Initialize modal
     */
    initModal() {
        const modal = document.getElementById('sessionModal');
        const closeBtn = document.getElementById('modalClose');
        const doneBtn = document.getElementById('modalDone');
        const deleteBtn = document.getElementById('modalDelete');
        
        closeBtn.addEventListener('click', () => this.hideModal());
        doneBtn.addEventListener('click', () => this.hideModal());
        
        deleteBtn.addEventListener('click', () => {
            if (this.currentSessionId && confirm('Delete this session?')) {
                Storage.deleteSession(this.currentSessionId);
                this.hideModal();
                this.updateSessionList();
                Analytics.update();
                this.showToast('Session deleted', 'success');
            }
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideModal();
        });
    },

    /**
     * Show session detail modal
     */
    showSessionDetail(sessionId) {
        const sessions = Storage.getSessions();
        const session = sessions.find(s => s.id === sessionId);
        
        if (!session) return;
        
        this.currentSessionId = sessionId;
        
        const eventName = Sessions.eventNames[session.event] || session.event;
        const load = Sessions.calculateLoad(session);
        
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="modal-detail-row">
                <span class="modal-detail-label">Date</span>
                <span class="modal-detail-value">${Sessions.formatDate(session.date)}</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Event</span>
                <span class="modal-detail-value">${Sessions.eventIcons[session.event]} ${eventName}</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Session Type</span>
                <span class="modal-detail-value">${Sessions.typeIcons[session.sessionType]} ${session.sessionType}</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Season</span>
                <span class="modal-detail-value">${session.season === 'indoor' ? '🏠 Indoor' : '☀️ Outdoor'}</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Throws</span>
                <span class="modal-detail-value">${session.throwCount}</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Implement Weight</span>
                <span class="modal-detail-value">${session.implementWeight} ${session.weightUnit}</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">RPE</span>
                <span class="modal-detail-value">${session.rpe}/10</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Session Load</span>
                <span class="modal-detail-value">${load}</span>
            </div>
            ${session.prDay ? `
                <div class="modal-detail-row">
                    <span class="modal-detail-label">🏅 PR Day!</span>
                    <span class="modal-detail-value">${session.prDistance ? session.prDistance + ' ' + session.distanceUnit : 'Yes'}</span>
                </div>
            ` : ''}
            ${session.notes ? `
                <div class="modal-notes">
                    <div class="modal-notes-title">Notes</div>
                    <div class="modal-notes-content">${session.notes}</div>
                </div>
            ` : ''}
            ${session.coachNotes ? `
                <div class="modal-notes">
                    <div class="modal-notes-title">Coach Notes</div>
                    <div class="modal-notes-content">${session.coachNotes}</div>
                </div>
            ` : ''}
        `;
        
        document.getElementById('sessionModal').classList.add('show');
    },

    /**
     * Hide modal
     */
    hideModal() {
        document.getElementById('sessionModal').classList.remove('show');
        this.currentSessionId = null;
    },

    /**
     * Initialize settings
     */
    initSettings() {
        const settings = Storage.getSettings();
        
        // Load saved settings
        document.getElementById('defaultWeightUnit').value = settings.weightUnit || 'kg';
        document.getElementById('defaultDistanceUnit').value = settings.distanceUnit || 'm';
        document.getElementById('athleteName').value = settings.athleteName || '';
        document.getElementById('primaryEvent').value = settings.primaryEvent || '';
        
        // Save on change
        ['defaultWeightUnit', 'defaultDistanceUnit', 'athleteName', 'primaryEvent'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.saveSettings());
        });
        
        // Clear data button
        document.getElementById('clearDataBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all session data? This cannot be undone.')) {
                Storage.clearAll();
                this.updateSessionList();
                this.updateStreak();
                Analytics.update();
                this.showToast('All data cleared', 'success');
            }
        });
        
        // Export all button
        document.getElementById('exportAllBtn').addEventListener('click', () => {
            Export.toJSON();
        });
        
        // Alert close button
        document.getElementById('alertClose').addEventListener('click', () => {
            Analytics.hideAlert();
        });
    },

    /**
     * Save settings
     */
    saveSettings() {
        const settings = {
            weightUnit: document.getElementById('defaultWeightUnit').value,
            distanceUnit: document.getElementById('defaultDistanceUnit').value,
            athleteName: document.getElementById('athleteName').value,
            primaryEvent: document.getElementById('primaryEvent').value
        };
        
        Storage.saveSettings(settings);
        
        // Update form defaults
        document.getElementById('weightUnit').value = settings.weightUnit;
        document.getElementById('distanceUnit').value = settings.distanceUnit;
    },

    /**
     * Update streak display
     */
    updateStreak() {
        const sessions = Storage.getSessions();
        const streak = this.calculateStreak(sessions);
        
        document.getElementById('streakCount').textContent = streak;
        
        // Save streak
        Storage.saveStreak({
            current: streak,
            lastLogDate: sessions.length > 0 ? sessions[0].date : null
        });
    },

    /**
     * Calculate current streak
     */
    calculateStreak(sessions) {
        if (sessions.length === 0) return 0;
        
        // Sort by date descending
        const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const mostRecentDate = new Date(sorted[0].date);
        mostRecentDate.setHours(0, 0, 0, 0);
        
        // Check if most recent is today or yesterday
        if (mostRecentDate < yesterday) {
            return 0; // Streak broken
        }
        
        let streak = 0;
        let checkDate = mostRecentDate.getTime() === today.getTime() ? today : yesterday;
        
        const sessionDates = new Set(sorted.map(s => s.date));
        
        while (true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (sessionDates.has(dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toastIcon');
        const text = document.getElementById('toastMessage');
        
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠'
        };
        
        icon.textContent = icons[type] || icons.success;
        text.textContent = message;
        
        toast.style.background = type === 'error' ? 'var(--danger)' : 
                                  type === 'warning' ? 'var(--warning)' : 
                                  'var(--success)';
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
};
