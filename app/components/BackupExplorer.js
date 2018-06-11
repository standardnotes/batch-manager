import React from 'react';
import BridgeManager from "../lib/BridgeManager.js";
import BackupItemsList from "./BackupItemsList.js";

import "standard-file-js/dist/regenerator.js";
import { StandardFile } from 'standard-file-js';

export default class BackupExplorer extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.configureFileForm();

    // Allow user to drag anywhere in the window
    window.addEventListener("dragover", this.onWindowDragOver, false);
    window.addEventListener("drop", this.onWindowDrop, false);
  }

  componentWillUnmount() {
    window.removeEventListener("dragover", this.onWindowDragOver, false);
    window.removeEventListener("drop", this.onWindowDrop, false);
  }

  onWindowDragOver = (evt) => {
    this.dropContainerOnEnter();
    evt = evt || event;
    evt.preventDefault();
  }

  onWindowDrop = (evt) => {
    this.dropContainerOnExit();

    this.handledFiles = true;
    this.dropContainer.classList.add('is-uploading');

    this.fileInput.files = evt.dataTransfer.files;
    this.handleDroppedFiles(evt.dataTransfer.files);

    evt.preventDefault();
  }

  get dropContainer() {
    return document.getElementById("drop-container");
  }

  get fileInput() {
    return document.getElementById("file-input");
  }

  dropContainerOnEnter = () => {
    this.dropContainer.classList.add('is-dragover');
  }

  dropContainerOnExit = () => {
    this.dropContainer.classList.remove('is-dragover');
  }

  handleDroppedFiles = (files) => {
    var reader = new FileReader();
    reader.onload = (e) => {
      var data = JSON.parse(e.target.result);
      this.previewData(data);
    }

    reader.readAsText(files[0]);
  }

  configureFileForm() {
    var fileInput = this.fileInput;
    var dropContainer = this.dropContainer;
    if(!fileInput) {
      return;
    }

    fileInput.onchange = (event) => {
      // On firefox, this event doesnt get triggered. INstead we handle it on window.addEventListener("drop")
      // Which gets called on all browsers
      let files = event.target.files;
      if(!this.handledFiles) {
        this.handleDroppedFiles(files);
      }
    };

    dropContainer.ondragover = dropContainer.ondragenter = (evt) => {
      this.dropContainerOnEnter();
      evt.preventDefault();
    };

    dropContainer.ondragleave = dropContainer.ondragend = this.dropContainerOnEnter;
  }


  reset() {
    this.setState({rawData: null, decryptedItems: null, requestPassword: false});
  }

  previewData(data) {
    this.setState({rawData: data});
    if(data.auth_params) {
      // request password
      this.setState({requestPassword: true});
    } else {
      this.setState({decryptedItems: data.items});
    }
  }

  onPasswordSubmit() {
    var params = this.state.rawData.auth_params;

    SFJS.crypto.computeEncryptionKeysForUser(this.state.password, params).then((keys) => {
      this.decryptItems(this.state.rawData.items, keys, (decryptedItems, errorCount) => {
        if(errorCount == this.state.rawData.items.length) {
          // All items unable to be decrypted, ask for password
          this.setState({requestPassword: true, password: ""});
        } else {
          this.setState({decryptedItems: decryptedItems, requestPassword: false});
        }
        if(errorCount > 0) {
          setTimeout(function () {
            alert(`${errorCount} items were unable to be decrypted. Please check your password and try again.`);
          }, 10);
        }
      })
    })
  }

  async decryptItems(items, keys, completion) {
    var processedItems = [];
    var errorCount = 0;
    for(var item of items) {
      try {
        await SFJS.itemTransformer.decryptItem(item, keys);
        if(typeof item.content == "string") {
          item.content = JSON.parse(item.content);
        }

        if(typeof item.created_at == "string") {
          item.created_at = new Date(item.created_at);
        }

        if(typeof item.updated_at == "string") {
          item.updated_at = new Date(item.updated_at);
        }
      } catch(error) {
        errorCount++;
        console.error("Error decrypting item", item, "error", error);
        continue;
      }

      if(item.content && !item.errorDecrypting) {
        processedItems.push(item);
      }
    }

    completion(processedItems, errorCount);
  }

  handlePasswordKeyPress = (e) => {
    if(e.key === 'Enter') {
      this.onPasswordSubmit();
    }
  }

  handlePasswordChange = (event) => {
    this.setState({password: event.target.value});
  }

  recoverItems(items) {
    if(!confirm(`Do you want to recover ${items.length} items? Items will be recovered as new items and will not replace any existing data.`)) {
      return;
    }

    BridgeManager.get().createItems(items, () => {
      setTimeout(function () {
        alert("Your items have been recovered. Note that the items' create date is kept to the original value, so may not appear at the top of your notes list if not sorting by date modified.")
      }, 250);
    })
  }

  render() {

    let additionalColumns = [
      {label: "Type", key: "content_type", width: 100}
    ];

    return (
      <div id="backups">
            {(this.state.requestPassword || !this.state.decryptedItems) &&
              <div id="drop-container" className="notification info dashed">

                {!this.state.requestPassword && !this.state.decryptedItems &&
                  <div>
                    <form id="file-attacher-form">
                      <label class="file-input-wrapper">
                        <h3 class="instructions-label"><strong>Drag and Drop</strong> or select a backup file to preview its contents.</h3>
                        <input id="file-input" type="file" name="file" class="file-input" />
                      </label>
                    </form>
                  </div>
                }

                {this.state.requestPassword &&
                  <div>
                    <p>Enter your password at the time this backup was created:</p>
                    <input
                      autoFocus={true}
                      id="password-input"
                      className="info clear center-text"
                      placeholder="Password"
                      type={"password"}
                      value={this.state.password}
                      onKeyPress={this.handlePasswordKeyPress}
                      onChange={this.handlePasswordChange}
                    />
                  </div>
                }
              </div>
            }

            {this.state.decryptedItems && this.state.decryptedItems.length > 0 &&
              <BackupItemsList items={this.state.decryptedItems} additionalColumns={additionalColumns} recoverItems={(items) => {this.recoverItems(items)}} />
            }
      </div>
    )
  }
}
