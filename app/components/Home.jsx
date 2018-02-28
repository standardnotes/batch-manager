import React from 'react';
import BridgeManager from "../lib/BridgeManager.js";
import ItemsList from "./ItemsList.js";

export default class Home extends React.Component {

  constructor(props) {
    super(props);
    this.state = {categories: {}};

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
    this.setState({selectedCategory: category});
  }

  render() {

    return (
      <div id="home" className="panel static">
        <div className="content">

          <div className="button-group categories-options">
            {Object.keys(this.state.categories).map((key) =>
              <div className={"button default " + (key == this.state.selectedCategory ? "info" : "")} key={key} onClick={() => {this.didSelectCategory(key)}}>
                {BridgeManager.get().humanReadableTitleForExtensionType(key, true)}
              </div>
            )}
          </div>

          {this.state.selectedCategory &&
            <ItemsList items={this.state.categories[this.state.selectedCategory]} contentType={this.state.selectedCategory} />
          }
        </div>

        <div className="footer">

        </div>
      </div>
    )
  }

}
