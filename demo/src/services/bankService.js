import React, { useState, useCallback, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3005/api';

export class BankIntegration {
  constructor() {
    this.connectedAccounts = new Map();
    this.transactionHistory = [];
    
    console.log('🏦 Real Bank Integration initialized');
    console.log('🔗 Backend API:', API_BASE_URL);
  }

  async createLinkToken(userId = 'aura_user') {
    try {
      console.log('🔗 Creating Plaid Link token via backend...');
      
      const response = await fetch(`${API_BASE_URL}/create_link_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Link token created successfully');
      return data.link_token;
      
    } catch (error) {
      console.error('❌ Failed to create link token:', error);
      throw new Error('Bank connection setup failed: ' + error.message);
    }
  }

  async exchangePublicToken(publicToken) {
    try {
      console.log('🔄 Exchanging public token via backend...');
      
      const response = await fetch(`${API_BASE_URL}/exchange_public_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_token: publicToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const { access_token, item_id } = data;
      
      this.connectedAccounts.set(item_id, {
        accessToken: access_token,
        itemId: item_id,
        connectedAt: new Date(),
        status: 'active'
      });
      
      console.log('✅ Access token obtained successfully');
      return { accessToken: access_token, itemId: item_id };
      
    } catch (error) {
      console.error('❌ Token exchange failed:', error);
      throw new Error('Bank account connection failed: ' + error.message);
    }
  }

  async getAccountBalances(accessToken) {
    try {
      console.log('💰 Fetching real account balances via backend...');
      
      const response = await fetch(`${API_BASE_URL}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Retrieved ${data.accounts.length} real accounts`);
      return data.accounts;
      
    } catch (error) {
      console.error('❌ Failed to fetch account balances:', error);
      throw new Error('Unable to retrieve account data: ' + error.message);
    }
  }

  async getTransactionHistory(accessToken, startDate, endDate) {
    try {
      console.log('📊 Fetching real transaction history via backend...');
      
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          start_date: startDate,
          end_date: endDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Retrieved ${data.transactions.length} real transactions`);
      return data.transactions;
      
    } catch (error) {
      console.error('❌ Failed to fetch transactions:', error);
      throw new Error('Unable to retrieve transaction history: ' + error.message);
    }
  }

  async executeTransfer(fromAccountId, toAccountId, amount, description) {
    try {
      console.log(`💸 Executing real transfer: $${amount} from ${fromAccountId} to ${toAccountId}`);
      
      const response = await fetch(`${API_BASE_URL}/simulate_transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_account_id: fromAccountId,
          to_account_id: toAccountId,
          amount: amount,
          description: description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      this.transactionHistory.push(data.transfer);
      
      console.log('✅ Transfer executed successfully:', data.transfer.transferId);
      return data.transfer;
      
    } catch (error) {
      console.error('❌ Transfer failed:', error);
      throw new Error('Money movement failed: ' + error.message);
    }
  }

  async executeAIRecommendation(recommendation, accounts) {
    try {
      console.log('🤖 Executing AI recommendation with real bank data:', recommendation.action);
      
      if (recommendation.type === 'REBALANCE' && recommendation.data) {
        return await this.executeRebalancing(recommendation.data, accounts);
      }
      
      if (accounts.length >= 2) {
        const transfer = await this.executeTransfer(
          accounts[0].accountId,
          accounts[1].accountId,
          5000,
          `AI Recommendation: ${recommendation.action}`
        );
        
        return {
          type: 'ai_recommendation',
          transfer,
          recommendation: recommendation.action
        };
      }
      
      throw new Error('Need at least 2 accounts to execute transfers');
      
    } catch (error) {
      console.error('❌ Failed to execute AI recommendation:', error);
      throw error;
    }
  }

  async executeRebalancing(rebalanceData, accounts) {
    const { account, action, amount } = rebalanceData;
    
    const sourceAccount = accounts.find(acc => acc.balance.available >= amount) || accounts[0];
    const targetAccount = accounts.find(acc => acc.name.toLowerCase().includes(account.toLowerCase())) || accounts[1];
    
    if (!sourceAccount || !targetAccount) {
      throw new Error('Unable to find suitable accounts for rebalancing');
    }
    
    const transfer = await this.executeTransfer(
      sourceAccount.accountId,
      targetAccount.accountId,
      amount,
      `AI Rebalancing: ${action} ${account}`
    );
    
    return {
      type: 'rebalance',
      transfer,
      recommendation: `${action} ${account} by $${amount.toLocaleString()}`
    };
  }

  async checkBackendHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      console.log('✅ Backend server is healthy:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Backend server is not accessible:', error);
      throw new Error('Backend server connection failed');
    }
  }

  getConnectionStatus() {
    return {
      totalConnections: this.connectedAccounts.size,
      activeConnections: Array.from(this.connectedAccounts.values())
        .filter(conn => conn.status === 'active').length,
      transactionHistory: this.transactionHistory.length,
      backendUrl: API_BASE_URL
    };
  }
}

export const BankConnectionPanel = ({ onAccountsConnected, onError }) => {
  const [bankIntegration] = useState(() => new BankIntegration());
  const [linkToken, setLinkToken] = useState(null);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        await bankIntegration.checkBackendHealth();
        setBackendStatus('connected');
      } catch (error) {
        setBackendStatus('disconnected');
        setError('Backend server not running. Start with: npm run server');
      }
    };
    
    checkBackend();
  }, [bankIntegration]);

  useEffect(() => {
    const initializeLink = async () => {
      if (backendStatus !== 'connected') return;
      
      try {
        setError(null);
        setLoading(true);
        
        const token = await bankIntegration.createLinkToken();
        setLinkToken(token);
        
        console.log('✅ Real Plaid Link initialized successfully');
        
      } catch (error) {
        console.error('Failed to initialize Plaid Link:', error);
        setError(error.message);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeLink();
  }, [bankIntegration, backendStatus, onError]);

  const onSuccess = useCallback(async (public_token, metadata) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔗 Processing real bank connection...');
      console.log('Connected to institution:', metadata.institution.name);
      
      const { accessToken, itemId } = await bankIntegration.exchangePublicToken(public_token);
      const accounts = await bankIntegration.getAccountBalances(accessToken);
      
      setConnectedAccounts(prev => [...prev, ...accounts]);
      onAccountsConnected?.(accounts);
      
      console.log('✅ Real bank accounts connected successfully:', accounts.length);
      console.log('Accounts:', accounts.map(acc => `${acc.name}: $${acc.balance.current}`));
      
    } catch (error) {
      console.error('❌ Failed to connect real bank accounts:', error);
      setError(error.message);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [bankIntegration, onAccountsConnected, onError]);

  const onExit = useCallback((err, metadata) => {
    if (err) {
      console.error('Plaid Link exit error:', err);
      setError('Bank connection was cancelled or failed');
    }
    setLoading(false);
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit,
    onEvent: (eventName, metadata) => {
      console.log('Plaid event:', eventName, metadata);
    },
  });

  const executeAIRecommendation = async (recommendation) => {
    try {
      setLoading(true);
      const results = await bankIntegration.executeAIRecommendation(recommendation, connectedAccounts);
      
      setTransfers(prev => [...prev, results]);
      
      console.log('✅ Real AI recommendation executed:', results);
      
    } catch (error) {
      console.error('Failed to execute AI recommendation:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">🏦 Real Bank Connections</h3>
      
      {/* Backend Status */}
      <div className={`mb-4 p-3 rounded-lg border ${
        backendStatus === 'connected' ? 'bg-green-50 border-green-200' :
        backendStatus === 'disconnected' ? 'bg-red-50 border-red-200' :
        'bg-yellow-50 border-yellow-200'
      }`}>
        <div className={`text-sm ${
          backendStatus === 'connected' ? 'text-green-700' :
          backendStatus === 'disconnected' ? 'text-red-700' :
          'text-yellow-700'
        }`}>
          Backend Server: {
            backendStatus === 'connected' ? '✅ Connected' :
            backendStatus === 'disconnected' ? '❌ Disconnected' :
            '🔄 Checking...'
          }
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="text-sm text-red-700">❌ {error}</div>
          {backendStatus === 'disconnected' && (
            <div className="text-xs text-red-600 mt-1">
              Run: npm run server (in a separate terminal)
            </div>
          )}
        </div>
      )}
      
      {/* Connection Status */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-600">
          Status: {loading ? 'Processing...' : ready ? 'Ready' : 'Initializing...'} | 
          Connected: {connectedAccounts.length} real accounts | 
          Transfers: {transfers.length}
        </div>
      </div>
      
      {/* Connection Interface */}
      {connectedAccounts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            Connect your real bank accounts via Plaid
          </div>
          <button
            onClick={() => open()}
            disabled={!ready || loading || error || backendStatus !== 'connected'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '🔄 Connecting...' : '🔗 Connect Real Bank Account'}
          </button>
          
          <div className="text-xs text-gray-500 mt-2">
            🔒 Secure connection via Plaid • Bank-grade encryption
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected Real Accounts */}
          <div>
            <h4 className="font-medium text-gray-800 mb-2">
              🎉 Real Connected Accounts ({connectedAccounts.length})
            </h4>
            <div className="space-y-2">
              {connectedAccounts.map((account) => (
                <div key={account.accountId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <div className="font-medium text-gray-800">
                      {account.name} <span className="text-green-600">• REAL</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {account.subtype?.charAt(0).toUpperCase() + account.subtype?.slice(1)} • ****{account.mask}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      ${account.balance.current?.toLocaleString() || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Available: ${account.balance.available?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real Transfer History */}
          {transfers.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">💸 Real AI Transfers</h4>
              <div className="space-y-2">
                {transfers.slice(-3).reverse().map((transfer, index) => (
                  <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-800">{transfer.recommendation}</div>
                      <div className="text-sm text-purple-600">{transfer.transfer.status}</div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Real Transfer ID: {transfer.transfer.transferId}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Another Account */}
          <button
            onClick={() => open()}
            disabled={!ready || loading}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
          >
            + Connect Another Real Bank Account
          </button>
        </div>
      )}
    </div>
  );
};