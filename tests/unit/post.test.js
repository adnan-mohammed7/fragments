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

  test('accepts text/plain with charset=utf-8 and returns correct size', async () => {
    const textData = "Hello, world!";
    const contentTypeHeader = 'text/plain; charset=utf-8';
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', contentTypeHeader)
      .send(textData);

    expect(postRes.statusCode).toBe(201);
    expect(postRes.body.status).toBe('ok');
    expect(postRes.body.fragment.type).toBe(contentTypeHeader);
    expect(postRes.body.fragment.size).toBe(Buffer.byteLength(textData));
  });

  test('accepts application/json fragment and returns correct size', async () => {
    const jsonData = JSON.stringify({ name: "Adnan" });
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(jsonData);

    expect(postRes.statusCode).toBe(201);
    expect(postRes.body.status).toBe('ok');
    expect(postRes.body.fragment.type).toBe('application/json');
    expect(postRes.body.fragment.size).toBe(Buffer.byteLength(jsonData));
  });

  test('accepts text/csv fragment', async () => {
    const csvData = 'name,age\nAdnan,22\nJohn,25';
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/csv')
      .send(csvData);

    expect(postRes.statusCode).toBe(201);
    expect(postRes.body.status).toBe('ok');
    expect(postRes.body.fragment.type).toBe('text/csv');
    expect(postRes.body.fragment.size).toBe(csvData.length);
  });

  test('accepts application/yaml fragment', async () => {
    const yamlData = 'name: Adnan\nage: 22\ncity: Toronto';
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/yaml')
      .send(yamlData);

    expect(postRes.statusCode).toBe(201);
    expect(postRes.body.status).toBe('ok');
    expect(postRes.body.fragment.type).toBe('application/yaml');
    expect(postRes.body.fragment.size).toBe(yamlData.length);
  });

  test('accepts image/png fragment', async () => {
    const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(pngData);

    expect(postRes.statusCode).toBe(201);
    expect(postRes.body.status).toBe('ok');
    expect(postRes.body.fragment.type).toBe('image/png');
    expect(postRes.body.fragment.size).toBe(pngData.length);
  });

  test('accepts image/jpeg fragment', async () => {
    const jpegData = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltTehW7mZ2j5I9n/9k=', 'base64');
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/jpeg')
      .send(jpegData);

    expect(postRes.statusCode).toBe(201);
    expect(postRes.body.status).toBe('ok');
    expect(postRes.body.fragment.type).toBe('image/jpeg');
    expect(postRes.body.fragment.size).toBe(jpegData.length);
  });

  test('accepts image/webp fragment', async () => {
    const webpData = Buffer.from('RIFF$WEBPVP8 l 8 ', 'ascii');
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/webp')
      .send(webpData);

    expect(postRes.statusCode).toBe(201);
    expect(postRes.body.status).toBe('ok');
    expect(postRes.body.fragment.type).toBe('image/webp');
    expect(postRes.body.fragment.size).toBe(webpData.length);
  });

  test('accepts image/avif fragment', async () => {
    const avifData = Buffer.from('ftypavif', 'ascii');
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/avif')
      .send(avifData);

    expect(postRes.statusCode).toBe(201);
    expect(postRes.body.status).toBe('ok');
    expect(postRes.body.fragment.type).toBe('image/avif');
    expect(postRes.body.fragment.size).toBe(avifData.length);
  });

  test('accepts image/gif fragment', async () => {
    const gifData = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xFF\xFF\xFF\x21\xF9\x04\x01\x00\x00\x00\x2C\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;');
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/gif')
      .send(gifData);

    expect(postRes.statusCode).toBe(201);
    expect(postRes.body.status).toBe('ok');
    expect(postRes.body.fragment.type).toBe('image/gif');
    expect(postRes.body.fragment.size).toBe(gifData.length);
  });
});
