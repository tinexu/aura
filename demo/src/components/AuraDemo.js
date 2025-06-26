import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Bot, DollarSign, Globe, Zap, Activity, Target } from 'lucide-react';

import {
  fetchTreasuryRates,
  fetchFXRates,
  fetchCurrentYields,
  calculateOptimalYield,
  calculateFXRisk
} from '../services/marketService';

const AuraDemo = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeAgent, setActiveAgent] = useState('cashOptimizer');
  const [notifications, setNotifications] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const [marketData, setMarketData] = useState({
    treasuryRate: 5.2,
    fxRates: {},
    yields: {},
    lastUpdated: new Date()
  });

  const [isLoadingMarketData, setIsLoadingMarketData] = useState(false);
  const [marketDataError, setMarketDataError] = useState(null);

  useEffect(() => {
    const loadMarketData = async () => {
      setIsLoadingMarketData(true);
      setMarketDataError(null);

      try {
        console.log('Loading market data...');

        const [treasuryRate, fxRates, yields] = await Promise.all([
          fetchTreasuryRates(),
          fetchFXRates(),
          fetchCurrentYields()
        ]);

        console.log('Market data loaded:', { treasuryRate, fxRates, yields });

        setMarketData({
          treasuryRate,
          fxRates,
          yields,
          lastUpdated: new Date()
        });

        // Update cash positions with real yields and opportunities
        setCashPositions(prev => prev.map(pos => {
          const optimization = calculateOptimalYield(pos.balance, pos.currency, pos.yield);
          return {
            ...pos,
            // Update yield if we have real data
            yield: getUpdatedYield(pos, yields),
            // Update opportunity based on optimization
            opportunity: optimization ? `${optimization.recommendation} (+${Math.round(optimization.potentialGain)}K annually)` : pos.opportunity
          };
        }));

        // Update notifications with real market insights
        const fxRisk = calculateFXRisk(cashPositions, fxRates);
        if (fxRisk.risks.length > 0) {
          const newNotification = {
            id: Date.now(),
            agent: 'FX Risk Monitor',
            action: `${fxRisk.risks[0].currency} exposure at ${fxRisk.risks[0].exposure.toFixed(1)}% - ${fxRisk.risks[0].recommendation}`,
            time: 'Just now',
            type: 'warning'
          };

          setNotifications(prev => [newNotification, ...prev.slice(0, 3)]);
        }

      } catch (error) {
        console.error('Failed to load market data:', error);
        setMarketDataError(error.message);
      } finally {
        setIsLoadingMarketData(false);
      }
    };

    // Load immediately
    loadMarketData();

    // Refresh every 5 minutes
    const interval = setInterval(loadMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to update yields
  const getUpdatedYield = (position, yields) => {
    const accountType = getAccountType(position.account);
    return yields[accountType] || position.yield;
  };

  // Helper function to determine account type
  const getAccountType = (accountName) => {
    if (accountName.toLowerCase().includes('operating') || accountName.toLowerCase().includes('checking')) {
      return 'Checking';
    } else if (accountName.toLowerCase().includes('money market') || accountName.toLowerCase().includes('mmf')) {
      return 'Money Market';
    } else if (accountName.toLowerCase().includes('sweep')) {
      return 'Treasury MMF';
    }
    return 'Money Market'; // Default
  };

  // Update your simulate action function to use real data
  const simulateAgentAction = () => {
    setIsSimulating(true);

    // Find the best optimization opportunity
    const optimizations = cashPositions.map(pos =>
      calculateOptimalYield(pos.balance, pos.currency, pos.yield)
    ).filter(opt => opt !== null);

    if (optimizations.length > 0) {
      const bestOpt = optimizations.sort((a, b) => b.potentialGain - a.potentialGain)[0];

      setTimeout(() => {
        const newAction = {
          id: notifications.length + 1,
          agent: 'Cash Optimizer',
          action: `Executed: ${bestOpt.reasoning} (+$${Math.round(bestOpt.potentialGain / 1000)}K annual impact)`,
          time: 'Just now',
          type: 'success'
        };
        setNotifications([newAction, ...notifications.slice(0, 3)]);
        setIsSimulating(false);
      }, 2000);
    } else {
      setTimeout(() => {
        const newAction = {
          id: notifications.length + 1,
          agent: 'Cash Optimizer',
          action: 'Analysis complete: All positions optimally allocated',
          time: 'Just now',
          type: 'success'
        };
        setNotifications([newAction, ...notifications.slice(0, 3)]);
        setIsSimulating(false);
      }, 2000);
    }
  };

  useEffect(() => {
    const loadMarketData = async () => {
      try {
        const [treasuryRate, fxRates, yields] = await Promise.all([
          fetchTreasuryRates(),
          fetchFXRates(),
          fetchCurrentYields()
        ]);

        setMarketData({ treasuryRate, fxRates, yields });

        // Update cash positions with real yields
        setCashPositions(prev => prev.map(pos => ({
          ...pos,
          yield: yields[pos.accountType] || pos.yield
        })));

      } catch (error) {
        console.error('Failed to load market data:', error);
      }
    };

    loadMarketData();

    // Refresh every 5 minutes
    const interval = setInterval(loadMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Simulate real-time agent actions
    const actions = [
      { id: 1, agent: 'Cash Optimizer', action: 'Moved $2.3M from low-yield checking to 5.2% Treasury MMF', time: '2 min ago', type: 'success' },
      { id: 2, agent: 'FX Monitor', action: 'EUR/USD volatility detected - suggesting 60% hedge coverage', time: '5 min ago', type: 'warning' },
      { id: 3, agent: 'Liquidity Forecaster', action: 'Predicted $1.8M shortfall in Q2 - recommending credit line activation', time: '12 min ago', type: 'info' },
      { id: 4, agent: 'Risk Analyst', action: 'Counterparty risk elevated for Supplier XYZ - flagged for review', time: '18 min ago', type: 'warning' }
    ];
    setNotifications(actions);
  }, []);

  const agents = {
    cashOptimizer: {
      name: 'Cash Optimizer',
      status: 'Active',
      icon: <DollarSign className="w-5 h-5" />,
      description: 'Autonomously optimizing cash across 47 accounts',
      metrics: {
        'Yield Generated': '$847K',
        'Accounts Monitored': '47',
        'Last Action': '2 min ago'
      },
      goals: ['Maintain $20M liquidity buffer', 'Maximize yield >4.8%', 'Minimize idle cash <2%']
    },
    fxManager: {
      name: 'FX Risk Manager',
      status: 'Monitoring',
      icon: <Globe className="w-5 h-5" />,
      description: 'Real-time FX exposure monitoring across 12 currencies',
      metrics: {
        'Exposure Hedged': '73%',
        'Currencies Tracked': '12',
        'Risk Score': 'Medium'
      },
      goals: ['Keep USD exposure <60%', 'Hedge EUR positions >70%', 'Alert on 2%+ moves']
    },
    liquidityForecaster: {
      name: 'Liquidity Forecaster',
      status: 'Learning',
      icon: <Activity className="w-5 h-5" />,
      description: 'AI-powered cash flow predictions with 94% accuracy',
      metrics: {
        'Forecast Accuracy': '94.2%',
        'Prediction Range': '90 days',
        'Model Confidence': 'High'
      },
      goals: ['Predict cash flows 90d ahead', 'Achieve >95% accuracy', 'Update forecasts daily']
    }
  };

  const [cashPositions, setCashPositions] = useState([
    { account: 'JP Morgan Operating', balance: 18500000, yield: 0.1, currency: 'USD', opportunity: 'Move to MMF' },
    { account: 'Wells Fargo Sweep', balance: 8200000, yield: 4.8, currency: 'USD', opportunity: null },
    { account: 'HSBC EUR Account', balance: 5400000, yield: 3.2, currency: 'EUR', opportunity: 'FX hedge needed' },
    { account: 'Citi Money Market', balance: 12000000, yield: 5.1, currency: 'USD', opportunity: null },
    { account: 'BNP Paribas SGD', balance: 2100000, yield: 2.8, currency: 'SGD', opportunity: 'Consider repatriation' }
  ]);

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              AURA
            </h1>
            <span className="text-sm text-gray-400">Agentic Treasury Intelligence</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">3 Agents Active</span>
            </div>
            <div className="text-sm text-gray-400">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Agent Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-cyan-400" />
                Active Agents
              </h2>
              <div className="space-y-3">
                {Object.entries(agents).map(([key, agent]) => (
                  <div
                    key={key}
                    onClick={() => setActiveAgent(key)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${activeAgent === key
                      ? 'bg-cyan-500/20 border border-cyan-400/50'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {agent.icon}
                        <span className="font-medium text-sm">{agent.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${agent.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                        agent.status === 'Monitoring' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                        {agent.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{agent.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Agent Goals</h3>
              <div className="space-y-2">
                {agents[activeAgent].goals.map((goal, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{goal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agent Performance */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">{agents[activeAgent].name} Performance</h2>
                <button
                  onClick={simulateAgentAction}
                  disabled={isSimulating}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>{isSimulating ? 'Executing...' : 'Simulate Action'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {Object.entries(agents[activeAgent].metrics).map(([key, value]) => (
                  <div key={key} className="bg-white/5 rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">{key}</div>
                    <div className="text-xl font-bold text-white">{value}</div>
                  </div>
                ))}
              </div>

              {/* Cash Positions Table */}
              <div className="bg-white/5 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10">
                  <h3 className="font-semibold">Live Cash Positions</h3>
                </div>
                <div className="divide-y divide-white/10">
                  {cashPositions.map((position, index) => (
                    <div key={index} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{position.account}</div>
                        <div className="text-sm text-gray-400">{position.currency} • {position.yield}% yield</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(position.balance, position.currency)}</div>
                        {position.opportunity && (
                          <div className="text-xs text-yellow-400 flex items-center mt-1">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {position.opportunity}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">AI-Generated Insights</h3>
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-green-400">Yield Optimization Opportunity</div>
                      <div className="text-sm text-gray-300 mt-1">
                        Moving $18.5M from JP Morgan Operating (0.1% yield) to Treasury MMF could generate additional $847K annually
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-400">FX Risk Alert</div>
                      <div className="text-sm text-gray-300 mt-1">
                        EUR exposure at 27% of portfolio. Recommend hedging 70% given ECB policy uncertainty
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <Activity className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-400">Liquidity Forecast</div>
                      <div className="text-sm text-gray-300 mt-1">
                        94.2% confidence: $23.7M available liquidity in 30 days, well above $20M target
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Live Agent Activity</h3>
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div key={notification.id} className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-sm">{notification.agent}</span>
                      <span className="text-xs text-gray-400">{notification.time}</span>
                    </div>
                    <p className="text-sm text-gray-300">{notification.action}</p>
                    <div className={`inline-flex mt-2 px-2 py-1 rounded-full text-xs ${notification.type === 'success' ? 'bg-green-500/20 text-green-400' :
                      notification.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                      {notification.type === 'success' ? 'Executed' :
                        notification.type === 'warning' ? 'Alert' : 'Analysis'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Today's Impact</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Yield Generated</span>
                  <span className="text-green-400 font-semibold">+$2,340</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Risk Reduced</span>
                  <span className="text-blue-400 font-semibold">-12%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Actions Taken</span>
                  <span className="text-cyan-400 font-semibold">47</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Time Saved</span>
                  <span className="text-purple-400 font-semibold">6.2 hrs</span>
                </div>
              </div>
            </div>

            {/* Market Data Status */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Market Data</h3>
                {isLoadingMarketData && (
                  <div className="text-sm text-blue-400">Updating...</div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">3M Treasury</span>
                  <span className="text-white font-semibold">{marketData.treasuryRate?.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">EUR/USD</span>
                  <span className="text-white font-semibold">{marketData.fxRates.EUR?.toFixed(4) || 'Loading...'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Last Updated</span>
                  <span className="text-xs text-gray-500">
                    {marketData.lastUpdated?.toLocaleTimeString() || 'Never'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuraDemo;