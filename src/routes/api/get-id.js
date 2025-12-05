// src/routes/api/get-id.js
const path = require('node:path');
const hash = require("../../hash");
const logger = require("../../logger");
const { Fragment } = require("../../model/fragment");
const { createErrorResponse } = require("../../response");
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();
const sharp = require('sharp');
const yaml = require('js-yaml');

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

  const contentTypeMap = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.html': 'text/html',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.yaml': 'application/yaml',
    '.yml': 'application/yaml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.avif': 'image/avif'
  };

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

  if (!ext) {
    logger.debug({ user: hashedEmail, fragmentId: id }, 'fragment data retrieved');
    return res.status(200).set('Content-Type', fragment.mimeType).send(data);
  }

  const targetExt = ext.toLowerCase();
  const targetType = contentTypeMap[targetExt];
  const isSupported = fragment.formats.includes(targetType);

  if (!isSupported) {
    logger.warn({ fragmentType: fragment.mimeType, fragmentId: id, requestedExt: targetExt, supportedFormats: fragment.formats },
      'Unsupported format conversion');
    return res.status(415).json(createErrorResponse(415, `Cannot convert ${fragment.mimeType} to ${targetExt}`));
  }

  try {
    let convertedData;
    const targetType = contentTypeMap[targetExt];

    if (fragment.isText || fragment.mimeType.startsWith('application/')) {
      const text = data.toString('utf-8');

      switch (targetExt) {
        case '.html':
          if (fragment.mimeType === 'text/markdown') {
            convertedData = md.render(text);
          } else {
            convertedData = text;
          }
          break;

        case '.json':
          if (fragment.mimeType === 'text/csv') {
            const lines = text.trim().replace(/\\n/g, '\n').split('\n');
            if (lines.length < 2) {
              convertedData = JSON.stringify(JSON.parse(text));
              break;
            }
            const headers = lines[0].split(',').map(heading => heading.trim());
            const rows = lines.slice(1).map(row => {
              const values = row.split(',').map(value => value.trim());
              return headers.reduce((obj, header, i) => {
                obj[header] = values[i] || '';
                return obj;
              }, {});
            });
            convertedData = JSON.stringify(rows);
          } else {
            convertedData = JSON.stringify(JSON.parse(text));
          }
          break;

        case '.yaml':
          if (fragment.mimeType === 'application/json') {
            convertedData = yaml.dump(JSON.parse(text));
          } else if (fragment.mimeType === 'application/yaml') {
            const obj = yaml.load(text);
            convertedData = yaml.dump(obj);
          }
          break;

        case '.yml':
          convertedData = yaml.dump(JSON.parse(text));
          break;

        case '.txt':
          convertedData = text;
          break;

        default:
          convertedData = text;
      }

      logger.info({ fragmentId: id, from: fragment.mimeType, to: targetType }, 'Conversion Completed');
      return res.status(200)
        .set('Content-Type', targetType)
        .send(convertedData);
    }

    if (fragment.mimeType.startsWith('image/')) {
      const sharpImg = sharp(data);

      switch (targetExt) {
        case '.png': convertedData = await sharpImg.png().toBuffer(); break;
        case '.jpg': convertedData = await sharpImg.jpeg().toBuffer(); break;
        case '.webp': convertedData = await sharpImg.webp().toBuffer(); break;
        case '.gif': convertedData = await sharpImg.gif().toBuffer(); break;
        case '.avif': convertedData = await sharpImg.avif().toBuffer(); break;
        default: convertedData = data;
      }

      logger.info({ fragmentId: id, from: fragment.mimeType, to: targetType }, 'Image converted with sharp');
      return res.status(200)
        .set('Content-Type', targetType)
        .send(convertedData);
    }

  } catch (err) {
    logger.error({ err, fragmentId: id }, 'Conversion failed');
    return res.status(500).json(createErrorResponse(500, 'Conversion failed'));
  }
};
