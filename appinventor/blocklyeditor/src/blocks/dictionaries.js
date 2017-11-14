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

///////////////////////////////

// Blockly.Blocks['dictionaries_add_dictionaries'] = {
//   // Create a list with any number of elements of any type.
//   category: 'Lists',
//   helpUrl: Blockly.Msg.LANG_LISTS_ADD_ITEMS_HELPURL,
//   init: function() {
//     this.setColour(Blockly.LIST_CATEGORY_HUE);
//     this.appendValueInput('DICT')
//       .setCheck(Blockly.Blocks.Utilities.YailTypeToBlocklyType("list",Blockly.Blocks.Utilities.INPUT))
//       .appendField(Blockly.Msg.LANG_LISTS_ADD_ITEMS_TITLE_ADD)
//       .appendField(Blockly.Msg.LANG_LISTS_ADD_ITEMS_INPUT_LIST);
//     this.appendValueInput('ITEM0')
//       .appendField(Blockly.Msg.LANG_LISTS_ADD_ITEMS_INPUT_ITEM)
//       .setAlign(Blockly.ALIGN_RIGHT);
//     this.setPreviousStatement(true);
//     this.setNextStatement(true);
//     this.setTooltip(Blockly.Msg.LANG_LISTS_ADD_ITEMS_TOOLTIP);
//     this.setMutator(new Blockly.Mutator(['lists_add_items_item']));
//     this.itemCount_ = 1;
//     this.emptyInputName = null;
//     this.repeatingInputName = 'ITEM';
//   },
//   mutationToDom: Blockly.mutationToDom,
//   domToMutation: Blockly.domToMutation,
//   decompose: function(workspace){
//     return Blockly.decompose(workspace,'lists_add_items_item',this);
//   },
//   compose: Blockly.compose,
//   saveConnections: Blockly.saveConnections,
//   addEmptyInput: function(){},
//   addInput: function(inputNum){
//     var input = this.appendValueInput(this.repeatingInputName + inputNum);
//     input.appendField('item').setAlign(Blockly.ALIGN_RIGHT);
//     return input;
//   },
//   updateContainerBlock: function(containerBlock) {
//     containerBlock.setFieldValue(Blockly.Msg.LANG_LISTS_ADD_ITEMS_CONTAINER_TITLE_ADD,"CONTAINER_TEXT");
//     containerBlock.setTooltip(Blockly.Msg.LANG_LISTS_ADD_ITEMS_CONTAINER_TOOLTIP);
//   },
//   typeblock: [{ translatedName: Blockly.Msg.LANG_LISTS_ADD_ITEMS_TITLE_ADD }]
// };

// Blockly.Blocks['lists_add_items_item'] = {
//   // Add items.
//   init: function() {
//     this.setColour(Blockly.LIST_CATEGORY_HUE);
//     this.appendDummyInput()
//         .appendField(Blockly.Msg.LANG_LISTS_ADD_ITEM_TITLE);
//     this.setPreviousStatement(true);
//     this.setNextStatement(true);
//     this.setTooltip(Blockly.Msg.LANG_LISTS_ADD_ITEM_TOOLTIP);
//     this.contextMenu = false;
//   }
// };

//////////////////////////////

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

Blockly.Blocks['dictionaries_get_keys'] = {
   // Gets all the keys in a dictionary
  category : 'Dictionaries',
  //helpUrl : Blockly.Msg.LANG_LISTS_LENGTH_HELPURL,
  init : function() {
    this.setColour(Blockly.DICTIONARY_CATEGORY_HUE);
    this.setOutput(true, Blockly.Blocks.Utilities.YailTypeToBlocklyType("list",Blockly.Blocks.Utilities.OUTPUT));
    this.appendValueInput('DICT')
      .setCheck(Blockly.Blocks.Utilities.YailTypeToBlocklyType("dictionary",Blockly.Blocks.Utilities.INPUT))
      .appendField(Blockly.Msg.LANG_DICTIONARIES_GET_KEYS_TITLE)
      .appendField(Blockly.Msg.LANG_DICTIONARIES_GET_KEYS_INPUT);
    this.setTooltip(Blockly.Msg.LANG_DICTIONARIES_GET_KEYS_TOOLTIP);
  },
  typeblock: [{ translatedName: Blockly.Msg.LANG_DICTIONARIES_GET_KEYS_TITLE }]
};

Blockly.Blocks['dictionaries_get_values'] = {
   // Gets all the values in a dictionary
  category : 'Dictionaries',
  //helpUrl : Blockly.Msg.LANG_LISTS_LENGTH_HELPURL,
  init : function() {
    this.setColour(Blockly.DICTIONARY_CATEGORY_HUE);
    this.setOutput(true, Blockly.Blocks.Utilities.YailTypeToBlocklyType("list",Blockly.Blocks.Utilities.OUTPUT));
    this.appendValueInput('DICT')
      .setCheck(Blockly.Blocks.Utilities.YailTypeToBlocklyType("dictionary",Blockly.Blocks.Utilities.INPUT))
      .appendField(Blockly.Msg.LANG_DICTIONARIES_GET_VALUES_TITLE)
      .appendField(Blockly.Msg.LANG_DICTIONARIES_GET_VALUES_INPUT);
    this.setTooltip(Blockly.Msg.LANG_DICTIONARIES_GET_VALUES_TOOLTIP);
  },
  typeblock: [{ translatedName: Blockly.Msg.LANG_DICTIONARIES_GET_VALUES_TITLE }]
};

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
