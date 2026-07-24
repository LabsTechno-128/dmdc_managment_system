const fs = require('fs');
const files = [
  'apps/api/src/billing/billing.controller.ts',
  'apps/api/src/reports/reports.controller.ts',
  'apps/api/src/test-counter/test-counter.controller.ts',
  'apps/api/src/settings/settings.controller.ts',
  'apps/api/src/tests/tests.controller.ts',
  'apps/api/src/dashboard/dashboard.controller.ts'
];
for(const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/from '\.\.\/auth\/guards\/jwt-auth\.guard'/g, "from '../auth/jwt-auth.guard'");
  fs.writeFileSync(file, content, 'utf8');
}
console.log('Fixed imports');
