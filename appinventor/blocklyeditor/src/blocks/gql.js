'use strict';

goog.provide('AI.Blockly.Blocks.gql');
goog.provide('AI.Blockly.GraphQL');
goog.require('AI.Blockly.FieldFlydown');
goog.require('Blockly.Blocks.Utilities');

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

// Check for type compatibility.
Blockly.GraphQLBlock.checkType = function(childConnection, parentConnection) {
  // Get the child and parent source blocks.
  var childBlock = childConnection.sourceBlock_;
  var parentBlock = parentConnection.sourceBlock_;

  // Degrade to a normal type check for parent blocks that do not require special validation.
  if (parentBlock.typeName !== 'GraphQL' && parentBlock.type !== 'gql') {
    return parentConnection.check_.indexOf('gql') !== -1;
  }

  // If the parent block is the query method, perform root and endpoint checking.
  if (parentBlock.typeName === 'GraphQL') {
    // Fetch the endpoint of the instance block.
    var uid = childBlock.workspace.componentDb_.getUidForName(parentBlock.instanceName);
    var endpoint = Blockly.GraphQLBlock.instances[uid];

    // Determine if the endpoints match.
    if (endpoint !== childBlock.gqlUrl) {
      return false;
    }

    // Fetch the schema for the endpoint.
    var schema = Blockly.GraphQLBlock.schemas[endpoint];

    // Only perform root checking for updated schemas.
    if (schema === undefined) {
      return true;
    }

    // Determine if the block is a valid root field.
    if (!schema.types[Blockly.GraphQLBlock.ROOT_TYPE].fields.hasOwnProperty(childBlock.gqlName)) {
      return false;
    }

    // All checks passed.
    return true;
  }

  // Check endpoint compatibility.
  if (childBlock.gqlUrl !== parentBlock.gqlUrl) {
    return false;
  }

  // Object type checking is only valid on blocks with an updated schema.
  if (childBlock.gqlBaseType === undefined || parentBlock.gqlBaseType === undefined) {
    return true;
  }

  // Fetch the schema.
  var schema = Blockly.GraphQLBlock.schemas[childBlock.gqlUrl];

  // Perform checking on fragments.
  if (childBlock.gqlParent === null) {
    // Get the parent type reference.
    var parentTypeRef = schema.types[parentBlock.gqlBaseType];

    // Get the parent type name and possible types.
    var allPossibleTypes = (parentTypeRef.possibleTypes || []).slice(0);
    allPossibleTypes.push(parentTypeRef);

    // Locate valid type.
    var validType = goog.array.find(allPossibleTypes, function(type) {
      return Blockly.GraphQLBlock.traverseTypeRef(type).name === childBlock.gqlBaseType;
    });

    // Check for type validity.
    if (!validType) {
      return false;
    }
  }

  // Perform checking on non-fragments.
  else {
    // Fetch the parent type, which must exist.
    var parentType = schema.types[childBlock.gqlParent];

    // Check for field validity.
    if (childBlock.gqlParent !== parentBlock.gqlBaseType || !parentType.fields.hasOwnProperty(childBlock.gqlName)) {
      return false;
    }
  }

  // All checks passed.
  return true;
};

// Register an instance with an endpoint.
Blockly.GraphQLBlock.registerInstance = function(uid, endpointUrl, httpHeaders) {
  // Add instance.
  Blockly.GraphQLBlock.instances[uid] = endpointUrl;

  // Update (or fetch) the schema for the associated endpoint
  Blockly.GraphQLBlock.updateSchema(endpointUrl, httpHeaders);
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

// Create a default argument block if possible.
Blockly.GraphQLBlock.defaultArgument = function(typeRef, defaultValue) {
  // No need to handle null default values.
  if (defaultValue === null) {
    return null;
  }

  // Create a block.
  var block = document.createElement('block');

  // Get top level type.
  var type = (typeRef.kind === 'NON_NULL') ? typeRef.ofType : typeRef;

  // Handle booleans.
  if (type.name === 'Boolean') {
    // Set type.
    block.setAttribute('type', 'logic_boolean');

    // Create field with value.
    var field = document.createElement('field');
    field.setAttribute('name', 'BOOL');
    field.innerText = defaultValue.toString().toUpperCase();

    // Add field to block.
    block.appendChild(field);
  }

  // Handle numbers.
  else if (type.name === 'Int' || type.name === 'Float') {
    // Set type.
    block.setAttribute('type', 'math_number');

    // Create field with value.
    var field = document.createElement('field');
    field.setAttribute('name', 'NUM');
    field.innerText = defaultValue.toString();

    // Add field to block.
    block.appendChild(field);
  }

  // Handle strings.
  else if (type.name === 'String' || type.name === 'ID') {
    // Set type.
    block.setAttribute('type', 'text');

    // Create field with value.
    var field = document.createElement('field');
    field.setAttribute('name', 'TEXT');
    field.innerText = defaultValue.slice(1, defaultValue.length - 1);

    // Add field to block.
    block.appendChild(field);
  }

  // Handle arrays.
  else if (Object.prototype.toString.call(defaultValue) === '[object Array]') {
    // TODO(bobbyluig): Handle default arguments for array type.
    return null;
  }

  // Handle objects.
  else {
    // TODO(bobbyluig): Handle objects when dictionary support is merged.
    return null;
  }

  return block;
};

// Traverses a type reference to get a type string.
Blockly.GraphQLBlock.typeString = function(typeRef) {
  // Handle not null types.
  if (typeRef.kind === 'NON_NULL') {
    return Blockly.GraphQLBlock.typeString(typeRef.ofType) + '!';
  }

  // Handle list types.
  if (typeRef.kind === 'LIST') {
    return '[' + Blockly.GraphQLBlock.typeString(typeRef.ofType) + ']';
  }

  // Handle base case.
  return typeRef.name;
};

// Creates a list of block elements from a given type.
Blockly.GraphQLBlock.buildTypeBlocks = function(gqlUrl, gqlBaseType) {
  // Fetch the associated type.
  var schema = Blockly.GraphQLBlock.schemas[gqlUrl];
  var type = schema.types[gqlBaseType];

  // Create an array to store blocks.
  var blocks = [];

  // Get all fields for the type.
  var allFields = [];
  for (var field in type.fields) {
    if (type.fields.hasOwnProperty(field)) {
      allFields.push(field);
    }
  }

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

      // Create a new parameter value.
      var gqlValue = document.createElement('value');
      gqlValue.setAttribute('name', 'GQL_PARAMETER' + j);

      // For fields that can be null, add a shadow block.
      if (!fullType.endsWith('!')) {
        // Create a new shadow block.
        var nullBlock = document.createElement('shadow');
        nullBlock.setAttribute('type', 'gql_null');

        // Add shadow block to parameter.
        gqlValue.appendChild(nullBlock);
      }

      // Create a default argument block if possible.
      var defaultArgument = Blockly.GraphQLBlock.defaultArgument(arg.type, arg.defaultValue);

      // If the default argument block exists, add it to the value.
      if (defaultArgument !== null) {
        gqlValue.appendChild(defaultArgument);
      }

      // Add parameter to mutation.
      mutation.appendChild(gqlParameter);

      // If the value is not empty, add it to the block.
      if (gqlValue.childNodes.length > 0) {
        block.appendChild(gqlValue);
      }
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
Blockly.GraphQLBlock.updateSchema = function(endpoint, headers) {
  // Build post data.
  var data = {
    'query': Blockly.GraphQLBlock.INTROSPECTION_QUERY,
    'operationName': 'IntrospectionQuery'
  };

  // Parse headers.
  var headers = (!!headers) ? JSON.parse(headers) : {};

  // Set content type.
  headers['content-type'] = 'application/json; charset=utf-8';

  // Create a new request object.
  var xhr = new XMLHttpRequest();

  // Response handler.
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      // Check if there were any errors sending the requests.
      if (xhr.status !== 200) {
        console.log('Introspection query for ' + endpoint + ' failed with error code ' + xhr.status + '.');
        return;
      }

      // Get the response, which is in JSON format.
      var response = JSON.parse(xhr.responseText);

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

        // Add the __typename field.
        newFields['__typename'] = {
          'name': '___typename',
          'description': null,
          'args': [],
          'type': {
            'kind': 'NON_NULL',
            'name': null,
            'ofType': {
              'kind': 'SCALAR',
              'name': 'String',
              'ofType': null
            }
          },
          'isDeprecated': false,
          'deprecationReason': null
        };

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

      // If the workspace was already injected, update the schema on the appropriate blocks.
      if (Blockly.mainWorkspace != null) {
        // Fetch all blocks from the current workspace.
        var allBlocks = Blockly.mainWorkspace.getAllBlocks();

        // Go through blocks.
        for (var i = 0, block; block = allBlocks[i]; i++) {
          // Filter by GraphQL blocks.
          if (block.type === 'gql') {
            // Inform the block that it should update its own schema.
            block.updateSchema();
          }
        }
      }
    }
  };

  // Send an introspection query.
  xhr.open('POST', endpoint);

  // Set headers.
  for (var name in headers) {
    if (headers.hasOwnProperty(name)) {
      xhr.setRequestHeader(name, headers[name]);
    }
  }

  // Send body.
  xhr.send(JSON.stringify(data));
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

// Converts a full type string to its corresponding Yail type.
Blockly.GraphQLBlock.gqlTypeToYailType = function(typeString) {
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
      return 'text';
  }
};

// Convert a full type string to its corresponding Blockly type.
Blockly.GraphQLBlock.gqlTypeToBlocklyType = function(typeString) {
  var yailType = Blockly.GraphQLBlock.gqlTypeToYailType(typeString);
  return Blockly.Blocks.Utilities.YailTypeToBlocklyType(yailType, Blockly.Blocks.Utilities.INPUT);
};

// The base GraphQL block type.
Blockly.Blocks['gql'] = {
  helpUrl: function() {
    var prefix = 'https://graphql-docs.com/docs/';

    if (this.gqlParent === null) {
      prefix += this.gqlName + '/';
    } else if (this.gqlParent !== Blockly.GraphQLBlock.ROOT_TYPE) {
      prefix += this.gqlParent + '/';
    }

    return prefix + '?graphqlUrl=' + this.gqlUrl;
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
    // Mutations must be idempotent for undo and redo to work correctly. The only mutation that can be applied by the
    // user is a change in the number of fields.
    if (this.gqlHasFields) {
      // Remove all old fields.
      for (var i = 0; i < this.itemCount_; i++) {
        this.removeInput(this.repeatingInputName + i);
      }

      // Update field count.
      this.itemCount_ = parseInt(xmlElement.getAttribute('gql_fields'));

      // Create new fields.
      for (var i = 0; i < this.itemCount_; i++) {
        this.addInput(i);
      }

      // There are no more mutations to apply. Nothing else could have been changed by the user.
      return;
    }

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
      // Create the parameter with the appropriate type checks.
      // TODO(bobbyluig): Do type checks only with full type reference when dictionary support arrives.
      this.appendValueInput('GQL_PARAMETER' + i)
        .appendField(this.gqlParameters[i].gqlName)
        .setAlign(Blockly.ALIGN_RIGHT)
        .setCheck([Blockly.GraphQLBlock.gqlTypeToBlocklyType(this.gqlParameters[i].gqlType), 'gql_null']);
    }

    // The return type of the block is initially gql.
    this.setOutput(true, ['gql']);

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
    return this.appendIndentedValueInput(this.repeatingInputName + inputNumber).setCheck(['gql']);
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
      // Remove the old title field and replace it with a flydown field.
      var flydown = new Blockly.GqlFlydown(this.gqlName, this.gqlUrl, this.gqlBaseType);
      titleInput.removeField('GQL_TITLE_FIELD');
      titleInput.appendField(flydown, 'GQL_TITLE_FIELD');

      // In order to correctly compute the width of the flydown, this block needs to be rendered when the workspace is
      // shown the next time.
      if (this.rendered) {
        this.workspace.blocksNeedingRendering.push(this);
      }
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

    // Set the output to allow for enhanced type checking.
    this.setOutput(true, [Blockly.GraphQLBlock.checkType]);
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
