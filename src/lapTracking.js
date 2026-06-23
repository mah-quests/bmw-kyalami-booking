/**
 * BMW Kyalami Track Platform - Lap Time Tracking & Performance Module
 * User Story 5: Lap Time Tracking & Performance View
 */

const { getDriverById } = require('./driverRegistration');

// Lap records stored as: { driverId, eventId, lapNumber, lapTimeMs, recordedAt }
const lapRecords = [];

const KYALAMI_LAP_RECORD_MS = 68000; // 1:08.000 — benchmark reference

/**
 * Records a lap time for a driver during an event.
 * @param {number} driverId
 * @param {string} eventId
 * @param {number} lapTimeMs - lap duration in milliseconds
 * @returns {Object} Recorded lap entry
 */
function recordLapTime(driverId, eventId, lapTimeMs) {
    const driver = getDriverById(driverId);
    if (!driver) {
        return { success: false, error: 'DRIVER_NOT_FOUND', driverId };
    }

    if (!eventId) {
        return { success: false, error: 'MISSING_EVENT_ID' };
    }

    if (typeof lapTimeMs !== 'number' || lapTimeMs <= 0) {
        return { success: false, error: 'INVALID_LAP_TIME', message: 'Lap time must be a positive number in milliseconds.' };
    }

    // Sub-30s laps are physically impossible on this circuit
    if (lapTimeMs < 30000) {
        return { success: false, error: 'LAP_TIME_BELOW_PHYSICAL_MINIMUM', minimumMs: 30000 };
    }

    const driverEventLaps = lapRecords.filter(r => r.driverId === driverId && r.eventId === eventId);
    const lapNumber = driverEventLaps.length + 1;

    const record = {
        driverId,
        driverName: `${driver.firstName} ${driver.lastName}`,
        eventId,
        lapNumber,
        lapTimeMs,
        lapTimeFormatted: formatLapTime(lapTimeMs),
        recordedAt: new Date().toISOString()
    };

    lapRecords.push(record);

    return {
        success: true,
        message: 'LAP_RECORDED',
        lap: record
    };
}

/**
 * Returns a full performance dashboard for a driver.
 * Includes best/worst/average lap, improvement trend, and gap to circuit record.
 * @param {number} driverId
 * @param {string} [eventId] - optional filter; returns all events if omitted
 * @returns {Object} Performance summary
 */
function getDriverPerformance(driverId, eventId) {
    const driver = getDriverById(driverId);
    if (!driver) {
        return { success: false, error: 'DRIVER_NOT_FOUND', driverId };
    }

    const laps = lapRecords.filter(
        r => r.driverId === driverId && (!eventId || r.eventId === eventId)
    );

    if (laps.length === 0) {
        return {
            success: true,
            driverId,
            driverName: `${driver.firstName} ${driver.lastName}`,
            message: 'NO_LAPS_RECORDED',
            laps: []
        };
    }

    const lapTimes = laps.map(r => r.lapTimeMs);
    const bestLapMs = Math.min(...lapTimes);
    const worstLapMs = Math.max(...lapTimes);
    const averageLapMs = Math.round(lapTimes.reduce((sum, t) => sum + t, 0) / lapTimes.length);

    // Improvement: compare average of first half vs second half of laps
    const midpoint = Math.floor(laps.length / 2);
    let improvementPercent = null;
    if (laps.length >= 4) {
        const firstHalfAvg = laps.slice(0, midpoint).reduce((s, r) => s + r.lapTimeMs, 0) / midpoint;
        const secondHalfAvg = laps.slice(midpoint).reduce((s, r) => s + r.lapTimeMs, 0) / (laps.length - midpoint);
        improvementPercent = parseFloat((((firstHalfAvg - secondHalfAvg) / firstHalfAvg) * 100).toFixed(2));
    }

    const gapToRecordMs = bestLapMs - KYALAMI_LAP_RECORD_MS;

    // Group laps by event for multi-event view
    const byEvent = laps.reduce((acc, r) => {
        if (!acc[r.eventId]) {
            acc[r.eventId] = [];
        }
        acc[r.eventId].push(r);
        return acc;
    }, {});

    return {
        success: true,
        driverId,
        driverName: `${driver.firstName} ${driver.lastName}`,
        vehicle: `${driver.vehicle.year} ${driver.vehicle.make} ${driver.vehicle.model}`,
        summary: {
            totalLaps: laps.length,
            bestLap: { ms: bestLapMs, formatted: formatLapTime(bestLapMs) },
            worstLap: { ms: worstLapMs, formatted: formatLapTime(worstLapMs) },
            averageLap: { ms: averageLapMs, formatted: formatLapTime(averageLapMs) },
            improvementPercent,
            gapToCircuitRecord: { ms: gapToRecordMs, formatted: formatLapTime(Math.abs(gapToRecordMs)), faster: gapToRecordMs < 0 }
        },
        lapHistory: laps,
        byEvent
    };
}

/**
 * Returns the leaderboard for an event (fastest lap per driver).
 * @param {string} eventId
 * @returns {Array} Sorted leaderboard
 */
function getEventLeaderboard(eventId) {
    const eventLaps = lapRecords.filter(r => r.eventId === eventId);

    const bestPerDriver = {};
    eventLaps.forEach(r => {
        if (!bestPerDriver[r.driverId] || r.lapTimeMs < bestPerDriver[r.driverId].lapTimeMs) {
            bestPerDriver[r.driverId] = r;
        }
    });

    return Object.values(bestPerDriver)
        .sort((a, b) => a.lapTimeMs - b.lapTimeMs)
        .map((r, index) => ({
            position: index + 1,
            driverId: r.driverId,
            driverName: r.driverName,
            bestLap: r.lapTimeFormatted,
            bestLapMs: r.lapTimeMs
        }));
}

/**
 * Formats milliseconds as M:SS.mmm string.
 * @param {number} ms
 * @returns {string}
 */
function formatLapTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = ms % 1000;
    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

module.exports = {
    recordLapTime,
    getDriverPerformance,
    getEventLeaderboard,
    formatLapTime,
    lapRecords
};
