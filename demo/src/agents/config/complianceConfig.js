module.exports = {
    kycThresholds: {
      pass: 75,
      conditional: 50
    },
    aml: {
      structuringThreshold: 10000,
      maxRiskScore: 0.5
    },
    geographyRisk: {
      highRiskCountries: ['Country1', 'Country2']
    }
  };