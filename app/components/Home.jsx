import React from 'react';
import BridgeManager from "../lib/BridgeManager.js";
import UserItemsList from "./UserItemsList.js";
import BackupExplorer from "./BackupExplorer.js";

export default class Home extends React.Component {

  constructor(props) {
    super(props);
    this.state = {categories: {}};
    this.backupsKey = Math.random();

    BridgeManager.get().initiateBridge(() => {
      BridgeManager.get().beginStreamingItems();
      this.reload();
    });

    BridgeManager.get().addUpdateObserver(() => {
      this.reload();
    })
  }

  reload() {
    let categories = BridgeManager.get().categorizedItems();
    let selectedCategory = this.state.selectedCategory ? this.state.selectedCategory : Object.keys(categories)[0];
    this.setState({categories: categories, selectedCategory: selectedCategory});
    this.forceUpdate();
  }

  didSelectCategory(category) {
    if(category == "backups" && this.state.selectedCategory == category) {
      // Allows the component to re-render and reset itself
      this.backupsKey = Math.random();
    }
    this.setState({selectedCategory: category});
  }

  isCategoryView(category) {
    return ["backups"].includes(category);
  }

  render() {

    return (
      <div id="home" className="sk-panel static">
        <div className="sk-panel-content">

          <div className="sk-panel-row categories-options">

            <div className="sk-button-group">
            {Object.keys(this.state.categories).map((key) =>
              <div className={"sk-button " + (key == this.state.selectedCategory ? "info" : "neutral")} key={key} onClick={() => {this.didSelectCategory(key)}}>
                <div className="sk-label">
                  {BridgeManager.get().humanReadableTitleForExtensionType(key, true)}
                </div>
              </div>
            )}
            </div>

            <div className="sk-button-group">
              <div className={"sk-button " + ("backups" == this.state.selectedCategory ? "info" : "neutral")} onClick={() => {this.didSelectCategory("backups")}}>
                <div className="sk-label">
                  Backup Explorer
                </div>
              </div>
            </div>
          </div>

          {this.state.selectedCategory && !this.isCategoryView(this.state.selectedCategory) &&
            <UserItemsList items={this.state.categories[this.state.selectedCategory]} contentType={this.state.selectedCategory} />
          }

          {this.state.selectedCategory && this.isCategoryView(this.state.selectedCategory) &&
            (this.state.selectedCategory == "backups" &&
              <BackupExplorer key={this.backupsKey} />
            )
          }
        </div>
      </div>
    )
  }

}
