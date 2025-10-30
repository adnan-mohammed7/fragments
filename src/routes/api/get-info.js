const hash = require("../../hash");
const { Fragment } = require("../../model/fragment");
const { createErrorResponse, createSuccessResponse } = require("../../response");
const logger = require("../../logger");

module.exports = async (req, res) => {
  const id = req.params.id;
  const ownerId = hash(req.user);

  try {
    const fragment = await Fragment.byId(ownerId, id);
    logger.info({ user: ownerId, fragmentId: id }, 'Fragment metadata retrieved');
    return res.status(200).json(createSuccessResponse({ fragment }));
  } catch (err) {
    logger.warn({ err, user: ownerId, fragmentId: id }, 'Fragment metadata not found');
    return res.status(404).json(createErrorResponse(404, `Fragment with id ${id} not found`));
  }
};
