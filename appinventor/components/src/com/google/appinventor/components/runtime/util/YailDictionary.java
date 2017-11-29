// -*- mode: java; c-basic-offset: 2; -*-
// Copyright 2009-2011 Google, All Rights reserved
// Copyright 2011-2012 MIT, All rights reserved
// Released under the Apache License, Version 2.0
// http://www.apache.org/licenses/LICENSE-2.0

package com.google.appinventor.components.runtime.util;

import com.google.appinventor.components.runtime.errors.YailRuntimeError;
import com.google.appinventor.components.runtime.Form;

import org.json.JSONException;

import java.util.Collection;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Iterator;

import android.util.Log;

/**
 * The YailList is a wrapper around the gnu.list.Pair class used
 * by the Kawa framework. YailList is the main list primitive used
 * by App Inventor components.
 *
 */
public class YailDictionary extends HashMap {

  private static final String LOG_TAG = "YailDictionary";

  // Component writers take note!
  // If you want to pass back a list to the blocks language, the
  // straightforward way to do this is simply to pass
  // back an ArrayList.  If you construct a YailList to return
  // to codeblocks, you must guarantee that the elements of the list
  // are "sanitized".  That is, you must pass back a tree whose
  // subtrees are themselves YailLists, and whose leaves are all
  // legitimate Yail data types.  See the definition of sanitization
  // in runtime.scm.

  /**
   * Create an empty YailDictionary.
   */
  public YailDictionary() {
    super();
    //super(YailConstants.YAIL_HEADER, LList.Empty);
  }

  public YailDictionary(HashMap<Object, Object> prevMap) {
    super(prevMap);
  }

  /**
   * Create an empty YailDictionary.
   */
  public static YailDictionary makeDictionary() {
    return new YailDictionary();
  }

  public static YailDictionary makeDictionary(HashMap<Object, Object> prevMap) {
    return new YailDictionary(prevMap);
  }

  public static YailDictionary makeDictionary(List<YailList> pairs) {
    HashMap<Object, Object> map = new HashMap();

    for (int i = 0; i < pairs.size(); i++) {
      YailList currentYailList = pairs.get(i);
      map.put(currentYailList.getObject(0), currentYailList.getObject(1));
    }

    return new YailDictionary(map);
  }

  public void setPairs(List<YailList> pairs) {
    for (int i = 0; i < pairs.size(); i++) {
      YailList currentYailList = pairs.get(i);
      this.put(currentYailList.getObject(0), currentYailList.getObject(1));
    }
  }

  public void deletePairs(List<Object> keys) {
    for (int i = 0; i < keys.size(); i++) {
      Object currentKey = keys.get(i);
      this.remove(currentKey);
    }
  }

  public Object recursiveGet(List<Object> keys) {
    Map currentMap = this;
    Object output = null;

    Iterator itr = keys.iterator();

    while (itr.hasNext()) {
        Object currentKey = itr.next();
        output = currentMap.get(currentKey);

        if (output instanceof Map) {
          currentMap = (Map) output;
        } else {
          if (itr.hasNext()) {
            return null;
          }
        }
    }

    return output;
  }
  
  @Override
  public String toString() {    
    try {
      Form currentForm = Form.getActiveForm();

      String jsonRep = JsonUtil.getJsonRepresentation(this);

      if (currentForm.ShowListsAsJson()) {
        //currentForm.ShowListsAsJson(false);
        return jsonRep;
      } else {
        //currentForm.ShowListsAsJson(true);
        Object jsonObject = JsonUtil.getObjectFromJson(jsonRep);
        return jsonObject.toString();
      }
    } catch (JSONException e) {
      throw new YailRuntimeError("YailDictionary failed to convert to string.", "toString Error.");
    }
  }
}
