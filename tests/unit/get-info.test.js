const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments/:id/info', () => {

  test('unauthenticated requests are denied', async () => {
    await request(app).get(`/v1/fragments/fdf71254-d217-4675-892c-a185a4f1c9b4/info`).expect(401);
  });

  test('incorrect credentials are denied', async () => {
    await request(app)
      .get(`/v1/fragments/fdf71254-d217-4675-892c-a185a4f1c9b4/info`)
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401);
  });

  test('successfully retrieves fragment metadata', async () => {
    const fragmentData = "This is a fragment";

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(fragmentData);

    const fragmentId = postRes.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toHaveProperty('id', fragmentId);
    expect(res.body.fragment).toHaveProperty('ownerId');
    expect(res.body.fragment).toHaveProperty('type');
    expect(res.body.fragment).toHaveProperty('size');
  });

  test('returns 404 if fragment does not exist', async () => {
    const fragmentId = "fdf71254-d217-4675-892c-a185a4f1c9b4";

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toMatch("not found");
  });
});
