// tests/unit/get.test.js

const request = require('supertest');

const app = require('../../src/app');

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', async () => {
    const fragmentData = "This is a fragment";

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(fragmentData);

    await request(app).get(`/v1/fragments/${postRes.body.fragment.id}`).expect(401)
  });

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', async () => {
    const fragmentData = "This is a fragment";

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(fragmentData);

    await request(app).get(`/v1/fragments/${postRes.body.fragment.id}`).auth('invalid@email.com', 'incorrect_password').expect(401)
  });

  // Using a valid username/password pair should give a success result with a .fragments array
  test('authenticated user gets the requested fragment ', async () => {
    const fragmentData = "This is a fragment";

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(fragmentData);

    const res = await request(app).get(`/v1/fragments/${postRes.body.fragment.id}`).auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe(fragmentData)
  });

  test('Rejects if the fragment does not exist ', async () => {
    const fragmentData = "This is a fragment";

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(fragmentData);

    const res = await request(app).get(`/v1/fragments/${postRes.body.fragment.id}65666`).auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
  });

  test('Rejects if the fragment does not belong to the user', async () => {
    const fragmentData = "This is a fragment";

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(fragmentData);

    const res = await request(app).get(`/v1/fragments/${postRes.body.fragment.id}65666`).auth('user2@email.com', 'password2');
    expect(res.statusCode).toBe(404);
  });
});
