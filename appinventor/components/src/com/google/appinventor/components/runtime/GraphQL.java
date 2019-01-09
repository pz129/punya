package com.google.appinventor.components.runtime;

import android.app.Activity;
import android.os.Handler;
import android.util.Log;
import com.google.appinventor.components.annotations.DesignerComponent;
import com.google.appinventor.components.annotations.DesignerProperty;
import com.google.appinventor.components.annotations.PropertyCategory;
import com.google.appinventor.components.annotations.SimpleEvent;
import com.google.appinventor.components.annotations.SimpleFunction;
import com.google.appinventor.components.annotations.SimpleObject;
import com.google.appinventor.components.annotations.SimpleProperty;
import com.google.appinventor.components.annotations.UsesLibraries;
import com.google.appinventor.components.annotations.UsesPermissions;
import com.google.appinventor.components.common.ComponentCategory;
import com.google.appinventor.components.common.PropertyTypeConstants;
import com.google.appinventor.components.common.YaVersion;
import com.google.appinventor.components.runtime.util.JsonUtil;
import com.google.gson.Gson;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.json.JSONException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * The {@link GraphQL} component communicates with a GraphQL endpoint to execute queries and mutations. It represents
 * returned data as a dictionary. All queries have an associated operation name and are executed asynchronously.
 * Completed queries trigger different events depending on whether there the queries had any errors.
 *
 * @author lujingcen@gmail.com (Lujing Cen)
 */
@DesignerComponent(version = YaVersion.GRAPHQL_COMPONENT_VERSION,
    description = "Non-visible component that interacts with a GraphQL endpoint.",
    designerHelpDescription = "Non-visible component that interacts with a GraphQL endpoint.",
    category = ComponentCategory.EXPERIMENTAL,
    nonVisible = true,
    iconName = "images/graphQL.png")
@SimpleObject
@UsesPermissions(permissionNames = "android.permission.INTERNET")
@UsesLibraries(libraries = "okhttp.jar, okio.jar, gson-2.8.5.jar")
public class GraphQL extends AndroidNonvisibleComponent implements Component {
  private static final String LOG_TAG = "GraphQL";

  private static final OkHttpClient CLIENT = new OkHttpClient();
  private static final MediaType JSON_CONTENT_TYPE = MediaType.parse("application/json");

  private final Handler androidUIHandler;
  private final Activity activity;
  private final Gson gson;

  private String endpointURL;

  /**
   * Creates a new GraphQL component.
   *
   * @param container the form that this component is contained in.
   */
  public GraphQL(ComponentContainer container) {
    super(container.$form());

    this.androidUIHandler = new Handler();
    this.activity = container.$context();
    this.gson = new Gson();

    // Log creation of component.
    Log.d(LOG_TAG, "Created GraphQL component.");
  }

  /**
   * Getter for the GraphQL endpoint URL.
   *
   * @return the URL for this GraphQL endpoint.
   */
  @SimpleProperty(category = PropertyCategory.BEHAVIOR,
      description = "Gets the URL for this GraphQL endpoint.",
      userVisible = false)
  public String GqlEndpointUrl() {
    return endpointURL;
  }

  /**
   * Specifies the URL for this GraphQL endpoint.
   *
   * @param gqlUrl the URL for this GraphQL endpoint.
   */
  @DesignerProperty(editorType = PropertyTypeConstants.PROPERTY_TYPE_STRING)
  @SimpleProperty(description = "Sets the URL for this GraphQL endpoint.")
  public void GqlEndpointUrl(final String gqlUrl) {
    endpointURL = gqlUrl;

    // Log URL change.
    Log.d(LOG_TAG, "Endpoint URL changed to " + gqlUrl + ".");
  }

  /**
   * Triggers an event indicating that the given operation has successfully executed and returned data. This method
   * should be executed in the application's main thread.
   *
   * @param gqlQueryName the query name associated with this event.
   * @param gqlResponse  a non-empty response map containing data from executing the associated query.
   */
  @SimpleEvent(description = "Event triggered by the \"Query\" method.")
  public void GqlGotResponse(final String gqlQueryName, final Object gqlResponse) {
    EventDispatcher.dispatchEvent(this, "GqlGotResponse", gqlQueryName, gqlResponse);

    // Log event dispatch.
    Log.d(LOG_TAG, "Dispatched response event for " + gqlQueryName + ".");
  }

  /**
   * Triggers an event indicating that there were one or more errors when executing the query. This method should be
   * executed in the application's main thread.
   *
   * @param gqlQueryName the query name associated with this event.
   * @param gqlError     a list of error messages, which must be non-empty.
   */
  @SimpleEvent(description = "Indicates that the GraphQL endpoint responded with an error.")
  public void GqlGotError(final String gqlQueryName, final List<String> gqlError) {
    EventDispatcher.dispatchEvent(this, "GqlGotError", gqlQueryName, gqlError);

    // Log event dispatch.
    Log.d(LOG_TAG, "Dispatched error event for " + gqlQueryName + ".");
  }

  /**
   * Executes an arbitrary query against the GraphQL endpoint.
   *
   * @param gqlQueryName the name for this query.
   * @param gqlQuery     the query string to execute.
   */
  @SimpleFunction(description = "Execute a GraphQL query against the endpoint.")
  public void GqlQuery(final String gqlQueryName, final String gqlQuery) {
    // Construct the request and callback handler.
    final Request request = buildRequest(gqlQuery, null, null);
    final GqlCallback callback = new GqlCallback(gqlQueryName);

    // Asynchronously execute request.
    CLIENT.newCall(request).enqueue(callback);

    // Log query request.
    Log.d(LOG_TAG, "Query for " + gqlQueryName + " has been enqueued.");
  }

  /**
   * Builds a new request from the input query.
   *
   * @param query         the input query string.
   * @param operationName the operation name of the query, which can be null.
   * @param variables     the variables associated with this query, which can be null.
   * @return a new request ready for execution.
   */
  private Request buildRequest(final String query, final String operationName, final Map<String, Object> variables) {
    // Construct the GraphQL query in standard JSON format.
    final Map<String, Object> queryBody = new HashMap<String, Object>();
    queryBody.put("query", query);
    queryBody.put("operationName", operationName);
    queryBody.put("variables", variables);

    // Log query.
    Log.d(LOG_TAG, "Building query " + queryBody + ".");

    // Construct the request body with the JSON media type.
    final RequestBody body = RequestBody.create(JSON_CONTENT_TYPE, gson.toJson(queryBody));

    // Build the request from the current endpoint URL and request body.
    return new Request.Builder()
        .url(endpointURL)
        .post(body)
        .build();
  }

  /**
   * A helper class to handle GraphQL callbacks by triggering the appropriate events.
   */
  private class GqlCallback implements Callback {
    private final String queryName;

    /**
     * Creates a new callback instance.
     *
     * @param queryName the query name associated with this callback.
     */
    public GqlCallback(final String queryName) {
      this.queryName = queryName;
    }

    @Override
    public void onFailure(final Call call, final IOException e) {
      // Create a list consisting of the single exception message.
      final List<String> errorMessages = Collections.singletonList(e.getMessage());

      // Post the error message on the application's main UI thread.
      androidUIHandler.post(new Runnable() {
        @Override
        public void run() {
          GqlGotError(queryName, errorMessages);
        }
      });
    }

    @Override
    public void onResponse(final Call call, final Response response) throws IOException {
      // Get the response string.
      assert response.body() != null;
      final String responseString = response.body().string();

      // Parse the response JSON into a known format for further processing.
      final GqlResponse responseMap = gson.fromJson(responseString, GqlResponse.class);

      // If there were errors, trigger the appropriate event to inform the user.
      if (responseMap.errors != null) {
        // Construct a list of error messages.
        final List<String> errorMessages = new ArrayList<String>();
        for (final GqlError error : responseMap.errors) {
          errorMessages.add(error.message);
        }

        // Post errors on the application's main UI thread.
        androidUIHandler.post(new Runnable() {
          @Override
          public void run() {
            GqlGotError(queryName, errorMessages);
          }
        });
      }

      // If there were data entries, trigger the appropriate event. Note that we do not distinguish between
      if (responseMap.data != null) {
        // Extract data from response.
        final Map<String, Object> data = responseMap.data;

        try {
          // Convert to list of list representation.
          // TODO(bobbyluig): Fix this hack.
          final Object listOfListData = JsonUtil.getObjectFromJson(gson.toJson(data));

          // Post data on the application's main UI thread.
          androidUIHandler.post(new Runnable() {
            @Override
            public void run() {
              GqlGotResponse(queryName, listOfListData);
            }
          });
        } catch (final JSONException e) {
          // Post JSON decoding error on the application's main UI thread.
          androidUIHandler.post(new Runnable() {
            @Override
            public void run() {
              GqlGotError(queryName, Collections.singletonList(e.getMessage()));
            }
          });
        }
      }

      // We are done processing the response, so close it.
      response.close();
    }
  }

  /**
   * A data class representing a GraphQL response.
   */
  private static class GqlResponse {
    public List<GqlError> errors;
    public Map<String, Object> data;
  }

  /**
   * A data class representing an error message. Note that fields aside from the message are dropped.
   */
  private static class GqlError {
    public String message;
  }
}