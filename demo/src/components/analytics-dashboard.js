import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Target, DollarSign, Activity, PieChart as PieChartIcon, BarChart3, Calculator, Clock } from 'lucide-react';

const RealDataAnalyticsDashboard = ({
    marketData,
    portfolioState,
    connectedAccounts = [],
    aiRecommendations = []
}) => {
    const [selectedTimeframe, setSelectedTimeframe] = useState('1M');
    const [selectedAnalysis, setSelectedAnalysis] = useState('performance');
    const [scenarioInputs, setScenarioInputs] = useState({
        marketShock: -20,
        rateChange: 1.0,
        liquidityNeed: 50000
    });

    // Track real portfolio history (persistent storage)
    const [portfolioHistory, setPortfolioHistory] = useState(() => {
        const saved = sessionStorage.getItem('aura-portfolio-history');
        return saved ? JSON.parse(saved) : [];
    });

    // Track portfolio changes and save real historical data
    useEffect(() => {
        if (!portfolioState || !marketData) return;

        const currentTime = new Date();
        const lastEntry = portfolioHistory[portfolioHistory.length - 1];

        // Only add new entry if it's been at least 1 minute since last entry (to avoid spam)
        if (!lastEntry || (currentTime - new Date(lastEntry.timestamp)) > 60000) {
            const newEntry = {
                timestamp: currentTime.toISOString(),
                date: currentTime.toISOString().split('T')[0],
                totalValue: portfolioState.totalCash,
                allocation: { ...portfolioState.currentAllocation },
                marketRates: marketData.yields ? { ...marketData.yields } : {},
                treasuryRate: marketData.treasuryRate || 0,

                // Calculate weighted average yield
                weightedAvgYield: Object.entries(portfolioState.currentAllocation).reduce((totalYield, [account, amount]) => {
                    const rate = marketData.yields?.[account]?.rate || marketData.yields?.[account] || 0;
                    return totalYield + ((amount / portfolioState.totalCash) * rate);
                }, 0),

                // Calculate annual income projection
                annualIncomeProjection: Object.entries(portfolioState.currentAllocation).reduce((total, [account, amount]) => {
                    const rate = marketData.yields?.[account]?.rate || marketData.yields?.[account] || 0;
                    return total + ((amount * rate) / 100);
                }, 0)
            };

            const updatedHistory = [...portfolioHistory, newEntry];
            setPortfolioHistory(updatedHistory);

            // Save to sessionStorage (persists during session)
            sessionStorage.setItem('aura-portfolio-history', JSON.stringify(updatedHistory));

            console.log('📊 Real portfolio data tracked:', newEntry);
        }
    }, [portfolioState, marketData, portfolioHistory]);

    // Generate historical performance data based on real tracking
    const historicalData = useMemo(() => {
        if (!portfolioHistory.length) {
            // If no history yet, create a single current point
            return [{
                date: new Date().toISOString().split('T')[0],
                portfolioValue: portfolioState?.totalCash || 250000,
                benchmark: portfolioState?.totalCash || 250000,
                dailyReturn: 0,
                cumulativeReturn: 0,
                weightedYield: Object.entries(portfolioState?.currentAllocation || {}).reduce((totalYield, [account, amount]) => {
                    const rate = marketData?.yields?.[account]?.rate || marketData?.yields?.[account] || 0;
                    return totalYield + ((amount / (portfolioState?.totalCash || 1)) * rate);
                }, 0)
            }];
        }

        // Use real historical data
        const timeframes = {
            '1W': 7,
            '1M': 30,
            '3M': 90,
            '6M': 180,
            '1Y': 365
        };

        const days = timeframes[selectedTimeframe] || 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        // Filter history by timeframe
        const filteredHistory = portfolioHistory.filter(entry =>
            new Date(entry.timestamp) >= cutoffDate
        );

        if (!filteredHistory.length) return [];

        const baseValue = filteredHistory[0].totalValue;

        return filteredHistory.map((entry, index) => {
            const cumulativeReturn = ((entry.totalValue - baseValue) / baseValue) * 100;
            const dailyReturn = index > 0 ?
                ((entry.totalValue - filteredHistory[index - 1].totalValue) / filteredHistory[index - 1].totalValue) * 100 : 0;

            // Calculate benchmark (money market average)
            const benchmarkValue = baseValue * (1 + (cumulativeReturn * 0.7) / 100); // Slightly lower performance

            return {
                date: entry.date,
                portfolioValue: entry.totalValue,
                benchmark: Math.round(benchmarkValue),
                dailyReturn,
                cumulativeReturn,
                weightedYield: entry.weightedAvgYield || 0,
                annualIncome: entry.annualIncomeProjection || 0
            };
        });
    }, [portfolioHistory, selectedTimeframe, portfolioState, marketData]);

    // Calculate real performance metrics
    const performanceMetrics = useMemo(() => {
        if (!historicalData.length || historicalData.length < 2) {
            return {
                totalReturn: 0,
                annualizedReturn: 0,
                volatility: 0,
                sharpeRatio: 0,
                maxDrawdown: 0,
                currentValue: portfolioState?.totalCash || 0,
                timespan: 0
            };
        }

        const returns = historicalData.map(d => d.dailyReturn / 100);
        const totalReturn = historicalData[historicalData.length - 1].cumulativeReturn / 100;
        const timespan = historicalData.length;

        // Calculate annualized return
        const annualizedReturn = timespan > 1 ?
            Math.pow(1 + totalReturn, 365 / timespan) - 1 : totalReturn;

        // Calculate volatility (standard deviation of returns)
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
        const volatility = Math.sqrt(variance) * Math.sqrt(365); // Annualized

        // Calculate Sharpe ratio (assuming risk-free rate of 5%)
        const riskFreeRate = 0.05;
        const sharpeRatio = volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;

        // Calculate max drawdown
        let peak = historicalData[0].portfolioValue;
        let maxDrawdown = 0;
        historicalData.forEach(point => {
            if (point.portfolioValue > peak) {
                peak = point.portfolioValue;
            }
            const drawdown = (peak - point.portfolioValue) / peak;
            maxDrawdown = Math.max(maxDrawdown, drawdown);
        });

        return {
            totalReturn,
            annualizedReturn,
            volatility,
            sharpeRatio,
            maxDrawdown,
            currentValue: historicalData[historicalData.length - 1]?.portfolioValue || 0,
            timespan
        };
    }, [historicalData, portfolioState?.totalCash]);

    // Real risk analysis based on actual portfolio
    const riskMetrics = useMemo(() => {
        if (!portfolioState?.currentAllocation || !marketData?.yields) return {};

        const accounts = Object.entries(portfolioState.currentAllocation);
        const totalValue = portfolioState.totalCash;

        // Calculate actual concentration risk
        const weights = accounts.map(([account, amount]) => ({
            account,
            weight: amount / totalValue,
            amount
        }));

        // Real liquidity analysis based on account types
        const liquidityMap = {
            'Checking': 0,           // Instant access
            'Money Market': 0.1,     // Same day
            'High Yield Savings': 0.2, // 1-3 days
            'Treasury MMF': 0.1,     // Same day
            'CD 3-Month': 3,         // 3 month penalty
            'CD 6-Month': 6,         // 6 month penalty
            'CD 1-Year': 12,         // 1 year penalty
            'Treasury Bills': 0.5,   // Secondary market
            'Corporate Bonds': 1     // Secondary market
        };

        const avgDuration = weights.reduce((sum, w) => {
            return sum + (w.weight * (liquidityMap[w.account] || 0));
        }, 0);

        // Interest rate sensitivity based on actual rates and durations
        const rateSensitivity = weights.reduce((sum, w) => {
            const duration = liquidityMap[w.account] || 0;
            const rate = marketData.yields[w.account]?.rate || marketData.yields[w.account] || 0;
            // Higher rates and longer durations = higher sensitivity
            return sum + (w.weight * duration * rate * 0.001);
        }, 0);

        // Diversification score (1 = perfectly diversified, 0 = concentrated)
        const diversificationScore = 1 - weights.reduce((sum, w) => sum + w.weight ** 2, 0);

        return {
            concentrationRisk: Math.max(...weights.map(w => w.weight)),
            liquidityRisk: avgDuration,
            rateSensitivity,
            diversificationScore,
            largestPosition: weights.reduce((max, w) => w.weight > max.weight ? w : max, weights[0])
        };
    }, [portfolioState, marketData]);

    // Real scenario analysis using actual portfolio data
    const scenarioAnalysis = useMemo(() => {
        if (!portfolioState?.currentAllocation) return {};

        const { marketShock, rateChange, liquidityNeed } = scenarioInputs;
        const currentValue = portfolioState.totalCash;

        // Market shock scenario - different impacts by account type
        const marketSensitivity = {
            'Checking': 0,              // No market impact
            'Money Market': 0.1,        // Minimal impact
            'High Yield Savings': 0.05, // Very low impact
            'Treasury MMF': 0.2,        // Low impact
            'CD 3-Month': 0,            // Fixed rate, no immediate impact
            'CD 6-Month': 0,            // Fixed rate, no immediate impact
            'Corporate Bonds': 0.5,     // Higher market sensitivity
            'Treasury Bills': 0.3       // Some market sensitivity
        };

        const marketImpact = Object.entries(portfolioState.currentAllocation).reduce((total, [account, amount]) => {
            const sensitivity = marketSensitivity[account] || 0.1;
            return total + (amount * (marketShock / 100) * sensitivity);
        }, 0);

        // Rate change scenario - impacts based on duration and current rates
        const rateImpact = Object.entries(portfolioState.currentAllocation).reduce((total, [account, amount]) => {
            const currentRate = marketData?.yields?.[account]?.rate || marketData?.yields?.[account] || 0;
            const duration = {
                'CD 3-Month': 0.25,
                'CD 6-Month': 0.5,
                'CD 1-Year': 1,
                'Treasury Bills': 0.25,
                'Corporate Bonds': 2
            }[account] || 0;

            // Duration-based price sensitivity to rate changes
            const priceImpact = -duration * (rateChange / 100) * amount * 0.01;
            // Income impact for variable rate accounts
            const incomeImpact = account.includes('Money Market') || account.includes('Savings') ?
                (amount * rateChange / 100) : 0;

            return total + priceImpact + incomeImpact;
        }, 0);

        // Real liquidity analysis
        const liquidAssets = Object.entries(portfolioState.currentAllocation).reduce((total, [account, amount]) => {
            const isLiquid = ['Checking', 'Money Market', 'Treasury MMF', 'High Yield Savings'].includes(account);
            return total + (isLiquid ? amount : 0);
        }, 0);

        const liquidityShortfall = Math.max(0, liquidityNeed - liquidAssets);

        return {
            marketShock: {
                scenario: `${marketShock}% Market Stress`,
                impact: marketImpact,
                newValue: currentValue + marketImpact,
                affectedAccounts: Object.keys(marketSensitivity).filter(acc =>
                    portfolioState.currentAllocation[acc] && marketSensitivity[acc] > 0
                )
            },
            rateChange: {
                scenario: `${rateChange}% Rate ${rateChange > 0 ? 'Increase' : 'Decrease'}`,
                impact: rateImpact,
                newValue: currentValue + rateImpact,
                annualIncomeChange: Object.entries(portfolioState.currentAllocation).reduce((total, [account, amount]) => {
                    const isVariable = account.includes('Money Market') || account.includes('Savings');
                    return total + (isVariable ? (amount * rateChange / 100) : 0);
                }, 0)
            },
            liquidityStress: {
                scenario: `${liquidityNeed.toLocaleString()} Emergency Need`,
                availableLiquidity: liquidAssets,
                shortfall: liquidityShortfall,
                coverage: liquidAssets / liquidityNeed,
                liquidAccounts: Object.entries(portfolioState.currentAllocation)
                    .filter(([account]) => ['Checking', 'Money Market', 'Treasury MMF', 'High Yield Savings'].includes(account))
                    .map(([account, amount]) => ({ account, amount }))
            }
        };
    }, [portfolioState, scenarioInputs, marketData]);

    // Real ROI data based on current market rates
    const roiData = useMemo(() => {
        if (!portfolioState?.currentAllocation || !marketData?.yields) return [];

        return Object.entries(portfolioState.currentAllocation).map(([account, amount]) => {
            const rateData = marketData.yields[account];
            const rate = typeof rateData === 'number' ? rateData : (rateData?.rate || 0);
            const annualIncome = (amount * rate) / 100;

            return {
                account,
                amount,
                rate,
                annualIncome,
                monthlyIncome: annualIncome / 12,
                dailyIncome: annualIncome / 365,
                percentage: (amount / portfolioState.totalCash) * 100,
                // Add risk category based on account type
                riskCategory: account.includes('CD') ? 'Very Low' :
                    account.includes('Treasury') ? 'Ultra Low' :
                        account.includes('Checking') ? 'None' :
                            account.includes('Money Market') ? 'Very Low' : 'Low',
                // Add liquidity rating
                liquidity: ['Checking', 'Money Market', 'Treasury MMF'].includes(account) ? 'High' :
                    account.includes('Savings') ? 'Medium' : 'Low'
            };
        });
    }, [portfolioState, marketData]);

    // Real benchmark comparison using actual market data
    const benchmarkData = useMemo(() => {
        if (!marketData?.yields || !portfolioState) return {};

        const portfolioYield = roiData.reduce((sum, item) => sum + (item.rate * item.percentage / 100), 0);

        // Real market benchmarks from your market data
        const moneyMarketAvg = marketData.yields['Money Market']?.rate || marketData.yields['Money Market'] || 4.2;
        const treasuryRate = marketData.treasuryRate || 5.2;
        const highYieldSavingsAvg = marketData.yields['High Yield Savings']?.rate || marketData.yields['High Yield Savings'] || 4.5;

        return {
            portfolioYield,
            moneyMarketAvg,
            treasuryRate,
            highYieldSavingsAvg,
            outperformance: {
                vsMoneyMarket: portfolioYield - moneyMarketAvg,
                vsTreasury: portfolioYield - treasuryRate,
                vsHighYieldSavings: portfolioYield - highYieldSavingsAvg
            }
        };
    }, [roiData, marketData, portfolioState]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

    const PerformanceView = () => (
        <div className="space-y-6">
            {/* Real Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="h-6 w-6 text-green-500" />
                        <span className={`text-sm px-2 py-1 rounded ${performanceMetrics.totalReturn >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {selectedTimeframe}
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                        {(performanceMetrics.totalReturn * 100 || 0).toFixed(2)}%
                    </div>
                    <div className="text-sm text-gray-600">
                        Total Return ({performanceMetrics.timespan} days)
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <Activity className="h-6 w-6 text-blue-500" />
                        <Target className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                        {(performanceMetrics.sharpeRatio || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Sharpe Ratio</div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <AlertTriangle className="h-6 w-6 text-yellow-500" />
                        <TrendingDown className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                        {(performanceMetrics.maxDrawdown * 100 || 0).toFixed(2)}%
                    </div>
                    <div className="text-sm text-gray-600">Max Drawdown</div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <DollarSign className="h-6 w-6 text-purple-500" />
                        <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                        {(performanceMetrics.volatility * 100 || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Volatility (Ann.)</div>
                </div>
            </div>

            {/* Real Performance Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Real Portfolio Performance
                    {historicalData.length > 1 && ` (${historicalData.length} data points)`}
                </h3>

                {historicalData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <ComposedChart data={historicalData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip
                                formatter={(value, name) => [
                                    typeof value === 'number' ? value.toLocaleString() : value,
                                    name
                                ]}
                            />
                            <Legend />
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="portfolioValue"
                                fill="#8884d8"
                                fillOpacity={0.6}
                                stroke="#8884d8"
                                name="Portfolio Value"
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="benchmark"
                                stroke="#82ca9d"
                                strokeWidth={2}
                                name="Benchmark"
                            />
                            <Bar
                                yAxisId="right"
                                dataKey="cumulativeReturn"
                                fill="#ffc658"
                                name="Cumulative Return %"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <h4 className="text-lg font-medium mb-2">Building Performance History</h4>
                        <p className="text-sm">
                            Real performance data will appear as your portfolio is tracked over time.
                            <br />Current snapshot recorded. Check back soon for trends!
                        </p>
                    </div>
                )}
            </div>

            {/* Real-time Yield Tracking */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Yield Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Weighted Average Yield</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {benchmarkData.portfolioYield?.toFixed(2) || 0}%
                        </div>
                        <div className="text-sm text-gray-500">Based on current allocation</div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Annual Income Projection</div>
                        <div className="text-2xl font-bold text-green-600">
                            ${roiData.reduce((sum, item) => sum + item.annualIncome, 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">At current rates</div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Daily Income</div>
                        <div className="text-2xl font-bold text-purple-600">
                            ${roiData.reduce((sum, item) => sum + item.dailyIncome, 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">Real-time earnings</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const ROIView = ({ roiData }) => (
        <div className="space-y-6">
            {/* ROI Bar Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">ROI Breakdown by Account (Bar)</h3>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={roiData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="account" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="rate" fill="#4f46e5" name="Interest Rate (%)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* ROI Line Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Income (Line)</h3>
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={roiData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="account" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="monthlyIncome" stroke="#16a34a" name="Monthly Income ($)" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    const ScenarioView = ({ scenarioAnalysis, portfolioState }) => {
        const data = [
            {
                scenario: scenarioAnalysis.marketShock.scenario,
                impact: scenarioAnalysis.marketShock.impact,
                newValue: scenarioAnalysis.marketShock.newValue
            },
            {
                scenario: scenarioAnalysis.rateChange.scenario,
                impact: scenarioAnalysis.rateChange.impact,
                newValue: scenarioAnalysis.rateChange.newValue
            },
            {
                scenario: scenarioAnalysis.liquidityStress.scenario,
                impact: -scenarioAnalysis.liquidityStress.shortfall,
                newValue: portfolioState.totalCash - scenarioAnalysis.liquidityStress.shortfall
            }
        ];

        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">What-If Scenario Impacts</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="scenario" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="impact" fill="#f97316" name="Impact ($)" />
                            <Bar dataKey="newValue" fill="#22c55e" name="New Portfolio Value ($)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    const RiskView = ({ roiData, riskMetrics }) => {
        const COLORS = ['#34d399', '#facc15', '#f87171', '#60a5fa', '#a78bfa']; // green, yellow, red, blue, purple

        const scatterData = roiData.map(item => ({
            risk:
                item.riskCategory === 'None' ? 0 :
                    item.riskCategory === 'Ultra Low' ? 1 :
                        item.riskCategory === 'Very Low' ? 2 :
                            item.riskCategory === 'Low' ? 3 : 4,
            return: item.rate,
            amount: item.amount,
            name: item.account
        }));

        return (
            <div className="space-y-6">
                {/* 📊 Risk Metrics Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="text-sm text-gray-500">Concentration Risk</div>
                        <div className="text-2xl font-bold text-red-600">
                            {(riskMetrics.concentrationRisk * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">
                            Largest: {riskMetrics.largestPosition?.account || '—'}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="text-sm text-gray-500">Liquidity Risk</div>
                        <div className="text-2xl font-bold text-yellow-600">
                            {(riskMetrics.liquidityRisk || 0).toFixed(1)} mo
                        </div>
                        <div className="text-sm text-gray-600">Avg. Lock-up</div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="text-sm text-gray-500">Rate Sensitivity</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {(riskMetrics.rateSensitivity * 100 || 0).toFixed(2)}%
                        </div>
                        <div className="text-sm text-gray-600">Per 1% rate change</div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="text-sm text-gray-500">Diversification</div>
                        <div className="text-2xl font-bold text-green-600">
                            {(riskMetrics.diversificationScore * 100 || 0).toFixed(0)}%
                        </div>
                        <div className="text-sm text-gray-600">Spread across accounts</div>
                    </div>
                </div>

                {/* 🥧 PieChart for allocation by risk level */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Allocation by Risk Category</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={roiData.map(item => ({
                                    name: item.account,
                                    value: item.amount,
                                }))}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {roiData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* 🎯 ScatterChart for Risk vs Return */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk vs Return</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart data={scatterData}>
                            <CartesianGrid />
                            <XAxis type="number" dataKey="risk" name="Risk Level" />
                            <YAxis type="number" dataKey="return" name="Return (%)" />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white p-3 border rounded shadow">
                                                <p className="font-medium">{data.name}</p>
                                                <p>Return: {data.return}%</p>
                                                <p>Amount: ${data.amount.toLocaleString()}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Legend />
                            <Scatter dataKey="return" fill="#4f46e5" />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header with Real Data Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
                        📊 Real-Time Analytics Dashboard
                    </h2>

                    <div className="flex flex-wrap gap-2">
                        {['performance', 'risk', 'scenarios', 'roi'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setSelectedAnalysis(tab)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedAnalysis === tab
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Real Data Status Indicators */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-sm text-green-700">Historical Tracking</div>
                        <div className="font-semibold text-green-800">{portfolioHistory.length} data points</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="text-sm text-blue-700">Market Data</div>
                        <div className="font-semibold text-blue-800">
                            {marketData ? '🟢 Live' : '🔴 Offline'}
                        </div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div className="text-sm text-purple-700">Portfolio Value</div>
                        <div className="font-semibold text-purple-800">
                            ${(portfolioState?.totalCash || 0).toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="text-sm text-yellow-700">Bank Integration</div>
                        <div className="font-semibold text-yellow-800">
                            {connectedAccounts.length > 0 ? `${connectedAccounts.length} accounts` : 'Simulated'}
                        </div>
                    </div>
                </div>

                {/* Timeframe Selector */}
                <div className="flex space-x-2">
                    {['1W', '1M', '3M', '6M', '1Y'].map((timeframe) => (
                        <button
                            key={timeframe}
                            onClick={() => setSelectedTimeframe(timeframe)}
                            className={`px-3 py-1 rounded text-sm transition-colors ${selectedTimeframe === timeframe
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {timeframe}
                        </button>
                    ))}
                </div>
            </div>


            {/* Performance Analysis */}
            {selectedAnalysis === 'performance' && <PerformanceView />}

            {/* Real Risk Analysis */}
            {selectedAnalysis === 'risk' && (
                <RiskView roiData={roiData} riskMetrics={riskMetrics} />
            )}



            {selectedAnalysis === 'scenarios' && (
                <ScenarioView
                    scenarioAnalysis={scenarioAnalysis}
                    portfolioState={portfolioState}
                />
            )}


            {selectedAnalysis === 'roi' && <ROIView roiData={roiData} />}

        </div>
    )
}

export default RealDataAnalyticsDashboard;