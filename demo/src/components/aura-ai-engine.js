import * as math from 'mathjs';

class SmartCashOptimizer {
    constructor() {
        this.riskAversion = 0.5;
        this.minLiquidityRatio = 0.15;
        this.rebalanceThreshold = 0.02;
    }

    async optimizeAllocation(accounts, totalCash, constraints = {}) {
        console.log('🧠 AURA AI: Starting intelligent cash optimization...');

        const optimization = {
            currentAllocation: this.getCurrentAllocation(accounts, totalCash),
            optimalAllocation: {},
            rebalanceActions: [],
            expectedYield: 0,
            riskScore: 0,
            confidence: 0
        };

        try {
            const accountScores = this.calculateAccountScores(accounts);

            const liquidityConstraints = this.calculateLiquidityConstraints(totalCash, constraints);

            optimization.optimalAllocation = this.solveOptimization(
                accountScores,
                totalCash,
                liquidityConstraints
            );

            optimization.rebalanceActions = this.generateRebalanceActions(
                optimization.currentAllocation,
                optimization.optimalAllocation
            );

            optimization.expectedYield = this.calculateExpectedYield(optimization.optimalAllocation, accounts);
            optimization.riskScore = this.calculateRiskScore(optimization.optimalAllocation, accounts);
            optimization.confidence = this.calculateConfidence(optimization);

            console.log('✅ Optimization complete:', {
                expectedYield: `${(optimization.expectedYield * 100).toFixed(2)}%`,
                riskScore: optimization.riskScore.toFixed(2),
                confidence: `${(optimization.confidence * 100).toFixed(1)}%`
            });

            return optimization;

        } catch (error) {
            console.error('❌ Optimization failed:', error);
            return this.getFallbackAllocation(accounts, totalCash);
        }
    }

    calculateAccountScores(accounts) {
        const scores = {};

        Object.entries(accounts).forEach(([type, account]) => {
            if (type === 'lastUpdated') return;

            let rate = 0;
            let liquidity = 0.5;

            if (typeof account === 'number') {
                rate = account;
                const defaultLiquidity = {
                    'Checking': 1.0,
                    'Money Market': 0.9,
                    'Treasury MMF': 0.9,
                    'High Yield Savings': 0.8,
                    'CD 3-Month': 0.3,
                    'CD 6-Month': 0.1
                };
                liquidity = defaultLiquidity[type] || 0.5;
            } else if (account && typeof account === 'object') {
                rate = account.rate || 0;
                liquidity = account.liquidity || 0.5;
            }

            const rateScore = Number(rate) / 100;
            const liquidityPenalty = this.getLiquidityPenalty(type);
            const riskPenalty = this.getRiskPenalty(type);

            scores[type] = {
                rawScore: rateScore - (liquidityPenalty * this.riskAversion) - riskPenalty,
                rate: Number(rate),
                liquidity: Number(liquidity),
                risk: this.getAccountRisk(type)
            };
        });

        return scores;
    }

    calculateLiquidityConstraints(totalCash, constraints) {
        return {
            minLiquid: Math.max(
                totalCash * this.minLiquidityRatio,
                constraints.emergencyReserve || 0
            ),
            maxIlliquid: totalCash * 0.6, // Max 60% in less liquid investments
            totalCash
        };
    }

    solveOptimization(accountScores, totalCash, constraints) {
        const allocation = {};
        let remainingCash = totalCash;

        // Sort accounts by risk-adjusted score (highest first)
        const sortedAccounts = Object.entries(accountScores)
            .sort(([, a], [, b]) => b.rawScore - a.rawScore);

        // Step 1: Satisfy liquidity requirements first
        const liquidAccounts = sortedAccounts.filter(([type]) =>
            this.isHighLiquidity(type)
        );

        let liquidityAllocated = 0;
        for (const [type, score] of liquidAccounts) {
            if (liquidityAllocated < constraints.minLiquid) {
                const needed = constraints.minLiquid - liquidityAllocated;
                const allocate = Math.min(needed, remainingCash * 0.4); // Don't over-allocate to liquidity
                allocation[type] = allocate;
                liquidityAllocated += allocate;
                remainingCash -= allocate;
            }
        }

        // Step 2: Allocate remaining cash to highest-scoring accounts
        for (const [type, score] of sortedAccounts) {
            if (remainingCash <= 0) break;

            const maxAllocation = this.getMaxAllocation(type, totalCash);
            const currentAllocation = allocation[type] || 0;
            const additionalCapacity = maxAllocation - currentAllocation;

            if (additionalCapacity > 0) {
                const allocate = Math.min(
                    additionalCapacity,
                    remainingCash * this.getAllocationWeight(score.rawScore)
                );
                allocation[type] = currentAllocation + allocate;
                remainingCash -= allocate;
            }
        }

        // Step 3: Handle any remaining cash (put in highest-yield liquid account)
        if (remainingCash > 0) {
            const fallbackAccount = this.getBestLiquidAccount(accountScores);
            allocation[fallbackAccount] = (allocation[fallbackAccount] || 0) + remainingCash;
        }

        return allocation;
    }

    generateRebalanceActions(current, optimal) {
        const actions = [];

        Object.entries(optimal).forEach(([type, optimalAmount]) => {
            const currentAmount = current[type] || 0;
            const difference = optimalAmount - currentAmount;

            if (Math.abs(difference) > (optimalAmount * this.rebalanceThreshold)) {
                actions.push({
                    account: type,
                    action: difference > 0 ? 'INCREASE' : 'DECREASE',
                    amount: Math.abs(difference),
                    currentAmount,
                    targetAmount: optimalAmount,
                    priority: this.getActionPriority(type, difference)
                });
            }
        });

        return actions.sort((a, b) => b.priority - a.priority);
    }

    // Helper methods
    getCurrentAllocation(accounts, totalCash) {
        const allocation = {};
        Object.keys(accounts).forEach(type => {
            allocation[type] = totalCash * 0.2; // Start with equal distribution
        });
        return allocation;
    }

    getLiquidityPenalty(accountType) {
        const penalties = {
            'Checking': 0,
            'Money Market': 0.001,
            'High Yield Savings': 0.002,
            'Treasury MMF': 0.001,
            'CD 3-Month': 0.01,
            'CD 6-Month': 0.02
        };
        return penalties[accountType] || 0.005;
    }

    getRiskPenalty(accountType) {
        const risks = {
            'Checking': 0,
            'Money Market': 0.001,
            'High Yield Savings': 0.002,
            'Treasury MMF': 0.001,
            'CD 3-Month': 0.005,
            'CD 6-Month': 0.008
        };
        return risks[accountType] || 0.005;
    }

    getDefaultLiquidity(accountType) {
        const liquidityMap = {
            'Checking': 1.0,
            'Money Market': 0.9,
            'High Yield Savings': 0.8,
            'Treasury MMF': 0.9,
            'CD 3-Month': 0.3,
            'CD 6-Month': 0.1
        };
        return liquidityMap[accountType] || 0.5;
    }

    isHighLiquidity(accountType) {
        return ['Checking', 'Money Market', 'Treasury MMF'].includes(accountType);
    }

    getMaxAllocation(accountType, totalCash) {
        const maxPercentages = {
            'Checking': 0.3,
            'Money Market': 0.4,
            'High Yield Savings': 0.5,
            'Treasury MMF': 0.6,
            'CD 3-Month': 0.3,
            'CD 6-Month': 0.2
        };
        return totalCash * (maxPercentages[accountType] || 0.25);
    }

    getAllocationWeight(score) {
        // Convert score to allocation weight (0.1 to 0.4)
        return Math.max(0.1, Math.min(0.4, score * 8));
    }

    getBestLiquidAccount(accountScores) {
        const liquidAccounts = Object.entries(accountScores)
            .filter(([type]) => this.isHighLiquidity(type))
            .sort(([, a], [, b]) => b.rawScore - a.rawScore);

        return liquidAccounts[0]?.[0] || 'Checking';
    }

    getActionPriority(accountType, difference) {
        const urgency = Math.abs(difference) / 10000; // Amount-based urgency
        const typePriority = this.isHighLiquidity(accountType) ? 1.2 : 1.0;
        return urgency * typePriority;
    }

    calculateExpectedYield(allocation, accounts) {
        let totalYield = 0;
        let totalAmount = 0;

        Object.entries(allocation).forEach(([type, amount]) => {
            const rate = accounts[type]?.rate || 0;
            totalYield += (amount * rate / 100);
            totalAmount += amount;
        });

        return totalAmount > 0 ? totalYield / totalAmount : 0;
    }

    calculateRiskScore(allocation, accounts) {
        let riskScore = 0;
        let totalAmount = 0;

        Object.entries(allocation).forEach(([type, amount]) => {
            const risk = this.getAccountRisk(type);
            riskScore += (amount * risk);
            totalAmount += amount;
        });

        return totalAmount > 0 ? riskScore / totalAmount : 0;
    }

    getAccountRisk(accountType) {
        const riskMap = {
            'Checking': 0.1,
            'Money Market': 0.2,
            'High Yield Savings': 0.3,
            'Treasury MMF': 0.15,
            'CD 3-Month': 0.25,
            'CD 6-Month': 0.35
        };
        return riskMap[accountType] || 0.25;
    }

    calculateConfidence(optimization) {
        // Confidence based on yield improvement and diversification
        const yieldConfidence = Math.min(1, optimization.expectedYield * 20);
        const diversificationScore = Object.keys(optimization.optimalAllocation).length / 6;
        const riskConfidence = Math.max(0, 1 - optimization.riskScore);

        return (yieldConfidence + diversificationScore + riskConfidence) / 3;
    }

    getFallbackAllocation(accounts, totalCash) {
        // Conservative fallback: equal distribution with liquidity priority
        const allocation = {};
        const accountTypes = Object.keys(accounts);
        const perAccount = totalCash / accountTypes.length;

        accountTypes.forEach(type => {
            allocation[type] = perAccount;
        });

        return {
            currentAllocation: allocation,
            optimalAllocation: allocation,
            rebalanceActions: [],
            expectedYield: 0.03,
            riskScore: 0.5,
            confidence: 0.7
        };
    }
}

// ===== LIQUIDITY FORECASTER =====
class LiquidityForecaster {
    constructor() {
        this.historicalData = [];
        this.seasonalityWindow = 30; // days
        this.trendWindow = 90; // days
    }

    // Generate intelligent cash flow predictions
    async forecastLiquidity(currentCash, timeHorizon = 30) {
        console.log('🔮 AURA AI: Generating liquidity forecast...');

        const forecast = {
            timeHorizon,
            predictions: [],
            confidenceInterval: {},
            riskFactors: [],
            recommendations: []
        };

        try {
            // Generate base predictions using simplified ARIMA-like approach
            const basePredictions = this.generateBasePredictions(currentCash, timeHorizon);

            // Apply seasonality adjustments
            const seasonalPredictions = this.applySeasonality(basePredictions);

            // Add volatility and confidence intervals
            forecast.predictions = this.addConfidenceIntervals(seasonalPredictions);

            // Identify risk factors
            forecast.riskFactors = this.identifyRiskFactors(forecast.predictions);

            // Generate recommendations
            forecast.recommendations = this.generateRecommendations(forecast);

            console.log('✅ Liquidity forecast complete:', {
                horizon: `${timeHorizon} days`,
                avgPrediction: `$${(forecast.predictions.reduce((sum, p) => sum + p.amount, 0) / forecast.predictions.length).toLocaleString()}`,
                riskFactors: forecast.riskFactors.length
            });

            return forecast;

        } catch (error) {
            console.error('❌ Forecasting failed:', error);
            return this.getFallbackForecast(currentCash, timeHorizon);
        }
    }

    generateBasePredictions(currentCash, days) {
        const predictions = [];
        let cashLevel = currentCash;

        for (let day = 1; day <= days; day++) {
            // Simplified cash flow model with trend and noise
            const trendComponent = this.calculateTrend(day);
            const cyclicalComponent = this.calculateCyclical(day);
            const randomComponent = this.generateRandomWalk();

            const dailyChange = trendComponent + cyclicalComponent + randomComponent;
            cashLevel += dailyChange;

            predictions.push({
                day,
                date: new Date(Date.now() + day * 24 * 60 * 60 * 1000),
                amount: Math.max(0, cashLevel),
                dailyChange,
                confidence: this.calculateDayConfidence(day)
            });
        }

        return predictions;
    }

    calculateTrend(day) {

        const growthRate = 0.001;
        const seasonalFactor = Math.sin(day * 2 * Math.PI / 365) * 0.0005;
        return day * growthRate * 1000 + seasonalFactor * 1000;
    }

    calculateCyclical(day) {
        const weeklyPattern = Math.sin(day * 2 * Math.PI / 7) * 2000;
        const monthlyPattern = Math.cos(day * 2 * Math.PI / 30) * 5000;
        return weeklyPattern + monthlyPattern;
    }

    generateRandomWalk() {
        const randomShock = (Math.random() - 0.5) * 10000;
        const meanReversion = -randomShock * 0.1;
        return randomShock + meanReversion;
    }

    applySeasonality(predictions) {
        return predictions.map(pred => {
            const dayOfWeek = pred.date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isMonday = dayOfWeek === 1;
            const isFriday = dayOfWeek === 5;

            let seasonalMultiplier = 1.0;

            if (isWeekend) seasonalMultiplier *= 0.3; // Lower weekend activity
            if (isMonday) seasonalMultiplier *= 1.2; // Monday bump
            if (isFriday) seasonalMultiplier *= 1.1; // Friday activity

            return {
                ...pred,
                amount: pred.amount * seasonalMultiplier,
                seasonalFactor: seasonalMultiplier
            };
        });
    }

    addConfidenceIntervals(predictions) {
        return predictions.map((pred, index) => {
            const volatility = this.calculateVolatility(index + 1);
            const confidenceLevel = 1.96; // 95% confidence interval

            return {
                ...pred,
                upperBound: pred.amount + (confidenceLevel * volatility),
                lowerBound: Math.max(0, pred.amount - (confidenceLevel * volatility)),
                volatility
            };
        });
    }

    calculateVolatility(dayIndex) {
        // Volatility increases with time horizon
        const baseVolatility = 5000;
        const timeDecay = Math.sqrt(dayIndex) * 1000;
        return baseVolatility + timeDecay;
    }

    calculateDayConfidence(day) {
        // Confidence decreases with time horizon
        return Math.max(0.3, 1 - (day / 100));
    }

    identifyRiskFactors(predictions) {
        const risks = [];

        // Check for low cash periods
        const lowCashDays = predictions.filter(p => p.amount < 50000);
        if (lowCashDays.length > 0) {
            risks.push({
                type: 'LIQUIDITY_RISK',
                severity: lowCashDays.length > 5 ? 'HIGH' : 'MEDIUM',
                description: `${lowCashDays.length} days with cash below $50k threshold`,
                affectedDays: lowCashDays.map(d => d.day)
            });
        }

        // Check for high volatility periods
        const highVolatilityDays = predictions.filter(p => p.volatility > 15000);
        if (highVolatilityDays.length > 5) {
            risks.push({
                type: 'VOLATILITY_RISK',
                severity: 'MEDIUM',
                description: `High volatility expected for ${highVolatilityDays.length} days`,
                affectedDays: highVolatilityDays.map(d => d.day)
            });
        }

        // Check for trend risks
        const trendSlope = this.calculateTrendSlope(predictions);
        if (trendSlope < -1000) {
            risks.push({
                type: 'TREND_RISK',
                severity: 'HIGH',
                description: 'Declining cash trend detected',
                trendSlope
            });
        }

        return risks;
    }

    calculateTrendSlope(predictions) {
        if (predictions.length < 2) return 0;

        const firstHalf = predictions.slice(0, Math.floor(predictions.length / 2));
        const secondHalf = predictions.slice(Math.floor(predictions.length / 2));

        const firstAvg = firstHalf.reduce((sum, p) => sum + p.amount, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, p) => sum + p.amount, 0) / secondHalf.length;

        return (secondAvg - firstAvg) / (predictions.length / 2);
    }

    generateRecommendations(forecast) {
        const recommendations = [];

        // Liquidity recommendations
        if (forecast.riskFactors.some(r => r.type === 'LIQUIDITY_RISK')) {
            recommendations.push({
                type: 'INCREASE_LIQUIDITY',
                priority: 'HIGH',
                action: 'Increase liquid cash reserves by 20%',
                reasoning: 'Low cash periods detected in forecast'
            });
        }

        // Optimization recommendations
        const avgCash = forecast.predictions.reduce((sum, p) => sum + p.amount, 0) / forecast.predictions.length;
        if (avgCash > 200000) {
            recommendations.push({
                type: 'OPTIMIZE_YIELD',
                priority: 'MEDIUM',
                action: 'Consider moving excess cash to higher-yield accounts',
                reasoning: 'Consistently high cash levels suggest optimization opportunity'
            });
        }

        // Risk management recommendations
        if (forecast.riskFactors.some(r => r.severity === 'HIGH')) {
            recommendations.push({
                type: 'RISK_MITIGATION',
                priority: 'HIGH',
                action: 'Establish credit facility for liquidity backup',
                reasoning: 'High-risk periods identified in forecast'
            });
        }

        return recommendations;
    }

    getFallbackForecast(currentCash, timeHorizon) {
        const predictions = [];
        for (let day = 1; day <= timeHorizon; day++) {
            predictions.push({
                day,
                date: new Date(Date.now() + day * 24 * 60 * 60 * 1000),
                amount: currentCash * (1 + (Math.random() - 0.48) * 0.1),
                confidence: 0.5,
                upperBound: currentCash * 1.1,
                lowerBound: currentCash * 0.9
            });
        }

        return {
            timeHorizon,
            predictions,
            riskFactors: [],
            recommendations: [{
                type: 'DATA_QUALITY',
                priority: 'LOW',
                action: 'Improve historical data for better forecasting',
                reasoning: 'Limited data available for accurate predictions'
            }]
        };
    }
}

class RiskEngine {
    constructor() {
        this.riskThresholds = {
            liquidityRisk: 0.15, // 15% of cash in liquid accounts minimum
            concentrationRisk: 0.40, // Max 40% in any single account type
            volatilityRisk: 0.25 // Max 25% expected volatility
        };
    }

    async assessPortfolioRisk(allocation, totalCash, marketConditions = {}) {
        console.log('⚠️ AURA AI: Assessing portfolio risk...');

        const riskAssessment = {
            overallRisk: 0,
            riskFactors: [],
            recommendations: [],
            riskBreakdown: {}
        };

        try {
            // Calculate different risk components with proper error handling
            riskAssessment.riskBreakdown = {
                liquidityRisk: this.calculateLiquidityRisk(allocation, totalCash),
                concentrationRisk: this.calculateConcentrationRisk(allocation),
                interestRateRisk: this.calculateInterestRateRisk(allocation, marketConditions),
                creditRisk: this.calculateCreditRisk(allocation)
            };

            // Calculate overall risk score
            riskAssessment.overallRisk = this.calculateOverallRisk(riskAssessment.riskBreakdown);

            // Generate risk factors and recommendations
            riskAssessment.riskFactors = this.identifyRiskFactors(riskAssessment.riskBreakdown);
            riskAssessment.recommendations = this.generateRiskRecommendations(riskAssessment);

            console.log('✅ Risk assessment complete:', {
                overallRisk: riskAssessment.overallRisk.toFixed(2),
                riskFactors: riskAssessment.riskFactors.length
            });

            return riskAssessment;

        } catch (error) {
            console.error('❌ Risk assessment failed:', error);

            // Return safe fallback
            return {
                overallRisk: 0.5,
                riskFactors: [],
                recommendations: [],
                riskBreakdown: {
                    liquidityRisk: { score: 0, status: 'UNKNOWN' },
                    concentrationRisk: { score: 0, status: 'UNKNOWN' },
                    interestRateRisk: { score: 0, status: 'UNKNOWN' },
                    creditRisk: { score: 0, status: 'UNKNOWN' }
                }
            };
        }
    }

    calculateLiquidityRisk(allocation, totalCash) {
        try {
            const liquidAccounts = ['Checking', 'Money Market', 'Treasury MMF'];
            const liquidAmount = liquidAccounts.reduce((sum, type) =>
                sum + (allocation[type] || 0), 0);

            // Ensure totalCash is valid
            const validTotalCash = totalCash > 0 ? totalCash : 1;
            const liquidityRatio = liquidAmount / validTotalCash;

            const score = Math.max(0, (this.riskThresholds.liquidityRisk - liquidityRatio) * 10);

            return {
                score: score,
                ratio: liquidityRatio,
                threshold: this.riskThresholds.liquidityRisk,
                status: liquidityRatio >= this.riskThresholds.liquidityRisk ? 'SAFE' : 'AT_RISK',
                liquidAmount: liquidAmount,
                totalCash: validTotalCash
            };
        } catch (error) {
            console.error('Error calculating liquidity risk:', error);
            return {
                score: 0,
                ratio: 0.5,
                threshold: this.riskThresholds.liquidityRisk,
                status: 'UNKNOWN',
                liquidAmount: 0,
                totalCash: totalCash || 0
            };
        }
    }

    calculateConcentrationRisk(allocation) {
        try {
            const totalAmount = Object.values(allocation).reduce((sum, amount) => sum + (amount || 0), 0);

            if (totalAmount <= 0) {
                return {
                    score: 0,
                    maxConcentration: 0,
                    threshold: this.riskThresholds.concentrationRisk,
                    concentrations: [],
                    status: 'UNKNOWN'
                };
            }

            const concentrations = Object.entries(allocation).map(([type, amount]) => ({
                type,
                percentage: (amount || 0) / totalAmount
            }));

            const maxConcentration = Math.max(...concentrations.map(c => c.percentage));
            const score = Math.max(0, (maxConcentration - this.riskThresholds.concentrationRisk) * 5);

            return {
                score: score,
                maxConcentration: maxConcentration,
                threshold: this.riskThresholds.concentrationRisk,
                concentrations: concentrations,
                status: maxConcentration <= this.riskThresholds.concentrationRisk ? 'SAFE' : 'AT_RISK'
            };
        } catch (error) {
            console.error('Error calculating concentration risk:', error);
            return {
                score: 0,
                maxConcentration: 0,
                threshold: this.riskThresholds.concentrationRisk,
                concentrations: [],
                status: 'UNKNOWN'
            };
        }
    }

    calculateInterestRateRisk(allocation, marketConditions) {
        try {
            // Simplified interest rate risk based on duration
            const durations = {
                'Checking': 0,
                'Money Market': 0.1,
                'High Yield Savings': 0.1,
                'Treasury MMF': 0.1,
                'CD 3-Month': 0.25,
                'CD 6-Month': 0.5
            };

            const totalAmount = Object.values(allocation).reduce((sum, amount) => sum + (amount || 0), 0);

            if (totalAmount <= 0) {
                return {
                    score: 0,
                    weightedDuration: 0,
                    rateVolatility: 0.02,
                    status: 'LOW'
                };
            }

            const weightedDuration = Object.entries(allocation).reduce((sum, [type, amount]) =>
                sum + (durations[type] || 0) * ((amount || 0) / totalAmount), 0);

            const rateVolatility = marketConditions.interestRateVolatility || 0.02;
            const riskScore = weightedDuration * rateVolatility * 10;

            return {
                score: riskScore,
                weightedDuration: weightedDuration,
                rateVolatility: rateVolatility,
                status: riskScore < 0.5 ? 'LOW' : riskScore < 1.0 ? 'MEDIUM' : 'HIGH'
            };
        } catch (error) {
            console.error('Error calculating interest rate risk:', error);
            return {
                score: 0,
                weightedDuration: 0,
                rateVolatility: 0.02,
                status: 'LOW'
            };
        }
    }

    calculateCreditRisk(allocation) {
        try {
            // Simplified credit risk scoring
            const creditRatings = {
                'Checking': 0.01, // FDIC insured
                'Money Market': 0.02,
                'High Yield Savings': 0.03,
                'Treasury MMF': 0.01, // Government backed
                'CD 3-Month': 0.01, // FDIC insured
                'CD 6-Month': 0.01  // FDIC insured
            };

            const totalAmount = Object.values(allocation).reduce((sum, amount) => sum + (amount || 0), 0);

            if (totalAmount <= 0) {
                return {
                    score: 0,
                    weightedRisk: 0,
                    status: 'LOW'
                };
            }

            const weightedCreditRisk = Object.entries(allocation).reduce((sum, [type, amount]) =>
                sum + (creditRatings[type] || 0.05) * ((amount || 0) / totalAmount), 0);

            return {
                score: weightedCreditRisk * 100,
                weightedRisk: weightedCreditRisk,
                status: weightedCreditRisk < 0.02 ? 'LOW' : weightedCreditRisk < 0.04 ? 'MEDIUM' : 'HIGH'
            };
        } catch (error) {
            console.error('Error calculating credit risk:', error);
            return {
                score: 0,
                weightedRisk: 0,
                status: 'LOW'
            };
        }
    }

    calculateOverallRisk(riskBreakdown) {
        try {
            const weights = {
                liquidityRisk: 0.4,
                concentrationRisk: 0.3,
                interestRateRisk: 0.2,
                creditRisk: 0.1
            };

            return Object.entries(weights).reduce((totalRisk, [riskType, weight]) => {
                const riskData = riskBreakdown[riskType];
                const score = riskData && typeof riskData.score === 'number' ? riskData.score : 0;
                return totalRisk + (score * weight);
            }, 0);
        } catch (error) {
            console.error('Error calculating overall risk:', error);
            return 0.5; // Default moderate risk
        }
    }

    identifyRiskFactors(riskBreakdown) {
        const factors = [];

        try {
            Object.entries(riskBreakdown).forEach(([riskType, risk]) => {
                if (risk && (risk.status === 'AT_RISK' || risk.status === 'HIGH')) {
                    factors.push({
                        type: riskType.toUpperCase(),
                        severity: risk.status,
                        score: risk.score || 0,
                        description: this.getRiskDescription(riskType, risk)
                    });
                }
            });

            return factors.sort((a, b) => (b.score || 0) - (a.score || 0));
        } catch (error) {
            console.error('Error identifying risk factors:', error);
            return [];
        }
    }

    getRiskDescription(riskType, risk) {
        try {
            const descriptions = {
                liquidityRisk: `Liquidity ratio ${((risk.ratio || 0) * 100).toFixed(1)}% below ${((risk.threshold || 0) * 100).toFixed(0)}% threshold`,
                concentrationRisk: `Over-concentration: ${((risk.maxConcentration || 0) * 100).toFixed(1)}% in single account type`,
                interestRateRisk: `Interest rate exposure with ${(risk.weightedDuration || 0).toFixed(2)} duration`,
                creditRisk: `Elevated credit risk with ${((risk.weightedRisk || 0) * 100).toFixed(2)}% weighted exposure`
            };

            return descriptions[riskType] || `${riskType} risk detected`;
        } catch (error) {
            console.error('Error generating risk description:', error);
            return `${riskType} risk requires attention`;
        }
    }

    generateRiskRecommendations(riskAssessment) {
        const recommendations = [];

        try {
            if (!riskAssessment.riskFactors) return recommendations;

            riskAssessment.riskFactors.forEach(factor => {
                switch (factor.type) {
                    case 'LIQUIDITYRISK':
                        recommendations.push({
                            type: 'INCREASE_LIQUIDITY',
                            priority: 'HIGH',
                            action: 'Move funds to more liquid accounts (Checking, Money Market)',
                            expectedImpact: 'Reduce liquidity risk'
                        });
                        break;

                    case 'CONCENTRATIONRISK':
                        recommendations.push({
                            type: 'DIVERSIFY',
                            priority: 'MEDIUM',
                            action: 'Spread allocation across more account types',
                            expectedImpact: 'Reduce concentration risk'
                        });
                        break;

                    case 'INTERESTRATERISK':
                        recommendations.push({
                            type: 'REDUCE_DURATION',
                            priority: 'LOW',
                            action: 'Consider shorter-duration instruments',
                            expectedImpact: 'Reduce interest rate sensitivity'
                        });
                        break;

                    case 'CREDITRISK':
                        recommendations.push({
                            type: 'IMPROVE_CREDIT_QUALITY',
                            priority: 'MEDIUM',
                            action: 'Move to FDIC-insured or government-backed accounts',
                            expectedImpact: 'Reduce credit exposure'
                        });
                        break;
                }
            });

            return recommendations;
        } catch (error) {
            console.error('Error generating risk recommendations:', error);
            return [];
        }
    }
}

// ===== DECISION ENGINE =====
class DecisionEngine {
    constructor() {
        this.optimizer = new SmartCashOptimizer();
        this.forecaster = new LiquidityForecaster();
        this.riskEngine = new RiskEngine();
        this.confidenceThreshold = 0.7;
    }

    async makeIntelligentDecision(marketData, portfolioState, userPreferences = {}) {
        console.log('🤖 AURA AI: Making intelligent decision...');

        const decision = {
            timestamp: new Date().toISOString(),
            confidence: 0,
            recommendations: [],
            analysis: {},
            executionPlan: []
        };

        try {
            // Validate inputs
            if (!marketData || !portfolioState) {
                throw new Error('Invalid input data for decision making');
            }

            // Ensure portfolioState has required properties
            const safeTotalCash = portfolioState.totalCash || 100000;
            const safeMarketYields = marketData.yields || {};

            // Step 1: Optimize current allocation with error handling
            let optimization;
            try {
                optimization = await this.optimizer.optimizeAllocation(
                    safeMarketYields,
                    safeTotalCash,
                    userPreferences
                );
            } catch (error) {
                console.error('Optimization failed:', error);
                optimization = {
                    currentAllocation: {},
                    optimalAllocation: {},
                    rebalanceActions: [],
                    expectedYield: 0,
                    riskScore: 0,
                    confidence: 0.3
                };
            }

            // Step 2: Generate liquidity forecast with error handling
            let forecast;
            try {
                forecast = await this.forecaster.forecastLiquidity(
                    safeTotalCash,
                    userPreferences.forecastHorizon || 30
                );
            } catch (error) {
                console.error('Forecasting failed:', error);
                forecast = {
                    timeHorizon: 30,
                    predictions: [],
                    riskFactors: [],
                    recommendations: []
                };
            }

            // Step 3: Assess risks with error handling
            let riskAssessment;
            try {
                riskAssessment = await this.riskEngine.assessPortfolioRisk(
                    optimization.optimalAllocation,
                    safeTotalCash,
                    marketData
                );
            } catch (error) {
                console.error('Risk assessment failed:', error);
                riskAssessment = {
                    overallRisk: 0.5,
                    riskFactors: [],
                    recommendations: [],
                    riskBreakdown: {}
                };
            }

            // Step 4: Combine insights into final decision
            decision.analysis = {
                optimization,
                forecast,
                riskAssessment
            };

            // Step 5: Generate consolidated recommendations
            decision.recommendations = this.consolidateRecommendations(
                optimization,
                forecast,
                riskAssessment
            );

            // Step 6: Calculate overall confidence
            decision.confidence = this.calculateOverallConfidence(
                optimization.confidence || 0.3,
                forecast,
                riskAssessment
            );

            // Step 7: Create execution plan
            if (decision.confidence >= this.confidenceThreshold) {
                decision.executionPlan = this.createExecutionPlan(decision.recommendations);
            }

            console.log('✅ Decision complete:', {
                confidence: `${(decision.confidence * 100).toFixed(1)}%`,
                recommendations: decision.recommendations.length,
                willExecute: decision.confidence >= this.confidenceThreshold
            });

            return decision;

        } catch (error) {
            console.error('❌ Decision engine failed:', error);
            return this.getFallbackDecision();
        }
    }

    consolidateRecommendations(optimization, forecast, riskAssessment) {
        const allRecommendations = [
            ...optimization.rebalanceActions.map(action => ({
                source: 'OPTIMIZER',
                type: 'REBALANCE',
                priority: action.priority,
                action: `${action.action} ${action.account} by ${action.amount.toLocaleString()}`,
                reasoning: 'Optimization analysis suggests improved yield',
                expectedBenefit: 'Higher risk-adjusted returns'
            })),
            ...forecast.recommendations.map(rec => ({
                source: 'FORECASTER',
                ...rec
            })),
            ...riskAssessment.recommendations.map(rec => ({
                source: 'RISK_ENGINE',
                ...rec
            }))
        ];

        // Remove duplicates and prioritize
        const consolidatedRecs = this.deduplicateRecommendations(allRecommendations);

        return consolidatedRecs
            .sort(this.prioritizeRecommendations)
            .slice(0, 5); // Top 5 recommendations
    }

    deduplicateRecommendations(recommendations) {
        const seen = new Set();
        return recommendations.filter(rec => {
            const key = `${rec.type}_${rec.action}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    prioritizeRecommendations(a, b) {
        const priorityMap = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return (priorityMap[b.priority] || 1) - (priorityMap[a.priority] || 1);
    }

    calculateOverallConfidence(optimizationConfidence, forecast, riskAssessment) {
        const weights = {
            optimization: 0.4,
            forecast: 0.3,
            risk: 0.3
        };

        const forecastConfidence = forecast.predictions.length > 0 ?
            forecast.predictions.reduce((sum, p) => sum + p.confidence, 0) / forecast.predictions.length : 0.5;

        const riskConfidence = Math.max(0, 1 - (riskAssessment.overallRisk / 10));

        return (
            optimizationConfidence * weights.optimization +
            forecastConfidence * weights.forecast +
            riskConfidence * weights.risk
        );
    }

    createExecutionPlan(recommendations) {
        return recommendations
            .filter(rec => rec.priority === 'HIGH')
            .map((rec, index) => ({
                step: index + 1,
                action: rec.action,
                type: rec.type,
                estimatedTime: this.getEstimatedTime(rec.type),
                dependencies: this.getDependencies(rec.type),
                riskLevel: this.getExecutionRisk(rec.type)
            }));
    }

    getEstimatedTime(actionType) {
        const timeMap = {
            'REBALANCE': '2-5 minutes',
            'INCREASE_LIQUIDITY': '1-3 minutes',
            'OPTIMIZE_YIELD': '3-7 minutes',
            'RISK_MITIGATION': '5-15 minutes'
        };
        return timeMap[actionType] || '2-5 minutes';
    }

    getDependencies(actionType) {
        const dependencyMap = {
            'REBALANCE': ['Account access', 'Sufficient balance'],
            'INCREASE_LIQUIDITY': ['Liquid funds available'],
            'OPTIMIZE_YIELD': ['Account minimums met'],
            'RISK_MITIGATION': ['Credit approval', 'Documentation']
        };
        return dependencyMap[actionType] || [];
    }

    getExecutionRisk(actionType) {
        const riskMap = {
            'REBALANCE': 'LOW',
            'INCREASE_LIQUIDITY': 'LOW',
            'OPTIMIZE_YIELD': 'MEDIUM',
            'RISK_MITIGATION': 'MEDIUM'
        };
        return riskMap[actionType] || 'LOW';
    }

    getFallbackDecision() {
        return {
            timestamp: new Date().toISOString(),
            confidence: 0.3,
            recommendations: [{
                type: 'MAINTAIN_STATUS',
                priority: 'LOW',
                action: 'Maintain current allocation pending system recovery',
                reasoning: 'Insufficient data for optimization'
            }],
            analysis: {},
            executionPlan: []
        };
    }
}

// ===== PERFORMANCE MONITOR =====
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            executionTimes: [],
            accuracyScores: [],
            userSatisfaction: []
        };
    }

    startOperation(operationName) {
        return {
            name: operationName,
            startTime: performance.now(),
            memoryStart: this.getMemoryUsage()
        };
    }

    endOperation(operation) {
        const endTime = performance.now();
        const duration = endTime - operation.startTime;
        const memoryEnd = this.getMemoryUsage();

        const result = {
            name: operation.name,
            duration,
            memoryUsed: memoryEnd - operation.memoryStart,
            timestamp: new Date().toISOString()
        };

        this.metrics.executionTimes.push(result);

        // Alert if performance degrades
        if (duration > 5000) { // 5 second threshold
            console.warn(`⚠️ Slow operation detected: ${operation.name} took ${duration.toFixed(0)}ms`);
        }

        return result;
    }

    getMemoryUsage() {
        if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
            return window.performance.memory.usedJSHeapSize;
        }
        return 0;
    }

    generatePerformanceReport() {
        const recentMetrics = this.metrics.executionTimes.slice(-50); // Last 50 operations

        if (recentMetrics.length === 0) {
            return { status: 'No metrics available' };
        }

        const avgDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
        const maxDuration = Math.max(...recentMetrics.map(m => m.duration));
        const minDuration = Math.min(...recentMetrics.map(m => m.duration));

        return {
            averageResponseTime: `${avgDuration.toFixed(2)}ms`,
            maxResponseTime: `${maxDuration.toFixed(2)}ms`,
            minResponseTime: `${minDuration.toFixed(2)}ms`,
            totalOperations: recentMetrics.length,
            systemHealth: avgDuration < 1000 ? 'EXCELLENT' : avgDuration < 3000 ? 'GOOD' : 'NEEDS_ATTENTION'
        };
    }
}

// ===== MAIN AURA AI CONTROLLER =====
export class AURAIntelligenceEngine {
    constructor() {
        this.decisionEngine = new DecisionEngine();
        this.optimizer = new SmartCashOptimizer();
        this.forecaster = new LiquidityForecaster();
        this.riskEngine = new RiskEngine();
        this.performanceMonitor = new PerformanceMonitor();

        console.log('🧠 AURA Intelligence Engine initialized');
    }

    // Main public interface for the AI system
    async analyzeAndOptimize(marketData, portfolioState, userPreferences = {}) {
        const operation = this.performanceMonitor.startOperation('FULL_ANALYSIS');

        try {
            console.log('🚀 AURA AI: Starting comprehensive analysis...');

            const result = await this.decisionEngine.makeIntelligentDecision(
                marketData,
                portfolioState,
                userPreferences
            );

            // Add performance metadata
            result.performance = this.performanceMonitor.endOperation(operation);
            result.systemHealth = this.performanceMonitor.generatePerformanceReport();

            console.log('✅ AURA AI: Analysis complete');

            return result;

        } catch (error) {
            this.performanceMonitor.endOperation(operation);
            console.error('❌ AURA AI: Analysis failed:', error);
            throw error;
        }
    }

    // Quick optimization for real-time updates
    async quickOptimize(accounts, totalCash) {
        const operation = this.performanceMonitor.startOperation('QUICK_OPTIMIZATION');

        try {
            const result = await this.optimizer.optimizeAllocation(accounts, totalCash);
            result.performance = this.performanceMonitor.endOperation(operation);
            return result;
        } catch (error) {
            this.performanceMonitor.endOperation(operation);
            throw error;
        }
    }

    // Generate forecast only
    async generateForecast(currentCash, timeHorizon = 30) {
        const operation = this.performanceMonitor.startOperation('LIQUIDITY_FORECAST');

        try {
            const result = await this.forecaster.forecastLiquidity(currentCash, timeHorizon);
            result.performance = this.performanceMonitor.endOperation(operation);
            return result;
        } catch (error) {
            this.performanceMonitor.endOperation(operation);
            throw error;
        }
    }

    // Risk assessment only
    async assessRisk(allocation, totalCash, marketConditions = {}) {
        const operation = this.performanceMonitor.startOperation('RISK_ASSESSMENT');

        try {
            const result = await this.riskEngine.assessPortfolioRisk(allocation, totalCash, marketConditions);
            result.performance = this.performanceMonitor.endOperation(operation);
            return result;
        } catch (error) {
            this.performanceMonitor.endOperation(operation);
            throw error;
        }
    }

    // Get system health metrics
    getSystemHealth() {
        return {
            status: 'OPERATIONAL',
            performance: this.performanceMonitor.generatePerformanceReport(),
            components: {
                optimizer: 'READY',
                forecaster: 'READY',
                riskEngine: 'READY',
                decisionEngine: 'READY'
            },
            lastUpdate: new Date().toISOString()
        };
    }
}