/**
 * BMW Kyalami Track Platform - User Stories End-to-End Test Suite
 * Validates all 5 user stories in a full happy-path + edge-case flow.
 */

const { registerDriver, getDriverById } = require('../src/driverRegistration');
const { uploadDocument, verifyDocuments, getDocumentStatus } = require('../src/documentVerification');
const { getAvailableEvents, bookEvent, cancelBooking, getDriverBookings } = require('../src/eventBooking');
const { generateCheckinToken, processCheckin, getEventCheckinLog } = require('../src/digitalCheckin');
const { recordLapTime, getDriverPerformance, getEventLeaderboard } = require('../src/lapTracking');

let passed = 0;
let failed = 0;

function assert(label, condition, detail) {
    if (condition) {
        console.log(`  ✅ PASS: ${label}`);
        passed++;
    } else {
        console.log(`  ❌ FAIL: ${label}${detail ? ' — ' + detail : ''}`);
        failed++;
    }
}

console.log('\n\x1b[36m=================================================================\x1b[0m');
console.log('\x1b[36m  BMW KYALAMI — USER STORIES VALIDATION SUITE\x1b[0m');
console.log('\x1b[36m=================================================================\x1b[0m\n');

// ─── USER STORY 1: Driver Registration ───────────────────────────────────────
console.log('\x1b[33m[US-1] Driver Registration\x1b[0m');

const reg1 = registerDriver({
    firstName: 'Sipho',
    lastName: 'Nkosi',
    email: 'sipho.nkosi@example.com',
    phone: '0821234567',
    licenseNumber: 'ZA-DL-9901',
    driverType: 'private',
    vehicle: { make: 'BMW', model: 'M4 Competition', year: 2023 }
});
assert('Registers a valid private driver', reg1.success);
assert('Returns a driverId', !!reg1.driverId);

const reg2 = registerDriver({
    firstName: 'Priya',
    lastName: 'Naidoo',
    email: 'priya.naidoo@example.com',
    phone: '0829876543',
    licenseNumber: 'ZA-DL-4422',
    driverType: 'professional',
    vehicle: { make: 'BMW', model: 'M5 CS', year: 2024 }
});
assert('Registers a valid professional driver', reg2.success);

const regDupe = registerDriver({
    firstName: 'Sipho',
    lastName: 'Nkosi',
    email: 'sipho.nkosi@example.com',
    phone: '0821234567',
    licenseNumber: 'ZA-DL-9901',
    driverType: 'private',
    vehicle: { make: 'BMW', model: 'M3', year: 2022 }
});
assert('Blocks duplicate email registration', !regDupe.success && regDupe.error === 'DRIVER_ALREADY_REGISTERED');

const regMissing = registerDriver({ firstName: 'Ghost' });
assert('Rejects incomplete registration payload', !regMissing.success && regMissing.error === 'MISSING_REQUIRED_FIELD');

const regBadEmail = registerDriver({
    firstName: 'Bad',
    lastName: 'Email',
    email: 'not-an-email',
    phone: '0821111111',
    licenseNumber: 'ZA-DL-0001',
    driverType: 'private',
    vehicle: { make: 'BMW', model: 'M2', year: 2021 }
});
assert('Rejects malformed email', !regBadEmail.success && regBadEmail.error === 'INVALID_EMAIL_FORMAT');

const driverId = reg1.driverId;
const driverId2 = reg2.driverId;

// ─── USER STORY 2: Document Upload & Verification ────────────────────────────
console.log('\n\x1b[33m[US-2] Document Upload & Verification\x1b[0m');

const upload1 = uploadDocument(driverId, 'ID', { fileName: 'sipho_id.pdf', fileSizeMB: 1.2 });
assert('Uploads ID document', upload1.success);

const upload2 = uploadDocument(driverId, 'driverLicense', { fileName: 'sipho_license.jpg', fileSizeMB: 0.8 });
assert('Uploads driver license', upload2.success);

const upload3 = uploadDocument(driverId, 'indemnityForm', { fileName: 'sipho_indemnity.pdf', fileSizeMB: 0.5 });
assert('Uploads indemnity form', upload3.success);

const badType = uploadDocument(driverId, 'passport', { fileName: 'passport.pdf', fileSizeMB: 1 });
assert('Rejects unknown document type', !badType.success && badType.error === 'INVALID_DOCUMENT_TYPE');

const badFile = uploadDocument(driverId, 'ID', { fileName: 'id.exe', fileSizeMB: 1 });
assert('Rejects unsupported file type', !badFile.success && badFile.error === 'UNSUPPORTED_FILE_TYPE');

const largeFile = uploadDocument(driverId, 'ID', { fileName: 'huge.pdf', fileSizeMB: 50 });
assert('Rejects file exceeding size limit', !largeFile.success && largeFile.error === 'FILE_TOO_LARGE');

const statusBefore = getDocumentStatus(driverId);
assert('Shows all documents uploaded before verification', statusBefore.missing.length === 0);

const verifyIncomplete = verifyDocuments(driverId2);
assert('Blocks verification when documents are missing', !verifyIncomplete.success && verifyIncomplete.error === 'MISSING_REQUIRED_DOCUMENTS');

const verified = verifyDocuments(driverId);
assert('Verifies all documents for driver 1', verified.success);
assert('Driver documents status updated to verified', getDriverById(driverId).documentsStatus === 'verified');

// Upload and verify driver 2 docs for event booking tests
['ID', 'driverLicense', 'indemnityForm'].forEach(type => {
    uploadDocument(driverId2, type, { fileName: `priya_${type}.pdf`, fileSizeMB: 0.5 });
});
verifyDocuments(driverId2);

// ─── USER STORY 3: Event Booking ─────────────────────────────────────────────
console.log('\n\x1b[33m[US-3] Event Booking\x1b[0m');

const events = getAvailableEvents();
assert('Returns available events list', Array.isArray(events) && events.length > 0);
assert('Events include time slot availability', events[0].slots && events[0].slots[0].available !== undefined);

const booking1 = bookEvent(driverId, 'EVT-001', '08:00');
assert('Books a confirmed event slot', booking1.success);
assert('Booking has a bookingId', !!booking1.booking.bookingId);

const bookingDupe = bookEvent(driverId, 'EVT-001', '09:30');
assert('Prevents duplicate booking for same event', !bookingDupe.success && bookingDupe.error === 'DUPLICATE_BOOKING');

const bookingUnverified = bookEvent(99999, 'EVT-001', '09:30');
assert('Rejects booking for unknown driver', !bookingUnverified.success && bookingUnverified.error === 'DRIVER_NOT_FOUND');

const booking2 = bookEvent(driverId2, 'EVT-001', '08:00');
assert('Second driver can book same slot', booking2.success);

const driverBookings = getDriverBookings(driverId);
assert('Returns driver booking history', driverBookings.length === 1);

const cancelResult = cancelBooking('BK-9999', driverId);
assert('Returns error for unknown booking cancellation', !cancelResult.success && cancelResult.error === 'BOOKING_NOT_FOUND');

// ─── USER STORY 4: Digital Check-in ──────────────────────────────────────────
console.log('\n\x1b[33m[US-4] Digital Check-in\x1b[0m');

const bookingId = booking1.booking.bookingId;
const tokenResult = generateCheckinToken(bookingId, driverId);
assert('Generates check-in token with QR content', tokenResult.success && !!tokenResult.qrCodeContent);
assert('QR content uses kyalami:// deep link scheme', tokenResult.qrCodeContent.startsWith('kyalami://'));

const checkin = processCheckin(tokenResult.token);
assert('Processes valid check-in successfully', checkin.success);
assert('Check-in response includes gate welcome message', !!checkin.gateMessage);

const checkinAgain = processCheckin(tokenResult.token);
assert('Blocks duplicate check-in on same token', !checkinAgain.success && checkinAgain.error === 'ALREADY_CHECKED_IN');

const badToken = generateCheckinToken('BK-9999', driverId);
assert('Rejects token for non-existent booking', !badToken.success && badToken.error === 'BOOKING_NOT_FOUND');

const malformedCheckin = processCheckin('not-valid-base64!!!');
assert('Rejects malformed token gracefully', !malformedCheckin.success);

const checkinLog = getEventCheckinLog('EVT-001');
assert('Check-in log records the entry', checkinLog.length >= 1);

// ─── USER STORY 5: Lap Time Tracking & Performance ───────────────────────────
console.log('\n\x1b[33m[US-5] Lap Time Tracking & Performance View\x1b[0m');

// Record a progression of laps (improving over time)
const lapSet = [95500, 92300, 90100, 88800, 87500, 86200];
lapSet.forEach(ms => recordLapTime(driverId, 'EVT-001', ms));

const perf = getDriverPerformance(driverId, 'EVT-001');
assert('Returns driver performance dashboard', perf.success);
assert('Identifies correct best lap', perf.summary.bestLap.ms === 86200);
assert('Formats best lap as M:SS.mmm', perf.summary.bestLap.formatted === '1:26.200');
assert('Calculates total lap count', perf.summary.totalLaps === 6);
assert('Calculates improvement percentage', perf.summary.improvementPercent !== null && perf.summary.improvementPercent > 0);
assert('Calculates gap to circuit record', perf.summary.gapToCircuitRecord !== undefined);

const badLap = recordLapTime(driverId, 'EVT-001', -500);
assert('Rejects negative lap time', !badLap.success && badLap.error === 'INVALID_LAP_TIME');

const impossibleLap = recordLapTime(driverId, 'EVT-001', 5000);
assert('Rejects physically impossible lap time', !impossibleLap.success && impossibleLap.error === 'LAP_TIME_BELOW_PHYSICAL_MINIMUM');

recordLapTime(driverId2, 'EVT-001', 89100);

const leaderboard = getEventLeaderboard('EVT-001');
assert('Returns event leaderboard sorted by best lap', leaderboard[0].position === 1);
assert('Leaderboard shows fastest driver in P1', leaderboard[0].bestLapMs <= leaderboard[1].bestLapMs);

const noLapPerf = getDriverPerformance(driverId, 'EVT-002');
assert('Returns empty performance for event with no laps', noLapPerf.success && noLapPerf.message === 'NO_LAPS_RECORDED');

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
console.log('\n\x1b[36m=================================================================\x1b[0m');
const total = passed + failed;
if (failed === 0) {
    console.log(`\x1b[32m  ALL ${total} ASSERTIONS PASSED — ALL 5 USER STORIES VERIFIED\x1b[0m`);
} else {
    console.log(`\x1b[31m  ${failed} FAILED / ${passed} PASSED out of ${total} total assertions\x1b[0m`);
}
console.log('\x1b[36m=================================================================\x1b[0m\n');

if (failed > 0) process.exit(1);
