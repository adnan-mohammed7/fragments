const request = require('supertest');

const app = require('../../src/app');
const hash = require('../../src/hash');

describe('POST /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).post('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).post('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result with a .fragment
  test('authenticated users can post a fragment', async () => {
    const fragmentData = "This is a fragment";

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(fragmentData);

    expect(postRes.statusCode).toBe(201);
    expect(postRes.headers).toHaveProperty('location');
    expect(postRes.body.status).toBe('ok');
    expect(typeof postRes.body.fragment.id).toBe('string');
    expect(postRes.body.fragment.ownerId).toBe(hash("user1@email.com"));
    expect(postRes.body.fragment.type).toBe('text/plain');
    expect(postRes.body.fragment.size).toBe(fragmentData.length);
  });

  test('Returns a location header', async () => {
    const fragmentData = "This is a fragment";

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(fragmentData);

    expect(postRes.statusCode).toBe(201);
    expect(postRes.headers).toHaveProperty('location');
  });

  test('rejects missing Content-Type header', async () => {
    const fragmentData = "This is a fragment";

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .send(fragmentData);

    expect(postRes.statusCode).toBe(415);
    expect(postRes.body.status).toBe('error');
    expect(postRes.body.error.code).toBe(415);
  });

  test('Rejects an unacceptable content-type', async () => {
    const fragmentData = "This is a fragment";

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'video/mp4')
      .send(fragmentData);

    expect(postRes.statusCode).toBe(415);
    expect(postRes.body.status).toBe('error');
    expect(postRes.body.error.code).toBe(415);
    expect(postRes.body.error.message).toBe('Invalid content-type. Received content type: video/mp4');
  });

  test('No data throws an error', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')

    expect(postRes.statusCode).toBe(400);
  });

});
