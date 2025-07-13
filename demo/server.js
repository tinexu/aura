// Backend Server for Real Plaid Integration
// Run this with: node server.js

const express = require('express');
const cors = require('cors');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your React app
app.use(cors({
  origin: ['http://localhost:3006', 'http://localhost:3005'],
  credentials: true
}));
app.use(express.json());

// Initialize Plaid client
const configuration = new Configuration({
  basePath: process.env.PLAID_ENV === 'production' 
    ? PlaidEnvironments.production 
    : PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

// Store access tokens (in production, use a database)
const accessTokens = new Map();

// ===== PLAID API ENDPOINTS =====

// Create Link Token
app.post('/api/create_link_token', async (req, res) => {
  try {
    console.log('Creating link token...');
    
    const request = {
      user: {
        client_user_id: req.body.user_id || 'aura_user_' + Date.now(),
      },
      client_name: 'AURA Treasury Intelligence',
      products: ['transactions', 'auth'],
      country_codes: ['US'],
      language: 'en',
    };

    const response = await client.linkTokenCreate(request);
    
    console.log('✅ Link token created successfully');
    res.json({ link_token: response.data.link_token });
    
  } catch (error) {
    console.error('❌ Error creating link token:', error);
    res.status(500).json({ 
      error: 'Failed to create link token',
      details: error.message 
    });
  }
});

// Exchange Public Token
app.post('/api/exchange_public_token', async (req, res) => {
  try {
    console.log('Exchanging public token...');
    
    const { public_token } = req.body;
    
    const response = await client.itemPublicTokenExchange({
      public_token: public_token,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;
    
    // Store access token (in production, store in database with user ID)
    accessTokens.set(itemId, {
      accessToken,
      itemId,
      createdAt: new Date(),
    });
    
    console.log('✅ Public token exchanged successfully');
    res.json({ 
      access_token: accessToken, 
      item_id: itemId 
    });
    
  } catch (error) {
    console.error('❌ Error exchanging public token:', error);
    res.status(500).json({ 
      error: 'Failed to exchange public token',
      details: error.message 
    });
  }
});

// Get Account Balances
app.post('/api/accounts', async (req, res) => {
  try {
    console.log('Fetching account balances...');
    
    const { access_token } = req.body;
    
    const response = await client.accountsGet({
      access_token: access_token,
    });

    const accounts = response.data.accounts.map(account => ({
      accountId: account.account_id,
      name: account.name,
      officialName: account.official_name,
      type: account.type,
      subtype: account.subtype,
      balance: {
        available: account.balances.available,
        current: account.balances.current,
        limit: account.balances.limit,
        currency: account.balances.iso_currency_code || 'USD'
      },
      mask: account.mask
    }));

    console.log(`✅ Retrieved ${accounts.length} accounts`);
    res.json({ accounts });
    
  } catch (error) {
    console.error('❌ Error fetching accounts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch accounts',
      details: error.message 
    });
  }
});

// Get Transactions
app.post('/api/transactions', async (req, res) => {
  try {
    console.log('Fetching transactions...');
    
    const { access_token, start_date, end_date } = req.body;
    
    const response = await client.transactionsGet({
      access_token: access_token,
      start_date: start_date || '2023-01-01',
      end_date: end_date || '2024-12-31',
      count: 100
    });

    const transactions = response.data.transactions.map(txn => ({
      transactionId: txn.transaction_id,
      accountId: txn.account_id,
      amount: txn.amount,
      date: txn.date,
      name: txn.name,
      merchantName: txn.merchant_name,
      category: txn.category,
      type: txn.amount > 0 ? 'debit' : 'credit',
      pending: txn.pending
    }));

    console.log(`✅ Retrieved ${transactions.length} transactions`);
    res.json({ transactions });
    
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transactions',
      details: error.message 
    });
  }
});

// Simulate Transfer (Sandbox Mode)
app.post('/api/simulate_transfer', async (req, res) => {
  try {
    console.log('Simulating transfer...');
    
    const { from_account_id, to_account_id, amount, description } = req.body;
    
    // In sandbox mode, we simulate the transfer
    const transfer = {
      transferId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromAccount: from_account_id,
      toAccount: to_account_id,
      amount: parseFloat(amount),
      status: 'completed',
      created: new Date(),
      description: description || 'AURA AI Transfer',
      network: 'ach_sandbox'
    };
    
    console.log('✅ Transfer simulated successfully');
    res.json({ transfer });
    
  } catch (error) {
    console.error('❌ Error simulating transfer:', error);
    res.status(500).json({ 
      error: 'Failed to simulate transfer',
      details: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.PLAID_ENV || 'sandbox'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AURA Plaid Backend Server running on port ${PORT}`);
  console.log(`🔗 Frontend should connect to: http://localhost:${PORT}`);
  console.log(`🏦 Plaid Environment: ${process.env.PLAID_ENV || 'sandbox'}`);
  
  // Validate environment variables
  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
    console.error('❌ Missing Plaid environment variables!');
    console.log('Required variables:');
    console.log('PLAID_CLIENT_ID=your_client_id');
    console.log('PLAID_SECRET=your_secret');
    console.log('PLAID_ENV=sandbox');
  } else {
    console.log('✅ Plaid environment variables loaded');
  }
});

module.exports = app;