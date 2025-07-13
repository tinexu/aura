// Integration component for AURA AI Intelligence Engine
// Add this to your AuraDemo.js file

import React, { useState, useEffect } from 'react';
import { AURAIntelligenceEngine } from './aura-ai-engine'; // Import the AI engine

// AI-Powered Dashboard Enhancement
export const AIIntelligencePanel = ({ marketData, portfolioState, onRecommendationAccept }) => {
  const [aiEngine] = useState(() => new AURAIntelligenceEngine());
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Auto-analyze when market data changes
  useEffect(() => {
    if (marketData && portfolioState) {
      runAIAnalysis();
    }
  }, [marketData?.lastUpdated, portfolioState?.totalCash]);

  const runAIAnalysis = async () => {
    setLoading(true);

    if (portfolioState?.isSimulated) {
        console.warn('⚠️ Skipping AI analysis — simulated portfolio data');
        setLoading(false);
        return;
    }

    try {
      console.log('🧠 Running AURA AI analysis...');
      
      const result = await aiEngine.analyzeAndOptimize(
        marketData,
        portfolioState,
        {
          riskTolerance: 'moderate',
          liquidityNeeds: 'normal',
          forecastHorizon: 30
        }
      );
      
      setAnalysis(result);
      console.log('✅ AI analysis complete:', result);
      
    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationAccept = (recommendation) => {
    console.log('🤖 Executing AI recommendation:', recommendation);
    onRecommendationAccept?.(recommendation);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          <span className="text-purple-700 font-medium">AURA AI is analyzing your portfolio...</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
        <button 
          onClick={runAIAnalysis}
          className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          🧠 Activate AURA AI Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200">
      {/* AI Header */}
      <div className="p-6 border-b border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🧠</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">AURA AI Intelligence</h3>
              <p className="text-sm text-purple-600">
                Confidence: {(analysis.confidence * 100).toFixed(1)}% | 
                Analysis Time: {analysis.performance?.duration?.toFixed(0)}ms
              </p>
            </div>
          </div>
          <button 
            onClick={runAIAnalysis}
            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* AI Tabs */}
      <div className="px-6 pt-4">
        <div className="flex space-x-4 border-b border-purple-200">
          {[
            { id: 'overview', label: '📊 Overview', icon: '📊' },
            { id: 'optimization', label: '⚡ Optimization', icon: '⚡' },
            { id: 'forecast', label: '🔮 Forecast', icon: '🔮' },
            { id: 'risk', label: '⚠️ Risk', icon: '⚠️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'border-b-2 border-purple-600 text-purple-600' 
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && <OverviewTab analysis={analysis} onAccept={handleRecommendationAccept} />}
        {activeTab === 'optimization' && <OptimizationTab analysis={analysis} onAccept={handleRecommendationAccept} />}
        {activeTab === 'forecast' && <ForecastTab analysis={analysis} />}
        {activeTab === 'risk' && <RiskTab analysis={analysis} />}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ analysis, onAccept }) => (
  <div className="space-y-4">
    {/* Key Insights */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-2xl font-bold text-green-600">
          +{(analysis.analysis.optimization?.expectedYield * 100 || 0).toFixed(2)}%
        </div>
        <div className="text-sm text-gray-600">Expected Yield Improvement</div>
      </div>
      
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-2xl font-bold text-blue-600">
          {analysis.analysis.riskAssessment?.overallRisk?.toFixed(1) || 'N/A'}
        </div>
        <div className="text-sm text-gray-600">Risk Score (Lower is Better)</div>
      </div>
      
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-2xl font-bold text-purple-600">
          {analysis.recommendations?.length || 0}
        </div>
        <div className="text-sm text-gray-600">Active Recommendations</div>
      </div>
    </div>

    {/* Top Recommendations */}
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h4 className="font-semibold text-gray-800 mb-3">🎯 Top AI Recommendations</h4>
      {analysis.recommendations?.slice(0, 3).map((rec, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
          <div className="flex-1">
            <div className="font-medium text-gray-800">{rec.action}</div>
            <div className="text-sm text-gray-600">{rec.reasoning}</div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full ${
              rec.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
              rec.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {rec.priority}
            </span>
            <button 
              onClick={() => onAccept(rec)}
              className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
            >
              Accept
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Optimization Tab Component
const OptimizationTab = ({ analysis, onAccept }) => {
  const optimization = analysis.analysis?.optimization;
  
  if (!optimization) {
    return <div className="text-gray-500">No optimization data available</div>;
  }

  return (
    <div className="space-y-4">
      {/* Current vs Optimal Allocation */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3">💰 Allocation Comparison</h4>
        
        <div className="space-y-3">
          {Object.entries(optimization.optimalAllocation).map(([account, amount]) => {
            const current = optimization.currentAllocation[account] || 0;
            const optimal = amount;
            const difference = optimal - current;
            
            return (
              <div key={account} className="flex items-center justify-between">
                <span className="font-medium text-gray-700">{account}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    ${current.toLocaleString()} → ${optimal.toLocaleString()}
                  </span>
                  <span className={`text-sm font-medium ${
                    difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {difference > 0 ? '+' : ''}{difference.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rebalancing Actions */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3">⚡ Rebalancing Actions</h4>
        
        {optimization.rebalanceActions?.length > 0 ? (
          <div className="space-y-2">
            {optimization.rebalanceActions.map((action, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">
                    {action.action} {action.account}
                  </div>
                  <div className="text-sm text-gray-600">
                    Amount: ${action.amount.toLocaleString()} | Priority: {action.priority.toFixed(2)}
                  </div>
                </div>
                <button 
                  onClick={() => onAccept({
                    type: 'REBALANCE',
                    action: `${action.action} ${action.account} by $${action.amount.toLocaleString()}`,
                    data: action
                  })}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  Execute
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">
            ✅ Your allocation is already optimized!
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h5 className="font-medium text-gray-800 mb-2">Expected Outcomes</h5>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Expected Yield:</span>
              <span className="font-medium">{(optimization.expectedYield * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Risk Score:</span>
              <span className="font-medium">{optimization.riskScore?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Confidence:</span>
              <span className="font-medium">{(optimization.confidence * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h5 className="font-medium text-gray-800 mb-2">AI Analysis</h5>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Accounts Analyzed:</span>
              <span className="font-medium">{Object.keys(optimization.optimalAllocation).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Actions Required:</span>
              <span className="font-medium">{optimization.rebalanceActions?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Analysis Time:</span>
              <span className="font-medium">{analysis.performance?.duration?.toFixed(0)}ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Forecast Tab Component
const ForecastTab = ({ analysis }) => {
  const forecast = analysis.analysis?.forecast;
  
  if (!forecast) {
    return <div className="text-gray-500">No forecast data available</div>;
  }

  // Sample the forecast data for display (every 5th day)
  const sampledPredictions = forecast.predictions?.filter((_, index) => index % 5 === 0) || [];

  return (
    <div className="space-y-4">
      {/* Forecast Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {forecast.timeHorizon} Days
          </div>
          <div className="text-sm text-gray-600">Forecast Horizon</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            ${Math.round(sampledPredictions.reduce((sum, p) => sum + p.amount, 0) / sampledPredictions.length || 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Average Predicted Cash</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {forecast.riskFactors?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Risk Factors Identified</div>
        </div>
      </div>

      {/* Forecast Chart (Simple representation) */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3">📈 Cash Flow Projection</h4>
        
        <div className="space-y-2">
          {sampledPredictions.slice(0, 6).map((prediction, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">
                Day {prediction.day} ({prediction.date?.toLocaleDateString()})
              </span>
              <div className="flex items-center space-x-3">
                <span className="font-medium">${prediction.amount?.toLocaleString()}</span>
                <span className="text-xs text-gray-500">
                  ±${(prediction.volatility || 0).toLocaleString()}
                </span>
                <div className={`w-3 h-3 rounded-full ${
                  (prediction.confidence || 0) > 0.8 ? 'bg-green-400' :
                  (prediction.confidence || 0) > 0.6 ? 'bg-yellow-400' : 'bg-red-400'
                }`} title={`Confidence: ${((prediction.confidence || 0) * 100).toFixed(1)}%`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Factors */}
      {forecast.riskFactors?.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3">⚠️ Identified Risk Factors</h4>
          
          <div className="space-y-2">
            {forecast.riskFactors.map((risk, index) => (
              <div key={index} className={`p-3 rounded-lg border-l-4 ${
                risk.severity === 'HIGH' ? 'bg-red-50 border-red-400' :
                risk.severity === 'MEDIUM' ? 'bg-yellow-50 border-yellow-400' :
                'bg-blue-50 border-blue-400'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{risk.type.replace('_', ' ')}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    risk.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                    risk.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {risk.severity}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">{risk.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forecast Recommendations */}
      {forecast.recommendations?.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3">💡 Forecast-Based Recommendations</h4>
          
          <div className="space-y-2">
            {forecast.recommendations.map((rec, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-gray-800">{rec.action}</div>
                <div className="text-sm text-gray-600">{rec.reasoning}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Risk Tab Component
const RiskTab = ({ analysis }) => {
  const riskAssessment = analysis.analysis?.riskAssessment;
  
  if (!riskAssessment) {
    return <div className="text-gray-500">No risk assessment data available</div>;
  }

  return (
    <div className="space-y-4">
      {/* Overall Risk Score */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="text-center">
          <div className={`text-4xl font-bold mb-2 ${
            riskAssessment.overallRisk < 3 ? 'text-green-600' :
            riskAssessment.overallRisk < 6 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {riskAssessment.overallRisk?.toFixed(1)}
          </div>
          <div className="text-gray-600">Overall Risk Score</div>
          <div className={`text-sm mt-1 ${
            riskAssessment.overallRisk < 3 ? 'text-green-600' :
            riskAssessment.overallRisk < 6 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {riskAssessment.overallRisk < 3 ? 'Low Risk' :
             riskAssessment.overallRisk < 6 ? 'Medium Risk' : 'High Risk'}
          </div>
        </div>
      </div>

      {/* Risk Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(riskAssessment.riskBreakdown || {}).map(([riskType, risk]) => (
          <div key={riskType} className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-gray-800 capitalize">
                {riskType.replace(/([A-Z])/g, ' $1').trim()}
              </h5>
              <span className={`px-2 py-1 text-xs rounded-full ${
                risk.status === 'SAFE' || risk.status === 'LOW' ? 'bg-green-100 text-green-700' :
                risk.status === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {risk.status}
              </span>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Score:</span>
                <span className="font-medium">{risk.score?.toFixed(2)}</span>
              </div>
              
              {risk.ratio && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ratio:</span>
                  <span className="font-medium">{(risk.ratio * 100).toFixed(1)}%</span>
                </div>
              )}
              
              {risk.threshold && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Threshold:</span>
                  <span className="font-medium">{(risk.threshold * 100).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Risk Factors */}
      {riskAssessment.riskFactors?.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3">🚨 Active Risk Factors</h4>
          
          <div className="space-y-3">
            {riskAssessment.riskFactors.map((factor, index) => (
              <div key={index} className={`p-3 rounded-lg border-l-4 ${
                factor.severity === 'HIGH' ? 'bg-red-50 border-red-400' :
                factor.severity === 'MEDIUM' ? 'bg-yellow-50 border-yellow-400' :
                'bg-blue-50 border-blue-400'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-800">
                    {factor.type.replace(/_/g, ' ')}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    factor.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                    factor.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {factor.severity}
                  </span>
                </div>
                <div className="text-sm text-gray-600">{factor.description}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Risk Score: {factor.score?.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Recommendations */}
      {riskAssessment.recommendations?.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3">🛡️ Risk Mitigation Recommendations</h4>
          
          <div className="space-y-2">
            {riskAssessment.recommendations.map((rec, index) => (
              <div key={index} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-800">{rec.action}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    rec.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                    rec.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <div className="text-sm text-gray-600">{rec.expectedImpact}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Market Data Hook with AI Integration
export const useAIEnhancedMarketData = (initialMarketData) => {
  const [marketData, setMarketData] = useState(initialMarketData);
  const [aiInsights, setAIInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateMarketDataWithAI = async (newMarketData) => {
    setMarketData(newMarketData);
    
    // Trigger AI analysis when market data updates
    if (newMarketData && newMarketData.yields) {
      setLoading(true);
      try {
        const aiEngine = new AURAIntelligenceEngine();
        const insights = await aiEngine.quickOptimize(
          newMarketData.yields,
          newMarketData.totalCash || 100000
        );
        setAIInsights(insights);
      } catch (error) {
        console.error('AI insights failed:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    marketData,
    aiInsights,
    loading,
    updateMarketData: updateMarketDataWithAI
  };
};

// AI Status Indicator Component
export const AIStatusIndicator = ({ aiEngine }) => {
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    const updateHealth = () => {
      if (aiEngine) {
        setSystemHealth(aiEngine.getSystemHealth());
      }
    };

    updateHealth();
    const interval = setInterval(updateHealth, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [aiEngine]);

  if (!systemHealth) return null;

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${
        systemHealth.status === 'OPERATIONAL' ? 'bg-green-400' : 'bg-red-400'
      }`}></div>
      <span className="text-gray-600">
        AI System: {systemHealth.status} | 
        Performance: {systemHealth.performance?.systemHealth}
      </span>
    </div>
  );
};

// Usage Instructions for Integration:
/*
To integrate this AI system into your existing AuraDemo.js:

1. Import the components:
   import { AIIntelligencePanel, useAIEnhancedMarketData, AIStatusIndicator } from './aura-ai-integration';
   import { AURAIntelligenceEngine } from './aura-ai-engine';

2. Initialize the AI engine in your component:
   const [aiEngine] = useState(() => new AURAIntelligenceEngine());

3. Replace your market data hook:
   const { marketData, aiInsights, loading, updateMarketData } = useAIEnhancedMarketData(initialData);

4. Add the AI panel to your JSX:
   <AIIntelligencePanel 
     marketData={marketData}
     portfolioState={{ totalCash: 250000 }}
     onRecommendationAccept={(rec) => console.log('Accepted:', rec)}
   />

5. Add the status indicator:
   <AIStatusIndicator aiEngine={aiEngine} />

6. Handle AI recommendations:
   const handleAIRecommendation = (recommendation) => {
     // Execute the recommendation (move money, adjust allocation, etc.)
     console.log('Executing AI recommendation:', recommendation);
   };
*/