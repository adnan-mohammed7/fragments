// src/routes/api/get-id.js
const path = require('node:path');
const hash = require("../../hash");
const logger = require("../../logger");
const { Fragment } = require("../../model/fragment");
const { createErrorResponse } = require("../../response");

/**
 * Get a fragment by id for the current authenticated user
 */
module.exports = async (req, res) => {
  try {
    const idWithExtension = req.params.id;
    const ext = path.extname(idWithExtension);
    const id = ext ? idWithExtension.slice(0, -ext.length) : idWithExtension;
    const hashedEmail = hash(req.user);
    let data = null;
    let fragment = null;

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

    logger.debug({ user: hashedEmail, fragmentId: id }, 'fragment data retrieved');
    res.status(200).set("Content-type", fragment.mimeType).send(data);
  } catch (err) {
    logger.error({ err }, 'Get-id: Unexpected error occurred in fetching fragment');
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
