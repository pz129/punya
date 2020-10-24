package com.google.appinventor.components.runtime;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.google.appinventor.components.annotations.DesignerComponent;
import com.google.appinventor.components.annotations.DesignerProperty;
import com.google.appinventor.components.annotations.SimpleFunction;
import com.google.appinventor.components.annotations.SimpleObject;
import com.google.appinventor.components.annotations.SimpleProperty;
import com.google.appinventor.components.annotations.UsesActivities;
import com.google.appinventor.components.annotations.UsesAssets;
import com.google.appinventor.components.annotations.androidmanifest.ActivityElement;
import com.google.appinventor.components.common.ComponentCategory;
import com.google.appinventor.components.common.PropertyTypeConstants;
import com.google.appinventor.components.common.PunyaVersion;
import com.google.appinventor.components.runtime.util.ErrorMessages;
import com.google.appinventor.components.runtime.util.JsonUtil;
import com.google.appinventor.components.runtime.util.YailDictionary;
import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.rdf.model.ModelFactory;
import com.hp.hpl.jena.rdf.model.Resource;
import com.hp.hpl.jena.rdf.model.Statement;
import com.hp.hpl.jena.sparql.vocabulary.FOAF;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import org.json.JSONException;

@DesignerComponent(
    version = PunyaVersion.SOLID_COMPONENT_VERSION,
    nonVisible = true,
    iconName = "images/solid.png",
    category = ComponentCategory.LINKEDDATA)
@SimpleObject
//@UsesAssets(fileNames = "solid.html")
@UsesActivities(activities = {
    @ActivityElement(name = "com.google.appinventor.components.runtime.SOLID$LoginActivity")
})
public class SOLID extends LinkedDataBase<Model> implements ActivityResultListener {

  private boolean cacheAuth = true;
  private YailDictionary authDetails = null;
  private String webId = "";
  private boolean writePending = false;
  private final Executor threadPool = Executors.newSingleThreadExecutor();

  /**
   * Creates a new AndroidNonvisibleComponent.
   *
   * @param parent the container that this component will be placed in
   */
  public SOLID(ComponentContainer<?> parent) {
    super(parent.$form(), ModelFactory.createDefaultModel());
  }

  /// region Properties

  @SimpleProperty
  public boolean Authenticated() {
    return true;
  }

  @SimpleProperty
  public boolean CacheAuthentication() {
    return cacheAuth;
  }

  @DesignerProperty(editorType = PropertyTypeConstants.PROPERTY_TYPE_BOOLEAN,
      defaultValue = "True")
  @SimpleProperty
  public void CacheAuthentication(boolean cache) {
    cacheAuth = cache;
  }

  @SimpleProperty
  public String WebID() {
    return webId;
  }

  @DesignerProperty(editorType = PropertyTypeConstants.PROPERTY_TYPE_ASSET)
  @SimpleProperty
  public void WebID(String webId) {
    this.webId = webId;
  }

  @SimpleProperty
  public String Name() {
    Resource subject = model.getResource(webId);
    Statement name =  model.getProperty(subject, FOAF.name);
    if (name != null) {
      return name.getObject().toString();
    }
    return "";
  }

  /// endregion

  /// region Methods

  public void Login() {
    Intent intent = new Intent(form, LoginActivity.class);
  }

  public void Logout() {
    authDetails = null;
    model.removeAll();
    if (cacheAuth) {
      SharedPreferences prefs = form.getSharedPreferences("__", Context.MODE_PRIVATE);
      prefs.edit().clear().apply();
    }
  }

  public Object GetProperty(String subject, String property) {
    return null;
  }

  public List<Object> GetPropertyValues(String subject, String property) {
    return null;
  }

  @SimpleFunction
  public void SaveForm(LinkedDataForm form) {
    startUpdate();
  }

  @SimpleFunction
  public void SetObjectProperty(String subject, String property, String object) {
    startUpdate();
  }

  @SimpleFunction
  public void SetDataProperty(String subject, String property, String value, String type) {
    startUpdate();
  }

  @SimpleFunction
  public void RemoveProperty(String subject, String property) {
    startUpdate();
  }

  @SimpleFunction
  public void RemoveObjectStatement(String subject, String property, String object) {
    startUpdate();
  }

  @SimpleFunction
  public void RemoveDataStatement(String subject, String property, String value, String type) {
    startUpdate();
  }

  /// endregion

  /// region Events

  public void LoggedIn() {
    EventDispatcher.dispatchEvent(this, "LoggedIn");
  }

  public void ErrorOccurred(String message) {
    EventDispatcher.dispatchEvent(this, "ErrorOccurred", message);
  }

  /// endregion

  private void startUpdate() {
    if (!writePending) {
      writePending = true;
      threadPool.execute(new Runnable() {
        @Override
        public void run() {
          try {
            updateRemote();
          } catch (Exception e) {
            form.dispatchErrorOccurredEvent(SOLID.this, "Update", ErrorMessages.ERROR_SOLID_UPDATE_FAILED, e.getLocalizedMessage());
          } finally {
            writePending = false;
          }
        }
      });
    }
  }

  private void updateRemote() {
  }

  @Override
  public void resultReturned(int requestCode, int resultCode, Intent data) {
    String authData = data.getStringExtra("authData");
    try {
      authDetails = (YailDictionary) JsonUtil.getObjectFromJson(authData, true);
    } catch (JSONException e) {
      e.printStackTrace();
    }
  }

  public static class LoginActivity extends AppInventorCompatActivity {
    @Override
    public void onCreate(Bundle icicle) {
      super.onCreate(icicle);
      WebView webview = new WebView(this);
      webview.getSettings().setJavaScriptEnabled(true);
      webview.setWebViewClient(new WebViewClient() {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
          Uri uri = Uri.parse(url);
          String scheme = uri.getScheme();
          if (Form.APPINVENTOR_URL_SCHEME.equals(scheme)) {
            Intent resultIntent = new Intent();
            resultIntent.putExtra("authData", "");
            setResult(RESULT_OK, resultIntent);
            finish();
          } else {
            view.loadUrl(url);
          }
          return true;
        }
      });
      setContentView(webview);
    }
  }
}
