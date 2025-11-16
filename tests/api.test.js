const request = require('supertest');
const app = require('../src/server');
const db = require('../src/models');

let created = null;
let rawKey = null;

beforeAll(async () => {
  // ensure db is synced (server already called sync), but make sure clean state if needed
  await db.sequelize.sync({ force: true });
});

afterAll(async () => {
  await db.sequelize.close();
});

test('register returns api key', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'My Site', ownerEmail: 'me@example.com' })
    .expect(200);
  expect(res.body.appId).toBeDefined();
  expect(res.body.apiKey).toBeDefined();
  created = res.body.appId;
  rawKey = res.body.apiKey;
});

test('collect event with api key', async () => {
  const res = await request(app)
    .post('/api/analytics/collect')
    .set('x-api-key', rawKey)
    .send({
      event: 'login_form_cta_click',
      url: 'https://example.com',
      device: 'mobile',
      metadata: { userId: 'user1', browser: 'Chrome' }
    })
    .expect(201);
  expect(res.body.message).toBe('Event collected');
});

test('event summary returns counts', async () => {
  const res = await request(app)
    .get('/api/analytics/event-summary')
    .query({ event: 'login_form_cta_click', app_id: created })
    .expect(200);
  expect(res.body.event).toBe('login_form_cta_click');
  expect(res.body.count).toBeGreaterThanOrEqual(1);
});
