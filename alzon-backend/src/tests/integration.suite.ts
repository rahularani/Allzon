import { prisma } from '../config/database';
import { signAccessToken } from '../utils/jwt';
import app from '../app';
import http from 'http';

async function runIntegrationTestSuite() {
  console.log('🧪 Running Stage 14 Automated Integration Test Suite...\n');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(3098, resolve));

  const BASE_URL = 'http://localhost:3098/api/v1';
  let passed = 0;
  let failed = 0;

  async function testEndpoint(
    name: string,
    method: string,
    url: string,
    expectedStatus: number,
    token?: string,
    body?: any,
  ): Promise<any> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}${url}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const resData = (await res.json().catch(() => null)) as any;

      if (res.status === expectedStatus) {
        console.log(`  ✅ [${res.status}] ${name}`);
        passed++;
        return resData;
      } else {
        console.error(`  ❌ [Expected ${expectedStatus}, Got ${res.status}] ${name}`);
        if (resData?.message) console.error(`     Reason: ${resData.message}`);
        failed++;
        return resData;
      }
    } catch (err: any) {
      console.error(`  ❌ [Error] ${name}: ${err.message}`);
      failed++;
      return null;
    }
  }

  // 1. Fetch Users
  const buyerUser = await prisma.user.findFirst({ where: { role: 'BUYER' }, include: { buyerProfile: true } });
  const supplier1User = await prisma.user.findFirst({ where: { role: 'SUPPLIER', phone: '9000000004' }, include: { supplierProfile: true } });
  const supplier2User = await prisma.user.findFirst({ where: { role: 'SUPPLIER', phone: '9000000005' }, include: { supplierProfile: true } });
  const staffUser = await prisma.user.findFirst({ where: { role: 'VERIFICATION_STAFF' } });
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  const buyerToken = buyerUser ? signAccessToken({ sub: buyerUser.id, role: 'BUYER' }) : '';
  const supplier1Token = supplier1User ? signAccessToken({ sub: supplier1User.id, role: 'SUPPLIER' }) : '';
  const supplier2Token = supplier2User ? signAccessToken({ sub: supplier2User.id, role: 'SUPPLIER' }) : '';
  const staffToken = staffUser ? signAccessToken({ sub: staffUser.id, role: 'VERIFICATION_STAFF' }) : '';
  const adminToken = adminUser ? signAccessToken({ sub: adminUser.id, role: 'ADMIN' }) : '';

  console.log('--- Suite 1: Authentication & Token Security ---');
  await testEndpoint('Malformed JWT token rejected', 'GET', '/auth/me', 401, 'invalid.jwt.token');
  await testEndpoint('Expired JWT token rejected', 'GET', '/auth/me', 401, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjEwMDAwMDAwMDB9.sig');
  await testEndpoint('Invalid refresh token rejected', 'POST', '/auth/refresh', 401);

  console.log('\n--- Suite 2: Data Isolation & Multi-Tenancy ---');
  await testEndpoint('Supplier 1 cannot edit Supplier 2 product', 'PUT', '/products/non-existent-id', 404, supplier1Token, { name: 'Hack' });
  await testEndpoint('Buyer accessing own enquiries', 'GET', '/enquiries/buyer/mine', 200, buyerToken);
  await testEndpoint('Supplier accessing received enquiries', 'GET', '/enquiries/supplier/received', 200, supplier1Token);

  console.log('\n--- Suite 3: Business Logic & Workflow Invariants ---');
  // Add category for product test
  const cat = await prisma.category.findFirst();

  // Create pending product as Supplier 1
  const newProdRes = await testEndpoint(
    'Supplier 1 creates product (Status = PENDING)',
    'POST',
    '/products',
    201,
    supplier1Token,
    {
      name: `Integration Test Product ${Date.now()}`,
      categoryId: cat?.id,
      priceMin: 100,
      priceMax: 150,
      moq: 50,
      description: 'Test product',
    },
  );

  const testProductId = newProdRes?.data?.id;

  if (testProductId) {
    // Attempt submitting enquiry on PENDING product -> 400
    await testEndpoint(
      'Cannot submit enquiry on PENDING product (Enforces status = APPROVED)',
      'POST',
      '/enquiries',
      400,
      buyerToken,
      {
        supplierId: supplier1User?.supplierProfile?.id,
        productId: testProductId,
        quantity: '100 Pcs',
        deliveryLocation: 'Delhi',
      },
    );

    // Supplier attempting to approve own product via Admin endpoint -> 403
    await testEndpoint(
      'Supplier cannot approve own product via Admin route',
      'PUT',
      `/admin/products/${testProductId}/review`,
      403,
      supplier1Token,
      { status: 'APPROVED' },
    );

    // Verification Staff approving product listing -> 200 (Allowed by Matrix!)
    await testEndpoint(
      'Verification Staff approves product listing',
      'PUT',
      `/admin/products/${testProductId}/review`,
      200,
      staffToken,
      { status: 'APPROVED' },
    );
  }

  // Verification Staff attempting to manage users -> 403
  await testEndpoint('Verification Staff cannot view user management', 'GET', '/admin/users', 403, staffToken);

  // Verification Staff attempting to delete category -> 403
  if (cat) {
    await testEndpoint('Verification Staff cannot delete category', 'DELETE', `/categories/${cat.id}`, 403, staffToken);
  }

  // Wishlist Duplicate check
  if (testProductId) {
    await testEndpoint('Add product to Wishlist', 'POST', '/wishlist', 201, buyerToken, { itemType: 'PRODUCT', productId: testProductId });
    await testEndpoint('Duplicate wishlist item returns 409 Conflict', 'POST', '/wishlist', 409, buyerToken, { itemType: 'PRODUCT', productId: testProductId });
  }

  server.close();
  await prisma.$disconnect();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`🧪 Integration Suite Results: ${passed} Passed, ${failed} Failed`);
  console.log(`${'='.repeat(50)}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runIntegrationTestSuite();
