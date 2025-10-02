const { writeFragment, writeFragmentData, readFragment, readFragmentData } = require("../../src/model/data/index")

describe('memory-test', () => {
  let fragmentObj;

  // Each test will get its own fragment object
  beforeEach(() => {
    fragmentObj = {
      id: "abc",
      ownerId: "123",
      created: "30-09-2025",
      updated: "30-09-2025",
      type: "text/plain",
      size: 2
    }
  });

  test('writeFragment() returns undefined', async () => {
    const result = await writeFragment(fragmentObj);
    expect(result).toBe(undefined);
  });

  test('readFragment() is able to retrieve what is stored using writeFragment()', async () => {
    fragmentObj.ownerId = "abd";
    fragmentObj.id = "124";
    await writeFragment(fragmentObj);
    const result = await readFragment(fragmentObj.ownerId, fragmentObj.id);
    expect(result).toEqual(fragmentObj);
  });

  test('readFragment() is able to return parsed object', async () => {
    fragmentObj.ownerId = "abe";
    fragmentObj.id = "125";
    await writeFragment(fragmentObj);
    const result = await readFragment(fragmentObj.ownerId, fragmentObj.id);
    expect(typeof result).toBe('object');
  });

  test('readFragment() returns undefined for fragment object that does not exist', async () => {
    const result = await readFragment("000", "000");
    expect(result).toBe(undefined);
  });

  test('writeFragmentData(ownerId, id, object) returns undefined', async () => {
    const data = [1, 2, 3];
    const result = await writeFragmentData("abf", "126", data);
    expect(result).toBe(undefined);
  });

  test('writeFragmentData(ownerId, id, buffer) returns undefined', async () => {
    const data = Buffer.from([1, 2, 3]);
    const result = await writeFragmentData("abg", "127", data);
    expect(result).toBe(undefined);
  });

  test('readFragmentData() is able to retrieve what is stored using writeFragmentData()', async () => {
    const data = "This is a string";
    await writeFragmentData("abh", "128", data);
    const result = await readFragmentData("abh", "128");
    expect(result).toEqual(data);
  });

  test('readFragmentData() returns undefined for non existent data', async () => {
    const result = await readFragmentData("zzz", "zzz");
    expect(result).toBe(undefined);
  });

  test('writeFragment() throws error for no arguments', async () => {
    expect(async () => await writeFragment()).rejects.toThrow();
  });

  test('writeFragment() throws error for no id', async () => {
    let invalidFragment = {
      ownerId: "zzz",
      created: "30-09-2025",
      updated: "30-09-2025",
      type: "text/plain",
      size: 2
    }
    expect(async () => await writeFragment(invalidFragment)).rejects.toThrow();
  });

  test('writeFragment() throws error for non-string id', async () => {
    let invalidFragment = {
      id: 123,
      ownerId: "zzz",
      created: "30-09-2025",
      updated: "30-09-2025",
      type: "text/plain",
      size: 2
    }
    expect(async () => await writeFragment(invalidFragment)).rejects.toThrow();
  });

  test('writeFragment() throws error for no ownerId', async () => {
    let invalidFragment = {
      id: "zzz",
      created: "30-09-2025",
      updated: "30-09-2025",
      type: "text/plain",
      size: 2
    }
    expect(async () => await writeFragment(invalidFragment)).rejects.toThrow();
  });

  test('writeFragment() throws error for non-string ownerId', async () => {
    let invalidFragment = {
      id: "zzz",
      ownerId: 123,
      created: "30-09-2025",
      updated: "30-09-2025",
      type: "text/plain",
      size: 2
    }
    expect(async () => await writeFragment(invalidFragment)).rejects.toThrow();
  });

  test('readFragment() throws error for no arguments', async () => {
    expect(async () => await readFragment()).rejects.toThrow();
  });

  test('readFragment() throws error for no id', async () => {
    let invalidFragment = {
      ownerId: "zzz",
      created: "30-09-2025",
      updated: "30-09-2025",
      type: "text/plain",
      size: 2
    }
    expect(async () => await readFragment(invalidFragment.ownerId)).rejects.toThrow();
  });

  test('readFragment() throws error for non-string id', async () => {
    let invalidFragment = {
      id: 123,
      ownerId: "zzz",
      created: "30-09-2025",
      updated: "30-09-2025",
      type: "text/plain",
      size: 2
    }
    expect(async () => await readFragment(invalidFragment.ownerId, invalidFragment.id)).rejects.toThrow();
  });

  test('readFragment() throws error for no ownerId', async () => {
    let invalidFragment = {
      id: "zzz",
      created: "30-09-2025",
      updated: "30-09-2025",
      type: "text/plain",
      size: 2
    }
    expect(async () => await writeFragment(invalidFragment.id)).rejects.toThrow();
  });

  test('readFragment() throws error for non-string ownerId', async () => {
    let invalidFragment = {
      id: "zzz",
      ownerId: 123,
      created: "30-09-2025",
      updated: "30-09-2025",
      type: "text/plain",
      size: 2
    }
    expect(async () => await writeFragment(invalidFragment.ownerId, invalidFragment.id)).rejects.toThrow();
  });

  test('writeFragmentData() throws error for no arguments', async () => {
    expect(async () => await writeFragmentData()).rejects.toThrow();
  });

  test('writeFragmentData() throws error for no id/ownerId', async () => {
    let data = [1, 2, 3];
    expect(async () => await writeFragmentData("abcd", data)).rejects.toThrow();
  });

  test('writeFragmentData() throws error for non-string id', async () => {
    let data = [1, 2, 3];
    expect(async () => await writeFragmentData("abcd", 123, data)).rejects.toThrow();
  });

  test('writeFragmentData() throws error for non-string ownerId', async () => {
    let data = [1, 2, 3];
    expect(async () => await writeFragmentData(123, "abcd", data)).rejects.toThrow();
  });

  test('readFragmentData() throws error for no arguments', async () => {
    expect(async () => await readFragmentData()).rejects.toThrow();
  });

  test('readFragmentData() throws error for no ownerId/Id', async () => {
    expect(async () => await readFragmentData("abcd")).rejects.toThrow();
  });

  test('readFragmentData() throws error for non-string id', async () => {
    expect(async () => await readFragmentData("abcd", 1234)).rejects.toThrow();
  });

  test('readFragmentData() throws error for non-string ownerId', async () => {
    expect(async () => await writeFragmentData(1234, "abcd")).rejects.toThrow();
  });
})
