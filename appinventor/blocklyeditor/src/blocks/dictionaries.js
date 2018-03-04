// -*- mode: java; c-basic-offset: 2; -*-
// Copyright 2013-2014 MIT, All rights reserved
// Released under the Apache License, Version 2.0
// http://www.apache.org/licenses/LICENSE-2.0
/**
 * @license
 * @fileoverview Dictionaries blocks for Blockly, modified for MIT App Inventor.
 * @author data1013@mit.edu (Danny Tang)
 */

'use strict';

goog.provide('Blockly.Blocks.dictionaries');

goog.require('Blockly.Blocks.Utilities');

Blockly.Blocks['dictionaries_create_with'] = {
  // Create a dictionary with any number of pairs of any type.
  category: 'Dictionaries',
  //helpUrl: Blockly.Msg.LANG_DICTIONARIES_CREATE_WITH_EMPTY_HELPURL,
  init: function() {
    this.setColour(Blockly.DICTIONARY_CATEGORY_HUE);
    this.appendValueInput('ADD0')
        .appendField(Blockly.Msg.LANG_DICTIONARIES_CREATE_WITH_TITLE_MAKE_DICTIONARY)
        .setCheck(Blockly.Blocks.Utilities.YailTypeToBlocklyType("pair",Blockly.Blocks.Utilities.INPUT));
    this.appendValueInput('ADD1')
        .setCheck(Blockly.Blocks.Utilities.YailTypeToBlocklyType("pair",Blockly.Blocks.Utilities.INPUT));
    this.setOutput(true, Blockly.Blocks.Utilities.YailTypeToBlocklyType("dictionary",Blockly.Blocks.Utilities.OUTPUT));
    this.setMutator(new Blockly.Mutator(['dictionaries_create_with_pair']));
    this.setTooltip(Blockly.Msg.LANG_DICTIONARIES_CREATE_WITH_TOOLTIP);
    this.itemCount_ = 2;
    this.emptyInputName = 'EMPTY';
    this.repeatingInputName = 'ADD';
  },
  mutationToDom: Blockly.mutationToDom,
  domToMutation: Blockly.domToMutation,
  decompose: function(workspace){
    return Blockly.decompose(workspace,'dictionaries_create_with_pair',this);
  },
  compose: Blockly.compose,
  saveConnections: Blockly.saveConnections,
  addEmptyInput: function(){
    this.appendDummyInput(this.emptyInputName)
      .appendField(Blockly.Msg.LANG_DICTIONARIES_CREATE_EMPTY_TITLE);
  },
  addInput: function(inputNum){
    var input = this.appendValueInput(this.repeatingInputName + inputNum)
        .setCheck(Blockly.Blocks.Utilities.YailTypeToBlocklyType("pair",Blockly.Blocks.Utilities.INPUT));
    if(inputNum === 0){
      input.appendField(Blockly.Msg.LANG_DICTIONARIES_CREATE_WITH_TITLE_MAKE_DICTIONARY);
    }
    return input;
  },
  updateContainerBlock: function(containerBlock) {
    containerBlock.setFieldValue(Blockly.Msg.LANG_DICTIONARIES_CREATE_WITH_CONTAINER_TITLE_ADD,"CONTAINER_TEXT");
    containerBlock.setTooltip(Blockly.Msg.LANG_DICTIONARIES_CREATE_WITH_CONTAINER_TOOLTIP);
  },
  // create type blocks for both make a dictionary (two pairs) and create empty dictionary
  typeblock: [
      { translatedName: Blockly.Msg.LANG_DICTIONARIES_CREATE_WITH_TITLE_MAKE_DICTIONARY,
        mutatorAttributes: { items: 2 } },
      { translatedName: Blockly.Msg.LANG_DICTIONARIES_CREATE_EMPTY_TITLE,
        mutatorAttributes: { items: 0 } }]
};

Blockly.Blocks['dictionaries_create_with_pair'] = {
  // Add pairs.
  init: function() {
    this.setColour(Blockly.DICTIONARY_CATEGORY_HUE);
    this.appendDummyInput()
        .appendField(Blockly.Msg.LANG_DICTIONARIES_CREATE_WITH_PAIR_TITLE);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip(Blockly.Msg.LANG_DICTIONARIES_CREATE_WITH_PAIR_TOOLTIP);
    this.contextMenu = false;
  }
};

Blockly.Blocks['pair'] = {
  category: 'Dictionaries',
  init: function() {
    this.setColour(Blockly.DICTIONARY_CATEGORY_HUE);
    this.setOutput(true, Blockly.Blocks.Utilities.YailTypeToBlocklyType("pair",Blockly.Blocks.Utilities.OUTPUT));
    var checkTypeAny = Blockly.Blocks.Utilities.YailTypeToBlocklyType("any",Blockly.Blocks.Utilities.INPUT);
    var checkTypeKey = Blockly.Blocks.Utilities.YailTypeToBlocklyType("key",Blockly.Blocks.Utilities.INPUT);
    this.interpolateMsg(Blockly.Msg.LANG_DICTIONARIES_PAIRS_INPUT,
            ['KEY', checkTypeKey, Blockly.ALIGN_RIGHT],
            ['VALUE', checkTypeAny, Blockly.ALIGN_RIGHT],
            Blockly.ALIGN_RIGHT);
    this.setTooltip(Blockly.Msg.LANG_DICTIONARIES_PAIRS_TOOLTIP);
    this.setInputsInline(false);
  },
  typeblock: [{ translatedName: Blockly.Msg.LANG_DICTIONARIES_MAKE_PAIR_TITLE }]
};

Blockly.Blocks['dictionaries_set_pair'] = {
  category: 'Dictionaries',
  //helpUrl: Blockly.Msg.LANG_LISTS_ADD_ITEMS_HELPURL,
  init: function() {
    this.setColour(Blockly.DICTIONARY_CATEGORY_HUE);  //TODO: set actual color
    var checkTypeDict = Blockly.Blocks.Utilities.YailTypeToBlocklyType("dictionary",Blockly.Blocks.Utilities.INPUT);
    var checkTypePair = Blockly.Blocks.Utilities.YailTypeToBlocklyType("pair",Blockly.Blocks.Utilities.INPUT);
    this.interpolateMsg(Blockly.Msg.LANG_DICTIONARIES_SET_PAIR_INPUT,
            ['DICT', checkTypeDict, Blockly.ALIGN_RIGHT],
            ['PAIR', checkTypePair, Blockly.ALIGN_RIGHT],
            Blockly.ALIGN_RIGHT);
    this.setTooltip(Blockly.Msg.LANG_DICTIONARIES_SET_PAIR_TOOLTIP);
    this.setInputsInline(false);
  },
  typeblock: [{ translatedName: Blockly.Msg.LANG_DICTIONARIES_SET_PAIR_TITLE }]
};

Blockly.Blocks['dictionaries_delete_pair'] = {
  category: 'Dictionaries',
  //helpUrl: Blockly.Msg.LANG_LISTS_ADD_ITEMS_HELPURL,
  init: function() {
    this.setColour(Blockly.DICTIONARY_CATEGORY_HUE);  //TODO: set actual color
    var checkTypeDict = Blockly.Blocks.Utilities.YailTypeToBlocklyType("dictionary",Blockly.Blocks.Utilities.INPUT);
    var checkTypeKey = Blockly.Blocks.Utilities.YailTypeToBlocklyType("key",Blockly.Blocks.Utilities.INPUT);
    this.interpolateMsg(Blockly.Msg.LANG_DICTIONARIES_DELETE_PAIR_INPUT,
            ['DICT', checkTypeDict, Blockly.ALIGN_RIGHT],
            ['KEY', checkTypeKey, Blockly.ALIGN_RIGHT],
            Blockly.ALIGN_RIGHT);
    this.setTooltip(Blockly.Msg.LANG_DICTIONARIES_DELETE_PAIR_TOOLTIP);
    this.setInputsInline(false);
  },
  typeblock: [{ translatedName: Blockly.Msg.LANG_DICTIONARIES_DELETE_PAIR_TITLE }]
};

Blockly.Blocks['dictionary_lookup'] = {
  // Look up in a dictionary.
  category: 'Dictionaries',
  //helpUrl : Blockly.Msg.LANG_LISTS_LOOKUP_IN_PAIRS_HELPURL,
  init: function() {
    this.setColour(Blockly.DICTIONARY_CATEGORY_HUE);	//TODO: set actual color
    this.setOutput(true, Blockly.Blocks.Utilities.YailTypeToBlocklyType("any",Blockly.Blocks.Utilities.OUTPUT));
    var checkTypeDict = Blockly.Blocks.Utilities.YailTypeToBlocklyType("dictionary",Blockly.Blocks.Utilities.INPUT);
    var checkTypeAny = Blockly.Blocks.Utilities.YailTypeToBlocklyType("any",Blockly.Blocks.Utilities.INPUT);
    var checkTypeKey = Blockly.Blocks.Utilities.YailTypeToBlocklyType("key",Blockly.Blocks.Utilities.INPUT);
    this.interpolateMsg(Blockly.Msg.LANG_DICTIONARIES_DICTIONARY_LOOKUP_INPUT,
            ['KEY', checkTypeKey, Blockly.ALIGN_RIGHT],
            ['DICT', checkTypeDict, Blockly.ALIGN_RIGHT],
            ['NOTFOUND', checkTypeAny, Blockly.ALIGN_RIGHT],
            Blockly.ALIGN_RIGHT);
    this.setTooltip(Blockly.Msg.LANG_DICTIONARIES_DICTIONARY_LOOKUP_TOOLTIP);
    this.setInputsInline(false);
  },
  typeblock: [{ translatedName: Blockly.Msg.LANG_DICTIONARIES_DICTIONARY_LOOKUP_TITLE }]
};

Blockly.Blocks['dictionary_recursive_lookup'] = {
  // Look up in a dictionary.
  category: 'Dictionaries',
  //helpUrl : Blockly.Msg.LANG_LISTS_LOOKUP_IN_PAIRS_HELPURL,
  init: function() {
    this.setColour(Blockly.DICTIONARY_CATEGORY_HUE);  //TODO: set actual color
    this.setOutput(true, Blockly.Blocks.Utilities.YailTypeToBlocklyType("any",Blockly.Blocks.Utilities.OUTPUT));
    var checkTypeDict = Blockly.Blocks.Utilities.YailTypeToBlocklyType("dictionary",Blockly.Blocks.Utilities.INPUT);
    var checkTypeAny = Blockly.Blocks.Utilities.YailTypeToBlocklyType("any",Blockly.Blocks.Utilities.INPUT);
    var checkTypeList = Blockly.Blocks.Utilities.YailTypeToBlocklyType("list",Blockly.Blocks.Utilities.INPUT);
    this.interpolateMsg(Blockly.Msg.LANG_DICTIONARIES_DICTIONARY_RECURSIVE_LOOKUP_INPUT,
            ['KEYS', checkTypeList, Blockly.ALIGN_RIGHT],
            ['DICT', checkTypeDict, Blockly.ALIGN_RIGHT],
            ['NOTFOUND', checkTypeAny, Blockly.ALIGN_RIGHT],
            Blockly.ALIGN_RIGHT);
    this.setTooltip(Blockly.Msg.LANG_DICTIONARIES_DICTIONARY_RECURSIVE_LOOKUP_TOOLTIP);
    this.setInputsInline(false);
  },
  typeblock: [{ translatedName: Blockly.Msg.LANG_DICTIONARIES_DICTIONARY_RECURSIVE_LOOKUP_TITLE }]
};

Blockly.Blocks['dictionaries_getters'] = {
  // Advanced math operators with single operand.
  category: 'Dictionaries',
  // helpUrl: function () {
  //   var mode = this.getFieldValue('OP');
  //   return Blockly.Blocks.dictionaries_getters.HELPURLS()[mode];
  // },
  init: function () {
    this.setColour(Blockly.DICTIONARY_CATEGORY_HUE);
    this.setOutput(true, Blockly.Blocks.Utilities.YailTypeToBlocklyType("list", Blockly.Blocks.Utilities.OUTPUT));
    this.appendValueInput('DICT')
        .setCheck(Blockly.Blocks.Utilities.YailTypeToBlocklyType("dictionary", Blockly.Blocks.Utilities.INPUT))
        .appendField(new Blockly.FieldDropdown(this.OPERATORS), 'OP');
    // Assign 'this' to a variable for use in the tooltip closure below.
    var thisBlock = this;
    this.setTooltip(function () {
      var mode = thisBlock.getFieldValue('OP');
      return Blockly.Blocks.dictionaries_getters.TOOLTIPS()[mode];
    });
  },
  typeblock: [{
    translatedName: Blockly.Msg.LANG_DICTIONARIES_GET_KEYS_TITLE,
    dropDown: {
      titleName: 'OP',
      value: 'KEYS'
    }
  }, {
    translatedName: Blockly.Msg.LANG_DICTIONARIES_GET_VALUES_TITLE,
    dropDown: {
      titleName: 'OP',
      value: 'VALUES'
    }
  }]
};

Blockly.Blocks.dictionaries_getters.OPERATORS = function () {
  return [[Blockly.Msg.LANG_DICTIONARIES_GET_KEYS_TITLE, 'KEYS'],
    [Blockly.Msg.LANG_DICTIONARIES_GET_VALUES_TITLE, 'VALUES']];
};

Blockly.Blocks.dictionaries_getters.TOOLTIPS = function () {
  return {
    KEYS: Blockly.Msg.LANG_DICTIONARIES_GET_KEYS_TOOLTIP,
    VALUES: Blockly.Msg.LANG_DICTIONARIES_GET_VALUES_TOOLTIP
  }
};

// Blockly.Blocks.dictionaries_getters.HELPURLS = function () {
//   return {
//     ROOT: Blockly.Msg.LANG_MATH_SINGLE_HELPURL_ROOT,
//     ABS: Blockly.Msg.LANG_MATH_SINGLE_HELPURL_ABS
//   }
// };

Blockly.Blocks['dictionaries_is_key_in'] = {
   // Checks if a key is in a dictionary
  category : 'Dictionaries',
  // helpUrl : Blockly.Msg.LANG_LISTS_IS_IN_HELPURL,
  init : function() {
    this.setColour(Blockly.DICTIONARY_CATEGORY_HUE);
    var checkTypeDict = Blockly.Blocks.Utilities.YailTypeToBlocklyType("dictionary",Blockly.Blocks.Utilities.INPUT);
    var checkTypeKey = Blockly.Blocks.Utilities.YailTypeToBlocklyType("key",Blockly.Blocks.Utilities.INPUT);
    this.interpolateMsg(Blockly.Msg.LANG_DICTIONARIES_IS_KEY_IN_INPUT,
            ['KEY', checkTypeKey, Blockly.ALIGN_RIGHT],
            ['DICT', checkTypeDict, Blockly.ALIGN_RIGHT],
            Blockly.ALIGN_RIGHT);
    this.setOutput(true, Blockly.Blocks.Utilities.YailTypeToBlocklyType("boolean",Blockly.Blocks.Utilities.OUTPUT));
    this.setTooltip(Blockly.Msg.LANG_DICTIONARIES_IS_KEY_IN_TOOLTIP);
    this.setInputsInline(false);
  },
  typeblock: [{ translatedName: Blockly.Msg.LANG_DICTIONARIES_IS_KEY_IN_TITLE }]
};

Blockly.Blocks['dictionaries_length'] = {
   // Gets all the values in a dictionary
  category : 'Dictionaries',
  //helpUrl : Blockly.Msg.LANG_LISTS_LENGTH_HELPURL,
  init : function() {
    this.setColour(Blockly.DICTIONARY_CATEGORY_HUE);
    this.setOutput(true, Blockly.Blocks.Utilities.YailTypeToBlocklyType("number",Blockly.Blocks.Utilities.OUTPUT));
    this.appendValueInput('DICT')
      .setCheck(Blockly.Blocks.Utilities.YailTypeToBlocklyType("dictionary",Blockly.Blocks.Utilities.INPUT))
      .appendField(Blockly.Msg.LANG_DICTIONARIES_LENGTH_TITLE)
      .appendField(Blockly.Msg.LANG_DICTIONARIES_LENGTH_INPUT);
    this.setTooltip(Blockly.Msg.LANG_DICTIONARIES_LENGTH_TOOLTIP);
  },
  typeblock: [{ translatedName: Blockly.Msg.LANG_DICTIONARIES_LENGTH_TITLE }]
};

Blockly.Blocks['dictionaries_alist_to_dict'] = {
   // Gets all the values in a dictionary
  category : 'Dictionaries',
  //helpUrl : Blockly.Msg.LANG_LISTS_LENGTH_HELPURL,
  init : function() {
    this.setColour(Blockly.DICTIONARY_CATEGORY_HUE);
    this.setOutput(true, Blockly.Blocks.Utilities.YailTypeToBlocklyType("dictionary",Blockly.Blocks.Utilities.OUTPUT));
    this.appendValueInput('PAIRS')
      .setCheck(Blockly.Blocks.Utilities.YailTypeToBlocklyType("list",Blockly.Blocks.Utilities.INPUT))
      .appendField(Blockly.Msg.LANG_DICTIONARIES_ALIST_TO_DICT_TITLE)
      .appendField(Blockly.Msg.LANG_DICTIONARIES_ALIST_TO_DICT_INPUT);
    this.setTooltip(Blockly.Msg.LANG_DICTIONARIES_ALIST_TO_DICT_TOOLTIP);
  },
  typeblock: [{ translatedName: Blockly.Msg.LANG_DICTIONARIES_ALIST_TO_DICT_TITLE }]
};

Blockly.Blocks['dictionaries_copy'] = {
   // Gets all the values in a dictionary
  category : 'Dictionaries',
  //helpUrl : Blockly.Msg.LANG_LISTS_LENGTH_HELPURL,
  init : function() {
    this.setColour(Blockly.DICTIONARY_CATEGORY_HUE);
    this.setOutput(true, Blockly.Blocks.Utilities.YailTypeToBlocklyType("dictionary",Blockly.Blocks.Utilities.OUTPUT));
    this.appendValueInput('DICT')
      .setCheck(Blockly.Blocks.Utilities.YailTypeToBlocklyType("dictionary",Blockly.Blocks.Utilities.INPUT))
      .appendField(Blockly.Msg.LANG_DICTIONARIES_COPY_TITLE)
      .appendField(Blockly.Msg.LANG_DICTIONARIES_COPY_INPUT);
    this.setTooltip(Blockly.Msg.LANG_DICTIONARIES_COPY_TOOLTIP);
  },
  typeblock: [{ translatedName: Blockly.Msg.LANG_DICTIONARIES_COPY_TITLE }]
};

Blockly.Blocks['dictionaries_is_dict'] = {
   // Gets all the values in a dictionary
  category : 'Dictionaries',
  //helpUrl : Blockly.Msg.LANG_LISTS_LENGTH_HELPURL,
  init : function() {
    this.setColour(Blockly.DICTIONARY_CATEGORY_HUE);
    this.setOutput(true, Blockly.Blocks.Utilities.YailTypeToBlocklyType("boolean",Blockly.Blocks.Utilities.OUTPUT));
    this.appendValueInput('THING')
      .appendField(Blockly.Msg.LANG_DICTIONARIES_IS_DICT_TITLE)
      .appendField(Blockly.Msg.LANG_DICTIONARIES_IS_DICT_INPUT);
    this.setTooltip(Blockly.Msg.LANG_DICTIONARIES_IS_DICT_TOOLTIP);
  },
  typeblock: [{ translatedName: Blockly.Msg.LANG_DICTIONARIES_IS_DICT_TITLE }]
};