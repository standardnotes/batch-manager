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
      <div className="panel-section">

        <div className="panel-row">
          <div className="context-options panel-row button-group">

            {!this.state.duplicatesMode &&
              <div className={"button default"} onClick={() => {this.toggleSelectAll()}}>
                {this.state.selectState ? "Deselect All" : "Select All"}
              </div>
            }

            {selectedCount > 0 &&
              <div className={"button " + (selectedCount > 0 ? "success" : "default")} onClick={() => {this.props.recoverItems(this.state.selectedItems)}}>
                {`Recover ${selectedCount} Items`}
              </div>
            }
          </div>
        </div>

        <div className="panel-section">
          <ItemsTable additionalColumns={this.props.additionalColumns} itemGroups={itemGroups} onSelectionChange={(item) => {this.toggleSelection(item)}} />
        </div>
      </div>
    )
  }
}
