import CorvoLinkedList from './corvo_linked_list';
import CorvoNode from './corvo_node';
import CorvoListNode from './data_types/corvo_list_node';
import MemoryTracker from './memory_tracker';
const DEFAULT_MAX_MEMORY = 104857600; // equals 100MB

class Store {
  constructor(options={maxMemory: DEFAULT_MAX_MEMORY}) {
    this.mainHash = {};
    this.mainList = new CorvoLinkedList();

    this.memoryTracker = new MemoryTracker(options.maxMemory);
  }

  setString(key, value) {
    const accessedNode = this.mainHash[key];

    if (accessedNode === undefined) {
      const newNode = new CorvoNode(key, value);
      this.mainHash[key] = newNode;
      this.mainList.append(newNode);
      this.memoryTracker.incrementMemoryUsed(key, value);
    } else {
      const oldValue = accessedNode.val;
      accessedNode.val = value;
      this.memoryTracker.updateMemoryUsed(key, oldValue, value);
      this.touch(accessedNode);
    }
    this.lruCheckAndEvictToMaxMemory();
    return "OK";
  }

  setStringX(key, value) {
    // only writes if already exists; otherwise, return null
    const accessedNode = this.mainHash[key];

    if (accessedNode === undefined) {
      return null;
    }
    const oldValue = accessedNode.val;
    accessedNode.val = value;
    this.memoryTracker.updateMemoryUsed(key, oldValue, value);
    this.touch(accessedNode);
    this.lruCheckAndEvictToMaxMemory();
    return "OK";
  }

  setStringNX(key, value) {
    // only writes if doesn't exist; otherwise return null
    const accessedNode = this.mainHash[key];

    if (accessedNode !== undefined) {
      return null;
    }
    const newNode = new CorvoNode(key, value);
    this.mainHash[key] = newNode;
    this.mainList.append(newNode);
    this.memoryTracker.incrementMemoryUsed(key, value);
    this.lruCheckAndEvictToMaxMemory();
    return "OK";
  }

  getString(key) {
    const accessedNode = this.mainHash[key];
    if (accessedNode === undefined) {
      return null;
    }

    const returnValue = accessedNode.val;
    this.touch(key);
    return returnValue;
  }

  appendString(key, valueToAppend) {
    const accessedNode = this.mainHash[key];
    if (accessedNode === undefined) {
      return null;
    }

    this.touch(key);
    const oldValue = accessedNode.val;
    accessedNode.val += valueToAppend;
    this.memoryTracker.updateMemoryUsed(key, oldValue, accessedNode.val);

    this.lruCheckAndEvictToMaxMemory();
    return accessedNode.val.length;
  }

  touch(...keys) {
    let validKeys = 0;
    keys.forEach((key) => {
      const accessedNode = this.mainHash[key];
      if (accessedNode !== undefined) {
        validKeys += 1;
        this.mainList.remove(accessedNode);
        this.mainList.append(accessedNode);
      }
    });
    return validKeys;
  }

  getStrLen(key) {
    // strlen should return an error if the value is not a string
    const accessedNode = this.mainHash[key];
    if (accessedNode !== undefined) {
      return accessedNode.val.length;
    }
    return 0;
  }

  strIncr(key) {
    // should we touch if val not number as string?
    function isNumberString(strInput) {
      return ((parseInt(strInput)).toString() === strInput);
    }

    let accessedNode = this.mainHash[key];

    if (accessedNode === undefined) {
      this.setString(key, '0');
      accessedNode = this.mainHash[key];
    } else if (!isNumberString(accessedNode.val)) {
      return null;
    }

    const oldValue = accessedNode.val;
    accessedNode.val = (parseInt(accessedNode.val, 10) + 1).toString();
    this.memoryTracker.updateMemoryUsed(key, oldValue, accessedNode.val);
    this.touch(accessedNode);

    this.lruCheckAndEvictToMaxMemory();
    return parseInt(accessedNode.val, 10);
  }

  strDecr(key) {
    function isNumberString(strInput) {
      return ((parseInt(strInput)).toString() === strInput);
    }

    let accessedNode = this.mainHash[key];

    if (accessedNode === undefined) {
      this.setString(key, '0');
      accessedNode = this.mainHash[key];
    } else if (!isNumberString(accessedNode.val)) {
      return null;
    }

    const oldValue = accessedNode.val;
    accessedNode.val = (parseInt(accessedNode.val, 10) - 1).toString();
    this.memoryTracker.updateMemoryUsed(key, oldValue, accessedNode.val);
    this.touch(accessedNode);

    this.lruCheckAndEvictToMaxMemory();
    return parseInt(accessedNode.val, 10);
  }

  exists(key) {
    return !!this.mainHash[key];
  }

  type(key) {
    // alter after dataType prop added to corvoNode
    return this.mainHash[key].type;
  }

  rename(keyA, keyB) {
    // alter after dataType prop and multiple data types added
    if (!this.exists(keyA)) {
      return null;
    }

    const val = this.mainHash[keyA].val;
    const keyADataType = this.mainHash[keyA].type;

    if (keyADataType === 'string') {
      this.setString(keyB, val);
    } else if (keyADataType === 'list') {
      const newMainListNode = new CorvoNode(keyA, val, "list");
      this.mainList.append(newMainListNode);
      this.mainList[keyB] = newMainListNode;
    }

    this.del(keyA);
    return "OK";
  }

  renameNX(keyA, keyB) {
    const keyAExists = !!this.mainHash[keyA];
    const keyBExists = !!this.mainHash[keyB];

    if (keyAExists) {
      if (keyBExists) {
        return 0;
      } else {
        this.rename(keyA, keyB);
        return 1;
      }
    } else {
      return null;
    }
  }

  del(...keys) {
    let numDeleted = 0;

    keys.forEach((key) => {
      const node = this.mainHash[key];
      if (node !== undefined) {
        const val = node.val;
        this.memoryTracker.decrementMemoryUsed(key, val);
        delete this.mainHash[key];
        this.mainList.remove(node);
        numDeleted += 1;
      }
    });

    return numDeleted;
  }

  lruEvict() {
    const head = this.mainList.head;
    const headKey = head.key;

    this.mainList.remove(head);
    const currentVal = this.mainHash[headKey];
    delete this.mainHash[headKey];
    this.memoryTracker.decrementMemoryUsed(headKey, currentVal);
  }

  lruCheckAndEvictToMaxMemory() {
    while (this.memoryTracker.maxMemoryExceeded()) {
      this.lruEvict();
    }
  }

  lpush(key, val) {
    const nodeAtKey = this.mainHash[key];
    if (nodeAtKey && nodeAtKey.type === "list") {
      nodeAtKey.val.append(new CorvoListNode(val));
    } else if (nodeAtKey && nodeAtKey.type !== "list") {
      return null;
    } else {
      // create new linked list at that key
      // add node to mainList
      // add key to mainHash
      // add value to "list" linked list
      const newListNode = this.createListNode(key);
      newListNode.val.append(new CorvoListNode(val));
      this.mainHash[key] = newListNode;
      this.mainList.append(newListNode);
    }
  }

  createListNode(key) {
    const newList = new CorvoLinkedList();
    const newNode = new CorvoNode(key, newList, "list", null, null);
    return newNode;
  }
}

export default Store;
