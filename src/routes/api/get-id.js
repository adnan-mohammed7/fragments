// src/routes/api/get-id.js
const path = require('node:path');
const hash = require("../../hash");
const logger = require("../../logger");
const { Fragment } = require("../../model/fragment");
const { createErrorResponse } = require("../../response");
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

/**
 * Get a fragment by id for the current authenticated user
 */
module.exports = async (req, res) => {
  const idWithExtension = req.params.id;
  const ext = path.extname(idWithExtension);
  const id = ext ? idWithExtension.slice(0, -ext.length) : idWithExtension;
  const hashedEmail = hash(req.user);
  let data = null;
  let fragment = null;
  const acceptedExtensions = ['', '.html'];

  logger.info({ fragmentId: id }, 'Fetching fragment by id');

  try {
    fragment = await Fragment.byId(hashedEmail, id);
  } catch (err) {
    logger.warn({ err, user: hashedEmail, fragmentId: id }, 'Fragment not found');
    return res.status(404).json(createErrorResponse(404, `Fragment with id ${id} not found`));
  }

  try {
    data = await fragment.getData();
  } catch (err) {
    logger.error({ err, user: hashedEmail, fragmentId: id }, 'Error fetching fragment data');
    return res.status(500).json(createErrorResponse(500, 'Error fetching fragment data'));
  }

  if (!acceptedExtensions.includes(ext)) {
    logger.warn({ ext, user: hashedEmail, fragmentId: id }, `Unsupported extension requested`);
    return res.status(415).json(createErrorResponse(415, `Unsupported extension: ${ext}`));
  }

  if (ext == '.html') {
    if (fragment.mimeType == 'text/markdown') {
      const dataString = data.toString('utf8');
      const result = md.render(dataString);
      logger.info({ user: hashedEmail, fragmentId: id }, 'Converted markdown fragment to HTML');
      res.status(200).set('Content-Type', 'text/html').send(result);
    } else {
      logger.warn({ user: hashedEmail, fragmentId: id, mimeType: fragment.mimeType }, 'Cannot convert fragment type to HTML');
      res.status(415).json(createErrorResponse(415, `Cannot convert fragment type ${fragment.mimeType} to HTML`));
    }
  }

  logger.debug({ user: hashedEmail, fragmentId: id }, 'fragment data retrieved');
  res.status(200).set("Content-type", fragment.mimeType).send(data);
};
