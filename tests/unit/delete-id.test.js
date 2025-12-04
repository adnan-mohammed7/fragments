const request = require('supertest');
const app = require('../../src/app');

describe('DELETE /v1/fragments/:id', () => {
  let fragmentId;

  beforeEach(async () => {
    const createRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('test data');

    expect(createRes.statusCode).toBe(201);
    fragmentId = createRes.body.fragment.id;
  });

  test('rejects unauthenticated requests', async () =>
    request(app).delete(`/v1/fragments/${fragmentId}`).expect(401)
  );

  test('rejects incorrect credentials', async () =>
    request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('invalid@email.com', 'wrong')
      .expect(401)
  );

  test('authenticated user can delete their own fragment', async () => {
    const deleteRes = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .send();

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.status).toBe('ok');

    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(404);
  });

  test('returns 404 for non-existent fragment ID', async () => {
    const res = await request(app)
      .delete('/v1/fragments/00000000-0000-0000-0000-000000000000')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(404);
    expect(res.body.error.message).toContain('Fragment with ID');
  });

  test('user cannot delete another user\'s fragment', async () => {
    const user1Res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('user1 data');

    const user1Id = user1Res.body.fragment.id;

    const deleteRes = await request(app)
      .delete(`/v1/fragments/${user1Id}`)
      .auth('user2@email.com', 'password2');

    expect(deleteRes.statusCode).toBe(404);
  });

  test('works with fragments of different types', async () => {
    const csvRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/csv')
      .send('name,age\nTest,25');

    const csvId = csvRes.body.fragment.id;

    const deleteRes = await request(app)
      .delete(`/v1/fragments/${csvId}`)
      .auth('user1@email.com', 'password1');

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.status).toBe('ok');
  });

  test('delete removes fragment from user\'s list', async () => {
    const frag1Res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('frag1');

    const frag2Res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('frag2');

    await request(app)
      .delete(`/v1/fragments/${frag1Res.body.fragment.id}`)
      .auth('user1@email.com', 'password1')
      .expect(200);

    const listRes = await request(app)
      .get('/v1/fragments')
      .auth('user1@email.com', 'password1');

    expect(listRes.body.fragments).toContain(frag2Res.body.fragment.id);
    expect(listRes.body.fragments).not.toContain(frag1Res.body.fragment.id);
  });

  test('multiple deletes of same fragment return 404 after first', async () => {
    await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .expect(200);

    const secondDelete = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(secondDelete.statusCode).toBe(404);
    expect(secondDelete.body.status).toBe('error');
    expect(secondDelete.body.error.code).toBe(404);
  });
});
