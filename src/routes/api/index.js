// src/routes/api/index.js

/**
 * The main entry-point for the v1 version of the fragments API.
 */
const express = require('express');

// Create a router on which to mount our API endpoints
const router = express.Router();

const { Fragment } = require("../../model/fragment");
const contentType = require("content-type");
const logger = require('../../logger');

// Define our first route, which will be: GET /v1/fragments
router.get('/fragments', require('./get'));
// Other routes (POST, DELETE, etc.) will go here later on...

// Get a fragment by ID, which will be: GET /v1/fragments/:id
router.get('/fragments/:id', require('./get-id'));

// Support sending various Content-Types on the body up to 5M in size
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      try {
        // See if we can parse this content type. If we can, `req.body` will be
        // a Buffer (e.g., `Buffer.isBuffer(req.body) === true`). If not, `req.body`
        // will be equal to an empty Object `{}` and `Buffer.isBuffer(req.body) === false`
        const { type } = contentType.parse(req);
        const result = Fragment.isSupportedType(type);
        if (!result) {
          logger.error(`Content-type not supported: Received type: ${type}`)
        }
        return result;
      } catch (err) {
        logger.error({ err }, `Failed to parse Content-Type header`);
        return false;
      }
    },
  });

// Use a raw body parser for POST, which will give a `Buffer` Object or `{}` at `req.body`
// You can use Buffer.isBuffer(req.body) to test if it was parsed by the raw body parser.
router.post('/fragments', rawBody(), require('./post'));

module.exports = router;
