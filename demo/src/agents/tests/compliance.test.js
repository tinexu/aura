const ComplianceAgent = require('../compliance');
const mockApplication = require('./mocks/sampleApplication.json');

(async () => {
  const agent = new ComplianceAgent();
  const result = await agent.performComplianceCheck(mockApplication, {});
  console.log(JSON.stringify(result, null, 2));
})();