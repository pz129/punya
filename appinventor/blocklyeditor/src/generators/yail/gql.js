'use strict';

goog.provide('Blockly.Yail.gql');

// Code generator for the GraphQL null argument.
Blockly.Yail['gql_null'] = function() {
  return ['', Blockly.Yail.ORDER_ATOMIC];
};

// Code generator for GraphQL blocks.
Blockly.Yail['gql'] = function() {
  // If the blocks is a scalar, then the code is just the field name.
  if (!this.gqlHasFields) {
    return [Blockly.Yail.quote_(this.gqlName), Blockly.Yail.ORDER_ATOMIC];
  }

  // If the block is not a scalar but does not have fields, there is no code to generate.
  if (this.itemCount_ === 0) {
    return ['', Blockly.Yail.ORDER_ATOMIC];
  }

  // Keep track of an array of items to concatenate.
  var combination = [];

  // The first item in the list is the list constructor, which is not part of the query string.
  combination.push(Blockly.Yail.YAIL_LIST_CONSTRUCTOR);

  // The field name (or fragment) is the first query element.
  var nameWithPrefix = (this.gqlParent === null) ? '... on ' + this.gqlName : this.gqlName;
  combination.push(Blockly.Yail.quote_(nameWithPrefix));

  // If there are parameters, add them.
  if (this.gqlParameters.length > 0) {
    // Create a list of arguments.
    var args = [];

    // Add all parameters.
    for (var i = 0; i < this.gqlParameters.length; i++) {
      // Default to null.
      args.push(Blockly.Yail.valueToCode(this, 'GQL_PARAMETER' + i, Blockly.Yail.ORDER_NONE) || null);
    }

    // Open parenthesis.
    combination.push('"("');

    // Add parameter names and arguments.
    for (var i = 0; i < args.length; i++) {
      // Add the parameter name.
      combination.push(Blockly.Yail.quote_(this.gqlParameters[i].gqlName + ': '));

      // Get type type of the argument.
      var argType = this.gqlParameters[i].gqlType;

      // Determine how to represent the argument, defaulting to null.
      if (args[i] === null) {
        combination.push('"null"');
      } else if (this.gqlTypeToYailType(argType) === 'list') {
        combination.push(Blockly.Yail.YAIL_OPEN_COMBINATION + 'JsonUtil:getJsonRepresentation' + Blockly.Yail.YAIL_SPACER + args[i] + Blockly.Yail.YAIL_CLOSE_COMBINATION);
      } else if (this.gqlTypeToYailType(argType) !== 'text') {
        combination.push(args[i]);
      } else {
        combination.push('"\\\""');
        combination.push(args[i]);
        combination.push('"\\\""');
      }

      // Add commas in between.
      if (i !== args.length - 1) {
        combination.push('", "');
      }
    }

    // Close parenthesis.
    combination.push('")"');
  }

  // Add opening bracket.
  combination.push('" {"');

  // Add all object fields.
  for (var i = 0; i < this.itemCount_; i++) {
    // Recursively generate code for the field.
    var objectField = Blockly.Yail.valueToCode(this, 'GQL_FIELD' + i, Blockly.Yail.ORDER_NONE);

    // Only add the field if it is non-empty.
    if (objectField) {
      combination.push('" "');
      combination.push(objectField);
    }
  }

  // Add closing bracket.
  combination.push('" }"');

  // Begin generating string concatenation code.
  var code = Blockly.Yail.YAIL_CALL_YAIL_PRIMITIVE + 'string-append' + Blockly.Yail.YAIL_SPACER;

  // Add all items in the combination.
  code += Blockly.Yail.YAIL_OPEN_COMBINATION;
  code += combination.join(Blockly.Yail.YAIL_SPACER);
  code += Blockly.Yail.YAIL_CLOSE_COMBINATION;

  // Prepare to create a new combination (for type coercions).
  code += Blockly.Yail.YAIL_SPACER + Blockly.Yail.YAIL_QUOTE;

  // Open combination.
  code += Blockly.Yail.YAIL_OPEN_COMBINATION;

  // Place the text type for all items in combinations except for the list constructor.
  for (var i = 0; i < combination.length - 1; i++) {
    code += 'text';

    // Add a spacer in between.
    if (i !== combination.length - 2) {
      code += Blockly.Yail.YAIL_SPACER;
    }
  }

  // Close combination.
  code += Blockly.Yail.YAIL_CLOSE_COMBINATION;

  // Indicate that we are performing a join.
  code += Blockly.Yail.YAIL_SPACER + '"join"';

  // Close final combination.
  code += Blockly.Yail.YAIL_CLOSE_COMBINATION;

  // Return code.
  return [code, Blockly.Yail.ORDER_ATOMIC];
};
