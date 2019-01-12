// -*- mode: java; c-basic-offset: 2; -*-
// Copyright © 2013-2016 MIT, All rights reserved
// Released under the Apache License, Version 2.0
// http://www.apache.org/licenses/LICENSE-2.0
/**
 * @license
 * @fileoverview Field in which mouseover displays flyout-like menu of blocks
 * and mouse click edits the field name.
 * Flydowns are used in App Inventor for displaying get/set blocks for parameter names
 * and callers for procedure declarations.
 * @author fturbak@wellesley.edu (Lyn Turbak)
 */

'use strict';

goog.provide('AI.Blockly.FieldFlydown');

goog.require('Blockly.FieldTextInput');
goog.require('Blockly.Options');

/**
 * Class for a clickable parameter field.
 * @param {string} text The initial parameter name in the field.
 * @param {Function} opt_changeHandler An optional function that is called
 *     to validate any constraints on what the user entered.  Takes the new
 *     text as an argument and returns the accepted text or null to abort
 *     the change. E.g., for an associated getter/setter this could change
 *     references to names in this field.
 * @extends {Blockly.FieldTextInput}
 * @constructor
 */

Blockly.FieldFlydown = function(name, isEditable, displayLocation, opt_changeHandler) {
  Blockly.FieldFlydown.superClass_.constructor.call(this, name, opt_changeHandler);

  this.EDITABLE = isEditable; // This by itself does not control editability
  this.displayLocation = displayLocation || Blockly.FieldFlydown.DISPLAY_LOCATION;
};
goog.inherits(Blockly.FieldFlydown, Blockly.FieldTextInput);

/**
 * Milliseconds to wait before showing flydown after mouseover event on flydown field.
 * @type {number}
 * @const
 */
Blockly.FieldFlydown.timeout = 500;

/**
 * Process ID for timer event to show flydown (scheduled by mouseover event)
 * @type {number}
 * @const
 */
Blockly.FieldFlydown.showPid_ = 0;

/**
 * Which instance of FieldFlydown (or a subclass) is an open flydown attached to?
 * @type {Blockly.FieldFlydown (or subclass)}
 * @private
 */
Blockly.FieldFlydown.openFieldFlydown_ = null;

/**
 * Control positioning of flydown
 */
Blockly.FieldFlydown.DISPLAY_BELOW = "BELOW";
Blockly.FieldFlydown.DISPLAY_RIGHT = "RIGHT";
Blockly.FieldFlydown.DISPLAY_LOCATION = Blockly.FieldFlydown.DISPLAY_RIGHT; // [lyn, 10/14/13] Make global for now, change in future

/**
 * Default CSS class name for the field itself
 * @type {String}
 * @const
 */
Blockly.FieldFlydown.prototype.fieldCSSClassName = 'blocklyFieldFlydownField';

/**
 * Default CSS class name for the flydown that flies down from the field
 * @type {String}
 * @const
 */
Blockly.FieldFlydown.prototype.flyoutCSSClassName = 'blocklyFieldFlydownFlydown';

// Override FieldTextInput's showEditor_ so it's only called for EDITABLE field.
Blockly.FieldFlydown.prototype.showEditor_ = function() {
  if (this.EDITABLE) {
    if (Blockly.FieldFlydown.showPid_) {  // cancel a pending flydown for editing
      clearTimeout(Blockly.FieldFlydown.showPid_);
      Blockly.FieldFlydown.showPid_ = 0;
      Blockly.hideChaff();
    }
    Blockly.FieldFlydown.superClass_.showEditor_.call(this);
  }
};

Blockly.FieldFlydown.prototype.init = function(block) {
  Blockly.FieldFlydown.superClass_.init.call(this, block);

  // Remove inherited field css classes ...
  Blockly.utils.removeClass(/** @type {!Element} */ (this.fieldGroup_),
      'blocklyEditableText');
  Blockly.utils.removeClass(/** @type {!Element} */ (this.fieldGroup_),
      'blocklyNoNEditableText');
  // ... and add new one, so that look and feel of flyout fields can be customized
  Blockly.utils.addClass(/** @type {!Element} */ (this.fieldGroup_),
      this.fieldCSSClassName);

  this.mouseOverWrapper_ =
      Blockly.bindEvent_(this.fieldGroup_, 'mouseover', this, this.onMouseOver_);
  this.mouseOutWrapper_ =
      Blockly.bindEvent_(this.fieldGroup_, 'mouseout', this, this.onMouseOut_);
};

Blockly.FieldFlydown.prototype.onMouseOver_ = function(e) {
  // alert("FieldFlydown mouseover");
  if (! this.sourceBlock_.isInFlyout) { // [lyn, 10/22/13] No flydowns in a flyout!
    Blockly.FieldFlydown.showPid_ =
        window.setTimeout(this.showFlydownMaker_(), Blockly.FieldFlydown.timeout);
    // This event has been handled.  No need to bubble up to the document.
  }
  e.stopPropagation();
};

Blockly.FieldFlydown.prototype.onMouseOut_ = function(e) {
  // Clear any pending timer event to show flydown
  window.clearTimeout(Blockly.FieldFlydown.showPid_);
  e.stopPropagation();
};

/**
 * Returns a thunk that creates a Flydown block of the getter and setter blocks for receiver field.
 *  @return A thunk (zero-parameter function).
 */
Blockly.FieldFlydown.prototype.showFlydownMaker_ = function() {
  var field = this; // Name receiver in variable so can close over this variable in returned thunk
  return function() {
    if (Blockly.FieldFlydown.showPid_ != 0) {
      field.showFlydown_();
      Blockly.FieldFlydown.showPid_ = 0;
    }
  };
};

/**
 * Creates a Flydown block of the getter and setter blocks for the parameter name in this field.
 */
Blockly.FieldFlydown.prototype.showFlydown_ = function() {
  // Hide open context menus, dropdowns, flyouts, and other flydowns.
  Blockly.hideChaff();

  // Remember field to which flydown is attached.
  Blockly.FieldFlydown.openFieldFlydown_ = this;

  // A single flydown instance is shared in the main workspace.
  var flydown = Blockly.getMainWorkspace().getFlydown();

  // Adjust scale for current zoom level.
  var scale = flydown.targetWorkspace_.scale;
  flydown.workspace_.setScale(scale);

  // Update the class, which could have been overriden by a subclass.
  flydown.setCSSClass(this.flyoutCSSClassName);

  // Populate the flydown with blocks.
  var blocksXMLText = this.flydownBlocksXML_();
  var blocksDom = Blockly.Xml.textToDom(blocksXMLText);
  var blocksXMLList = goog.dom.getChildren(blocksDom);
  flydown.populate(blocksXMLList);

  // Get the boarder rectangle for the input field.
  var xy = Blockly.getMainWorkspace().getSvgXY(this.borderRect_);
  var borderBBox = this.borderRect_.getBBox();

  // While the flydown width is correctly computed, the height should be computed from the content height and not
  // container height (which is what we are trying to adjust here).
  var metrics = flydown.getMetrics_();
  flydown.height_ = metrics.contentHeight + 2 * Blockly.Flyout.prototype.SCROLLBAR_PADDING;

  // Get the metrics of the main workspace.
  var workspaceMetrics = Blockly.getMainWorkspace().getMetrics();
  var workspaceWidth = workspaceMetrics.viewWidth;
  var workspaceHeight = workspaceMetrics.viewHeight;

  // Get the available space depending on positioning. Place a margin of scrollbar thickness.
  if (this.displayLocation === Blockly.FieldFlydown.DISPLAY_BELOW) {
    var spaceUp = xy.y - Blockly.Scrollbar.scrollbarThickness;
    var spaceDown = workspaceHeight - spaceUp - borderBBox.height * scale;
    var spaceRight = workspaceWidth - xy.x - Blockly.Scrollbar.scrollbarThickness;
    var spaceLeft = xy.x + borderBBox.width * scale - Blockly.Scrollbar.scrollbarThickness;
  } else {
    var spaceLeft = xy.x - Blockly.Scrollbar.scrollbarThickness;
    var spaceRight = workspaceWidth - spaceLeft - borderBBox.width * scale;
    var spaceDown = workspaceHeight - xy.y - Blockly.Scrollbar.scrollbarThickness;
    var spaceUp = xy.y + borderBBox.height * scale - Blockly.Scrollbar.scrollbarThickness;
  }

  // Determine whether we should invert the flydown.
  var invertVertical = false;
  var invertHorizontal = false;

  // If there is not enough space below but there is enough space above, invert the flydown.
  if (spaceDown < flydown.height_ && spaceUp >= flydown.height_) {
    invertVertical = true;
  }

  // If there is not enough space in either direction, invert as necessary to give the most vertical space to the
  // flydown and adjust its height.
  if (spaceDown < flydown.height_ && spaceUp < flydown.height_) {
    invertVertical = spaceUp > spaceDown;
    flydown.height_ = Math.max(spaceUp, spaceDown);
  }

  // If there is not enough horizontal space, invert as necessary to give the most horizontal view space.
  if (spaceRight < flydown.width_) {
    invertHorizontal = spaceLeft > spaceRight;
  }

  // Begin computation of absolute flydown offset.
  var x = xy.x;
  var y = xy.y;

  // Determine where to display the flydown.
  if (this.displayLocation === Blockly.FieldFlydown.DISPLAY_BELOW) {
    // Handle vertical inverts.
    if (invertVertical) {
      y -= flydown.height_;
    } else {
      y += borderBBox.height * scale;
    }

    // Handle horizontal inverts.
    if (invertHorizontal) {
      x -= flydown.width_ - borderBBox.width * scale;
    }
  } else if (this.displayLocation === Blockly.FieldFlydown.DISPLAY_RIGHT) {
    // Handle horizontal inverts.
    if (invertHorizontal) {
      x -= flydown.width_;
    } else {
      x += borderBBox.width * scale;
    }

    // Handle vertical inverts.
    if (invertVertical) {
      y -= flydown.height_ - borderBBox.height * scale;
    }
  }

  // Display the flyout at the computed location.
  flydown.showAt(x, y);
};

/**
 * Hide the flydown menu and squash any timer-scheduled flyout creation
 */
Blockly.FieldFlydown.hide = function() {
  // Clear any pending timer event to show flydown
  window.clearTimeout(Blockly.FieldFlydown.showPid_);
  // Clear any displayed flydown
  var flydown = Blockly.getMainWorkspace().getFlydown();
  if (flydown) {
    flydown.hide();
  }
};


// override Blockly's behavior; they call the validator after setting the text, which is
// incompatible with how our validators work (we expect to be called before the change since in
// order to find the old references to be renamed).
Blockly.FieldFlydown.prototype.onHtmlInputChange_ = function(e) {
  goog.asserts.assertObject(Blockly.FieldTextInput.htmlInput_);
  var htmlInput = Blockly.FieldTextInput.htmlInput_;
  var text = htmlInput.value;
  if (text !== htmlInput.oldValue_) {
    htmlInput.oldValue_ = text;
    var valid = true;
    if (this.sourceBlock_) {
      valid = this.callValidator(htmlInput.value);
    }
    if (valid === null) {
      Blockly.utils.addClass(htmlInput, 'blocklyInvalidInput');
    } else {
      Blockly.utils.removeClass(htmlInput, 'blocklyInvalidInput');
      this.setText(valid);
    }
  } else if (goog.userAgent.WEBKIT) {
    // Cursor key.  Render the source block to show the caret moving.
    // Chrome only (version 26, OS X).
    this.sourceBlock_.render();
  }
  this.resizeEditor_();
  Blockly.svgResize(this.sourceBlock_.workspace);
};


/**
 * Close the flydown and dispose of all UI.
 */
Blockly.FieldFlydown.prototype.dispose = function() {
  if (Blockly.FieldFlydown.openFieldFlydown_ == this) {
    Blockly.FieldFlydown.hide();
  }
  // Call parent's destructor.
  Blockly.FieldTextInput.prototype.dispose.call(this);
};
