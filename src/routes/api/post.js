const { Fragment } = require("../../model/fragment");
const { createSuccessResponse, createErrorResponse } = require("../../response");
const hash = require("../../hash");
const logger = require("../../logger");

module.exports = async (req, res) => {
  if (!Fragment.isSupportedType(req.headers["content-type"])) {
    logger.warn("Content type not supported");
    return res.status(415).json(createErrorResponse(415, `Invalid content-type. Received content type: ${req.headers["content-type"]}`));
  }

  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    logger.warn("Request body must be a non-empty buffer");
    return res.status(400).json(createErrorResponse(400, 'Request body must be a non-empty buffer'));
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

    await fragment.save();
    await fragment.setData(req.body);

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
