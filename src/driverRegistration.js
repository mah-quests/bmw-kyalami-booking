/**
 * BMW Kyalami Track Platform - Driver Registration Module
 * User Story 1: Driver Registration
 */

const driverRegistry = [];
let nextDriverId = 1;

const DRIVER_TYPES = ['private', 'professional'];

/**
 * Registers a new driver and creates their profile.
 * @param {Object} profile
 * @param {string} profile.firstName
 * @param {string} profile.lastName
 * @param {string} profile.email
 * @param {string} profile.phone
 * @param {string} profile.licenseNumber
 * @param {'private'|'professional'} profile.driverType
 * @param {Object} profile.vehicle - { make, model, year }
 * @returns {Object} Result with driverId or error
 */
function registerDriver(profile) {
    const required = ['firstName', 'lastName', 'email', 'phone', 'licenseNumber', 'driverType', 'vehicle'];
    for (const field of required) {
        if (!profile || !profile[field]) {
            return { success: false, error: 'MISSING_REQUIRED_FIELD', field };
        }
    }

    if (!DRIVER_TYPES.includes(profile.driverType)) {
        return { success: false, error: 'INVALID_DRIVER_TYPE', validTypes: DRIVER_TYPES };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) {
        return { success: false, error: 'INVALID_EMAIL_FORMAT' };
    }

    const duplicate = driverRegistry.find(d => d.email === profile.email || d.licenseNumber === profile.licenseNumber);
    if (duplicate) {
        return { success: false, error: 'DRIVER_ALREADY_REGISTERED', conflictField: duplicate.email === profile.email ? 'email' : 'licenseNumber' };
    }

    const vehicleRequired = ['make', 'model', 'year'];
    for (const field of vehicleRequired) {
        if (!profile.vehicle[field]) {
            return { success: false, error: 'MISSING_VEHICLE_FIELD', field };
        }
    }

    const driver = {
        driverId: nextDriverId++,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        licenseNumber: profile.licenseNumber,
        driverType: profile.driverType,
        vehicle: {
            make: profile.vehicle.make,
            model: profile.vehicle.model,
            year: profile.vehicle.year
        },
        registeredAt: new Date().toISOString(),
        documentsStatus: 'pending',
        profileStatus: 'active'
    };

    driverRegistry.push(driver);

    return {
        success: true,
        message: 'DRIVER_REGISTERED_SUCCESSFULLY',
        driverId: driver.driverId,
        profile: driver
    };
}

/**
 * Retrieves a driver profile by ID.
 * @param {number} driverId
 * @returns {Object|null}
 */
function getDriverById(driverId) {
    return driverRegistry.find(d => d.driverId === driverId) || null;
}

/**
 * Retrieves a driver profile by email.
 * @param {string} email
 * @returns {Object|null}
 */
function getDriverByEmail(email) {
    return driverRegistry.find(d => d.email === email) || null;
}

module.exports = {
    registerDriver,
    getDriverById,
    getDriverByEmail,
    driverRegistry
};
