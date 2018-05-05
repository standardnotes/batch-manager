import React from 'react';
import BridgeManager from "../lib/BridgeManager.js";
import BackupItemsList from "./BackupItemsList.js";
import 'standard-file-js';

export default class BackupExplorer extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.configureFileForm();
  }

  reset() {
    console.log("Reset");
    this.setState({rawData: null, decryptedItems: null, requestPassword: false});
  }

  configureFileForm() {
    var dropContainer = document.getElementById("drop-container");
    var fileInput = document.getElementById("file-input");

    if(fileInput) {
      fileInput.onchange = (event) => {
        let files = event.target.files;
        var reader = new FileReader();
        reader.onload = (e) => {
          var data = JSON.parse(e.target.result);
          this.previewData(data);
        }

        reader.readAsText(files[0]);
      };

      var onEnter = function() {
        dropContainer.classList.add('is-dragover');
      }

      var onExit = function() {
        dropContainer.classList.remove('is-dragover');
      }

      dropContainer.ondragover = dropContainer.ondragenter = function(evt) {
        onEnter();
        evt.preventDefault();
      };

      dropContainer.ondragleave = dropContainer.ondragend = onExit;

      dropContainer.ondrop = function(evt) {
        onExit();
        dropContainer.classList.add('is-uploading');
        fileInput.files = evt.dataTransfer.files;
        evt.preventDefault();
      };
    }
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
    params.password = this.state.password;

    SFJS.crypto.computeEncryptionKeysForUser(params, (keys) => {
      console.log("Got keys", keys);
      this.decryptItems(this.state.rawData.items, keys, (decryptedItems, errorCount) => {
        console.log("Decrypted data", decryptedItems);
        this.setState({decryptedItems: decryptedItems, requestPassword: false});
        if(errorCount > 0) {
          setTimeout(function () {
            alert(`${errorCount} items were not able to be decrypted. Please check your password and try again.`);
          }, 10);
        }
      })
    })
  }

  decryptItems(items, keys, completion) {
    var processedItems = [];
    var errorCount = 0;
    for(var item of items) {
      try {
        SFItemTransformer.decryptItem(item, keys);
        if(typeof item.content == "string") {
          item.content = JSON.parse(item.content);
        }
      } catch(error) {
        errorCount++;
        console.error("Error decrypting:", error);
        continue;
      }

      processedItems.push(item);
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
    if(!confirm(`Are you sure you want to recover ${items.length} items? Items will be recovered as duplicates and will not replace any existing data.`)) {
      return;
    }

    BridgeManager.get().createItems(items, () => {
      setTimeout(function () {
        alert("Your items have been recovered. Note that the items' create date is kept to the original value, so may not appear at the top of your notes list if you're not sorting by date modified.")
      }, 250);
    })
  }

  render() {

    let additionalColumns = [
      {label: "Type", key: "content_type"}
    ];

    return (
      <div id="backups">
            {(this.state.requestPassword || !this.state.decryptedItems) &&
              <div id="drop-container" className="notification info dashed">

                {!this.state.requestPassword && !this.state.decryptedItems &&
                  <div>
                    <form id="file-attacher-form">
                      <label class="file-input-wrapper">
                        <h3 class="instructions-label"><strong>Drag and Drop</strong> or select a file to preview.</h3>
                        <input id="file-input" type="file" name="file" class="file-input" />
                      </label>
                    </form>
                  </div>
                }

                {this.state.requestPassword &&
                  <div>
                    <p>Enter your password at the time the backup was created</p>
                    <input
                      autoFocus={true}
                      id="password-input"
                      className="info clear center-text"
                      placeholder="Enter Password"
                      type={"password"}
                      value={this.state.password}
                      onKeyPress={this.handlePasswordKeyPress}
                      onChange={this.handlePasswordChange}
                    />
                  </div>
                }
              </div>
            }

            {this.state.decryptedItems &&
              <BackupItemsList items={this.state.decryptedItems} additionalColumns={additionalColumns} recoverItems={(items) => {this.recoverItems(items)}} />
            }
      </div>
    )
  }
}
