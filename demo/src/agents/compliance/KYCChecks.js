const { ComplianceError } = require('../errors/complianceErrors');

const config = require('../config/complianceConfig');

function performKYCCheck(application) {
    try {
        const kyc = {
            status: 'PENDING',
            score: 0,
            requirements: [],
            documents: [],
            issues: []
        };

        // Identity verification
        if (application.personalInfo.ssn) {
            kyc.score += 25;
            kyc.requirements.push('SSN_VERIFIED');
        } else {
            kyc.issues.push('Missing SSN');
        }

        // Address verification
        if (application.personalInfo.address && application.personalInfo.addressVerified) {
            kyc.score += 25;
            kyc.requirements.push('ADDRESS_VERIFIED');
        } else {
            kyc.issues.push('Address not verified');
        }

        // Income verification
        if (application.incomeVerified && application.incomeDocuments) {
            kyc.score += 25;
            kyc.requirements.push('INCOME_VERIFIED');
        } else {
            kyc.issues.push('Income documentation incomplete');
        }

        // Employment verification
        if (application.employmentVerified) {
            kyc.score += 25;
            kyc.requirements.push('EMPLOYMENT_VERIFIED');
        } else {
            kyc.issues.push('Employment not verified');
        }

        // Determine status based on score
        if (kyc.score >= config.kycThresholds.pass) {
            kyc.status = 'PASS';
        } else if (kyc.score >= config.kycThresholds.conditional) {
            kyc.status = 'CONDITIONAL';
        } else {
            kyc.status = 'FAIL';
        }

        return kyc;
    } catch (err) {
        throw new ComplianceError('KYC module failed to load', 'KYC_FAILURE');
    }
}

module.exports = performKYCCheck;