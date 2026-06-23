/**
 * BMW Kyalami Track Platform - Core Reservation Processor
 * Use Case: Full Track Day Booking Lifecycle
 * Covers session management, booking creation with package selection,
 * capacity enforcement, KYL-XXXX reference generation, and cancellation.
 */

const KYALAMI_CONFIG = require('../config');

const sessionRegistry = [
    {
        id: 1,
        sessionName: "Morning Track Day - GP Circuit",
        sessionDate: "2026-07-05",
        startTime: "08:00",
        endTime: "12:00",
        trackConfig: "gp",
        maxParticipants: 25,
        currentParticipants: 2,
        packages: {
            bronze: { price: 2500, label: "Bronze" },
            silver: { price: 4500, label: "Silver" },
            gold:   { price: 7500, label: "Gold" }
        },
        status: "scheduled"
    },
    {
        id: 2,
        sessionName: "Afternoon Club Session",
        sessionDate: "2026-07-05",
        startTime: "13:00",
        endTime: "17:00",
        trackConfig: "club",
        maxParticipants: 25,
        currentParticipants: 0,
        packages: {
            bronze: { price: 2500, label: "Bronze" },
            silver: { price: 4500, label: "Silver" },
            gold:   { price: 7500, label: "Gold" }
        },
        status: "scheduled"
    }
];

const bookingRegistry = [
    {
        id: 1,
        bookingRef: "KYL-0001",
        driverId: "drv_001",
        driver: "Thato Mohono",
        sessionId: 1,
        sessionName: "Morning Track Day - GP Circuit",
        sessionDate: "2026-07-05",
        timeSlot: "10:00",
        car: "BMW M4 Competition",
        package: "silver",
        amountZAR: 4500,
        status: "confirmed",
        paymentStatus: "paid"
    },
    {
        id: 2,
        bookingRef: "KYL-0002",
        driverId: "drv_002",
        driver: "Yongama Sobambela",
        sessionId: 1,
        sessionName: "Morning Track Day - GP Circuit",
        sessionDate: "2026-07-05",
        timeSlot: "11:30",
        car: "BMW M5 CS",
        package: "gold",
        amountZAR: 7500,
        status: "confirmed",
        paymentStatus: "paid"
    }
];

const VALID_PACKAGES = ["bronze", "silver", "gold"];

function generateBookingReference() {
    const nextId = bookingRegistry.length + 1;
    return "KYL-" + String(nextId).padStart(4, "0");
}

function validateTimeSlotFormat(timeSlot) {
    return /^\d{2}:\d{2}$/.test(timeSlot);
}

/**
 * Admin: creates a new track day session
 */
function createSession(sessionData) {
    if (!sessionData || !sessionData.sessionName || !sessionData.sessionDate ||
        !sessionData.startTime || !sessionData.endTime) {
        return {
            success: false,
            error: "INVALID_SESSION_DATA",
            message: "Session requires sessionName, sessionDate, startTime, and endTime."
        };
    }

    const newSession = {
        id: sessionRegistry.length + 1,
        sessionName: sessionData.sessionName,
        sessionDate: sessionData.sessionDate,
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        trackConfig: sessionData.trackConfig || "gp",
        maxParticipants: sessionData.maxParticipants || KYALAMI_CONFIG.maxCarsOnTrack,
        currentParticipants: 0,
        packages: {
            bronze: { price: 2500, label: "Bronze" },
            silver: { price: 4500, label: "Silver" },
            gold:   { price: 7500, label: "Gold" }
        },
        status: "scheduled"
    };

    sessionRegistry.push(newSession);
    return { success: true, message: "SESSION_CREATED", session: newSession };
}

/**
 * Returns all sessions that still have open slots
 */
function getAvailableSessions() {
    return sessionRegistry
        .filter(s => s.status === "scheduled" && s.currentParticipants < s.maxParticipants)
        .map(s => ({
            ...s,
            slotsRemaining: s.maxParticipants - s.currentParticipants
        }));
}

/**
 * Creates a confirmed booking for a driver on a session.
 * Enforces: payload validation, time format, package selection,
 * session capacity, and time-slot conflict detection within the session.
 * @param {Object} payload { driver, driverId, timeSlot, car, package, sessionId }
 */
function processTrackBooking(payload) {
    if (!payload || !payload.driver || !payload.timeSlot) {
        return { success: false, error: "INVALID_PAYLOAD_STRUCTURE" };
    }

    if (!validateTimeSlotFormat(payload.timeSlot)) {
        return {
            success: false,
            error: "INVALID_TIME_FORMAT",
            message: "Time slot must be in HH:MM format (e.g. 10:00)."
        };
    }

    const selectedPackage = (payload.package || "bronze").toLowerCase();
    if (!VALID_PACKAGES.includes(selectedPackage)) {
        return {
            success: false,
            error: "INVALID_PACKAGE",
            message: `Package must be one of: ${VALID_PACKAGES.join(", ")}.`
        };
    }

    const session = payload.sessionId
        ? sessionRegistry.find(s => s.id === payload.sessionId)
        : sessionRegistry.find(s => s.status === "scheduled" && s.currentParticipants < s.maxParticipants);

    if (!session) {
        return {
            success: false,
            error: "SESSION_NOT_FOUND",
            message: "No available session found for this booking."
        };
    }

    if (session.currentParticipants >= session.maxParticipants) {
        return {
            success: false,
            error: "SESSION_FULL",
            message: `Session "${session.sessionName}" has reached maximum capacity of ${session.maxParticipants} vehicles.`
        };
    }

    // Block duplicate time slots within the same session
    const isSlotOccupied = bookingRegistry.some(
        b => b.sessionId === session.id && b.timeSlot === payload.timeSlot && b.status !== "cancelled"
    );

    if (isSlotOccupied) {
        return {
            success: false,
            error: "CONCURRENCY_COLLISION",
            message: `Execution blocked. Time slot ${payload.timeSlot} is already allocated to another vehicle asset.`
        };
    }

    const bookingRef = generateBookingReference();
    const newBooking = {
        id: bookingRegistry.length + 1,
        bookingRef,
        driverId: payload.driverId || null,
        driver: payload.driver,
        sessionId: session.id,
        sessionName: session.sessionName,
        sessionDate: session.sessionDate,
        timeSlot: payload.timeSlot,
        car: payload.car || "Not specified",
        package: selectedPackage,
        amountZAR: session.packages[selectedPackage].price,
        status: "confirmed",
        paymentStatus: "unpaid"
    };

    bookingRegistry.push(newBooking);
    session.currentParticipants += 1;

    return {
        success: true,
        message: "RESERVATION_SUCCESSFUL",
        booking: newBooking
    };
}

/**
 * Cancels a booking by reference. Releases the session slot and marks
 * the payment as refunded if the booking was already paid.
 * @param {string} bookingRef  e.g. "KYL-0003"
 * @param {string} driverId    Optional — when provided, enforces ownership
 */
function cancelBooking(bookingRef, driverId) {
    if (!bookingRef) {
        return { success: false, error: "MISSING_BOOKING_REF", message: "A booking reference is required to cancel." };
    }

    const booking = bookingRegistry.find(b => b.bookingRef === bookingRef);

    if (!booking) {
        return { success: false, error: "BOOKING_NOT_FOUND", message: `No booking found with reference ${bookingRef}.` };
    }

    if (driverId && booking.driverId !== driverId) {
        return { success: false, error: "UNAUTHORIZED", message: "You can only cancel your own bookings." };
    }

    if (booking.status === "cancelled") {
        return { success: false, error: "ALREADY_CANCELLED", message: `Booking ${bookingRef} is already cancelled.` };
    }

    if (booking.status === "completed") {
        return { success: false, error: "CANNOT_CANCEL_COMPLETED", message: "Completed bookings cannot be cancelled." };
    }

    booking.status = "cancelled";
    if (booking.paymentStatus === "paid") {
        booking.paymentStatus = "refunded";
    }

    const session = sessionRegistry.find(s => s.id === booking.sessionId);
    if (session && session.currentParticipants > 0) {
        session.currentParticipants -= 1;
    }

    return { success: true, message: "BOOKING_CANCELLED", booking };
}

/**
 * Returns all bookings for a given driver
 */
function getDriverBookings(driverId) {
    if (!driverId) {
        return { success: false, error: "MISSING_DRIVER_ID", message: "A driver ID is required." };
    }

    const bookings = bookingRegistry.filter(b => b.driverId === driverId);
    return { success: true, count: bookings.length, bookings };
}

/**
 * Checks whether GPS coordinates fall within Kyalami circuit boundaries
 */
function isWithinTrackBorders(latitude, longitude) {
    if (typeof latitude !== "number" || typeof longitude !== "number") {
        return false;
    }

    const minLat = -25.9980;
    const maxLat = -25.9890;
    const minLng = 28.0610;
    const maxLng = 28.0750;

    return (latitude >= minLat && latitude <= maxLat) &&
           (longitude >= minLng && longitude <= maxLng);
}

/**
 * Returns true if the requested slot is not already in the provided list
 */
function validateRaceSlot(requestedSlot, existingBookings) {
    if (!requestedSlot) {
        throw new Error("Critical Parameter Missing: Invalid track query.");
    }
    return !existingBookings.includes(requestedSlot);
}

module.exports = {
    createSession,
    getAvailableSessions,
    processTrackBooking,
    cancelBooking,
    getDriverBookings,
    isWithinTrackBorders,
    validateRaceSlot,
    bookingRegistry,
    sessionRegistry
};
