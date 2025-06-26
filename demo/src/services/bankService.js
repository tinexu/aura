import axios from 'axios';

export const connectPlaidAccount = async (publicToken) => {
  // Exchange public token for access token
  const response = await axios.post('/api/plaid/exchange', {
    public_token: publicToken
  });
  return response.data.access_token;
};

export const fetchAccountBalances = async (accessToken) => {
  const response = await axios.post('/api/plaid/accounts', {
    access_token: accessToken
  });
  return response.data.accounts;
};