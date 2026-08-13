import { prisma } from '../config/database';
import { signAccessToken } from '../utils/jwt';
import app from '../app';
import http from 'http';

async function runSecurityAudit() {
  console.log('🔒 Running Stage 13 Security Hardening Audit...\n');

  // Start temporary test server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(3099, resolve));

  const BASE_URL = 'http://localhost:3099/api/v1';
  let passed = 0;
  let failed = 0;

  async function assertStatus(
    name: string,
    method: string,
    url: string,
    expectedStatus: number,
    token?: string,
    body?: any,
  ) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}${url}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (res.status === expectedStatus) {
        console.log(`  ✅ PASSED: ${name} (Expected ${expectedStatus}, Got ${res.status})`);
        passed++;
      } else {
        console.error(`  ❌ FAILED: ${name} (Expected ${expectedStatus}, Got ${res.status})`);
        failed++;
      }
    } catch (err: any) {
      console.error(`  ❌ FAILED: ${name} (Error: ${err.message})`);
      failed++;
    }
  }

  // Fetch test users from DB
  const buyerUser = await prisma.user.findFirst({ where: { role: 'BUYER' } });
  const supplierUser = await prisma.user.findFirst({ where: { role: 'SUPPLIER' } });
  const staffUser = await prisma.user.findFirst({ where: { role: 'VERIFICATION_STAFF' } });
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  const buyerToken = buyerUser ? signAccessToken({ sub: buyerUser.id, role: buyerUser.role }) : '';
  const supplierToken = supplierUser ? signAccessToken({ sub: supplierUser.id, role: supplierUser.role }) : '';
  const staffToken = staffUser ? signAccessToken({ sub: staffUser.id, role: staffUser.role }) : '';
  const adminToken = adminUser ? signAccessToken({ sub: adminUser.id, role: adminUser.role }) : '';

  console.log('--- 1. Unauthenticated Access Protection ---');
  await assertStatus('Unauthenticated request to /auth/me', 'GET', '/auth/me', 401);
  await assertStatus('Unauthenticated request to /admin/users', 'GET', '/admin/users', 401);

  console.log('\n--- 2. RBAC Permission Matrix Audit ---');
  await assertStatus('BUYER accessing /admin/users', 'GET', '/admin/users', 403, buyerToken);
  await assertStatus('SUPPLIER accessing /admin/users', 'GET', '/admin/users', 403, supplierToken);
  await assertStatus('VERIFICATION_STAFF accessing /admin/users (Excluded)', 'GET', '/admin/users', 403, staffToken);
  await assertStatus('VERIFICATION_STAFF creating Category (Excluded)', 'POST', '/categories', 403, staffToken, { name: 'Forbidden Cat' });
  await assertStatus('VERIFICATION_STAFF viewing Verification Queue (Allowed)', 'GET', '/verification/queue', 200, staffToken);
  await assertStatus('ADMIN viewing /admin/users (Allowed)', 'GET', '/admin/users', 200, adminToken);

  console.log('\n--- 3. Role Escalation Prevention ---');
  await assertStatus('BUYER attempting supplier product creation', 'POST', '/products', 403, buyerToken, { name: 'Illegal Prod', categoryId: '123' });
  await assertStatus('SUPPLIER attempting supplier product creation (Allowed)', 'POST', '/products', 400, supplierToken, { name: 'Test' }); // 400 bad payload, but passed auth/role guard

  server.close();
  await prisma.$disconnect();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`🔒 Security Audit Complete: ${passed} Passed, ${failed} Failed`);
  console.log(`${'='.repeat(50)}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAudit();
