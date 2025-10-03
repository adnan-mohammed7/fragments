const { Fragment } = require("../../model/fragment");
const { createSuccessResponse, createErrorResponse } = require("../../response");
const hash = require("../../hash");
const logger = require("../../logger");

module.exports = async (req, res) => {
  if (!Buffer.isBuffer(req.body)) {
    logger.warn("Request body is not a buffer");
    return res.status(400).json(createErrorResponse(400, 'Request body must be a buffer'));
  }

  let fragment = null;

  try {
    logger.info("Creating a Fragment instance");

    const hashedUserEmail = hash(req.user);

    try {
      fragment = new Fragment({
        ownerId: hashedUserEmail,
        type: req.headers['content-type']
      });
    } catch (err) {
      logger.error({ err }, 'Post: Error creating Fragment instance');
      return res.status(400).json(createErrorResponse(400, `Error creating Fragment instance`));
    }

    try {
      await fragment.save();
    } catch (err) {
      logger.error({ err, fragmentId: fragment.id }, 'Error saving fragment metadata');
      return res.status(500).json(createErrorResponse(500, 'Failed to save fragment metadata'));
    }

    try {
      await fragment.setData(req.body);
    } catch (err) {
      logger.error({ err, fragmentId: fragment.id }, 'Error saving fragment data');
      return res.status(500).json(createErrorResponse(500, 'Failed to save fragment data'));
    }

    logger.info("Fragment instance saved in DB");

    const baseUrl = process.env.API_URL || `https://${req.headers.host}`;
    const fragmentUrl = new URL(`/v1/fragments/${fragment.id}`, baseUrl).toString();

    logger.debug({ fragmentUrl: fragmentUrl }, `Fragment instance with data successfully created`)

    res.status(201)
      .set('Location', fragmentUrl)
      .json(createSuccessResponse({ fragment }));

  } catch (err) {
    logger.error({ err }, "Error creating fragment");
    res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
  }
};
