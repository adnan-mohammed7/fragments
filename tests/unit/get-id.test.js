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

  // Markdown-to-HTML conversion on GET /:id.html
  test('converts text/markdown fragment to HTML when requested with .html extension', async () => {
    const fragmentData = "This is a text/markdown fragment.";

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(fragmentData);

    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment.id}.html`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch("text/html");
    expect(res.text).toContain('<p>This is a text/markdown fragment.</p>');
  });

  // Unsupported conversion extension returns 415
  test('returns 415 for unsupported conversion extension', async () => {
    const fragmentData = "This is a text/markdown fragment";

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(fragmentData);

    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment.id}.png`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(415);
  });

  // Does not allow text/plain conversion to .html and returns an error
  test('returns 415 when trying to convert text/plain fragment to .html', async () => {
    const fragmentData = "Just some plain text";

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(fragmentData);

    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment.id}.html`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
  });

  test('markdown: original, .md, .html, .txt', async () => {
    const mdData = '# Adnan\n**bold**';

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(mdData);

    const id = postRes.body.fragment.id;

    const original = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');
    expect(original.statusCode).toBe(200);
    expect(original.headers['content-type']).toMatch(/text\/markdown/);
    expect(original.text).toBe(mdData);

    const mdRes = await request(app)
      .get(`/v1/fragments/${id}.md`)
      .auth('user1@email.com', 'password1');
    expect(mdRes.statusCode).toBe(200);
    expect(mdRes.headers['content-type']).toMatch(/text\/markdown/);
    expect(mdRes.text).toBe(mdData);

    const htmlRes = await request(app)
      .get(`/v1/fragments/${id}.html`)
      .auth('user1@email.com', 'password1');
    expect(htmlRes.statusCode).toBe(200);
    expect(htmlRes.headers['content-type']).toMatch(/text\/html/);
    expect(htmlRes.text).toContain('<h1>Adnan</h1>');
    expect(htmlRes.text).toContain('<strong>bold</strong>');

    const textRes = await request(app)
      .get(`/v1/fragments/${id}.txt`)
      .auth('user1@email.com', 'password1');
    expect(textRes.statusCode).toBe(200);
    expect(textRes.headers['content-type']).toMatch(/text\/plain/);
    expect(textRes.text).toBe(mdData);
  });

  test('html: original, .html, .txt', async () => {
    const html = '<h1>Hello</h1><p>World</p>';

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send(html);

    const id = postRes.body.fragment.id;

    const original = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');
    expect(original.statusCode).toBe(200);
    expect(original.headers['content-type']).toMatch(/text\/html/);
    expect(original.text).toBe(html);

    const htmlRes = await request(app)
      .get(`/v1/fragments/${id}.html`)
      .auth('user1@email.com', 'password1');
    expect(htmlRes.statusCode).toBe(200);
    expect(htmlRes.headers['content-type']).toMatch(/text\/html/);
    expect(htmlRes.text).toBe(html);

    const textRes = await request(app)
      .get(`/v1/fragments/${id}.txt`)
      .auth('user1@email.com', 'password1');
    expect(textRes.statusCode).toBe(200);
    expect(textRes.headers['content-type']).toMatch(/text\/plain/);
    expect(textRes.text).toBe(html);
  });

  test('csv: original, .csv, .txt, .json', async () => {
    const csv = 'name,age\nAlice,30\nBob,25';

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/csv')
      .send(csv);

    const id = postRes.body.fragment.id;

    const original = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');
    expect(original.statusCode).toBe(200);
    expect(original.headers['content-type']).toMatch(/text\/csv/);
    expect(original.text).toBe(csv);

    const csvRes = await request(app)
      .get(`/v1/fragments/${id}.csv`)
      .auth('user1@email.com', 'password1');
    expect(csvRes.statusCode).toBe(200);
    expect(csvRes.headers['content-type']).toMatch(/text\/csv/);
    expect(csvRes.text).toBe(csv);

    const textRes = await request(app)
      .get(`/v1/fragments/${id}.txt`)
      .auth('user1@email.com', 'password1');
    expect(textRes.statusCode).toBe(200);
    expect(textRes.headers['content-type']).toMatch(/text\/plain/);
    expect(textRes.text).toBe(csv);

    const jsonRes = await request(app)
      .get(`/v1/fragments/${id}.json`)
      .auth('user1@email.com', 'password1');
    expect(jsonRes.statusCode).toBe(200);
    expect(jsonRes.headers['content-type']).toMatch(/application\/json/);
    expect(JSON.parse(jsonRes.text)).toEqual([
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' },
    ]);
  });

  test('application/json: original, .json, .yaml, .yml, .txt', async () => {
    const obj = { name: 'Alice', age: 30 };
    const json = JSON.stringify(obj);

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(json);

    const id = postRes.body.fragment.id;

    const original = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');
    expect(original.statusCode).toBe(200);
    expect(original.headers['content-type']).toMatch(/application\/json/);
    expect(original.text).toBe(json);

    const jsonRes = await request(app)
      .get(`/v1/fragments/${id}.json`)
      .auth('user1@email.com', 'password1');
    expect(jsonRes.statusCode).toBe(200);
    expect(jsonRes.headers['content-type']).toMatch(/application\/json/);
    expect(JSON.parse(jsonRes.text)).toEqual(obj);

    const yamlRes = await request(app)
      .get(`/v1/fragments/${id}.yaml`)
      .auth('user1@email.com', 'password1');
    expect(yamlRes.statusCode).toBe(200);
    expect(yamlRes.headers['content-type']).toMatch(/application\/yaml/);
    expect(yamlRes.text).toContain('name: Alice');
    expect(yamlRes.text).toContain('age: 30');

    const ymlRes = await request(app)
      .get(`/v1/fragments/${id}.yml`)
      .auth('user1@email.com', 'password1');
    expect(ymlRes.statusCode).toBe(200);
    expect(ymlRes.headers['content-type']).toMatch(/application\/yaml/);
    expect(ymlRes.text).toContain('name: Alice');

    const textRes = await request(app)
      .get(`/v1/fragments/${id}.txt`)
      .auth('user1@email.com', 'password1');
    expect(textRes.statusCode).toBe(200);
    expect(textRes.headers['content-type']).toMatch(/text\/plain/);
    expect(textRes.text).toBe(json);
  });

  test('application/yaml: original, .yaml, .txt', async () => {
    const yamlText = 'name: Bob\nage: 25\ncity: Toronto';

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/yaml')
      .send(yamlText);

    const id = postRes.body.fragment.id;

    const original = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');
    expect(original.statusCode).toBe(200);
    expect(original.headers['content-type']).toMatch(/application\/yaml/);
    expect(original.text).toBe(yamlText);

    const yamlRes = await request(app)
      .get(`/v1/fragments/${id}.yaml`)
      .auth('user1@email.com', 'password1');
    expect(yamlRes.statusCode).toBe(200);
    expect(yamlRes.headers['content-type']).toMatch(/application\/yaml/);
    expect(yamlRes.text).toContain('name: Bob');
    expect(yamlRes.text).toContain('age: 25');
    expect(yamlRes.text).toContain('city: Toronto');

    const textRes = await request(app)
      .get(`/v1/fragments/${id}.txt`)
      .auth('user1@email.com', 'password1');
    expect(textRes.statusCode).toBe(200);
    expect(textRes.headers['content-type']).toMatch(/text\/plain/);
    expect(textRes.text).toBe(yamlText);
  });

  // Image conversion tests
  test('image/png: supports original, .png, .jpg, .webp, .gif, .avif', async () => {
    const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(pngData);

    expect(postRes.statusCode).toBe(201);
    const id = postRes.body.fragment.id;

    const extensions = ['.png', '.jpg', '.webp', '.gif', '.avif'];
    const expectedTypes = {
      '.png': /image\/png/,
      '.jpg': /image\/jpeg/,
      '.webp': /image\/webp/,
      '.gif': /image\/gif/,
      '.avif': /image\/avif/
    };

    const original = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');
    expect(original.statusCode).toBe(200);
    expect(original.headers['content-type']).toMatch(/image\/png/);

    // All conversions
    for (const ext of extensions) {
      const res = await request(app)
        .get(`/v1/fragments/${id}${ext}`)
        .auth('user1@email.com', 'password1');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(expectedTypes[ext]);
    }
  });

  test('image/jpeg: supports original, .png, .jpg, .webp, .gif, .avif', async () => {
    const jpgData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/jpeg')
      .send(jpgData);

    expect(postRes.statusCode).toBe(201);
    const id = postRes.body.fragment.id;

    const extensions = ['.png', '.jpg', '.webp', '.gif', '.avif'];
    const expectedTypes = {
      '.png': /image\/png/,
      '.jpg': /image\/jpeg/,
      '.webp': /image\/webp/,
      '.gif': /image\/gif/,
      '.avif': /image\/avif/
    };

    const original = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');
    expect(original.statusCode).toBe(200);
    expect(original.headers['content-type']).toMatch(/image\/jpeg/);

    for (const ext of extensions) {
      const res = await request(app)
        .get(`/v1/fragments/${id}${ext}`)
        .auth('user1@email.com', 'password1');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(expectedTypes[ext]);
    }
  });

  test('image/webp: supports original, .png, .jpg, .webp, .gif, .avif', async () => {
    const webpData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/webp')
      .send(webpData);

    expect(postRes.statusCode).toBe(201);
    const id = postRes.body.fragment.id;

    const extensions = ['.png', '.jpg', '.webp', '.gif', '.avif'];
    const expectedTypes = {
      '.png': /image\/png/,
      '.jpg': /image\/jpeg/,
      '.webp': /image\/webp/,
      '.gif': /image\/gif/,
      '.avif': /image\/avif/
    };

    const original = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');
    expect(original.statusCode).toBe(200);
    expect(original.headers['content-type']).toMatch(/image\/webp/);

    for (const ext of extensions) {
      const res = await request(app)
        .get(`/v1/fragments/${id}${ext}`)
        .auth('user1@email.com', 'password1');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(expectedTypes[ext]);
    }
  });

  test('image/gif: supports original, .png, .jpg, .webp, .gif, .avif', async () => {
    const gifData = Buffer.from('R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=', 'base64');

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/gif')
      .send(gifData);

    expect(postRes.statusCode).toBe(201);
    const id = postRes.body.fragment.id;

    const extensions = ['.png', '.jpg', '.webp', '.gif', '.avif'];
    const expectedTypes = {
      '.png': /image\/png/,
      '.jpg': /image\/jpeg/,
      '.webp': /image\/webp/,
      '.gif': /image\/gif/,
      '.avif': /image\/avif/
    };

    const original = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');
    expect(original.statusCode).toBe(200);
    expect(original.headers['content-type']).toMatch(/image\/gif/);

    for (const ext of extensions) {
      const res = await request(app)
        .get(`/v1/fragments/${id}${ext}`)
        .auth('user1@email.com', 'password1');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(expectedTypes[ext]);
    }
  });

  test('image/avif: supports original, .png, .jpg, .webp, .gif, .avif', async () => {
    const avifData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/avif')
      .send(avifData);

    expect(postRes.statusCode).toBe(201);
    const id = postRes.body.fragment.id;

    const extensions = ['.png', '.jpg', '.webp', '.gif', '.avif'];
    const expectedTypes = {
      '.png': /image\/png/,
      '.jpg': /image\/jpeg/,
      '.webp': /image\/webp/,
      '.gif': /image\/gif/,
      '.avif': /image\/avif/
    };

    const original = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');
    expect(original.statusCode).toBe(200);
    expect(original.headers['content-type']).toMatch(/image\/avif/);

    for (const ext of extensions) {
      const res = await request(app)
        .get(`/v1/fragments/${id}${ext}`)
        .auth('user1@email.com', 'password1');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(expectedTypes[ext]);
    }
  });

  test('image conversion: rejects unsupported extensions', async () => {
    const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(pngData);

    const id = postRes.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${id}.pdf`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(415);
  });
});
