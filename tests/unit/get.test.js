// tests/unit/get.test.js

const request = require('supertest');

const app = require('../../src/app');

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result with a .fragments array
  test('authenticated users get a fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

  test('authenticated users gets a fragments array regardless of any fragment exist or not', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

  test('authenticated users gets an empty fragments array if no fragments exist', async () => {
    const res = await request(app).get('/v1/fragments').auth('user2@email.com', 'password2');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
    expect(res.body.fragments).toEqual([])
  });

  test('authenticated users gets a fragment ids array stored using put()', async () => {
    const fragmentData = "This is a fragment";

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(fragmentData);

    const secondPostRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(fragmentData);

    const getRes = await request(app)
      .get('/v1/fragments')
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(Array.isArray(getRes.body.fragments)).toBe(true);
    expect(getRes.body.fragments).toContain(postRes.body.fragment.id);
    expect(getRes.body.fragments).toContain(secondPostRes.body.fragment.id);
  });

  test('authenticated users gets a fragments array stored using put()', async () => {
    const fragmentData = "This is a fragment";

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(fragmentData);

    const secondPostRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(fragmentData);

    const getRes = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(Array.isArray(getRes.body.fragments)).toBe(true);

    const fragment1 = getRes.body.fragments.find(f => f.id === postRes.body.fragment.id);
    const fragment2 = getRes.body.fragments.find(f => f.id === secondPostRes.body.fragment.id);

    expect(fragment1).toEqual(postRes.body.fragment);
    expect(fragment2).toEqual(secondPostRes.body.fragment);
  });

  test('authenticated users gets a fragment ids array if query expand is any random value', async () => {
    const fragmentData = "This is a fragment";

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(fragmentData);

    const getRes = await request(app)
      .get('/v1/fragments?expand=2')
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(Array.isArray(getRes.body.fragments)).toBe(true);

    expect(getRes.body.fragments).toContain(postRes.body.fragment.id);
  });

  test('authenticated users gets a fragment ids array if query expand is 0', async () => {
    const fragmentData = "This is a fragment";

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(fragmentData);

    const getRes = await request(app)
      .get('/v1/fragments?expand=0')
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(Array.isArray(getRes.body.fragments)).toBe(true);

    expect(getRes.body.fragments).toContain(postRes.body.fragment.id);
  });

  test("Fragments belonging to user are only returned for requested user", async () => {
    const fragmentData = "This is a fragment";

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(fragmentData);

    const secondPostRes = await request(app)
      .post('/v1/fragments')
      .auth('user2@email.com', 'password2')
      .set('Content-Type', 'text/plain')
      .send(fragmentData);

    const getRes = await request(app)
      .get('/v1/fragments?expand=2')
      .auth('user2@email.com', 'password2');

    expect(getRes.statusCode).toBe(200);
    expect(Array.isArray(getRes.body.fragments)).toBe(true);

    expect(getRes.body.fragments).toContain(secondPostRes.body.fragment.id);
    expect(getRes.body.fragments).not.toContain(postRes.body.fragment.id);
  });
});
