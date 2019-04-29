import ComponentManager from 'sn-components-api';
import DuplicateItem from "./DuplicateItem"

export default class BridgeManager {

  /* Singleton */
  static instance = null;
  static get() {
    if (this.instance == null) { this.instance = new BridgeManager(); }
    return this.instance;
  }

  constructor(onReceieveItems) {
    this.updateObservers = [];
    this.items = [];
    this.size = null;
  }

  addUpdateObserver(callback) {
    let observer = {id: Math.random, callback: callback};
    this.updateObservers.push(observer);
    return observer;
  }

  removeUpdateObserver(observer) {
    this.updateObservers.splice(this.updateObservers.indexOf(observer), 1);
  }

  initiateBridge(onReady) {
    this.componentManager = new ComponentManager([], () => {
      document.querySelector("html").classList.add(this.componentManager.platform);
      this.reloadScrollBars();
      onReady && onReady();
    });

    this.componentManager.setSize("content", "90%", "90%");
  }

  reloadScrollBars() {
    // For some reason, scrollbars don't update when the className for this.state.platform is set dynamically.
    // We're doing everything right, but on Chrome Windows, the scrollbars don't reload if adding className after
    // the page already loaded. So this seems to work in manually reloading.
    var container = document.querySelector("body");
    container.style.display = "none";
    setTimeout(() => {
      container.style.display = "block";
    }, 0);
  }

  getItemAppDataValue(item, key) {
    return this.componentManager.getItemAppDataValue(item, key);
  }

  getSelfComponentUUID() {
    return this.componentManager.getSelfComponentUUID();
  }

  didBeginStreaming() {
    return this._didBeginStreaming;
  }

  categorizedItems() {
    var types = {};
    for(var item of this.items) {
      var array = types[item.content_type];
      if(!array) {
        array = [];
        types[item.content_type] = array;
      }
      array.push(item);
    }
    return types;
  }

  beginStreamingItems() {
    this._didBeginStreaming = true;
    let contentTypes = [
      "Note", "Tag", "SN|SmartTag",
      "SN|Component", "SN|Theme", "SN|UserPreferences",
      "SF|Extension", "Extension", "SF|MFA", "SN|Editor",
      "SN|FileSafe|Credentials", "SN|FileSafe|FileMetadata", "SN|FileSafe|Integration"
    ];
    this.componentManager.streamItems(contentTypes, (items) => {
      for(var item of items) {

        item = new DuplicateItem(item);

        if(item.deleted) {
          this.removeItemFromItems(item);
          continue;
        }
        if(item.isMetadataUpdate) {
          continue;
        }

        var index = this.indexOfItem(item);
        if(index >= 0) {
          this.items[index] = item;
        } else {
          this.items.push(item);
        }
      }

      this.notifyObserversOfUpdate();
    });
  }

  createItems(items, callback) {
    for(var item of items) { item.uuid = null; }
    this.componentManager.createItems(items, (createdItems) => {
      callback(createdItems);
    })
  }

  indexOfItem(item) {
    for(var index in this.items) {
      if(this.items[index].uuid == item.uuid) {
        return index;
      }
    }
    return -1;
  }

  deleteItems(items, callback) {
    this.componentManager.deleteItems(items, callback);
  }

  removeItemFromItems(item) {
    this.items = this.items.filter((candidate) => {return candidate.uuid !== item.uuid});
  }

  notifyObserversOfUpdate() {
    for(var observer of this.updateObservers) {
      observer.callback();
    }
  }

  humanReadableTitleForExtensionType(type, pluralize) {
    let mapping = {
      "Note" : "Note",
      "Tag" : "Tag",
      "Extension" : "Action",
      "SF|Extension" : "Server Extension",
      "SN|Theme" : "Theme",
      "SN|Editor" : "Editor",
      "SN|Component" : "Component",
      "SN|FileSafe|Credentials": "FileSafe Credential",
      "SN|FileSafe|FileMetadata": "FileSafe File",
      "SN|FileSafe|Integration": "FileSafe Integration",
      "SN|SmartTag": "Smart Tag",
      "SN|UserPreferences": "User Preferences"
    }

    var value = mapping[type];
    if(!value) {
      value = type;
    }
    else if(pluralize) {
      value += "s";
    }
    return value;
  }
}
