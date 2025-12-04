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

  try {
    const hashedUserEmail = hash(req.user);
    const fragmentId = req.params.id;

    logger.info({ fragmentId, user: hashedUserEmail }, "Attempting to update fragment");

    let fragment;
    try {
      fragment = await Fragment.byId(hashedUserEmail, fragmentId);
    } catch (err) {
      logger.warn({ fragmentId, user: hashedUserEmail, err }, "Fragment not found");
      return res.status(404).json(createErrorResponse(404, `Fragment not found`));
    }

    if (req.headers["content-type"] !== fragment.type) {
      logger.warn({
        fragmentId,
        user: hashedUserEmail,
        expectedType: fragment.type,
        receivedType: req.headers["content-type"]
      }, "Content-Type mismatch");
      return res.status(400).json(createErrorResponse(400, `Content-Type must match fragment type. Expected: ${fragment.type}, received: ${req.headers["content-type"]}`));
    }

    await fragment.setData(req.body);

    logger.info({ fragmentId, user: hashedUserEmail, newSize: fragment.size }, "Fragment successfully updated");

    res.status(200).json(createSuccessResponse({ fragment }));

  } catch (err) {
    logger.error({ err, fragmentId: req.params.id }, "Error updating fragment");
    res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
  }
};
