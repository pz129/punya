// -*- mode: java; c-basic-offset: 2; -*-
// Copyright 2012 Massachusetts Institute of Technology. All rights reserved.

/**
 * @license
 * @fileoverview Dictionaries blocks yail generators for Blockly, modified for MIT App Inventor.
 * @author data1013@mit.edu (Danny Tang)
 */

'use strict';

goog.provide('Blockly.Yail.dictionaries');

Blockly.Yail['dictionaries_create_with'] = function() {
  	var code = Blockly.Yail.YAIL_CALL_YAIL_PRIMITIVE + "make-yail-dictionary" + Blockly.Yail.YAIL_SPACER;
  	code += Blockly.Yail.YAIL_OPEN_COMBINATION + Blockly.Yail.YAIL_LIST_CONSTRUCTOR + Blockly.Yail.YAIL_SPACER;
  	var itemsAdded = 0;
  	for(var i=0;i<this.itemCount_;i++) {
    	var argument = Blockly.Yail.valueToCode(this, 'ADD' + i, Blockly.Yail.ORDER_NONE) || null;
    	if(argument != null){
      		code += argument + Blockly.Yail.YAIL_SPACER;
      		itemsAdded++;
    	}
  	}
  	code += Blockly.Yail.YAIL_CLOSE_COMBINATION + Blockly.Yail.YAIL_SPACER + Blockly.Yail.YAIL_QUOTE + Blockly.Yail.YAIL_OPEN_COMBINATION;
  	for(var i=0;i<itemsAdded;i++) {
    	code += "pair" + Blockly.Yail.YAIL_SPACER;
  	}
  	code += Blockly.Yail.YAIL_CLOSE_COMBINATION;
  	code += Blockly.Yail.YAIL_SPACER + Blockly.Yail.YAIL_DOUBLE_QUOTE + "make a dictionary" + Blockly.Yail.YAIL_DOUBLE_QUOTE + Blockly.Yail.YAIL_CLOSE_COMBINATION;
  	return [ code, Blockly.Yail.ORDER_ATOMIC ];
};

// var code = Blockly.Yail.YAIL_CALL_YAIL_PRIMITIVE + "make-yail-list" + Blockly.Yail.YAIL_SPACER;
//   code += Blockly.Yail.YAIL_OPEN_COMBINATION + Blockly.Yail.YAIL_LIST_CONSTRUCTOR + Blockly.Yail.YAIL_SPACER;
//   var itemsAdded = 0;
//   for(var i=0;i<this.itemCount_;i++) {
//     var argument = Blockly.Yail.valueToCode(this, 'ADD' + i, Blockly.Yail.ORDER_NONE) || null;
//     if(argument != null){
//       code += argument + Blockly.Yail.YAIL_SPACER;
//       itemsAdded++;
//     }
//   }
//   code += Blockly.Yail.YAIL_CLOSE_COMBINATION + Blockly.Yail.YAIL_SPACER + Blockly.Yail.YAIL_QUOTE + Blockly.Yail.YAIL_OPEN_COMBINATION;
//   for(var i=0;i<itemsAdded;i++) {
//     code += "any" + Blockly.Yail.YAIL_SPACER;
//   }
//   code += Blockly.Yail.YAIL_CLOSE_COMBINATION;
//   code += Blockly.Yail.YAIL_SPACER + Blockly.Yail.YAIL_DOUBLE_QUOTE + "make a list" + Blockly.Yail.YAIL_DOUBLE_QUOTE + Blockly.Yail.YAIL_CLOSE_COMBINATION;
//   return [ code, Blockly.Yail.ORDER_ATOMIC ];

Blockly.Yail['pair'] = function() {
  var argument0 = Blockly.Yail.valueToCode(this, 'KEY', Blockly.Yail.ORDER_NONE) || null;
  var argument1 = Blockly.Yail.valueToCode(this, 'VALUE', Blockly.Yail.ORDER_NONE) || null;
  var code = Blockly.Yail.YAIL_CALL_YAIL_PRIMITIVE + "make-yail-pair" + Blockly.Yail.YAIL_SPACER;
  code = code + Blockly.Yail.YAIL_OPEN_COMBINATION + Blockly.Yail.YAIL_LIST_CONSTRUCTOR + Blockly.Yail.YAIL_SPACER;
  code = code + argument0 + Blockly.Yail.YAIL_SPACER + argument1 + Blockly.Yail.YAIL_SPACER + Blockly.Yail.YAIL_CLOSE_COMBINATION;
  code = code + Blockly.Yail.YAIL_SPACER + Blockly.Yail.YAIL_QUOTE + Blockly.Yail.YAIL_OPEN_COMBINATION;
  code = code + "key any" + Blockly.Yail.YAIL_CLOSE_COMBINATION + Blockly.Yail.YAIL_SPACER;
  code = code + Blockly.Yail.YAIL_SPACER + Blockly.Yail.YAIL_DOUBLE_QUOTE + "make a pair" + Blockly.Yail.YAIL_DOUBLE_QUOTE + Blockly.Yail.YAIL_CLOSE_COMBINATION;
  return [ code, Blockly.Yail.ORDER_ATOMIC ];
}

Blockly.Yail['dictionary_lookup'] = function() {
	// Lookup in pairs in list of lists (key, value).
	var argument0 = Blockly.Yail.valueToCode(this, 'KEY', Blockly.Yail.ORDER_NONE) || Blockly.Yail.YAIL_FALSE;
	var argument1 = Blockly.Yail.valueToCode(this, 'DICT', Blockly.Yail.ORDER_NONE) || Blockly.Yail.emptyDictCode;    //TODO: define empty dict code
	var argument2 = Blockly.Yail.valueToCode(this, 'NOTFOUND', Blockly.Yail.ORDER_NONE) || Blockly.Yail.YAIL_NULL;
	var code = Blockly.Yail.YAIL_CALL_YAIL_PRIMITIVE + "yail-dictionary-lookup" + Blockly.Yail.YAIL_SPACER;
	code = code + Blockly.Yail.YAIL_OPEN_COMBINATION + Blockly.Yail.YAIL_LIST_CONSTRUCTOR + Blockly.Yail.YAIL_SPACER;
	code = code + argument0 + Blockly.Yail.YAIL_SPACER + argument1 + Blockly.Yail.YAIL_SPACER + argument2 + Blockly.Yail.YAIL_CLOSE_COMBINATION;
	code = code + Blockly.Yail.YAIL_SPACER + Blockly.Yail.YAIL_QUOTE + Blockly.Yail.YAIL_OPEN_COMBINATION;
	code = code + "any any any" + Blockly.Yail.YAIL_CLOSE_COMBINATION + Blockly.Yail.YAIL_SPACER;
	code = code + Blockly.Yail.YAIL_SPACER + Blockly.Yail.YAIL_DOUBLE_QUOTE + "dictionary lookup" + Blockly.Yail.YAIL_DOUBLE_QUOTE + Blockly.Yail.YAIL_CLOSE_COMBINATION;
	return [ code, Blockly.Yail.ORDER_ATOMIC ];
};
