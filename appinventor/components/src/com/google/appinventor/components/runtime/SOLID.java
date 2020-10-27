package com.google.appinventor.components.runtime;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.text.TextUtils;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.google.appinventor.components.annotations.DesignerComponent;
import com.google.appinventor.components.annotations.DesignerProperty;
import com.google.appinventor.components.annotations.PropertyCategory;
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
import com.hp.hpl.jena.rdf.model.Literal;
import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.rdf.model.ModelFactory;
import com.hp.hpl.jena.rdf.model.Property;
import com.hp.hpl.jena.rdf.model.Resource;
import com.hp.hpl.jena.rdf.model.Statement;
import com.hp.hpl.jena.sparql.vocabulary.FOAF;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

@DesignerComponent(
    version = PunyaVersion.SOLID_COMPONENT_VERSION,
    nonVisible = true,
    iconName = "images/solid.png",
    category = ComponentCategory.LINKEDDATA)
@SimpleObject
@UsesAssets(fileNames = "popup.html")
@UsesActivities(activities = {
    @ActivityElement(name = "com.google.appinventor.components.runtime.SOLID$LoginActivity")
})
public class SOLID extends LinkedDataBase<Model> implements ActivityResultListener {

  private static final String LOG_TAG = SOLID.class.getSimpleName();

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
  @SimpleProperty(category = PropertyCategory.BEHAVIOR)
  public void CacheAuthentication(boolean cache) {
    cacheAuth = cache;
  }

  @SimpleProperty
  public String WebID() {
    return webId;
  }

  @DesignerProperty(editorType = PropertyTypeConstants.PROPERTY_TYPE_ASSET)
  @SimpleProperty(category = PropertyCategory.BEHAVIOR)
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

  public void AddObjectStatement(String subject, String property, String object) {
    Resource s = model.getResource(subject);
    Property p = model.getProperty(property);
    Resource o = model.getResource(object);
    model.add(s, p, o);
  }

  public void AddDataStatement(String subject, String property, String object, String dataType) {
    Resource s = model.getResource(subject);
    Property p = model.getProperty(property);
    Literal o;
    if (TextUtils.isEmpty(dataType)) {
      o = model.createLiteral(object);
    } else {
      o = model.createTypedLiteral(object, dataType);
    }
    model.add(s, p, o);
  }

  public void AddLanguageStatement(String subject, String property, String object, String language) {
    Resource s = model.getResource(subject);
    Property p = model.getProperty(property);
    Literal o;
    if (TextUtils.isEmpty(language)) {
      o = model.createLiteral(object);
    } else {
      o = model.createLiteral(object, language);
    }
    model.add(s, p, o);
  }

  @SimpleFunction
  public void Login() {
    Intent intent = new Intent(form, LoginActivity.class);
    form.startActivityForResult(intent, 9999);
  }

  @SimpleFunction
  public void Logout() {
    authDetails = null;
    model.removeAll();
    if (cacheAuth) {
      SharedPreferences prefs = form.getSharedPreferences("__", Context.MODE_PRIVATE);
      prefs.edit().clear().apply();
    }
  }

  @SimpleFunction
  public void ReadGraph(String relativePath) {
  }

  @SimpleFunction
  public void WriteGraph(String relativePath) {
  }

  @SimpleFunction
  public Object GetProperty(String subject, String property) {
    return null;
  }

  @SimpleFunction
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
    private WebView webview;

    @Override
    public void onCreate(Bundle icicle) {
      super.onCreate(icicle);
      webview = new WebView(this);
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

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
          Log.d(LOG_TAG, "Loading " + request.getUrl().toString());
          if (request.getUrl().toString().equals("http://localhost/popup.html")) {
            try {
              return new WebResourceResponse("text/html", "utf-8", LoginActivity.this.getAssets().open("popup.html"));
            } catch (IOException e) {
              Log.e(LOG_TAG, "Unable to read popup.html", e);
              return super.shouldInterceptRequest(view, request);
            }
          }
          return super.shouldInterceptRequest(view, request);
        }
      });
      webview.addJavascriptInterface(new FakeOpener(), "SOLID");
      setContentView(webview);
      webview.loadUrl("http://localhost/popup.html");
      WebView.setWebContentsDebuggingEnabled(true);
    }

    public class FakeOpener {
      SharedPreferences prefs = getSharedPreferences("solid-auth-client", MODE_PRIVATE);

      @JavascriptInterface
      public void postMessage(String args) {
        Log.d(LOG_TAG, "message = " + args);
        try {
          JSONObject object = new JSONObject(args);
          object = object.getJSONObject("solid-auth-client");
          String message = object.getString("method");
          if ("getAppOrigin".equals(message)) {
            JSONObject response = new JSONObject();
            response.put("id", object.getDouble("id"));
            response.put("ret", getApplication().getPackageName());
            JSONObject wrapper = new JSONObject();
            wrapper.put("solid-auth-client", response);
            final String wrapperStr = wrapper.toString();
            runOnUiThread(new Runnable() {
              @Override
              public void run() {
                webview.evaluateJavascript("window.dispatchEvent(new MessageEvent('message', {data:" + wrapperStr + "}))", null);
              }
            });
          } else if ("getLoginOptions".equals(message)) {
            JSONObject response = new JSONObject();
            response.put("popupUri", "http://localhost/popup.html");
            response.put("callbackUri", "http://localhost/popup.html");
            JSONObject ret = new JSONObject();
            ret.put("id", object.getDouble("id"));
            ret.put("ret", response);
            JSONObject wrapper = new JSONObject();
            wrapper.put("solid-auth-client", ret);
            final String wrapperStr = wrapper.toString();
            runOnUiThread(new Runnable() {
              @Override
              public void run() {
                webview.evaluateJavascript("window.dispatchEvent(new MessageEvent('message', {data:" + wrapperStr + "}))", null);
              }
            });
          } else if ("storage/getItem".equals(message)) {
            JSONArray actionArgs = object.getJSONArray("solid-auth-client");
            String resultData = prefs.getString(actionArgs.getString(0), "");
            JSONObject ret = new JSONObject();
            ret.put("id", object.getDouble("id"));
            ret.put("ret", resultData);
            JSONObject wrapper = new JSONObject();
            wrapper.put("solid-auth-client", ret);
            final String wrapperStr = wrapper.toString();
            runOnUiThread(new Runnable() {
              @Override
              public void run() {
                webview.evaluateJavascript("window.dispatchEvent(new MessageEvent('message', {data:" + wrapperStr + "}))", null);
              }
            });
          } else if ("storage/setItem".equals(message)) {
          } else if ("storage/removeItem".equals(message)) {
          } else {
            Log.w(LOG_TAG, "Unknown message " + message);
          }
        } catch (JSONException e) {
          e.printStackTrace();
        }
      }

      @JavascriptInterface
      public void gotSession(String auth) {
        Log.d(LOG_TAG, "session = " + auth);
        final Intent result = new Intent();
        result.putExtra("auth", auth);
        runOnUiThread(new Runnable() {
          @Override
          public void run() {
            setResult(RESULT_OK, result);
            finish();
          }
        });
      }
    }
  }
}
