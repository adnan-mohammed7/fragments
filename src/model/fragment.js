// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');

// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

class Fragment {
  constructor({ id = randomUUID(), ownerId, created = new Date().toISOString(), updated = new Date().toISOString(), type, size = 0 }) {
    if (!ownerId || !type) {
      throw new Error(`
        ownerId, and type are required. Received ownerId: ${ownerId}, and type: ${type}`);
    }
    if (!Fragment.isSupportedType(type)) {
      throw new Error(`
        Invalid type. Received type: ${type}`);
    }
    if (typeof (size) != "number" || isNaN(size)) {
      throw new Error(`
        Invalid size. Received size: ${size}`);
    }
    if (size < 0) {
      throw new Error(`
        size cannot be less than 0. Received size: ${size}`);
    }

    this.id = id;
    this.ownerId = ownerId;
    this.created = created;
    this.updated = updated;
    this.type = type;
    this.size = size;
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
    if (!ownerId || typeof (ownerId) != "string") {
      throw new Error(`Invalid ownerId. Received ownerId: ${ownerId}`)
    }
    if (expand) {
      let result = await listFragments(ownerId, expand)
      return result.map((serializedObject) => new Fragment(JSON.parse(serializedObject)));
    }
    return await listFragments(ownerId, expand);
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    if (!ownerId || typeof (ownerId) != "string" || !id) {
      throw new Error(`Invalid ownerId. Received ownerId: ${ownerId}, id: ${id}`)
    }
    const result = await readFragment(ownerId, id);
    if (!result) {
      throw new Error(`Invalid fragmentId. Received id: ${id}`)
    }
    return new Fragment(result)
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static async delete(ownerId, id) {
    if (!ownerId || typeof (ownerId) != "string" || !id) {
      throw new Error(`Invalid ownerId. Received ownerId: ${ownerId}, id: ${id}`)
    }
    return await deleteFragment(ownerId, id);
  }

  /**
   * Saves the current fragment (metadata) to the database
   * @returns Promise<void>
   */
  async save() {
    if (!this.id || !this.ownerId || !this.created || !this.updated || !this.type || this.size < 0) {
      throw new Error(`Missing fragment details. Received id: ${this.id},
         ownerId: ${this.ownerId}, created: ${this.created}, updated: ${this.updated},
         type: ${this.type}, size: ${this.size}`);
    }
    this.updated = new Date().toISOString();
    return await writeFragment(this);
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  getData() {
    return readFragmentData(this.ownerId, this.id);
  }

  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data) {
    if (!data) {
      throw new Error(`
        Invalid/no data. Received data: ${data}`);
    }
    this.size = data.length;
    this.updated = new Date().toISOString();
    await writeFragment(this);
    return await writeFragmentData(this.ownerId, this.id, data);
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    return this.mimeType.includes("text")
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    let convertibleTypes = [];
    switch (this.mimeType) {
      case "text/plain":
        convertibleTypes.push("text/plain");
        break;
      default: break;
    }
    return convertibleTypes;
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    let acceptedTypes = ["text/plain",
      "text/plain; charset=utf-8",
      //For later development
      /*
      Currently, only text/plain is supported. Others will be added later.

      `text/markdown`,
      `text/html`,
      `application/json`,
      `image/png`,
      `image/jpeg`,
      `image/webp`,
      `image/gif`,
      */
    ]

    return acceptedTypes.includes(value);
  }
}

module.exports.Fragment = Fragment;
