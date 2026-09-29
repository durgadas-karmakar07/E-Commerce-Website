import { describe, it, expect } from 'vitest';

const BASE_URL = 'http://127.0.0.1:5000/api';

describe('AURA E-Commerce Live Server End-to-End API Integration', () => {
  let customerToken: string;
  let adminToken: string;
  let testProductId: string;
  let testOrderId: string;

  it('1. should register and authenticate customer user', async () => {
    const email = `test.shopper.${Date.now()}@example.com`;
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aakash Verma',
        email,
        password: 'Password@123',
        phone: '+919988776655',
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.token).toBeDefined();
    customerToken = body.token;
  });

  it('2. should authenticate admin user with admin role', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@aura.store',
        password: 'Admin@123456',
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.user.role).toBe('admin');
    adminToken = body.token;
  });

  it('3. should retrieve active categories and products', async () => {
    const catRes = await fetch(`${BASE_URL}/categories`);
    const catBody = await catRes.json();
    expect(catRes.status).toBe(200);
    expect(catBody.success).toBe(true);
    expect(catBody.categories.length).toBeGreaterThan(0);

    const prodRes = await fetch(`${BASE_URL}/products?limit=5`);
    const prodBody = await prodRes.json();
    expect(prodRes.status).toBe(200);
    expect(prodBody.success).toBe(true);
    expect(prodBody.products.length).toBeGreaterThan(0);
    testProductId = prodBody.products[0]._id;
  });

  it('4. should manage cart operations', async () => {
    const addRes = await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        productId: testProductId,
        quantity: 2,
      }),
    });

    const addBody = await addRes.json();
    expect(addRes.status).toBe(200);
    expect(addBody.success).toBe(true);

    const cartRes = await fetch(`${BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const cartBody = await cartRes.json();
    expect(cartRes.status).toBe(200);
    expect(cartBody.cart.items.length).toBe(1);
    expect(cartBody.cart.subtotal).toBeGreaterThan(0);
  });

  it('5. should validate promotional coupon WELCOME10', async () => {
    const res = await fetch(`${BASE_URL}/coupons/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        code: 'WELCOME10',
        orderAmount: 2000,
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.coupon.discountAmount).toBe(200);
  });

  it('6. should place an order with server-verified demo payment', async () => {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        shippingAddress: {
          name: 'Aakash Verma',
          phone: '+91 9988776655',
          street: '12 Brigade Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
        paymentMethod: 'demo',
        couponCode: 'WELCOME10',
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.order.orderNumber).toBeDefined();
    expect(body.order.orderStatus).toBe('confirmed');
    testOrderId = body.order._id;
  });

  it('7. should validate state machine: confirmed -> processing -> packed -> shipped', async () => {
    // 1. confirmed -> processing
    const p1 = await fetch(`${BASE_URL}/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'processing',
        note: 'Order processing in warehouse',
      }),
    });
    expect(p1.status).toBe(200);

    // 2. processing -> packed
    const p2 = await fetch(`${BASE_URL}/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'packed',
        note: 'Order packaged securely with tamper-evident seal',
      }),
    });
    expect(p2.status).toBe(200);

    // 3. packed -> shipped with tracking details
    const res = await fetch(`${BASE_URL}/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'shipped',
        deliveryPartner: 'BlueDart Logistics',
        trackingId: 'BLUEDART-E2E-999',
        note: 'Dispatched from central warehouse hub',
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.order.orderStatus).toBe('shipped');
    expect(body.order.tracking.trackingId).toBe('BLUEDART-E2E-999');
    expect(body.order.tracking.deliveryPartner).toBe('BlueDart Logistics');
  });

  it('8. should calculate real database-driven admin KPIs', async () => {
    const res = await fetch(`${BASE_URL}/analytics/kpis`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.kpis.totalRevenue).toBeGreaterThan(0);
    expect(body.kpis.totalOrders).toBeGreaterThan(0);
    expect(body.kpis.totalProducts).toBeGreaterThan(0);
    expect(body.kpis.websiteHealth).toBe('Healthy');
  });

  it('9. should generate CSV export report for accounting', async () => {
    const res = await fetch(`${BASE_URL}/reports/export?type=sales`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    const text = await res.text();
    expect(text).toContain('Order ID');
  });

  it('10. should report comprehensive system health telemetry', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.overallStatus).toBe('Healthy');
    expect(body.components.length).toBeGreaterThan(0);
  });
});
