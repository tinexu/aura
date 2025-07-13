class ComplianceError extends Error {
    constructor(message, code = 'COMPLIANCE_ERROR') {
      super(message);
      this.name = 'ComplianceError';
      this.code = code;
    }
  }
  
  module.exports = { ComplianceError };