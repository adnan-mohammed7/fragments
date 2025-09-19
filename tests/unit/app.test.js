// tests/unit/app.test.js

const request = require('supertest');

const app = require('../../src/app');

describe('/notfound App 404 middleware handler', () => {
  test('404 ', () => request(app).get('/notfound').expect(404));
});
