package com.google.appinventor.client.editor.simple.components;

import com.google.appinventor.client.Ode;
import com.google.appinventor.client.editor.simple.SimpleComponentDatabase;
import com.google.appinventor.client.editor.simple.SimpleEditor;
import com.google.appinventor.client.editor.youngandroid.YaBlocksEditor;
import com.google.appinventor.client.properties.json.ClientJsonParser;
import com.google.appinventor.shared.simple.ComponentDatabaseInterface;
import com.google.gwt.user.client.ui.Image;
import com.google.gwt.user.client.ui.Widget;

public class MockGraphQL extends MockNonVisibleComponent {

  public static final String TYPE = "GraphQL";
  private static final String PROPERTY_NAME_GQL_ENDPOINT_URL = "GqlEndpointUrl";

  /**
   * Creates a new instance of a non-visible component whose icon is loaded dynamically (not part of the icon image
   * bundle).
   */
  public MockGraphQL(SimpleEditor editor, String type, Image iconImage) {
    super(editor, type, iconImage);
  }

  @Override
  public void onComponentCreated() {
    super.onComponentCreated();

    // Update schema.
    onPropertyChange(PROPERTY_NAME_GQL_ENDPOINT_URL, getPropertyValue(PROPERTY_NAME_GQL_ENDPOINT_URL));
  }

  @Override
  public void onPropertyChange(String propertyName, String newValue) {
    super.onPropertyChange(propertyName, newValue);

    // If the property change was the endpoint, update the schema.
    if (PROPERTY_NAME_GQL_ENDPOINT_URL.equals(propertyName) && !newValue.isEmpty()) {
      updateSchema(newValue);
    }
  }


  /**
   * Updates the schema of this component.
   *
   * @param url the endpoint to use.
   */
  private native void updateSchema(String url) /*-{
    var uid = this.@com.google.appinventor.client.editor.simple.components.MockGraphQL::getUuid()();
    // Update the schema and register this block.
    Blockly.GraphQLBlock.updateSchema(url);
    Blockly.GraphQLBlock.registerInstance(uid, url);
  }-*/;
}