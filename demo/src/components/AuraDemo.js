import React, { useState, useEffect } from 'react';
import { loadMarketData } from '../services/marketService';

import { BankConnectionPanel } from '../services/bankService';

import { AURAIntelligenceEngine } from './aura-ai-engine';
import { AIIntelligencePanel, AIStatusIndicator } from './aura-ai-integration';

import RealDataAnalyticsDashboard from './analytics-dashboard';

const AuraDemo = () => {
  // Existing state
  const [marketData, setMarketData] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectedAccounts, setConnectedAccounts] = useState([]);

  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'analytics'

  const [aiEngine] = useState(() => new AURAIntelligenceEngine());
  const [portfolioState, setPortfolioState] = useState({
    totalCash: 250000,
    currentAllocation: {
      'Checking': 50000,
      'Money Market': 75000,
      'High Yield Savings': 60000,
      'Treasury MMF': 40000,
      'CD 3-Month': 15000,
      'CD 6-Month': 10000
    },
    isSimulated: true
  });
  const [aiRecommendations, setAIRecommendations] = useState([]);
  const [showAIPanel, setShowAIPanel] = useState(true);

  useEffect(() => {
    console.log('🔍 Environment Check:');
    console.log('Client ID exists:', !!process.env.REACT_APP_PLAID_CLIENT_ID);
    console.log('Secret exists:', !!process.env.REACT_APP_PLAID_SECRET);
    console.log('Environment:', process.env.REACT_APP_PLAID_ENV);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('Loading market data...');
        const data = await loadMarketData();

        // debug section
        console.log('=== DEBUG: Market Data Structure ===');
        console.log('Full data:', data);
        console.log('data.yields:', data.yields);

        if (data.yields) {
          Object.entries(data.yields).forEach(([key, value]) => {
            console.log(`${key}:`, value, 'Type:', typeof value);
          });
        }
        console.log('=== END DEBUG ===');

        setMarketData(data);
        setLastUpdate(new Date());
        console.log('Market data loaded:', data);
      } catch (error) {
        console.error('Failed to load market data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAIRecommendation = async (recommendation) => {
    console.log('🤖 Executing AI recommendation:', recommendation);

    try {
      if (portfolioState.isSimulated) {
        console.warn('❌ Cannot execute AI recommendation on simulated data');
        setAIRecommendations(prev => [...prev, {
          ...recommendation,
          timestamp: new Date(),
          status: 'SKIPPED',
          note: 'Simulated data - execution skipped'
        }]);
        return;
      }      
      setAIRecommendations(prev => [...prev, {
        ...recommendation,
        timestamp: new Date(),
        status: 'EXECUTING'
      }]);

      if (recommendation.type === 'REBALANCE' && recommendation.data) {
        await executeRebalancing(recommendation.data);
      } else if (recommendation.type === 'INCREASE_LIQUIDITY') {
        await increaseLiquidity();
      } else if (recommendation.type === 'OPTIMIZE_YIELD') {
        await optimizeYield();
      }

      setAIRecommendations(prev =>
        prev.map(rec =>
          rec.timestamp === recommendation.timestamp
            ? { ...rec, status: 'COMPLETED' }
            : rec
        )
      );

      console.log('✅ AI recommendation executed successfully');

    } catch (error) {
      console.error('❌ Failed to execute AI recommendation:', error);

      setAIRecommendations(prev =>
        prev.map(rec =>
          rec.timestamp === recommendation.timestamp
            ? { ...rec, status: 'FAILED', error: error.message }
            : rec
        )
      );
    }
  };

  const executeRebalancing = async (rebalanceData) => {
    const { account, action, amount, targetAmount } = rebalanceData;

    console.log(`🔄 Rebalancing: ${action} ${account} by $${amount.toLocaleString()}`);

    await new Promise(resolve => setTimeout(resolve, 1000));

    setPortfolioState(prev => ({
      ...prev,
      currentAllocation: {
        ...prev.currentAllocation,
        [account]: targetAmount
      }
    }));

    console.log(`✅ Rebalancing complete: ${account} now has $${targetAmount.toLocaleString()}`);
  };

  const increaseLiquidity = async () => {
    console.log('💧 Increasing liquidity...');

    await new Promise(resolve => setTimeout(resolve, 1000));

    setPortfolioState(prev => {
      const newAllocation = { ...prev.currentAllocation };
      const moveAmount = Math.min(newAllocation['CD 6-Month'], 20000);

      newAllocation['CD 6-Month'] -= moveAmount;
      newAllocation['Money Market'] += moveAmount;

      return {
        ...prev,
        currentAllocation: newAllocation
      };
    });

    console.log('✅ Liquidity increased');
  };

  const optimizeYield = async () => {
    console.log('📈 Optimizing yield...');

    await new Promise(resolve => setTimeout(resolve, 1000));

    setPortfolioState(prev => {
      const newAllocation = { ...prev.currentAllocation };
      const moveAmount = Math.min(newAllocation['Checking'], 30000);

      newAllocation['Checking'] -= moveAmount;
      newAllocation['High Yield Savings'] += moveAmount;

      return {
        ...prev,
        currentAllocation: newAllocation
      };
    });

    console.log('✅ Yield optimization complete');
  };

  const refreshAIAnalysis = async () => {
    if (!marketData) return;

    try {
      console.log('🔄 Refreshing AI analysis...');
    } catch (error) {
      console.error('Failed to refresh AI analysis:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading AURA Intelligence...</h2>
          <p className="text-gray-500">Connecting to financial markets and AI systems</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with AI Status and View Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                AURA Treasury Intelligence System
              </h1>
              <p className="text-gray-600">
                AI-powered cash optimization and liquidity management
              </p>
            </div>

            <div className="mt-4 md:mt-0 space-y-2">
              {/* AI Status Indicator */}
              <AIStatusIndicator aiEngine={aiEngine} />

              {/* View Toggle Controls */}
              <div className="flex space-x-2 mb-2">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'dashboard'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  🏠 Dashboard
                </button>
                
                <button
                  onClick={() => setCurrentView('analytics')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'analytics'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  📊 Advanced Analytics
                </button>
              </div>

              {/* Controls */}
              <div className="flex space-x-2">
                <button
                  onClick={refreshAIAnalysis}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  🔄 Refresh AI
                </button>

                <button
                  onClick={() => setShowAIPanel(!showAIPanel)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  {showAIPanel ? '🧠 Hide AI' : '🧠 Show AI'}
                </button>
              </div>

              {lastUpdate && (
                <p className="text-sm text-gray-500">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Conditional View Rendering */}
        {currentView === 'analytics' ? (
          // NEW: Advanced Analytics Dashboard View
          <RealDataAnalyticsDashboard
            marketData={marketData}
            portfolioState={portfolioState}
            connectedAccounts={connectedAccounts}
            aiRecommendations={aiRecommendations}
          />
        ) : (
          // Existing Dashboard View
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Market Data & Portfolio */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Portfolio Overview */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">💰 Current Portfolio</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      ${portfolioState.totalCash.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Cash Under Management</div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {Object.keys(portfolioState.currentAllocation).length}
                    </div>
                    <div className="text-sm text-gray-600">Active Account Types</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium text-gray-800">Current Allocation</h3>
                  {Object.entries(portfolioState.currentAllocation).map(([account, amount]) => {
                    const percentage = (amount / portfolioState.totalCash) * 100;

                    // Safely get the account rate
                    let accountRate = 0;
                    if (marketData?.yields?.[account]) {
                      const yieldData = marketData.yields[account];
                      accountRate = typeof yieldData === 'number' ? yieldData : (yieldData?.rate || 0);
                    }

                    return (
                      <div key={account} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{account}</div>
                          <div className="text-sm text-gray-600">
                            {percentage.toFixed(1)}% • {Number(accountRate).toFixed(2)}% APY
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-800">
                            ${amount.toLocaleString()}
                          </div>
                          <div className="text-sm text-green-600">
                            +${((amount * Number(accountRate)) / 100).toFixed(0)}/year
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Market Data Display */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Live Market Data</h2>

                {marketData ? (
                  <div className="space-y-4">
                    {/* Treasury Rate */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">US Treasury Rate</span>
                        <span className="text-xl font-bold text-blue-600">
                          {marketData.treasuryRate ? `${marketData.treasuryRate}%` : 'Loading...'}
                        </span>
                      </div>
                    </div>

                    {/* Safe Yield Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {marketData.yields && Object.entries(marketData.yields).map(([type, data]) => {
                        // Skip metadata entries
                        if (type === 'lastUpdated') return null;

                        // Safely extract rate
                        let rate = null;
                        if (typeof data === 'number') {
                          rate = data;
                        } else if (data && typeof data === 'object' && data.rate !== undefined) {
                          rate = data.rate;
                        }

                        // Skip if we can't find a valid rate
                        if (rate === null || rate === undefined || isNaN(rate)) {
                          console.warn(`Invalid rate data for ${type}:`, data);
                          return (
                            <div key={type} className="border border-gray-200 rounded-lg p-4">
                              <div className="font-medium text-gray-800 mb-2">{type}</div>
                              <div className="text-red-500 text-sm">Data loading...</div>
                            </div>
                          );
                        }

                        return (
                          <div key={type} className="border border-gray-200 rounded-lg p-4">
                            <div className="font-medium text-gray-800 mb-2">{type}</div>
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold text-green-600">
                                {Number(rate).toFixed(2)}%
                              </span>
                              <span className="text-sm text-gray-500">APY</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Loading market data...
                  </div>
                )}
              </div>

              {/* Recent AI Recommendations */}
              {aiRecommendations.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">🤖 Recent AI Actions</h2>

                  <div className="space-y-3">
                    {aiRecommendations.slice(-5).reverse().map((rec, index) => (
                      <div key={index} className={`p-3 rounded-lg border-l-4 ${rec.status === 'COMPLETED' ? 'bg-green-50 border-green-400' :
                        rec.status === 'EXECUTING' ? 'bg-blue-50 border-blue-400' :
                          'bg-red-50 border-red-400'
                        }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-800">{rec.action}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${rec.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            rec.status === 'EXECUTING' ? 'bg-blue-100 text-blue-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                            {rec.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {rec.timestamp.toLocaleTimeString()}
                          {rec.error && ` - Error: ${rec.error}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: AI Intelligence Panel & Bank Connection */}
            <div className="space-y-6">
              {showAIPanel && marketData && (
                <AIIntelligencePanel
                  marketData={marketData}
                  portfolioState={portfolioState}
                  onRecommendationAccept={handleAIRecommendation}
                />
              )}

              <BankConnectionPanel
                onAccountsConnected={(accounts) => {
                  setConnectedAccounts(accounts);
                  console.log('🏦 Real bank accounts connected:', accounts);
                }}
                onError={(error) => {
                  console.error('Bank connection error:', error);
                }}
              />

              {/* Quick Stats */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Quick Stats</h3>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Annual Yield</span>
                    <span className="font-medium text-green-600">
                      ${Object.entries(portfolioState.currentAllocation).reduce((total, [account, amount]) => {
                        const rate = marketData?.yields?.[account]?.rate || 0;
                        return total + ((amount * rate) / 100);
                      }, 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Liquid Assets</span>
                    <span className="font-medium text-blue-600">
                      ${(portfolioState.currentAllocation['Checking'] +
                        portfolioState.currentAllocation['Money Market'] +
                        portfolioState.currentAllocation['Treasury MMF']).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Average APY</span>
                    <span className="font-medium text-purple-600">
                      {Object.entries(portfolioState.currentAllocation).reduce((totalYield, [account, amount]) => {
                        const rate = marketData?.yields?.[account]?.rate || 0;
                        return totalYield + ((amount / portfolioState.totalCash) * rate);
                      }, 0).toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">AI Recommendations</span>
                    <span className="font-medium text-gray-600">
                      {aiRecommendations.filter(r => r.status === 'COMPLETED').length} completed
                    </span>
                  </div>
                </div>
              </div>

              {/* Emergency Actions */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🚨 Emergency Actions</h3>

                <div className="space-y-2">
                  <button
                    onClick={() => handleAIRecommendation({
                      type: 'INCREASE_LIQUIDITY',
                      action: 'Emergency liquidity boost',
                      priority: 'HIGH',
                      reasoning: 'Manual emergency action'
                    })}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                  >
                    🚀 Boost Liquidity
                  </button>

                  <button
                    onClick={() => handleAIRecommendation({
                      type: 'OPTIMIZE_YIELD',
                      action: 'Immediate yield optimization',
                      priority: 'MEDIUM',
                      reasoning: 'Manual optimization request'
                    })}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    📈 Optimize Now
                  </button>

                  <button
                    onClick={async () => {
                      if (!marketData) return;
                      try {
                        const quickOptimization = await aiEngine.quickOptimize(
                          marketData.yields,
                          portfolioState.totalCash
                        );
                        console.log('Quick optimization result:', quickOptimization);

                        if (quickOptimization.rebalanceActions?.length > 0) {
                          const topAction = quickOptimization.rebalanceActions[0];
                          await handleAIRecommendation({
                            type: 'REBALANCE',
                            action: `${topAction.action} ${topAction.account} by ${topAction.amount.toLocaleString()}`,
                            data: topAction,
                            priority: 'HIGH',
                            reasoning: 'AI quick optimization'
                          });
                        }
                      } catch (error) {
                        console.error('Quick optimization failed:', error);
                      }
                    }}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    🤖 AI Quick Fix
                  </button>
                </div>
              </div>

              {/* Quick Analytics Preview */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Analytics Preview</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get detailed performance insights, risk analysis, and ROI reporting
                </p>
                <button
                  onClick={() => setCurrentView('analytics')}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
                >
                  🚀 View Advanced Analytics
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer with System Information */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between text-sm text-gray-600">
            <div>
              AURA Treasury Intelligence System | Real-time AI-powered cash optimization
            </div>
            <div className="mt-2 md:mt-0 flex items-center space-x-4">
              <span>Market Data: Federal Reserve Economic Data (FRED)</span>
              <span>•</span>
              <span>AI Engine: Active and Learning</span>
              <span>•</span>
              <span>Security: Bank-grade encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuraDemo;