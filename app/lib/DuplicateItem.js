// A subclass of SFItem where we override methods related to checking if two items content
// are equal.

import "standard-file-js/dist/regenerator.js";
import "standard-file-js/vendor/lodash/lodash.custom.min.js";
import { StandardFile } from 'standard-file-js';

// This needs to be set in order to do proper duplication detection
SFItem.AppDomain = "org.standardnotes.sn";

export default class DuplicateItem extends SFItem {

  keysToIgnoreWhenCheckingContentEquality() {
    return ["references"].concat(super.keysToIgnoreWhenCheckingContentEquality());
  }

}
