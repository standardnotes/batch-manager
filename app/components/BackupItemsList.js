import React from 'react';
import BridgeManager from "../lib/BridgeManager.js";
import {BaseItemsList, ItemsTable} from "./BaseItemsList";

export default class UserItemsList extends BaseItemsList {

  constructor(props) {
    super(props);
  }

  render() {
    let selectedCount = this.state.selectedItems.length;
    var itemGroups =  [this.props.items];

    return (
      <div className="sk-panel-section">

        <div className="sk-panel-row">
          <div className="context-options sk-panel-row sk-button-group">

            {!this.state.duplicatesMode &&
              <div className={"sk-button neutral"} onClick={() => {this.toggleSelectAll()}}>
                <div className="sk-label">
                  {this.state.selectState ? "Deselect All" : "Select All"}
                </div>
              </div>
            }

            {selectedCount > 0 &&
              <div className={"sk-button " + (selectedCount > 0 ? "success" : "neutral")} onClick={() => {this.props.recoverItems(this.state.selectedItems)}}>
                <div className="sk-label">
                  {`Recover ${selectedCount} Items`}
                </div>
              </div>
            }
          </div>
        </div>

        <div className="sk-panel-section">
          <ItemsTable additionalColumns={this.props.additionalColumns} itemGroups={itemGroups} onSelectionChange={(item) => {this.toggleSelection(item)}} />
        </div>
      </div>
    )
  }
}
