const { screenAgainstWatchList } = require('../utils/screeningUtils');
const {
    analyzeTransactionPatterns,
    detectStructuring,
    detectUnusualVolume,
    calculateRecentVolume,
    assessGeographicRisk
  } = require('../utils/amlUtils');
  

function performAMLCheck(application, watchLists) {
    const aml = {
        status: 'PENDING',
        riskLevel: 'LOW',
        flags: [],
        screeningResults: {},
        requiresManualReview: false
    };

    // Screen against watch lists
    aml.screeningResults.sanctions = screenAgainstWatchList(
        application.personalInfo, 
        watchLists.sanctions
    );
    
    aml.screeningResults.pep = screenAgainstWatchList(
        application.personalInfo, 
        watchLists.pep
    );

    // Transaction pattern analysis
    if (application.accountHistory) {
        aml.screeningResults.transactionPattern = analyzeTransactionPatterns(
            application.accountHistory
        );
    }

    // Geographic risk assessment
    aml.screeningResults.geographic = assessGeographicRisk(application.personalInfo.address);

    // Evaluate AML risk
    if (aml.screeningResults.sanctions.matches.length > 0) {
        aml.riskLevel = 'HIGH';
        aml.flags.push('SANCTIONS_MATCH');
        aml.requiresManualReview = true;
    }

    if (aml.screeningResults.pep.matches.length > 0) {
        aml.riskLevel = 'MEDIUM';
        aml.flags.push('PEP_MATCH');
        aml.requiresManualReview = true;
    }

    if (aml.screeningResults.transactionPattern?.suspicious) {
        aml.flags.push('SUSPICIOUS_PATTERN');
        aml.requiresManualReview = true;
    }

    // Determine overall status
    if (aml.flags.includes('SANCTIONS_MATCH')) {
        aml.status = 'FAIL';
    } else if (aml.requiresManualReview) {
        aml.status = 'REVIEW_REQUIRED';
    } else {
        aml.status = 'PASS';
    }

    return aml;
}

module.exports = performAMLCheck;