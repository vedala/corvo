import Store from "../store.js";
import CorvoTypeList from "../data_types/corvo_type_list.js";
import CorvoTypeListNode from "../data_types/corvo_type_list_node.js";
import MemoryTracker from "../memory_tracker";

describe("CorvoListNode", () => {
  it("exists as a class", () => {
    let testNode = new CorvoTypeListNode();
    expect(testNode.constructor).toBe(CorvoTypeListNode);
  });

  it("takes val argument", () => {
    const val = "My value";
    const key = "key";
    const testNode = new CorvoTypeListNode(val);
    expect(testNode.val).toBe(val);
  });

  it("takes all constructor arguments", () => {
    const val = "My value";
    const preceedingNode = new CorvoTypeListNode(null, null);
    const succeedingNode = new CorvoTypeListNode(null, null);
    const testNode = new CorvoTypeListNode(val, preceedingNode, succeedingNode);
    expect(testNode.val).toBe(val);
    expect(testNode.nextNode).toBe(succeedingNode);
    expect(testNode.prevNode).toBe(preceedingNode);
  });

  it("has null default constructor arguments", () => {
    const val = "My value";
    const testNode = new CorvoTypeListNode(val);
    expect(testNode.nextNode).toBe(null);
    expect(testNode.prevNode).toBe(null);
  });
});


describe("Store list", () => {
  const REFERENCE_SIZE_BYTES = 8;
  const STRING_ONE_CHAR_BYTES = 2;

  it("uses lpush to add item to end of list", () => {
    const testStore = new Store();
    const key = "mykey";
    const val = "value";
    testStore.lpush(key, val);

    expect(testStore.mainHash[key].type).toBe("list");
    expect(testStore.mainHash[key].val.tail.val).toBe(val);
  });

  it("uses lpush throw error when adding item to non list", () => {
    const testStore = new Store();
    const key = "mykey";
    const val = "value";
    testStore.setString(key, val);
    // const returnVal = testStore.lpush(key, val);

    expect(() => { testStore.lpush(key, val) }).toThrow(new Error("StoreError: value at key not a list."));
  });

  it("uses lpush to add two items to the list", () => {
    const testStore = new Store();
    const key = "mykey";
    const val1 = "value1";
    const val2 = "value2";
    testStore.lpush(key, val1);
    testStore.lpush(key, val2);
    expect(testStore.mainHash[key].type).toBe("list");
    expect(testStore.mainHash[key].val.head.val).toBe(val2);
    expect(testStore.mainHash[key].val.head.nextNode.val).toBe(val1);
  });

  it("uses rpush to throw error when adding item to end of non list", () => {
    const testStore = new Store();
    const key = "mykey";
    const val = "value";
    testStore.setString(key, val);
    expect(() => { testStore.rpush(key, val) }).toThrow(new Error("StoreError: value at key not a list."));
  });

  it("uses rpush to add two items to the list", () => {
    const testStore = new Store();
    const key = "mykey";
    const val1 = "value1";
    const val2 = "value2";
    testStore.rpush(key, val1);
    testStore.rpush(key, val2);

    expect(testStore.mainHash[key].type).toBe("list");
    expect(testStore.mainHash[key].val.head.val).toBe(val1);
    expect(testStore.mainHash[key].val.head.nextNode.val).toBe(val2);
  });

  it("uses rpush to add two items to the list in one invocation", () => {
    const testStore = new Store();
    const key = "mykey";
    const val1 = "value1";
    const val2 = "value2";
    testStore.rpush(key, val1, val2);
    expect(testStore.mainHash[key].type).toBe("list");
    expect(testStore.mainHash[key].val.head.val).toBe(val1);
    expect(testStore.mainHash[key].val.head.nextNode.val).toBe(val2);
  });

  it("uses lpop to pop the leftmost node and return the value", () => {
    const testStore = new Store();
    const keyA = "keyA";
    const valA = "some-valueA";
    const valB = "some-valueB";

    testStore.lpush(keyA, valA);
    testStore.lpush(keyA, valB);

    const result = testStore.lpop(keyA);

    expect(result).toBe(valB);
  });

  it("uses rpop to pop the rightmost node and return the value", () => {
    const testStore = new Store();
    const keyA = "keyA";
    const valA = "some-valueA";
    const valB = "some-valueB";

    testStore.lpush(keyA, valA);
    testStore.lpush(keyA, valB);

    const result = testStore.rpop(keyA);

    expect(result).toBe(valA);
  });

  it("uses lindex to retrieve a value from list", () => {
    const testStore = new Store();
    const key1 = "key-1";
    const val1 = "value-1";
    const val2 = "value-2";
    const val3 = "value-3";
    const val4 = "value-4";

    testStore.rpush(key1, val1);
    testStore.rpush(key1, val2);
    testStore.rpush(key1, val3);
    testStore.rpush(key1, val4);
    const result = testStore.lindex(key1, 1);
    expect(result).toBe(val2);
  });

  it("lindex returns null for a non-existent key", () => {
    const testStore = new Store();
    const key1 = "key-1";

    const result = testStore.lindex(key1, 10);
    expect(result).toBe(null);
  });

  it("lindex returns null for a list that exists but index is out of range", () => {
    const testStore = new Store();
    const key1 = "key-1";
    const val1 = "value-1";
    const val2 = "value-2";

    testStore.rpush(key1, val1);
    testStore.rpush(key1, val2);

    const result = testStore.lindex(key1, 10);
    expect(result).toBe(null);
  });

  it("lindex throws error when operation performed on a key that is not of list type", () => {
    const testStore = new Store();
    const key1 = "key-1";
    const val1 = "value-1";
    testStore.setString(key1, val1);

    expect(() => { testStore.lindex(key1, 0) }).toThrow(new Error("StoreError: value at key not a list."));
  });

  it("uses lindex to retrieve a value from list using negative index", () => {
    const testStore = new Store();
    const key1 = "key-1";
    const val1 = "value-1";
    const val2 = "value-2";
    const val3 = "value-3";
    const val4 = "value-4";

    testStore.rpush(key1, val1);
    testStore.rpush(key1, val2);
    testStore.rpush(key1, val3);
    testStore.rpush(key1, val4);

    const result = testStore.lindex(key1, -2);
    expect(result).toBe(val3);
  });

  it("lrem returns 0 for a non-existent key", () => {
    const testStore = new Store();
    const key1 = "key-1";
    const val1 = "value-1";

    const result = testStore.lrem(key1, 2, val1);
    expect(result).toBe(0);
  });

  it("uses lrem on a key with non-list value, throws error", () => {
    const testStore = new Store();
    const key1 = "key-1";
    const val1 = "value-1";
    testStore.setString(key1, val1);

    expect(() => { testStore.lrem(key1, 2, val1) }).toThrow(new Error("StoreError: value at key not a list."));
  });

  it("uses lrem to remove one element from a list", () => {
    const testStore = new Store();
    const key1 = "key-1";
    const val1 = "value-1";
    const val2 = "value-2";
    const val3 = "value-3";
    const val4 = "value-4";

    testStore.rpush(key1, val1);
    testStore.rpush(key1, val2);
    testStore.rpush(key1, val3);
    testStore.rpush(key1, val2);
    testStore.rpush(key1, val4);

    const result = testStore.lrem(key1, 1, val2);
    expect(result).toBe(1);
    const list = testStore.mainHash[key1].val.head;
    expect(list.val).toBe("value-1");
    expect(list.nextNode.val).toBe("value-3");
    expect(list.nextNode.nextNode.val).toBe("value-2");
    expect(list.nextNode.nextNode.nextNode.val).toBe("value-4");
    expect(list.nextNode.nextNode.nextNode.nextNode).toBe(null);
  });

  it("uses lrem to remove multiple elements from a list", () => {
    const testStore = new Store();
    const key1 = "key-1";
    const val1 = "value-1";
    const val2 = "value-2";
    const val3 = "value-3";
    const val4 = "value-4";

    testStore.rpush(key1, val1);
    testStore.rpush(key1, val2);
    testStore.rpush(key1, val3);
    testStore.rpush(key1, val2);
    testStore.rpush(key1, val4);
    testStore.rpush(key1, val2);

    const result = testStore.lrem(key1, 2, val2);
    expect(result).toBe(2);
    const list = testStore.mainHash[key1].val.head;
    expect(list.val).toBe("value-1");
    expect(list.nextNode.val).toBe("value-3");
    expect(list.nextNode.nextNode.val).toBe("value-4");
    expect(list.nextNode.nextNode.nextNode.val).toBe("value-2");
    expect(list.nextNode.nextNode.nextNode.nextNode).toBe(null);
  });

  it("uses lrem to remove one element from end of list", () => {
    const testStore = new Store();
    const key1 = "key-1";
    const val1 = "value-1";
    const val2 = "value-2";
    const val3 = "value-3";
    const val4 = "value-4";

    testStore.rpush(key1, val1);
    testStore.rpush(key1, val2);
    testStore.rpush(key1, val3);
    testStore.rpush(key1, val2);
    testStore.rpush(key1, val4);

    const result = testStore.lrem(key1, -1, val2);
    expect(result).toBe(1);
    const list = testStore.mainHash[key1].val.head;
    expect(list.val).toBe("value-1");
    expect(list.nextNode.val).toBe("value-2");
    expect(list.nextNode.nextNode.val).toBe("value-3");
    expect(list.nextNode.nextNode.nextNode.val).toBe("value-4");
    expect(list.nextNode.nextNode.nextNode.nextNode).toBe(null);
  });

  it("uses lrem to remove multiple elements from end of list", () => {
    const testStore = new Store();
    const key1 = "key-1";
    const val1 = "value-1";
    const val2 = "value-2";
    const val3 = "value-3";
    const val4 = "value-4";

    testStore.rpush(key1, val1);
    testStore.rpush(key1, val2);
    testStore.rpush(key1, val3);
    testStore.rpush(key1, val2);
    testStore.rpush(key1, val4);
    testStore.rpush(key1, val2);

    const result = testStore.lrem(key1, -2, val2);
    expect(result).toBe(2);
    const list = testStore.mainHash[key1].val.head;
    expect(list.val).toBe("value-1");
    expect(list.nextNode.val).toBe("value-2");
    expect(list.nextNode.nextNode.val).toBe("value-3");
    expect(list.nextNode.nextNode.nextNode.val).toBe("value-4");
    expect(list.nextNode.nextNode.nextNode.nextNode).toBe(null);
  });

  it("uses lrem to remove all elements matching a value from the list", () => {
    const testStore = new Store();
    const key1 = "key-1";
    const val1 = "value-1";
    const val2 = "value-2";
    const val3 = "value-3";
    const val4 = "value-4";

    testStore.rpush(key1, val1);
    testStore.rpush(key1, val2);
    testStore.rpush(key1, val3);
    testStore.rpush(key1, val2);
    testStore.rpush(key1, val4);
    testStore.rpush(key1, val2);

    const result = testStore.lrem(key1, 0, val2);
    expect(result).toBe(3);
    const list = testStore.mainHash[key1].val.head;
    expect(list.val).toBe("value-1");
    expect(list.nextNode.val).toBe("value-3");
    expect(list.nextNode.nextNode.val).toBe("value-4");
    expect(list.nextNode.nextNode.nextNode).toBe(null);
  });

  it("uses llen to return the length of the list stored at key", () => {
    const testStore = new Store();
    const key1 = "key-1";
    const val1 = "value-1";
    const val2 = "value-2";
    const val3 = "value-3";
    const val4 = "value-4";

    testStore.rpush(key1, val1);
    testStore.rpush(key1, val2);
    testStore.rpush(key1, val3);
    testStore.rpush(key1, val4);

    expect(testStore.llen(key1)).toBe(4);

  });

  it("uses llen to return 0 if the key does not exist", () => {
    const testStore = new Store();
    const key1 = "key-1";
    const key2 = "key-2";
    const val1 = "value-1";
    const val2 = "value-2";
    const val3 = "value-3";
    const val4 = "value-4";

    testStore.rpush(key1, val1);
    testStore.rpush(key1, val2);
    testStore.rpush(key1, val3);
    testStore.rpush(key1, val4);

    expect(testStore.llen(key2)).toBe(0);
  });

  it("uses llen to throw an error if the value stored at key is not a list", () => {

    const testStore = new Store();
    const key1 = "key-1";
    const key2 = "key-2";
    const val1 = "value-1";
    const val2 = "value-2";
    const val3 = "value-3";
    const val4 = "value-4";

    testStore.rpush(key1, val1);
    testStore.rpush(key1, val2);
    testStore.rpush(key1, val3);
    testStore.rpush(key1, val4);

    testStore.setString(key2, "val");

    expect(() => { testStore.llen(key2) }).toThrow(new Error("StoreError: value at key not a list."));
  });

  it ("uses linsertBefore to insert a value before the reference value pivot and return new length of list", () => {
    const testStore = new Store();

    const key1 = "key-1";
    const val1 = "value-1";
    const val2 = "value-2";
    const val3 = "value-3";
    const val4 = "value-4";

    testStore.rpush(key1, val1);
    testStore.rpush(key1, val2);
    testStore.rpush(key1, val3);
    testStore.rpush(key1, val4);

    expect(testStore.linsertBefore(key1, "value-3", "new-val")).toBe(5);
  });

  it("linsertBefore returns 0 when key does not exist", () => {

    const testStore = new Store();

    const key1 = "key-1";
    const key2 = "key-2";
    const val1 = "value-1";
    const val2 = "value-2";

    testStore.rpush(key1, val1);
    testStore.rpush(key1, val2);

    expect(testStore.linsertBefore(key2, "value-1", "new-val")).toBe(0);
  });

  it("linsertBefore throws error when the value stored at key is not a list", () => {
    const testStore = new Store();

    const key1 = "key-1";
    const key2 = "key-2";
    const val1 = "value-1";
    const val2 = "value-2";

    testStore.rpush(key1, val1);
    testStore.rpush(key1, val2);
    testStore.setString(key2, "val");

    expect(() => { testStore.linsertBefore(key2, "val", "new-val") }).toThrow(new Error("StoreError: value at key not a list."));
  });

  it("linsertBefore maintains existing state of the list", () => {
    const testStore = new Store();
    const key1 = "key-1";
    const val1 = "value-1";
    const val2 = "value-2";
    const val3 = "value-3";

    testStore.rpush(key1, val1);
    testStore.rpush(key1, val2);
    testStore.rpush(key1, val3);

    const result = testStore.linsertBefore(key1, val3, "new-val");
    expect(result).toBe(4);
    const list = testStore.mainHash[key1].val.head;
    expect(list.val).toBe("value-1");
    expect(list.nextNode.val).toBe("value-2");
    expect(list.nextNode.nextNode.val).toBe("new-val");
    expect(list.nextNode.nextNode.nextNode.val).toBe("value-3");
    expect(list.nextNode.nextNode.nextNode.nextNode).toBe(null);
  });

  it("linsertBefore maintains existing state of the list when inserting before head of list", () => {
    const testStore = new Store();
    const key1 = "key-1";
    const val1 = "value-1";
    const val2 = "value-2";

    testStore.rpush(key1, val1);
    testStore.rpush(key1, val2);

    const result = testStore.linsertBefore(key1, val1, "new-val");
    expect(result).toBe(3);
    const list = testStore.mainHash[key1].val.head;
    expect(list.val).toBe("new-val");
    expect(list.nextNode.val).toBe("value-1");
    expect(list.nextNode.nextNode.val).toBe("value-2");
    expect(list.nextNode.nextNode.nextNode).toBe(null);
  });

////// insertAfter tests
it ("uses linsertAfter to insert a value after the reference value pivot and return new length of list", () => {
  const testStore = new Store();

  const key1 = "key-1";
  const val1 = "value-1";
  const val2 = "value-2";
  const val3 = "value-3";
  const val4 = "value-4";

  testStore.rpush(key1, val1);
  testStore.rpush(key1, val2);
  testStore.rpush(key1, val3);
  testStore.rpush(key1, val4);

  expect(testStore.linsertAfter(key1, "value-3", "new-val")).toBe(5);
});

it("linsertAfter returns 0 when key does not exist", () => {

  const testStore = new Store();

  const key1 = "key-1";
  const key2 = "key-2";
  const val1 = "value-1";
  const val2 = "value-2";

  testStore.rpush(key1, val1);
  testStore.rpush(key1, val2);

  expect(testStore.linsertAfter(key2, "value-1", "new-val")).toBe(0);
});

it("linsertAfter throws error when the value stored at key is not a list", () => {
  const testStore = new Store();

  const key1 = "key-1";
  const key2 = "key-2";
  const val1 = "value-1";
  const val2 = "value-2";

  testStore.rpush(key1, val1);
  testStore.rpush(key1, val2);
  testStore.setString(key2, "val");

  expect(() => { testStore.linsertAfter(key2, "val", "new-val") }).toThrow(new Error("StoreError: value at key not a list."));
});

it("linsertAfter maintains existing state of the list", () => {
  const testStore = new Store();
  const key1 = "key-1";
  const val1 = "value-1";
  const val2 = "value-2";
  const val3 = "value-3";

  testStore.rpush(key1, val1);
  testStore.rpush(key1, val2);
  testStore.rpush(key1, val3);

  const result = testStore.linsertAfter(key1, val2, "new-val");
  expect(result).toBe(4);
  const list = testStore.mainHash[key1].val.head;
  expect(list.val).toBe("value-1");
  expect(list.nextNode.val).toBe("value-2");
  expect(list.nextNode.nextNode.val).toBe("new-val");
  expect(list.nextNode.nextNode.nextNode.val).toBe("value-3");
  expect(list.nextNode.nextNode.nextNode.nextNode).toBe(null);
});

it("linsertAfter maintains existing state of the list when inserting after tail of list", () => {
  const testStore = new Store();
  const key1 = "key-1";
  const val1 = "value-1";
  const val2 = "value-2";

  testStore.rpush(key1, val1);
  testStore.rpush(key1, val2);

  const result = testStore.linsertAfter(key1, val2, "new-val");
  expect(result).toBe(3);
  const list = testStore.mainHash[key1].val.head;
  expect(list.val).toBe("value-1");
  expect(list.nextNode.val).toBe("value-2");
  expect(list.nextNode.nextNode.val).toBe("new-val");
  expect(list.nextNode.nextNode.nextNode).toBe(null);
});

  it("lset throws error when operation performed on a non-existent key", () => {
    const testStore = new Store();
    const key1 = "key-1";
    const val1 = "value-1";

    expect(() => { testStore.lset(key1, 0, val1) }).toThrow(new Error("StoreError: no such key."));
  });

  it("lset throws error when operation performed on a key that is not of list type", () => {
    const testStore = new Store();
    const key1 = "key-1";
    const val1 = "value-1";
    testStore.setString(key1, val1);

    expect(() => { testStore.lset(key1, 0, val1) }).toThrow(new Error("StoreError: value at key not a list."));
  });

  it("lset throws error when operation performed on a index that is out of range", () => {
    const testStore = new Store();
    const key1 = "key-1";
    const val1 = "value-1";
    const val2 = "value-2";
    const val3 = "value-3";

    testStore.rpush(key1, val1);
    testStore.rpush(key1, val2);
    testStore.rpush(key1, val3);

    expect(() => { testStore.lset(key1, 5, "foo") }).toThrow(new Error("StoreError: index out of range."));
  });

  it("lset sets value of field to new value and returns OK", () => {
    const testStore = new Store();
    const key1 = "key-1";
    const val1 = "value-1";
    const val2 = "value-2";
    const val3 = "value-3";
    const updatedVal = "new-value";
    const idx = 1;

    testStore.rpush(key1, val1);
    testStore.rpush(key1, val2);
    testStore.rpush(key1, val3);

    expect(testStore.memoryTracker.memoryUsed).toBe(222);
    const returnVal = testStore.lset(key1, idx, updatedVal);
    expect(returnVal).toBe("OK");
    expect(testStore.lindex(key1, idx)).toBe(updatedVal);
    expect(testStore.memoryTracker.memoryUsed).toBe(226);
  });

  it("lset uses negative index to set value of field to new value and returns OK", () => {
    const testStore = new Store();
    const key1 = "key-1";
    const val1 = "value-1";
    const val2 = "value-2";
    const val3 = "value-3";
    const val4 = "value-4";
    const updatedVal = "new-value";
    const idx = -2;

    testStore.rpush(key1, val1);
    testStore.rpush(key1, val2);
    testStore.rpush(key1, val3);
    testStore.rpush(key1, val4);

    const returnVal = testStore.lset(key1, idx, updatedVal);
    expect(returnVal).toBe("OK");
    expect(testStore.lindex(key1, 2)).toBe(updatedVal);
  });
});
