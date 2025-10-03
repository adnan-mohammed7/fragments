// src/routes/api/get.js

const hash = require("../../hash");
const logger = require("../../logger");
const { Fragment } = require("../../model/fragment");
const { createSuccessResponse, createErrorResponse } = require("../../response");

/**
 * Get a list of fragments for the current user
 */
module.exports = async (req, res) => {
  try {
    const expand = req.query.expand == 1;
    const hashedEmail = hash(req.user);
    let fragments;

    logger.info({ expand }, 'Fetching fragment list for a user');

    try {
      fragments = await Fragment.byUser(hashedEmail, expand);
    } catch (err) {
      logger.error({ err, user: hashedEmail, expand: expand }, 'Error fetching fragment list for a user');
      return res.status(500).json(createErrorResponse(500, 'Unable to retrieve fragments'));
    }

    logger.debug({ user: hashedEmail, expand: expand, count: fragments.length }, 'Fragments retrieved');

    res.status(200).json(createSuccessResponse({ fragments: fragments }));
  } catch (err) {
    logger.error({ err }, 'Get: Unexpected error in fetching fragments by user');
    res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
  }
};
