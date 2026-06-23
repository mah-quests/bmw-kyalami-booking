/**
 * BMW Kyalami Track Platform - Digital Check-in Module
 * User Story 4: Digital Check-in
 */

const { bookingRegistry } = require('./eventBooking');

const checkinLog = [];

/**
 * Generates a deterministic check-in token for a booking.
 * Encodes bookingId + driverId + eventDate as a base64-like string
 * that a QR code generator would render.
 * @param {string} bookingId
 * @param {number} driverId
 * @returns {Object} Token payload and QR data string
 */
function generateCheckinToken(bookingId, driverId) {
    const booking = bookingRegistry.find(
        b => b.bookingId === bookingId && b.driverId === driverId
    );

    if (!booking) {
        return { success: false, error: 'BOOKING_NOT_FOUND' };
    }

    if (booking.status === 'cancelled') {
        return { success: false, error: 'BOOKING_CANCELLED' };
    }

    if (booking.checkedIn) {
        return { success: false, error: 'ALREADY_CHECKED_IN', checkinTime: booking.checkinTime };
    }

    // Encode a verifiable token: base64 of JSON payload
    const payload = {
        bookingId: booking.bookingId,
        driverId: booking.driverId,
        eventId: booking.eventId,
        eventDate: booking.eventDate,
        timeSlot: booking.timeSlot
    };

    const tokenData = Buffer.from(JSON.stringify(payload)).toString('base64');

    // QR code content follows a standard deep-link pattern the gate scanner reads
    const qrCodeContent = `kyalami://checkin?token=${tokenData}`;

    return {
        success: true,
        bookingId,
        driverName: booking.driverName,
        eventName: booking.eventName,
        eventDate: booking.eventDate,
        timeSlot: booking.timeSlot,
        qrCodeContent,
        token: tokenData,
        instructions: 'Present this QR code at the track gate for contactless entry.'
    };
}

/**
 * Processes a check-in by validating the token and marking the driver as checked in.
 * @param {string} token - base64 token from generateCheckinToken
 * @returns {Object} Check-in result
 */
function processCheckin(token) {
    if (!token) {
        return { success: false, error: 'MISSING_TOKEN' };
    }

    let payload;
    try {
        payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    } catch {
        return { success: false, error: 'INVALID_TOKEN_FORMAT' };
    }

    const { bookingId, driverId, eventId, eventDate, timeSlot } = payload;
    if (!bookingId || !driverId || !eventId) {
        return { success: false, error: 'MALFORMED_TOKEN_PAYLOAD' };
    }

    const booking = bookingRegistry.find(
        b => b.bookingId === bookingId && b.driverId === driverId
    );

    if (!booking) {
        return { success: false, error: 'BOOKING_NOT_FOUND' };
    }

    if (booking.status === 'cancelled') {
        return { success: false, error: 'BOOKING_CANCELLED' };
    }

    if (booking.checkedIn) {
        return {
            success: false,
            error: 'ALREADY_CHECKED_IN',
            checkinTime: booking.checkinTime,
            message: 'This QR code has already been used for entry.'
        };
    }

    const checkinTime = new Date().toISOString();
    booking.checkedIn = true;
    booking.checkinTime = checkinTime;
    booking.status = 'checked-in';

    const logEntry = {
        bookingId,
        driverId,
        driverName: booking.driverName,
        eventId,
        eventDate,
        timeSlot,
        checkinTime,
        method: 'qr-scan'
    };
    checkinLog.push(logEntry);

    return {
        success: true,
        message: 'CHECK_IN_SUCCESSFUL',
        driverName: booking.driverName,
        eventName: booking.eventName,
        timeSlot: booking.timeSlot,
        checkinTime,
        gateMessage: `Welcome to Kyalami, ${booking.driverName}! Proceed to your assigned bay.`
    };
}

/**
 * Returns the check-in log for an event.
 * @param {string} eventId
 * @returns {Array}
 */
function getEventCheckinLog(eventId) {
    return checkinLog.filter(entry => entry.eventId === eventId);
}

module.exports = {
    generateCheckinToken,
    processCheckin,
    getEventCheckinLog,
    checkinLog
};
