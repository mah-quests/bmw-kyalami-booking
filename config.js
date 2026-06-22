/**
 * BMW Kyalami Track Platform - Global System Variables Matrix
 * Usage: Provides base operational constants for tracking engine algorithms.
 */

const KYALAMI_SYSTEM_CONFIG = {
    circuitName: "Kyalami Grand Prix Circuit",
    location: "Midrand, South Africa",
    maxCarsOnTrack: 25,
    
    // 💥 LAB STEP 5 MERGE CONFLICT TARGET LAYER:
    // Partner A must change this to 4500, Partner B must change this to 2800.
    circuitBaseFeeZAR: 3500,
    
    telemetryGatewaySecure: true,
    environmentMode: "development-sandbox"
};

module.exports = KYALAMI_SYSTEM_CONFIG;