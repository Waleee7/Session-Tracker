/**
 * Export Module
 * Handles data export functionality
 */
const Export = {
    /**
     * Export sessions to CSV
     */
    toCSV(sessions, filename = 'throwing_sessions.csv') {
        if (sessions.length === 0) {
            UI.showToast('No sessions to export', 'warning');
            return;
        }

        const headers = [
            'Date',
            'Event',
            'Session Type',
            'Season',
            'Throws',
            'Implement Weight',
            'Weight Unit',
            'RPE',
            'PR Day',
            'PR Distance',
            'Distance Unit',
            'Notes',
            'Coach Notes',
            'Load (Throws × RPE)'
        ];

        const rows = sessions.map(session => [
            session.date,
            Sessions.eventNames[session.event] || session.event,
            session.sessionType,
            session.season,
            session.throwCount,
            session.implementWeight,
            session.weightUnit,
            session.rpe,
            session.prDay ? 'Yes' : 'No',
            session.prDistance || '',
            session.distanceUnit || '',
            this.escapeCSV(session.notes || ''),
            this.escapeCSV(session.coachNotes || ''),
            Sessions.calculateLoad(session)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        this.downloadFile(csvContent, filename, 'text/csv');
        UI.showToast('Sessions exported successfully!', 'success');
    },

    /**
     * Export all data as JSON
     */
    toJSON(filename = 'throwing_tracker_backup.json') {
        const data = {
            sessions: Storage.getSessions(),
            settings: Storage.getSettings(),
            streak: Storage.getStreak(),
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };

        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, filename, 'application/json');
        UI.showToast('Data exported successfully!', 'success');
    },

    /**
     * Escape CSV special characters
     */
    escapeCSV(str) {
        if (typeof str !== 'string') return str;
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    },

    /**
     * Download file
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
};
