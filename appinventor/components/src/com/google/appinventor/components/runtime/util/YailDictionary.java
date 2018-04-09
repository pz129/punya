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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Iterator;
import java.util.Set;

import android.util.Log;

/**
 * The YailList is a wrapper around the gnu.list.Pair class used
 * by the Kawa framework. YailList is the main list primitive used
 * by App Inventor components.
 *
 */
public class YailDictionary extends LinkedHashMap {

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

  public YailDictionary(LinkedHashMap<Object, Object> prevMap) {
    super(prevMap);
  }

  /**
   * Create an empty YailDictionary.
   */
  public static YailDictionary makeDictionary() {
    return new YailDictionary();
  }

  public static YailDictionary makeDictionary(LinkedHashMap<Object, Object> prevMap) {
    return new YailDictionary(prevMap);
  }

  public static YailDictionary makeDictionary(List<YailList> pairs) {
    LinkedHashMap<Object, Object> map = new LinkedHashMap();

    for (int i = 0; i < pairs.size(); i++) {
      YailList currentYailList = pairs.get(i);
      Object currentKey = currentYailList.getObject(0);
      Object currentValue = currentYailList.getObject(1);

      if (currentValue instanceof YailList) {
        Log.e(LOG_TAG, "List is: " + currentValue);
      }

      map.put(currentKey, currentValue);
    }

    return new YailDictionary(map);
  }

  private static Boolean isAlist(YailList yailList) {
    Iterator itr = yailList.iterator();
    Object yailListHeader = itr.next();

    while(itr.hasNext()) {
      Object currentPair = itr.next();

      if (!(currentPair instanceof YailList)) {
        return false;
      }

      if (!(((YailList) currentPair).size() == 2)) {
        return false;
      }
    }

    return true;
  }

  public static YailDictionary alistToDict(YailList alist) {
    LinkedHashMap<Object, Object> map = new LinkedHashMap();

    Iterator itr = alist.iterator();
    Object yailListHeader = itr.next();

    while(itr.hasNext()) {
      YailList currentPair = (YailList) itr.next();

      Object currentKey = currentPair.getObject(0);
      Object currentValue = currentPair.getObject(1);

      if (currentValue instanceof YailList && isAlist((YailList) currentValue)) {
        map.put(currentKey, alistToDict((YailList) currentValue));
      } else {
        if (currentValue instanceof YailList) {
          Log.e(LOG_TAG, "List is: " + currentValue);
        }

        map.put(currentKey, currentValue);
      }
    }

    return new YailDictionary(map);
  }

  public static YailList dictToAlist(YailDictionary dict) {
    List<Object> list = new ArrayList();

    Set<Object> keys = dict.keySet();
    Iterator itr = keys.iterator();

    while(itr.hasNext()) {
      Object currentKey = itr.next();
      Object currentValue = dict.get(currentKey);

      List<Object> currentPair = new ArrayList();
      currentPair.add(currentKey);

      if (currentValue instanceof YailDictionary) {
        currentPair.add(dictToAlist((YailDictionary) currentValue));
      } else {
        currentPair.add(currentValue);
      }

      list.add(YailList.makeList(currentPair));
    }

    return YailList.makeList(list);
  }

  public void setPair(YailList pair) {
    this.put(pair.getObject(0), pair.getObject(1));
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

      Log.e(LOG_TAG, "--------BEFORE GET JSON REP----------");

      String jsonRep = JsonUtil.getJsonRepresentation(this);

      Log.e(LOG_TAG, "--------AFTER GET JSON REP----------");

      if (currentForm.ShowListsAsJson()) {
        return jsonRep;
      } else {
        Object jsonObject = JsonUtil.getObjectFromJson(jsonRep);
        return jsonObject.toString();
      }
    } catch (JSONException e) {
      throw new YailRuntimeError("YailDictionary failed to convert to string.", "toString Error.");
    }
  }
}
