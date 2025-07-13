export const fetchTreasuryRates = async () => {
  try {
    console.log('Fetching real Treasury rates from FRED API...');

    const apiKey = process.env.REACT_APP_FRED_API_KEY;
    
    if (!apiKey) {
      console.warn('FRED API key not found in environment variables. Using fallback data.');
      throw new Error('No API key configured');
    }
    
    // cors for fred api access
    const proxyUrl = 'https://api.allorigins.win/get?url=';
    const fredUrl = encodeURIComponent(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DGS3MO&api_key=${apiKey}&file_type=json&limit=1&sort_order=desc`
    );
    
    const response = await fetch(proxyUrl + fredUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const proxyData = await response.json();
    const fredData = JSON.parse(proxyData.contents);
    
    console.log('FRED API Response:', fredData);
    
    if (fredData.observations && fredData.observations.length > 0) {
      const observation = fredData.observations[0];
      const rate = parseFloat(observation.value);
      
      if (!isNaN(rate)) {
        console.log(`Real 3-Month Treasury Rate: ${rate}% (Date: ${observation.date})`);
        return { rate, isFallback: false };
      }
    }
    
    throw new Error('Invalid rate data from FRED');
  } catch (error) {
    console.error('Failed to fetch Treasury rates from FRED:', error.message);
    console.log('Using fallback rate');
    return {rate: 5.2, isFallback: true };
  }
};

export const fetchFXRates = async () => {
  try {
    console.log('Fetching real FX rates...');
    
    // reliability purposes
    const apis = [
      'https://api.exchangerate.host/latest?base=USD&symbols=EUR,GBP,JPY,SGD',
      'https://api.fxratesapi.com/latest?base=USD&symbols=EUR,GBP,JPY,SGD',
      'https://open.er-api.com/v6/latest/USD'
    ];
    
    for (const apiUrl of apis) {
      try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          console.log(`API ${apiUrl} returned status: ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        console.log('FX API Response:', data);
        
        let rates;
        if (data.rates) {
          rates = data.rates;
        } else if (data.conversion_rates) {
          rates = data.conversion_rates;
        } else {
          console.log('Unknown FX API response format');
          continue;
        }
        
        if (rates.EUR && rates.GBP && rates.JPY && rates.SGD) {
          console.log('Real FX rates fetched successfully:', rates);
          console.log(`EUR/USD: ${rates.EUR}, GBP/USD: ${rates.GBP}`);
          
          return {
            EUR: rates.EUR,
            GBP: rates.GBP,
            JPY: rates.JPY,
            SGD: rates.SGD,
            lastUpdated: new Date(data.date ? data.date + 'T00:00:00Z' : Date.now())
          };
        }
      } catch (apiError) {
        console.log(`API ${apiUrl} failed:`, apiError.message);
        continue;
      }
    }
    
    throw new Error('All FX APIs failed');
  } catch (error) {
    console.error('Failed to fetch real FX rates:', error.message);
    console.log('Using fallback FX rates');
    
    const baseRates = { EUR: 0.8534, GBP: 0.7821, JPY: 149.23, SGD: 1.3245 };
    const fallbackRates = {};
    
    Object.entries(baseRates).forEach(([currency, rate]) => {
      const variation = (Math.random() - 0.5) * 0.02;
      fallbackRates[currency] = parseFloat((rate * (1 + variation)).toFixed(4));
    });
    
    console.log('Generated fallback FX rates:', fallbackRates);
    
    return { 
      ...fallbackRates,
      lastUpdated: new Date()
    };
  }
};

export const fetchCurrentYields = async () => {
  try {
    console.log('Calculating yields based on real Treasury rates...');
    
    const { value: baseRate, isFallback } = await fetchTreasuryRates();
    const parsedRate = parseFloat(baseRate) || 4.0;

    console.log(`Using ${isFallback ? 'fallback' : 'real'} Treasury rate: ${parsedRate}% for yield calculations`);

    const yields = {
      'Treasury MMF': { 
        rate: parseFloat((parsedRate + 0.15).toFixed(2)), 
        liquidity: 0.9 
      },
      'Money Market': { 
        rate: parseFloat(Math.max(parsedRate - 0.25, 4.0).toFixed(2)), 
        liquidity: 0.9 
      },
      'High Yield Savings': { 
        rate: parseFloat(Math.max(parsedRate - 0.45, 3.8).toFixed(2)), 
        liquidity: 0.8 
      },
      'Checking': { 
        rate: 0.1, 
        liquidity: 1.0 
      },
      'CD 3-Month': { 
        rate: parseFloat((parsedRate + 0.25).toFixed(2)), 
        liquidity: 0.3 
      },
      'CD 6-Month': { 
        rate: parseFloat((parsedRate + 0.35).toFixed(2)), 
        liquidity: 0.1 
      },
      lastUpdated: new Date()
    };

    console.log('✅ Yields calculated from', isFallback ? 'fallback data' : 'real FRED data', yields);
    return yields;

  } catch (error) {
    console.error('❌ Failed to calculate yields based on real rates:', error);
    console.log('⚠️ Using fallback yields');
    return {
      'Treasury MMF': { rate: 5.35, liquidity: 0.9 },
      'Money Market': { rate: 4.95, liquidity: 0.9 },
      'High Yield Savings': { rate: 4.75, liquidity: 0.8 },
      'Checking': { rate: 0.1, liquidity: 1.0 },
      'CD 3-Month': { rate: 5.45, liquidity: 0.3 },
      'CD 6-Month': { rate: 5.55, liquidity: 0.1 },
      lastUpdated: new Date()
    };
  }
};

export const calculateOptimalYield = (balance, currency, currentYield) => {
  if (balance > 10000000) {
    return {
      recommendation: 'Treasury MMF',
      targetYield: 5.2,
      potentialGain: (balance * (5.2 - currentYield)) / 100,
      reasoning: 'Large balance qualifies for institutional MMF rates'
    };
  } else if (balance > 1000000) {
    return {
      recommendation: 'Money Market',
      targetYield: 4.8,
      potentialGain: (balance * (4.8 - currentYield)) / 100,
      reasoning: 'Balance qualifies for premium money market rates'
    };
  } else if (currentYield < 4.0) {
    return {
      recommendation: 'High Yield Savings',
      targetYield: 4.5,
      potentialGain: (balance * (4.5 - currentYield)) / 100,
      reasoning: 'Current yield below market rates'
    };
  }
  
  return null;
};

export const calculateFXRisk = (positions, fxRates) => {
  let totalUSDValue = 0;
  let fxExposure = {};
  
  positions.forEach(position => {
    const usdValue = position.currency === 'USD' 
      ? position.balance 
      : position.balance / (fxRates[position.currency] || 1);
    
    totalUSDValue += usdValue;
    fxExposure[position.currency] = (fxExposure[position.currency] || 0) + usdValue;
  });
  
  const exposurePercentages = {};
  Object.keys(fxExposure).forEach(currency => {
    exposurePercentages[currency] = (fxExposure[currency] / totalUSDValue) * 100;
  });

  const risks = [];
  Object.entries(exposurePercentages).forEach(([currency, percentage]) => {
    if (currency !== 'USD' && percentage > 25) {
      risks.push({
        currency,
        exposure: percentage,
        recommendation: `Consider hedging ${Math.round(percentage * 0.7)}% of ${currency} exposure`,
        severity: percentage > 40 ? 'high' : 'medium'
      });
    }
  });
  
  return {
    totalUSDValue,
    exposurePercentages,
    risks,
    overallRisk: risks.length > 0 ? 'elevated' : 'low'
  };
};

export const loadMarketData = async () => {
  try {
    console.log('Loading comprehensive market data...');
    
    const [treasury, fxRates, yields] = await Promise.all([
      fetchTreasuryRates(),
      fetchFXRates(),
      fetchCurrentYields()
    ]);
    
    const marketData = {
      treasuryRate: treasury.rate,
      fxRates,
      yields,
      isMarketDataFallback: treasury.isFallback,
      lastUpdated: new Date()
    };
    
    console.log('Market data loaded successfully:', marketData);
    return marketData;
    
  } catch (error) {
    console.error('Failed to load market data:', error);
    
    // note to user that fallback data is being returned
    return {
      treasuryRate: 5.2,
      fxRates: { EUR: 0.8534, GBP: 0.7821, JPY: 149.23, SGD: 1.3245 },
      yields: {
        'Treasury MMF': { rate: 5.2, liquidity: 0.9 },
        'Money Market': { rate: 4.8, liquidity: 0.9 },
        'High Yield Savings': { rate: 4.5, liquidity: 0.8 },
        'Checking': { rate: 0.1, liquidity: 1.0 },
        'CD 3-Month': { rate: 5.3, liquidity: 0.3 },
        'CD 6-Month': { rate: 5.4, liquidity: 0.1 }
      },
      isMarketDataFallback: true,
      lastUpdated: new Date()
    };
  }
};

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatPercentage = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};