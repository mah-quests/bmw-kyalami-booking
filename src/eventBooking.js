/**
 * BMW Kyalami Track Platform - Event Booking Module
 * User Story 3: Event Booking
 */

const { getDriverById } = require('./driverRegistration');

const eventCatalogue = [
    {
        eventId: 'EVT-001',
        name: 'BMW Track Day - Morning Session',
        date: '2026-07-12',
        timeSlots: ['08:00', '09:30', '11:00'],
        maxParticipants: 25,
        description: 'Open track day for all registered BMW drivers.'
    },
    {
        eventId: 'EVT-002',
        name: 'BMW M Performance Experience',
        date: '2026-07-19',
        timeSlots: ['10:00', '13:00', '15:30'],
        maxParticipants: 15,
        description: 'Guided high-performance driving experience with M models only.'
    },
    {
        eventId: 'EVT-003',
        name: 'Kyalami Open Circuit Day',
        date: '2026-08-02',
        timeSlots: ['07:30', '10:00', '12:30', '15:00'],
        maxParticipants: 25,
        description: 'Full-day track access with multiple session slots available.'
    }
];

const bookingRegistry = [];
let nextBookingId = 1;

/**
 * Returns all available events with remaining capacity per slot.
 * @returns {Array} List of events with availability
 */
function getAvailableEvents() {
    return eventCatalogue.map(event => {
        const slotsWithAvailability = event.timeSlots.map(slot => {
            const booked = bookingRegistry.filter(
                b => b.eventId === event.eventId && b.timeSlot === slot && b.status !== 'cancelled'
            ).length;
            return {
                timeSlot: slot,
                available: booked < event.maxParticipants,
                spotsRemaining: event.maxParticipants - booked
            };
        });

        return {
            eventId: event.eventId,
            name: event.name,
            date: event.date,
            description: event.description,
            slots: slotsWithAvailability
        };
    });
}

/**
 * Books an event slot for a verified, registered driver.
 * @param {number} driverId
 * @param {string} eventId
 * @param {string} timeSlot
 * @returns {Object} Booking result with confirmation record
 */
function bookEvent(driverId, eventId, timeSlot) {
    const driver = getDriverById(driverId);
    if (!driver) {
        return { success: false, error: 'DRIVER_NOT_FOUND', driverId };
    }

    if (driver.documentsStatus !== 'verified') {
        return {
            success: false,
            error: 'DOCUMENTS_NOT_VERIFIED',
            message: 'All required documents must be verified before booking an event.'
        };
    }

    const event = eventCatalogue.find(e => e.eventId === eventId);
    if (!event) {
        return { success: false, error: 'EVENT_NOT_FOUND', eventId };
    }

    if (!event.timeSlots.includes(timeSlot)) {
        return { success: false, error: 'INVALID_TIME_SLOT', availableSlots: event.timeSlots };
    }

    const existingBooking = bookingRegistry.find(
        b => b.driverId === driverId && b.eventId === eventId && b.status !== 'cancelled'
    );
    if (existingBooking) {
        return { success: false, error: 'DUPLICATE_BOOKING', existingBookingId: existingBooking.bookingId };
    }

    const slotBookings = bookingRegistry.filter(
        b => b.eventId === eventId && b.timeSlot === timeSlot && b.status !== 'cancelled'
    );
    if (slotBookings.length >= event.maxParticipants) {
        return { success: false, error: 'TIME_SLOT_FULL', timeSlot };
    }

    const booking = {
        bookingId: `BK-${String(nextBookingId++).padStart(4, '0')}`,
        driverId,
        driverName: `${driver.firstName} ${driver.lastName}`,
        eventId,
        eventName: event.name,
        eventDate: event.date,
        timeSlot,
        vehicle: `${driver.vehicle.year} ${driver.vehicle.make} ${driver.vehicle.model}`,
        status: 'confirmed',
        bookedAt: new Date().toISOString(),
        checkedIn: false
    };

    bookingRegistry.push(booking);

    return {
        success: true,
        message: 'BOOKING_CONFIRMED',
        booking
    };
}

/**
 * Cancels an existing booking.
 * @param {string} bookingId
 * @param {number} driverId
 * @returns {Object}
 */
function cancelBooking(bookingId, driverId) {
    const booking = bookingRegistry.find(b => b.bookingId === bookingId);
    if (!booking) {
        return { success: false, error: 'BOOKING_NOT_FOUND' };
    }
    if (booking.driverId !== driverId) {
        return { success: false, error: 'UNAUTHORISED_CANCELLATION' };
    }
    if (booking.status === 'cancelled') {
        return { success: false, error: 'BOOKING_ALREADY_CANCELLED' };
    }

    booking.status = 'cancelled';
    return { success: true, message: 'BOOKING_CANCELLED', bookingId };
}

/**
 * Retrieves all bookings for a driver.
 * @param {number} driverId
 * @returns {Array}
 */
function getDriverBookings(driverId) {
    return bookingRegistry.filter(b => b.driverId === driverId);
}

module.exports = {
    getAvailableEvents,
    bookEvent,
    cancelBooking,
    getDriverBookings,
    bookingRegistry,
    eventCatalogue
};
