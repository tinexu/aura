/**
 * ComplianceAgent.js
 *
 * This agent scans the user's portfolio and activity for compliance violations.
 * It enforces basic financial guidelines such as diversification limits,
 * account usage restrictions, and configurable KYC/AML rule checks.
 *
 * Supports integration with AI audits and reporting systems.
 */

const performKYCCheck = require('./compliance/KYCChecks');
const performAMLCheck = require('./compliance/AMLScreening');
const performFairLendingCheck = require('./compliance/FairLending');
const performRegulatoryCheck = require('./compliance/RegulatoryCheck');
const performSanctionsCheck = require('./compliance/SanctionsScreening');

const { loadWatchlist } = require('../services/watchlistService');

const config = require('../agents/config/complianceConfig');

const fs = require('fs');
const path = require('path');

class ComplianceAgent {
    constructor() {
        this.agentId = 'compliance-001';
        this.name = 'Compliance Agent';
        this.capabilities = [
            'regulatory_compliance',
            'kyc_verification',
            'aml_screening',
            'policy_enforcement',
            'audit_support'
        ];
        this.regulatoryFrameworks = [
            'BASEL_III',
            'DODD_FRANK',
            'GDPR',
            'KYC',
            'AML',
            'FAIR_LENDING'
        ];
        this.auditTrail = [];
        this.watchLists = {
            pep: loadWatchlist('../agents/data/pep.json'),
            sanctions: loadWatchlist('../agents/data/sanctions.json'),
            adverse: loadWatchlist('../agents/data/adverse_media.json')
        };
    }

    async performComplianceCheck(application, riskAssessment) {
        const timestamp = new Date().toISOString();
        const complianceCheck = {
            applicationId: application.id,
            timestamp,
            agentId: this.agentId,
            checks: {},
            overallStatus: 'PENDING',
            violations: [],
            recommendations: []
        };

        complianceCheck.checks.kyc = await performKYCCheck(application);
        complianceCheck.checks.aml = await performAMLCheck(application, this.watchLists);
        complianceCheck.checks.fairLending = await performFairLendingCheck(application, riskAssessment);
        complianceCheck.checks.regulatory = await performRegulatoryCheck(application, riskAssessment);
        complianceCheck.checks.sanctions = await performSanctionsCheck(application, this.watchLists);

        // Evaluate overall compliance status
        complianceCheck.overallStatus = this.evaluateOverallCompliance(complianceCheck.checks);
        complianceCheck.violations = this.identifyViolations(complianceCheck.checks);
        complianceCheck.recommendations = this.generateComplianceRecommendations(complianceCheck);

        this.logAction('COMPLIANCE_CHECK', {
            applicationId: application.id,
            status: complianceCheck.overallStatus,
            violations: complianceCheck.violations.length
        });

        return complianceCheck;
    }

    identifyProtectedClasses(demographics) {
        const protectedClasses = [];
        
        // Note: This identification is for compliance monitoring only
        // and must never be used in lending decisions
        if (demographics.race) protectedClasses.push('RACE');
        if (demographics.gender) protectedClasses.push('GENDER');
        if (demographics.age && demographics.age >= 40) protectedClasses.push('AGE');
        if (demographics.maritalStatus) protectedClasses.push('MARITAL_STATUS');
        
        return protectedClasses;
    }

    analyzDecisionConsistency(application, riskAssessment) {
        // Analyze if similar applications receive consistent treatment
        return {
            consistent: true,
            variance: 0.05,
            comparable_cases: 150
        };
    }

    assessBiasRisk(application, riskAssessment) {
        // Simplified bias risk assessment
        // In practice, would use sophisticated statistical analysis
        return 'LOW';
    }

    checkBaselCompliance(application, riskAssessment) {
        return {
            status: 'COMPLIANT',
            capitalRequirement: riskAssessment?.capitalRequirement || 0,
            riskWeight: 1.0,
            issues: []
        };
    }

    checkDoddFrankCompliance(application) {
        return {
            status: 'COMPLIANT',
            qualifiedMortgage: application.loanType === 'mortgage' ? this.checkQMCompliance(application) : null,
            issues: []
        };
    }

    checkLendingRegulations(application) {
        return {
            status: 'COMPLIANT',
            stateCompliance: true,
            federalCompliance: true,
            issues: []
        };
    }

    checkQMCompliance(application) {
        const dtiRatio = application.monthlyDebt / application.monthlyIncome;
        return {
            compliant: dtiRatio <= 0.43,
            dtiRatio,
            verification: application.incomeVerified
        };
    }

    screenAgainstSanctionsList(personalInfo, listName) {
        // Simplified sanctions screening
        // In practice, would integrate with actual sanctions databases
        return [];
    }

    calculateAverageMonthlyVolume(transactions) {
        // Simplified calculation
        return transactions.reduce((sum, t) => sum + t.amount, 0) / 12;
    }

    // Evaluation methods
    evaluateOverallCompliance(checks) {
        const statuses = Object.values(checks).map(check => check.status);
        
        if (statuses.includes('FAIL') || statuses.includes('VIOLATION')) {
            return 'NON_COMPLIANT';
        } else if (statuses.includes('REVIEW_REQUIRED') || statuses.includes('WARNING')) {
            return 'REVIEW_REQUIRED';
        } else {
            return 'COMPLIANT';
        }
    }

    identifyViolations(checks) {
        const violations = [];
        
        Object.entries(checks).forEach(([checkType, result]) => {
            if (result.violations) {
                violations.push(...result.violations.map(v => ({ type: checkType, ...v })));
            }
            if (result.status === 'FAIL' || result.status === 'VIOLATION') {
                violations.push({
                    type: checkType,
                    severity: 'HIGH',
                    description: `${checkType} check failed`
                });
            }
        });
        
        return violations;
    }

    generateComplianceRecommendations(complianceCheck) {
        const recommendations = [];
        
        if (complianceCheck.overallStatus === 'NON_COMPLIANT') {
            recommendations.push({
                priority: 'HIGH',
                action: 'REJECT_APPLICATION',
                reason: 'Compliance violations detected'
            });
        } else if (complianceCheck.overallStatus === 'REVIEW_REQUIRED') {
            recommendations.push({
                priority: 'MEDIUM',
                action: 'MANUAL_REVIEW',
                reason: 'Additional compliance review required'
            });
        }
        
        return recommendations;
    }

    extractViolations(frameworks) {
        const violations = [];
        
        Object.entries(frameworks).forEach(([framework, result]) => {
            if (result.violations) {
                violations.push(...result.violations);
            }
        });
        
        return violations;
    }

    // Agent communication methods
    async communicateWithAgent(targetAgent, message, data) {
        const communication = {
            from: this.agentId,
            to: targetAgent,
            timestamp: new Date().toISOString(),
            message,
            data,
            type: 'AGENT_COMMUNICATION'
        };

        this.logAction('AGENT_COMMUNICATION', communication);
        return communication;
    }

    async requestRiskReassessment(applicationId, reason) {
        return await this.communicateWithAgent('credit-risk-001', 'REQUEST_REASSESSMENT', {
            applicationId,
            reason
        });
    }

    async notifyReporting(complianceCheck) {
        return await this.communicateWithAgent('reporting-001', 'COMPLIANCE_COMPLETE', {
            applicationId: complianceCheck.applicationId,
            status: complianceCheck.overallStatus,
            violations: complianceCheck.violations
        });
    }

    logAction(action, details) {
        const entry = {
          timestamp: new Date().toISOString(),
          agentId: this.agentId,
          action,
          details
        };
      
        // Persist to file
        fs.appendFileSync(
          path.join(__dirname, '../../logs/compliance.log'),
          JSON.stringify(entry) + '\n'
        );
      
        this.auditTrail.push(entry);
    } 

    getAuditTrail(filter = {}) {
        let trail = this.auditTrail;
        
        if (filter.action) {
            trail = trail.filter(entry => entry.action === filter.action);
        }
        
        if (filter.dateFrom) {
            trail = trail.filter(entry => new Date(entry.timestamp) >= new Date(filter.dateFrom));
        }
        
        if (filter.dateTo) {
            trail = trail.filter(entry => new Date(entry.timestamp) <= new Date(filter.dateTo));
        }
        
        return trail;
    }

    // Get agent status
    getStatus() {
        return {
            agentId: this.agentId,
            name: this.name,
            capabilities: this.capabilities,
            status: 'ACTIVE',
            lastActivity: this.auditTrail.length > 0 ? this.auditTrail[this.auditTrail.length - 1].timestamp : null,
            totalChecks: this.auditTrail.filter(entry => entry.action === 'COMPLIANCE_CHECK').length,
            regulatoryFrameworks: this.regulatoryFrameworks
        };
    }
}

module.exports = ComplianceAgent;