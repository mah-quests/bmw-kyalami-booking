/**
 * BMW Kyalami Track Platform - Document Upload & Verification Module
 * User Story 2: Document Upload & Verification
 */

const { getDriverById } = require('./driverRegistration');

const documentStore = {};

const REQUIRED_DOCUMENT_TYPES = ['ID', 'driverLicense', 'indemnityForm'];
const ALLOWED_FILE_TYPES = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE_MB = 10;

/**
 * Simulates uploading a document for a driver.
 * @param {number} driverId
 * @param {'ID'|'driverLicense'|'indemnityForm'} docType
 * @param {Object} fileMetadata - { fileName, fileSizeMB, mimeType }
 * @returns {Object} Upload result
 */
function uploadDocument(driverId, docType, fileMetadata) {
    const driver = getDriverById(driverId);
    if (!driver) {
        return { success: false, error: 'DRIVER_NOT_FOUND', driverId };
    }

    if (!REQUIRED_DOCUMENT_TYPES.includes(docType)) {
        return { success: false, error: 'INVALID_DOCUMENT_TYPE', validTypes: REQUIRED_DOCUMENT_TYPES };
    }

    if (!fileMetadata || !fileMetadata.fileName) {
        return { success: false, error: 'MISSING_FILE_METADATA' };
    }

    const extension = fileMetadata.fileName.slice(fileMetadata.fileName.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(extension)) {
        return { success: false, error: 'UNSUPPORTED_FILE_TYPE', allowed: ALLOWED_FILE_TYPES };
    }

    if (fileMetadata.fileSizeMB && fileMetadata.fileSizeMB > MAX_FILE_SIZE_MB) {
        return { success: false, error: 'FILE_TOO_LARGE', maxSizeMB: MAX_FILE_SIZE_MB };
    }

    if (!documentStore[driverId]) {
        documentStore[driverId] = {};
    }

    documentStore[driverId][docType] = {
        docType,
        fileName: fileMetadata.fileName,
        fileSizeMB: fileMetadata.fileSizeMB || null,
        uploadedAt: new Date().toISOString(),
        verificationStatus: 'pending'
    };

    return {
        success: true,
        message: 'DOCUMENT_UPLOADED_SUCCESSFULLY',
        driverId,
        docType,
        status: 'pending'
    };
}

/**
 * Verifies all required documents for a driver.
 * In a real system this would trigger a human or automated review.
 * Here it auto-approves if all required documents are present.
 * @param {number} driverId
 * @returns {Object} Verification result
 */
function verifyDocuments(driverId) {
    const driver = getDriverById(driverId);
    if (!driver) {
        return { success: false, error: 'DRIVER_NOT_FOUND', driverId };
    }

    const driverDocs = documentStore[driverId] || {};
    const missing = REQUIRED_DOCUMENT_TYPES.filter(type => !driverDocs[type]);

    if (missing.length > 0) {
        return {
            success: false,
            error: 'MISSING_REQUIRED_DOCUMENTS',
            missing,
            uploaded: Object.keys(driverDocs)
        };
    }

    REQUIRED_DOCUMENT_TYPES.forEach(type => {
        documentStore[driverId][type].verificationStatus = 'verified';
    });

    driver.documentsStatus = 'verified';

    return {
        success: true,
        message: 'ALL_DOCUMENTS_VERIFIED',
        driverId,
        documents: documentStore[driverId]
    };
}

/**
 * Returns the document status for a driver.
 * @param {number} driverId
 * @returns {Object}
 */
function getDocumentStatus(driverId) {
    const driver = getDriverById(driverId);
    if (!driver) {
        return { success: false, error: 'DRIVER_NOT_FOUND' };
    }

    const driverDocs = documentStore[driverId] || {};
    const uploaded = Object.keys(driverDocs);
    const missing = REQUIRED_DOCUMENT_TYPES.filter(type => !driverDocs[type]);

    return {
        success: true,
        driverId,
        overallStatus: driver.documentsStatus,
        uploaded,
        missing,
        documents: driverDocs
    };
}

module.exports = {
    uploadDocument,
    verifyDocuments,
    getDocumentStatus,
    REQUIRED_DOCUMENT_TYPES
};
