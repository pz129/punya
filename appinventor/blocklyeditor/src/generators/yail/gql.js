'use strict';

goog.provide('Blockly.Yail.gql');

// Code generator for the GraphQL null argument.
Blockly.Yail['gql_null'] = function() {
  return ['', Blockly.Yail.ORDER_ATOMIC];
};

// Code generator for GraphQL blocks.
Blockly.Yail['gql'] = function() {
  // Get the selection name.
  var selectionName = (this.gqlParent === null) ? '... on ' + this.gqlName : this.gqlName;

  // Begin array selection for arguments.
  var selectionArguments = Blockly.Yail.YAIL_OPEN_COMBINATION + 'GqlArgument[]';

  // Add all arguments.
  for (var i = 0; i < this.gqlParameters.length; i++) {
    // Extract the name.
    var argumentName = this.gqlParameters[i].gqlName;

    // Extract the type.
    var argumentType = this.gqlParameters[i].gqlType;

    // Recursively generate the value, defaulting to null.
    var argumentValue = Blockly.Yail.valueToCode(this, 'GQL_PARAMETER' + i, Blockly.Yail.ORDER_NONE) || '#!null';

    // Create a new argument object.
    var gqlArgument = Blockly.Yail.YAIL_OPEN_COMBINATION + 'GqlArgument'
      + Blockly.Yail.YAIL_SPACER + Blockly.Yail.quote_(argumentName)
      + Blockly.Yail.YAIL_SPACER + Blockly.Yail.quote_(argumentType)
      + Blockly.Yail.YAIL_SPACER + argumentValue
      + Blockly.Yail.YAIL_CLOSE_COMBINATION;

    // Add the argument to the array.
    selectionArguments += Blockly.Yail.YAIL_SPACER + gqlArgument;
  }

  // Close the arguments array.
  selectionArguments += Blockly.Yail.YAIL_CLOSE_COMBINATION;

  // Begin array for selection set.
  var selectionSet = Blockly.Yail.YAIL_OPEN_COMBINATION + 'GqlSelection[]';

  // Add all object fields.
  for (var i = 0; i < this.itemCount_ || 0; i++) {
    // Recursively generate code for the selection.
    var gqlSelection = Blockly.Yail.valueToCode(this, 'GQL_FIELD' + i, Blockly.Yail.ORDER_NONE);

    // Add selection to array.
    selectionSet += Blockly.Yail.YAIL_SPACER + gqlSelection;
  }

  // Close the selection set array.
  selectionSet += Blockly.Yail.YAIL_CLOSE_COMBINATION;

  // Create a new selection object.
  var gqlSelection = Blockly.Yail.YAIL_OPEN_COMBINATION + 'GqlSelection'
    + Blockly.Yail.YAIL_SPACER + Blockly.Yail.quote_(selectionName)
    + Blockly.Yail.YAIL_SPACER + selectionArguments
    + Blockly.Yail.YAIL_SPACER + selectionSet
    + Blockly.Yail.YAIL_CLOSE_COMBINATION;

  // Return code.
  return [gqlSelection, Blockly.Yail.ORDER_ATOMIC];
};
