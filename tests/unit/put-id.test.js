const request = require('supertest');
const app = require('../../src/app');
const hash = require('../../src/hash');

describe('PUT /v1/fragments/:id', () => {
  let fragmentId;

  // Helper to create a test fragment first
  beforeEach(async () => {
    const createRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('original data');

    expect(createRes.statusCode).toBe(201);
    fragmentId = createRes.body.fragment.id;
  });

  test('rejects unauthenticated requests', async () =>
    request(app).put(`/v1/fragments/${fragmentId}`).expect(401)
  );

  test('authenticated user can update their own fragment with matching Content-Type', async () => {
    const updatedData = 'This is updated fragment data';

    const putRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(updatedData);

    expect(putRes.statusCode).toBe(200);
    expect(putRes.body.status).toBe('ok');
    expect(putRes.body.fragment.id).toBe(fragmentId);
    expect(putRes.body.fragment.ownerId).toBe(hash('user1@email.com'));
    expect(putRes.body.fragment.type).toBe('text/plain');
    expect(putRes.body.fragment.size).toBe(updatedData.length);
    expect(putRes.body.fragment.updated).not.toBe(putRes.body.fragment.created);
  });


  test('rejects incorrect credentials', async () =>
    request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('invalid@email.com', 'wrong')
      .expect(401)
  );

  test('returns 404 for non-existent fragment', async () => {
    const res = await request(app)
      .put('/v1/fragments/00000000-0000-0000-0000-000000000000')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('data');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(404);
  });

  test('rejects Content-Type mismatch', async () => {
    const res = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send('image data');

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(400);
    expect(res.body.error.message).toContain('Content-Type must match fragment type');
  });

  test('rejects unsupported Content-Type', async () => {
    const res = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'video/mp4')
      .send('data');

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(415);
  });

  test('rejects empty body', async () => {
    const res = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('');

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(400);
  });
});
