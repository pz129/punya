'use strict';

goog.provide('AI.Blockly.Blocks.gql');
goog.provide('AI.Blockly.GraphQL');
goog.require('AI.Blockly.FieldFlydown');
goog.require('Blockly.Blocks.Utilities');
goog.require('goog.net.XhrIo');

// Initialize namespace.
Blockly.Blocks.gql = {};
Blockly.GraphQLBlock = {};

// Constants for GraphQL blocks.
Blockly.GraphQLBlock.PRIMARY_COLOR = '#e535ab';
Blockly.GraphQLBlock.SECONDARY_COLOR = '#161e26';

// Constant for special internal root type. Must not be valid GraphQL name.
Blockly.GraphQLBlock.ROOT_TYPE = '[root]';

// GraphQL introspection query.
// <editor-fold desc="INTROSPECTION_QUERY">
Blockly.GraphQLBlock.INTROSPECTION_QUERY =
  'query IntrospectionQuery { ' +
  '  __schema { ' +
  '    queryType { ' +
  '      name ' +
  '    } ' +
  '    mutationType { ' +
  '      name ' +
  '    } ' +
  '    types { ' +
  '      ...FullType ' +
  '    } ' +
  '  } ' +
  '} ' +
  ' ' +
  'fragment FullType on __Type { ' +
  '  kind ' +
  '  name ' +
  '  description ' +
  '  fields(includeDeprecated: true) { ' +
  '    name ' +
  '    description ' +
  '    args { ' +
  '      ...InputValue ' +
  '    } ' +
  '    type { ' +
  '      ...TypeRef ' +
  '    } ' +
  '    isDeprecated ' +
  '    deprecationReason ' +
  '  } ' +
  '  inputFields { ' +
  '    ...InputValue ' +
  '  } ' +
  '  interfaces { ' +
  '    ...TypeRef ' +
  '  } ' +
  '  enumValues(includeDeprecated: true) { ' +
  '    name ' +
  '    description ' +
  '    isDeprecated ' +
  '    deprecationReason ' +
  '  } ' +
  '  possibleTypes { ' +
  '    ...TypeRef ' +
  '  } ' +
  '} ' +
  ' ' +
  'fragment InputValue on __InputValue { ' +
  '  name ' +
  '  description ' +
  '  type { ' +
  '    ...TypeRef ' +
  '  } ' +
  '  defaultValue ' +
  '} ' +
  ' ' +
  'fragment TypeRef on __Type { ' +
  '  kind ' +
  '  name ' +
  '  ofType { ' +
  '    kind ' +
  '    name ' +
  '    ofType { ' +
  '      kind ' +
  '      name ' +
  '      ofType { ' +
  '        kind ' +
  '        name ' +
  '      } ' +
  '    } ' +
  '  } ' +
  '} ';
// </editor-fold>

// GraphQL component instances.
Blockly.GraphQLBlock.instances = {};

// GraphQL introspection query cache.
Blockly.GraphQLBlock.schemas = {};

// Register an instance with an endpoint.
Blockly.GraphQLBlock.registerInstance = function(uid, endpointUrl) {
  // Add instance.
  Blockly.GraphQLBlock.instances[uid] = endpointUrl;

  // Update (or fetch) the schema for the associated endpoint
  Blockly.GraphQLBlock.updateSchema(endpointUrl);
};

// Unregister an instance.
Blockly.GraphQLBlock.unregisterInstance = function(uid) {
  // Get the endpoint associated with the instance.
  var endpointUrl = Blockly.GraphQLBlock.instances[uid];

  // If the instance is not registered, we are done.
  if (endpointUrl === undefined) {
    return;
  }

  // Remove the entry.
  delete Blockly.GraphQLBlock.instances[uid];

  // Find another instance with the same endpoint.
  var otherUid = goog.array.find(Object.values(Blockly.GraphQLBlock.instances), function(url) {
    return url === endpointUrl;
  });

  // Remove the schema if this was the last associated instance.
  if (otherUid === null) {
    delete Blockly.GraphQLBlock.schemas[endpointUrl];
  }
};

// Generates an array of top-level blocks associated with the given instance.
Blockly.GraphQLBlock.instanceBlocks = function(uid) {
  // Keep track of blocks.
  var blocks = [];

  // If the instance is not registered, return.
  if (!Blockly.GraphQLBlock.instances.hasOwnProperty(uid)) {
    return blocks;
  }

  // Get the endpoint associated with the instance.
  var endpoint = Blockly.GraphQLBlock.instances[uid];

  // If the schema for the endpoint does not exist, return.
  if (!Blockly.GraphQLBlock.schemas.hasOwnProperty(endpoint)) {
    return blocks;
  }

  // Add all blocks of the root.
  Array.prototype.push.apply(blocks, Blockly.GraphQLBlock.buildTypeBlocks(endpoint, Blockly.GraphQLBlock.ROOT_TYPE));

  // Return the list of blocks.
  return blocks;
};

// Traverses a type reference to get the base type reference.
Blockly.GraphQLBlock.traverseTypeRef = function(typeRef) {
  // Traverse type reference until we reach a base type.
  while (typeRef.kind === 'LIST' || typeRef.kind === 'NON_NULL') {
    typeRef = typeRef.ofType;
  }

  // Return the base type reference.
  return typeRef;
};

// Traverses a type reference to get a type string.
Blockly.GraphQLBlock.typeString = function(typeRef) {
  // Handle base case.
  if (typeRef.ofType === null) {
    return typeRef.name;
  }

  // Handle not null types.
  if (typeRef.kind === 'NON_NULL') {
    return Blockly.GraphQLBlock.typeString(typeRef.ofType) + '!';
  }

  // Handle list types.
  if (typeRef.kind === 'LIST') {
    return '[' + Blockly.GraphQLBlock.typeString(typeRef.ofType) + ']';
  }
};

// Creates a list of block elements from a given type.
Blockly.GraphQLBlock.buildTypeBlocks = function(gqlUrl, gqlBaseType) {
  // Fetch the associated type.
  var schema = Blockly.GraphQLBlock.schemas[gqlUrl];
  var type = schema.types[gqlBaseType];

  // Create an array to store blocks.
  var blocks = [];

  // Get all fields for the type.
  var allFields = Object.keys(type.fields);

  // Go through all fields for the type.
  for (var i = 0, fieldName; fieldName = allFields[i]; i++) {
    // Create a new block.
    var block = document.createElement('block');
    block.setAttribute('type', 'gql');
    blocks.push(block);

    // Get the field.
    var field = type.fields[fieldName];

    // Get field type reference.
    var fieldTypeRef = Blockly.GraphQLBlock.traverseTypeRef(field.type);

    // Create a new mutation.
    var mutation = document.createElement('mutation');
    mutation.setAttribute('gql_url', gqlUrl);
    mutation.setAttribute('gql_parent', gqlBaseType);
    mutation.setAttribute('gql_name', fieldName);
    block.appendChild(mutation);

    // If the field is an object, interface, or union, then it can have fields of its own.
    if (fieldTypeRef.kind === 'OBJECT' || fieldTypeRef.kind === 'INTERFACE' || fieldTypeRef.kind === 'UNION') {
      mutation.setAttribute('gql_fields', '1');
    }

    // Add parameters into the mutation.
    for (var j = 0, arg; arg = field.args[j]; j++) {
      var gqlParameter = document.createElement('gql_parameter');

      // Get the parameter's full type string.
      var fullType = Blockly.GraphQLBlock.typeString(arg.type);

      // Add parameter attributes.
      gqlParameter.setAttribute('gql_name', arg.name);
      gqlParameter.setAttribute('gql_type', fullType);

      // Add parameter to mutation.
      mutation.appendChild(gqlParameter);
    }
  }

  // Get all possible types.
  var possibleTypes = type.possibleTypes || [];

  // Build fragments on possible types.
  for (var i = 0, possibleType; possibleType = possibleTypes[i]; i++) {
    // Create a new block.
    var block = document.createElement('block');
    block.setAttribute('type', 'gql');
    blocks.push(block);

    // Get the base type.
    var baseType = Blockly.GraphQLBlock.traverseTypeRef(possibleType);

    // Create a new mutation.
    var mutation = document.createElement('mutation');
    mutation.setAttribute('gql_url', gqlUrl);
    mutation.setAttribute('gql_name', baseType.name);
    mutation.setAttribute('gql_fields', '1');
    block.appendChild(mutation);
  }

  // Return the block elements.
  return blocks;
};

// Method to update cached introspection query and associated blocks.
Blockly.GraphQLBlock.updateSchema = function(endpoint) {
  // Build post data.
  var data = {
    'query': Blockly.GraphQLBlock.INTROSPECTION_QUERY,
    'operationName': 'IntrospectionQuery'
  };

  // Create headers.
  var headers = {
    'content-type': 'application/json'
  };

  // Send an introspection query.
  goog.net.XhrIo.send(endpoint, function(e) {
    // Get the XHR.
    var xhr = e.target;

    // Check if there were any errors sending the requests.
    if (xhr.getLastErrorCode() !== goog.net.ErrorCode.NO_ERROR) {
      console.log('Introspection query for ' + endpoint + ' failed with error code ' + xhr.getLastErrorCode() + '.');
      return;
    }

    // Get the response, which is in JSON format.
    var response = xhr.getResponseJson();

    // Check if there were any errors.
    if (response.hasOwnProperty('errors')) {
      console.log('Introspection query for ' + endpoint + ' failed with GraphQL errors.', response['errors']);
      return;
    }

    // Fetch the raw schema.
    var schema = response['data']['__schema'];

    // Create a type mapping for fast name lookup.
    var newTypes = {};

    // Modify the old type objects and add them to new types.
    for (var i = 0, type; type = schema.types[i]; i++) {
      // Extract the type name as the key.
      var typeName = type['name'];

      // Set the modified type object under the type name.
      newTypes[typeName] = type;

      // Create a field mapping for fast name lookup.
      var newFields = {};

      // Determine if there are any fields.
      if (type['fields'] !== null) {
        // Modify the old field objects and add them to new fields.
        for (var j = 0, field; field = type.fields[j]; j++) {
          // Extract the field name as the key.
          var fieldName = field['name'];

          // Set the modified field object under the field name.
          newFields[fieldName] = field;
        }
      }

      // Replace the old fields with the new fields.
      type['fields'] = newFields;
    }

    // Get all possible object and interface types for fragment block generation.
    var possibleTypes = goog.array.filter(schema['types'], function(type) {
      return (type.kind === 'OBJECT' || type.kind === 'INTERFACE') && !type.name.startsWith('__');
    });

    // Add the special schema root type, which contains the root fields and all possible types
    newTypes[Blockly.GraphQLBlock.ROOT_TYPE] = {
      'fields': {},
      'possibleTypes': possibleTypes
    };

    // If there is a query type, add it to the root fields.
    if (schema['queryType'] !== null) {
      newTypes[Blockly.GraphQLBlock.ROOT_TYPE]['fields']['query'] = {
        'args': [],
        'description': 'A GraphQL query.',
        'type': {
          'kind': 'OBJECT',
          'name': schema['queryType']['name']
        }
      };
    }

    // If there is a mutation type, add it to the root fields.
    if (schema['mutationType'] !== null) {
      newTypes[Blockly.GraphQLBlock.ROOT_TYPE]['fields']['mutation'] = {
        'args': [],
        'description': 'A GraphQL mutation.',
        'type': {
          'kind': 'OBJECT',
          'name': schema['mutationType']['name']
        }
      };
    }

    // Replace the old types with the new types.
    schema['types'] = newTypes;

    // Store the modified schema in cache.
    Blockly.GraphQLBlock.schemas[endpoint] = schema;

    // Fetch all blocks from the current workspace.
    var allBlocks = Blockly.mainWorkspace.getAllBlocks();

    // Go through blocks.
    for (var i = 0, block; block = allBlocks[i]; i++) {
      // Filter by GraphQL blocks with the matching endpoint.
      if (block.type === 'gql' && block.gqlUrl === endpoint) {
        // Inform the block that it should update its own schema.
        block.updateSchema();
      }
    }
  }, 'POST', JSON.stringify(data), headers);
};

// The GraphQL mutator for adding and removing fields.
Blockly.Blocks['gql_mutator'] = {
  init: function() {
    this.setColour(Blockly.GraphQLBlock.PRIMARY_COLOR);
    this.appendDummyInput().appendField('field');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('Add a field to this object.');
    this.contextMenu = false;
  }
};

// The GraphQL null argument shadow block, which represents the default value of a nullable type.
Blockly.Blocks['gql_null'] = {
  init: function() {
    this.setColour(Blockly.GraphQLBlock.PRIMARY_COLOR);
    this.appendDummyInput().appendField('null');
    this.setOutput(true);
    this.setShadow(true);
  }
};

// The base GraphQL block type.
Blockly.Blocks['gql'] = {
  gqlTypeToYailType: function(typeString) {
    // Strip out the not null character at the end.
    if (typeString.endsWith('!')) {
      typeString = typeString.substring(0, typeString.length - 1);
    }

    // Check for list type.
    if (typeString.startsWith('[') && typeString.endsWith(']')) {
      return 'list';
    }

    // Check for primitive types, defaulting to any for unknown types.
    switch (typeString) {
      case 'Int':
      case 'Float':
        return 'number';
      case 'ID':
      case 'String':
        return 'text';
      case 'Boolean':
        return 'boolean';
      default:
        return 'any';
    }
  },

  gqlTypeToBlocklyType: function(gqlType) {
    var yailType = this.gqlTypeToYailType(gqlType);
    return Blockly.Blocks.Utilities.YailTypeToBlocklyType(yailType, Blockly.Blocks.Utilities.INPUT);
  },

  mutationToDom: function() {
    // Create a new mutation element to store data.
    var mutation = document.createElement('mutation');

    // Set basic attributes for this block shared by all GraphQL blocks.
    mutation.setAttribute('gql_url', this.gqlUrl);
    mutation.setAttribute('gql_name', this.gqlName);

    // Only non-fragments have parents.
    if (this.gqlParent !== null) {
      mutation.setAttribute('gql_parent', this.gqlParent);
    }

    // If this block has fields, store its field count.
    if (this.gqlHasFields) {
      mutation.setAttribute('gql_fields', this.itemCount_);
    }

    // Set parameters if they exist.
    for (var i = 0; i < this.gqlParameters.length; i++) {
      var gqlParameter = document.createElement('gql_parameter');

      // Add parameter attributes.
      gqlParameter.setAttribute('gql_name', this.gqlParameters[i].gqlName);
      gqlParameter.setAttribute('gql_type', this.gqlParameters[i].gqlType);

      // Add parameter to mutation.
      mutation.appendChild(gqlParameter);
    }

    return mutation;
  },

  domToMutation: function(xmlElement) {
    // Extract basic mutation attributes shared by all GraphQL blocks.
    this.gqlUrl = xmlElement.getAttribute('gql_url');
    this.gqlName = xmlElement.getAttribute('gql_name');
    this.gqlParent = xmlElement.getAttribute('gql_parent') || null;

    // Determine whether the block is an object or a scalar.
    this.gqlHasFields = xmlElement.hasAttribute('gql_fields');

    // Get any parameters for this GraphQL block.
    var gqlParameterElements = xmlElement.getElementsByTagName('gql_parameter');
    this.gqlParameters = [];

    // Populate parameters if any exist.
    for (var i = 0; i < gqlParameterElements.length; i++) {
      this.gqlParameters.push({
        gqlName: gqlParameterElements[i].getAttribute('gql_name'),
        gqlType: gqlParameterElements[i].getAttribute('gql_type')
      });
    }

    // Set the color of the block to a beautiful GraphQL pink.
    this.setColour(Blockly.GraphQLBlock.PRIMARY_COLOR);

    // Add the title row.
    var title = this.appendDummyInput('GQL_TITLE');

    // For fragments, add prefix.
    if (this.gqlParent === null) {
      title.appendField('... on');
    }

    // Add title field.
    title.appendField(this.gqlName, 'GQL_TITLE_FIELD');

    // Add any parameters if they exist.
    for (var i = 0; i < this.gqlParameters.length; i++) {
      // Create the parameter.
      var parameter = this.appendValueInput('GQL_PARAMETER' + i)
        .appendField(this.gqlParameters[i].gqlName)
        .setAlign(Blockly.ALIGN_RIGHT)
        .setCheck(['String']);

      // For fields that can be null, add a shadow block.
      if (this.gqlParameters[i].gqlType.endsWith('!')) {
        var nullArgument = this.workspace.newBlock('gql_null');
        nullArgument.outputConnection.connect(parameter.connection);
      }
    }

    // The return type of the block is a string.
    this.setOutput(['String']);

    // For non-scalar blocks, users should be able add and remove fields.
    if (this.gqlHasFields) {
      // Initialize required mutator parameters.
      this.emptyInputName = null;
      this.repeatingInputName = 'GQL_FIELD';
      this.itemCount_ = parseInt(xmlElement.getAttribute('gql_fields'));

      // Set mutator.
      this.setMutator(new Blockly.Mutator(['gql_mutator']));

      // Populate initial field value inputs.
      for (var i = 0; i < this.itemCount_; i++) {
        this.addInput(i);
      }
    }

    // Try to perform a schema update.
    this.updateSchema();
  },

  warnings: [{name: 'checkGql'}],

  updateContainerBlock: function(containerBlock) {
    containerBlock.setFieldValue('object', 'CONTAINER_TEXT');
    containerBlock.setTooltip('Add, remove, or reorder fields to reconfigure this GraphQL block.');
  },

  compose: Blockly.compose,
  decompose: function(workspace) {
    return Blockly.decompose(workspace, 'gql_mutator', this);
  },

  saveConnections: Blockly.saveConnections,

  addEmptyInput: function() {
  },
  addInput: function(inputNumber) {
    return this.appendIndentedValueInput(this.repeatingInputName + inputNumber);
  },

  onchange: function(e) {
    // Don't trigger error or warning checks on transient actions.
    if (e.isTransient) {
      return false;
    }

    // Perform error and warning checking.
    return this.workspace.getWarningHandler() && this.workspace.getWarningHandler().checkErrors(this);
  },

  updateSchema: function() {
    // If there is no schema, we can't update yet.
    if (!Blockly.GraphQLBlock.schemas.hasOwnProperty(this.gqlUrl)) {
      return;
    }

    // Fetch the schema.
    var schema = Blockly.GraphQLBlock.schemas[this.gqlUrl];

    // Get the base type for fragments.
    if (this.gqlParent === null) {
      // Perform type existence check on fragments.
      if (!schema.types.hasOwnProperty(this.gqlName)) {
        console.log('The fragment base type "' + this.gqlName + '" no longer exists.');
        return;
      }

      // The base type is the name.
      this.gqlBaseType = this.gqlName;
    }

    // Get the base type for non-fragments.
    else {
      // Perform parent type existence check on non-fragments.
      if (this.gqlParent !== null && !schema.types.hasOwnProperty(this.gqlParent)) {
        console.log('The parent base type "' + this.gqlParent + '" no longer exists.');
        return;
      }

      // Get the parent type.
      var parentType = schema.types[this.gqlParent];

      // Perform field existence check.
      if (!parentType.fields.hasOwnProperty(this.gqlName)) {
        console.log('The field "' + this.gqlName + '" no longer exists for the type "' + this.gqlParent + '".');
        return;
      }

      // Get own type reference, which must exist relative to parent assuming that the schema is well-formed.
      var rootTypeRef = parentType.fields[this.gqlName].type;
      var typeRef = Blockly.GraphQLBlock.traverseTypeRef(rootTypeRef);

      // Set the type name.
      this.gqlBaseType = typeRef.name;
    }

    // Fetch the actual type object associated with this block's GraphQL type.
    var type = schema.types[this.gqlBaseType];

    // Perform field existence type check.
    if (type.kind === 'OBJECT' && !this.gqlHasFields || type.kind === 'SCALAR' && this.gqlHasFields) {
      console.log('Field existence mismatch.');
      return;
    }

    // Get the title input.
    var titleInput = this.getInput('GQL_TITLE');

    // If we are an object, enable field autocompletion.
    if (this.gqlHasFields) {
      var gqlFlydown = new Blockly.GqlFlydown(this.gqlName, this.gqlUrl, this.gqlBaseType);
      titleInput.removeField('GQL_TITLE_FIELD');
      titleInput.appendField(gqlFlydown, 'GQL_TITLE_FIELD');
    }

    // Get the description for fragments.
    if (this.gqlParent === null) {
      // TODO(bobbyluig)
    }

    // Get the description for non-fragments.
    else {
      // Fetch the description from the parent type information.
      var description = parentType.fields[this.gqlName].description;

      // Update description if available.
      if (description !== null) {
        this.setTooltip(description);
      }
    }

    // Perform error and warning checking.
    this.workspace.getWarningHandler() && this.workspace.getWarningHandler().checkErrors(this);
  }
};

Blockly.GqlFlydown = function(name, gqlUrl, gqlBaseType) {
  this.gqlUrl = gqlUrl;
  this.gqlBaseType = gqlBaseType;

  Blockly.GqlFlydown.superClass_.constructor.call(this, name, false, null);
};

goog.inherits(Blockly.GqlFlydown, Blockly.FieldFlydown);

Blockly.GqlFlydown.prototype.fieldCSSClassName = 'blocklyGqlField';
Blockly.GqlFlydown.prototype.flyoutCSSClassName = 'blocklyGqlFlydown';

Blockly.GqlFlydown.prototype.flydownBlocksXML_ = function() {
  // Create a new root element.
  var xml = document.createElement('xml');

  // Get all blocks.
  var blocks = Blockly.GraphQLBlock.buildTypeBlocks(this.gqlUrl, this.gqlBaseType);

  // Add all blocks to the root.
  for (var i = 0, block; block = blocks[i]; i++) {
    xml.appendChild(block);
  }

  // Return the string representation of the element.
  return xml.outerHTML;
};
