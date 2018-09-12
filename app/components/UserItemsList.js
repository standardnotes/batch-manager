import React from 'react';
import BridgeManager from "../lib/BridgeManager.js";
import {BaseItemsList, ItemsTable} from "./BaseItemsList";

export default class UserItemsList extends BaseItemsList {

  constructor(props) {
    super(props);
  }

  componentWillReceiveProps(nextProps) {
    super.componentWillReceiveProps(nextProps);
    this.setState({duplicatesMode: false, duplicates: null});
  }

  deleteSelected() {
    BridgeManager.get().deleteItems(this.state.selectedItems, (response) => {
      var deleted = response.deleted;
      if(deleted) {
        for(var item of this.props.items) { item.selected = false; }
        this.setState({selectedItems: [], selectState: false});
      }
    });
  }

  cleanDuplicates() {
    var toDelete = [];
    for(var duplicateList of this.state.duplicates) {
      toDelete = toDelete.concat(duplicateList.slice(1, duplicateList.length));
    }
    BridgeManager.get().deleteItems(toDelete);
    this.setState({duplicatesMode: false, duplicates: null});
  }

  toggleDuplicates() {
    if(this.state.duplicatesMode) {
      this.setState({duplicatesMode: false})
      return;
    }

    this.setState({scanningDuplicates: true, selectedItems: []});

    const omitKeys = (obj, keys) => {
      var dup = {};
      for(var key in obj) {
        if(keys.indexOf(key) == -1) {
          dup[key] = obj[key];
        }
      }
      return dup;
    }

    const areDuplicates = (a, b) => {
      if(a == b) {
        return false;
      }

      if(a.content_type !== b.content_type) {
        return false;
      }

      return a.isItemContentEqualWith(b);
    }

    let items = this.props.items;
    var master = [];
    var trackingList = [];
    var itemsLength = items.length;
    var _index1, _index2;

    let completion = () => {
      this.setState({duplicates: master, duplicatesMode: true, scanningDuplicates: false});
    }

    var finished = false;

    for(let [index1, item1] of items.entries()) {
      setTimeout(function () {
        _index1 = index1;

        if(trackingList.indexOf(item1) === -1) {
          var current = [item1];
          trackingList.push(item1);

          // Begin Inner Loop
          for(let [index2, item2] of items.entries()) {
            _index2 = index2;
            if(item1 != item2) {
              var isDuplicate = areDuplicates(item1, item2);
              if(isDuplicate) {
                trackingList.push(item2);
                current.push(item2);
              }
            }
          }
          // End Inner Loop

          if(current.length > 1) {
            master.push(current);
          }
        }

        if((_index1 == itemsLength - 1) && (_index2 == itemsLength - 1)) {
          // Done
          completion();
        }
      }, 10);

    }
    // End Outer Loop
  }

  render() {
    let selectedCount = this.state.selectedItems.length;
    var itemGroups = this.state.duplicatesMode ? this.state.duplicates : [this.props.items];

    return (
      <div className="panel-section">

        <div className="panel-row">
          <div className="context-options panel-row button-group">

            {!this.state.duplicatesMode &&
              <div className={"button default"} onClick={() => {this.toggleSelectAll()}}>
                {this.state.selectState ? "Deselect All" : "Select All"}
              </div>
            }

            {selectedCount > 0 &&
              <div className={"button " + (selectedCount > 0 ? "danger" : "default")} onClick={() => {this.deleteSelected()}}>
                {`Delete ${selectedCount} Items`}
              </div>
            }

            <div className={"button default"} onClick={() => {this.toggleDuplicates()}}>
              {this.state.scanningDuplicates &&
                <div className="spinner small default"/>
              }
              {!this.state.scanningDuplicates &&
                (this.state.duplicatesMode ? "Hide Duplicates" : "Find Duplicates")
              }
            </div>

            {this.state.duplicatesMode && this.state.duplicates.length > 0 &&
              <div className={"button danger"} onClick={() => {this.cleanDuplicates()}}>
                Clean Duplicates
              </div>
            }

          </div>
        </div>

        <div className="panel-section">
          <ItemsTable itemGroups={itemGroups} onSelectionChange={(item) => {this.toggleSelection(item)}} />
        </div>
      </div>
    )
  }
}
