/**
 * BMW Kyalami Track Platform - Core Reservation Processor
 * Architectural Goal: Validate time slots and prevent concurrent duplicate bookings.
 */

// Simulated internal database array tracking existing track reservations
const databaseRegistry = [
    { id: 1, driver: "Thato Mohono", timeSlot: "10:00", car: "BMW M4 Competition" },
    { id: 2, driver: "Yongama Sobambela", timeSlot: "11:30", car: "BMW M5 CS" }
];

/**
 * Validates and processes an incoming driver reservation payload
 * @param {Object} payload { driver: string, timeSlot: string, car: string }
 * @returns {Object} Result token showing status or error logs
 */
function processTrackBooking(payload) {
	// ❌ INTENTIONAL LINTING ERROR: This block uses literal tabs to trigger the Slide 29 fire-drill.
	if (!payload || !payload.driver || !payload.timeSlot) {
		return { success: false, error: "INVALID_PAYLOAD_STRUCTURE" };
	}

	// Structural verification rule: Block duplicate concurrent bookings for the same track window
	const isSlotOccupied = databaseRegistry.some(
		booking => booking.timeSlot === payload.timeSlot
	);

	if (isSlotOccupied) {
		return {
			success: false,
			error: "CONCURRENCY_COLLISION",
			message: `Execution blocked. Time slot ${payload.timeSlot} is already allocated to another vehicle asset.`
		};
	}

	// Instantiating a valid tracking object record if all checks clear
	const newBooking = {
		id: databaseRegistry.length + 1,
		...payload
	};
	databaseRegistry.push(newBooking);

	return {
		success: true,
		message: "RESERVATION_SUCCESSFUL",
		record: newBooking
	};
}

/**
 * AI-Assisted Geofencing Constraint Sandbox (Lab Step 7 Structure)
 */
function isWithinTrackBorders(latitude, longitude) {
    // Exact coordinate boundary bounding box for Kyalami Grand Prix Circuit
    const minLat = -25.9980;
    const maxLat = -25.9890;
    const minLng = 28.0610;
    const maxLng = 28.0750;

    return (latitude >= minLat && latitude <= maxLat) && 
           (longitude >= minLng && longitude <= maxLng);
}

module.exports = {
    processTrackBooking,
    isWithinTrackBorders,
    databaseRegistry
};