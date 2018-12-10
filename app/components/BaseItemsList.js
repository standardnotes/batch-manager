import React from 'react';
import BridgeManager from "../lib/BridgeManager.js";

export class BaseItemsList extends React.Component {

  constructor(props) {
    super(props);
    this.state = {selectedItems: [], selectState: false};
  }

  componentWillReceiveProps(nextProps) {
    if(this.props.items) {
      for(var item of this.props.items) {
        item.selected = false;
      }
    }
    this.setState({selectedItems: [], selectState: false, duplicatesMode: false, duplicates: null});
  }

  toggleSelectAll() {
    var selectState = !this.state.selectState;
    for(var item of this.props.items) {
      item.selected = selectState;
    }

    this.setState({selectState: selectState, selectedItems: selectState ? this.props.items.slice() : []})
  }

  toggleSelection(item) {
    item.selected = !item.selected;
    var selectedItems = this.state.selectedItems;
    if(item.selected) {
      selectedItems.push(item);
    } else {
      selectedItems.splice(selectedItems.indexOf(item), 1);
    }
    this.setState({selectedItems: selectedItems});
  }
}

export class ItemsTable extends React.Component {

  constructor(props) {
    super(props);

    this.columns = props.additionalColumns ? props.additionalColumns : [];
    this.columns = this.columns.concat([
      {label: "Content", key: "content"},
      {label: "Created", key: "created_at", valueFunction: (item) => {
        return item.created_at.toString();
      }},
      {label: "Updated", key: "updated_at", valueFunction: (item) => {
        return item.updated_at.toString();
      }},
      {label: "Identifier", key: "uuid"}
    ]);
  }

  render() {
    let columns = this.columns;

    return (
      <div className="sk-panel-section">
        <div className="sk-panel-section">

            {this.props.itemGroups.map((array, index) =>
              <table>
                {array &&
                  <tr>
                    <th>Selection</th>
                    {columns.map((c) =>
                      <th>{c.label}</th>
                    )}
                  </tr>
                }

                {array && array.map((item, index) =>
                  <ItemRow
                    key={item.uuid}
                    item={item}
                    columns={columns}
                    onSelectionChange={(i) => {this.props.onSelectionChange(i)}}
                  />
                )}
              </table>
            )}

        </div>
      </div>
    )
  }
}

export class ItemRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {expanded: false};
  }

  _renderObject = (obj) => {
    const capitalizeFirstLetter = (string) => {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    if(!obj) {
      return (
        <div/>
      )
    }

    return (
      <div>
        {Object.keys(obj).map((key) =>
          (obj[key] && typeof(obj[key]) !== 'object' &&
            <div className="sk-panel-table-content-item" key={key}>
              <strong className="key">{capitalizeFirstLetter(key)}: </strong>
              <span className="body">{typeof(obj[key]) == "boolean" ? JSON.stringify(obj[key]) : obj[key]}</span>
            </div>
          )
        )}
      </div>
    )
  }

  _renderColumn = (column) => {
    var item = this.props.item;
    return (
      <td style={column.width ? {maxWidth: column.width} : {}}>
        {column.key == "content" &&
          <div
            onClick={() => {this.setState({expanded: !this.state.expanded})}}
            className={"content-body " + (this.state.expanded ? "expanded" : "")}>
              {this._renderObject(item[column.key])}
          </div>
        }

        {column.key != "content" &&
          (column.valueFunction ? column.valueFunction(item) : item[column.key])
        }
      </td>
    )
  }

  render() {
    var item = this.props.item;
    return (
      <tr className={"sk-panel-table-item " + (item.selected ? "selected" : "")}>
        <td className="selection-column">
          <label>
            <input type="checkbox"
              checked={item.selected}
              onChange={() => {this.props.onSelectionChange(item)}}
            />
          </label>
        </td>

        {this.props.columns.map((column) =>
          this._renderColumn(column)
        )}
      </tr>
    )
  }
}
