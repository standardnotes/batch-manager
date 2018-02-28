import React from 'react';
import BridgeManager from "../lib/BridgeManager.js";

export default class ItemsList extends React.Component {

  constructor(props) {
    super(props);
    this.state = {selectedItems: [], selectState: false};
  }

  componentWillReceiveProps(nextProps) {
    for(var item of this.props.items) {
      item.selected = false;
    }
    this.setState({selectedItems: [], selectState: false, duplicatesMode: false, duplicates: null});
  }

  deleteSelected() {
    BridgeManager.get().deleteItems(this.state.selectedItems);

    for(var item of this.props.items) { item.selected = false; }
    this.setState({selectedItems: [], selectState: false});
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
      if(a.content_type !== b.content_type) {
        return false;
      }
      var keysToOmit = ["references"];
      var aString = JSON.stringify(omitKeys(a.content, keysToOmit));
      var bString = JSON.stringify(omitKeys(b.content, keysToOmit));
      return aString == bString;
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
          console.log("Done");
          completion();
        }
      }, 10);

    }
    // End Outer Loop
  }

  toggleSelectAll() {
    var selectState = !this.state.selectState;
    for(var item of this.props.items) {
      item.selected = selectState;
    }

    this.setState({selectState: selectState, selectedItems: selectState ? this.props.items : []})
  }

  toggleSelection(item) {
    console.log("Toggle selection", item);
    item.selected = !item.selected;
    var selectedItems = this.state.selectedItems;
    if(item.selected) {
      selectedItems.push(item);
    } else {
      selectedItems.splice(selectedItems.indexOf(item), 1);
    }
    this.setState({selectedItems: selectedItems});
  }

  render() {
    let selectedCount = this.state.selectedItems.length;
    var itemsWrapper = this.state.duplicatesMode ? this.state.duplicates : [this.props.items];

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

            {itemsWrapper.map((array, index) =>
              <table>
                <tr>
                  <th>Selection</th>
                  <th>Content</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Identifier</th>
                </tr>

                {array.map((item, index) =>
                  <ItemRow
                    key={item.uuid}
                    item={item}
                    onSelectionChange={(i) => {this.toggleSelection(i)}}
                  />
                )}
              </table>
            )}

        </div>
      </div>
    )
  }
}

class ItemRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {expanded: false};
  }

  _renderObject = (obj) => {
    const capitalizeFirstLetter = (string) => {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
    return (
      <div>
        {Object.keys(obj).map((key) =>
          (typeof(obj[key]) !== 'object' &&
            <div className="content-item" key={key}>
              <strong className="key">{capitalizeFirstLetter(key)}: </strong>
              <span className="body">{obj[key]}</span>
            </div>
          )
        )}
      </div>
    )
  }

  render() {
    var item = this.props.item;
    return (
      <tr className={"table-item " + (item.selected ? "selected" : "")}>
        <td className="selection-column">
          <label>
            <input type="checkbox"
              checked={item.selected}
              onChange={() => {this.props.onSelectionChange(item)}}
            />
          </label>
        </td>

        <td>
          <div
            onClick={() => {this.setState({expanded: !this.state.expanded})}}
            className={"content-body " + (this.state.expanded ? "expanded" : "")}>
              {this._renderObject(item.content)}
          </div>
        </td>

        <td>{item.created_at.toString()}</td>
        <td>{item.updated_at.toString()}</td>
        <td>{item.uuid}</td>
      </tr>
    )
  }
}
