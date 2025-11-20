const hash = require('../../hash');
const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  const id = req.params.id;
  const hashedUserEmail = hash(req.user);

  try {
    const fragment = await Fragment.byId(hashedUserEmail, id);

    try {
      if (fragment != null) {
        await Fragment.delete(hashedUserEmail, id);
        return res.status(200).json(createSuccessResponse({ status: 'ok' }));
      }
    } catch (err) {
      logger.error({ err }, 'Error deleting fragment');
      return res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
    }
  } catch (err) {
    logger.error({ err }, `Error Finding Fragment with ID: ${id}`);
    return res.status(500).json(createErrorResponse(404, `Fragment with ID: ${id} not found`));
  }
};
