package com.sample.workflow;

import java.util.ArrayList;
import java.util.List;

import javax.net.ssl.SSLContext;

import org.activiti.engine.delegate.DelegateExecution;
import org.activiti.engine.delegate.Expression;
import org.activiti.engine.delegate.JavaDelegate;
import org.apache.http.HttpHeaders;
import org.apache.http.NameValuePair;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.conn.ssl.TrustSelfSignedStrategy;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.ssl.SSLContextBuilder;
import org.apache.http.ssl.TrustStrategy;
import org.apache.http.util.EntityUtils;
import org.apache.log4j.Logger;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;

public class WorkflowCompleteTask implements JavaDelegate {
    private Expression consumerKey;
    private Expression consumerSecret;
    private Expression callbackEndpoint;
    private Expression tokenEndpoint;
    private Expression approvalState;
    private Expression referenceId;

    static Logger log = Logger.getLogger(WorkflowCompleteTask.class.getName());

    @Override
    public void execute(DelegateExecution execution) {
        String id = (String) consumerKey.getValue(execution);
        String secret = (String) consumerSecret.getValue(execution);
        String tokenEp = (String) tokenEndpoint.getValue(execution);
        String state = (String) approvalState.getValue(execution);
        String callbackEp = (String) callbackEndpoint.getValue(execution);
        String ref = (String) referenceId.getValue(execution);

        try {
            String accessToken = getAccessToken(tokenEp, id, secret);
            if (accessToken != null) {
                completeWorkflow(callbackEp, accessToken, ref, state);
            }
        } catch (Exception e) {
            log.error("Error while completing the workflow " + e);
        }
    }

    public Expression getConsumerKey() {
        return consumerKey;
    }

    public void setConsumerKey(Expression consumerKey) {
        this.consumerKey = consumerKey;
    }

    public Expression getConsumerSecret() {
        return consumerSecret;
    }

    public void setConsumerSecret(Expression consumerSecret) {
        this.consumerSecret = consumerSecret;
    }

    public Expression getCallbackEndpoint() {
        return callbackEndpoint;
    }

    public void setCallbackEndpoint(Expression callbackEndpoint) {
        this.callbackEndpoint = callbackEndpoint;
    }

    public Expression getTokenEndpoint() {
        return tokenEndpoint;
    }

    public void setTokenEndpoint(Expression tokenEndpoint) {
        this.tokenEndpoint = tokenEndpoint;
    }

    public Expression getApprovalState() {
        return approvalState;
    }

    public void setApprovalState(Expression approvalState) {
        this.approvalState = approvalState;
    }

    public Expression getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(Expression referenceId) {
        this.referenceId = referenceId;
    }

    private static String getAccessToken(String url, String clientId, String clientSecret) throws Exception {

        String result = "";
        HttpPost post = new HttpPost(url);

        // add request parameters or form parameters
        List<NameValuePair> urlParameters = new ArrayList<>();
        urlParameters.add(new BasicNameValuePair("grant_type", "client_credentials"));
        urlParameters.add(new BasicNameValuePair("scope", "apim:api_workflow_approve"));
        urlParameters.add(new BasicNameValuePair("client_id", clientId));
        urlParameters.add(new BasicNameValuePair("client_secret", clientSecret));

        post.setEntity(new UrlEncodedFormEntity(urlParameters));

        try (CloseableHttpClient httpClient = getClient(); CloseableHttpResponse response = httpClient.execute(post)) {
            result = EntityUtils.toString(response.getEntity());
            if (200 == response.getStatusLine().getStatusCode()) {
                Object obj = new JSONParser().parse(result);
                JSONObject jsonObj = (JSONObject) obj;
                return (String) jsonObj.get("access_token");
            } else {
                log.error("Error while getting the access token . Response: " + result);
                return null;
            }

        }
    }

    private static int completeWorkflow(String url, String accessToken, String referenceId, String state)
            throws Exception {

        int result;
        HttpPost post = new HttpPost(url + "?workflowReferenceId=" + referenceId);

        post.setHeader(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken);
        JSONObject payloadObj = new JSONObject();
        payloadObj.put("status", state);

        StringEntity requestEntity = new StringEntity(payloadObj.toJSONString(), ContentType.APPLICATION_JSON);
        post.setEntity(requestEntity);
        try (CloseableHttpClient httpClient = getClient(); CloseableHttpResponse response = httpClient.execute(post)) {
            result = response.getStatusLine().getStatusCode();
            if (result != 200) {
                log.error("Workflow not completed for " + referenceId + ". Response:  " + result);
            }

        }
        return result;
    }

    public static void main(String[] args) {
        try {
            String accessToken = getAccessToken("https://localhost:8243/token", "TMEc68doOp14nZzBo0TqnZtLN58a",
                    "orVhwN4U0wp0ZLzCf71b52nefbMa");
            System.out.println(accessToken);
            System.out
                    .println(completeWorkflow("https://localhost:9443/api/am/admin/v1/workflows/update-workflow-status",
                            accessToken, "dddddddd", "APPROVED"));
        } catch (Exception e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
    }

    private static CloseableHttpClient getClient() throws Exception {
    	
    	TrustStrategy acceptingTrustStrategy = new TrustSelfSignedStrategy();
        SSLContext sslContext = org.apache.http.ssl.SSLContexts.custom().loadTrustMaterial(null, acceptingTrustStrategy)
                .build();

        SSLConnectionSocketFactory csf = new SSLConnectionSocketFactory(sslContext, NoopHostnameVerifier.INSTANCE);
        CloseableHttpClient httpClient = HttpClients.custom().setSSLSocketFactory(csf).build();

    	return httpClient;
    	/*
        org.apache.http.ssl.SSLContextBuilder sslContextBuilder = SSLContextBuilder.create();
        sslContextBuilder.loadTrustMaterial(new org.apache.http.conn.ssl.TrustSelfSignedStrategy());
        SSLContext sslContext = sslContextBuilder.build();
        org.apache.http.conn.ssl.SSLConnectionSocketFactory sslSocketFactory = new SSLConnectionSocketFactory(
                sslContext, new org.apache.http.conn.ssl.DefaultHostnameVerifier());
        return HttpClients.custom().setSSLHostnameVerifier(NoopHostnameVerifier.INSTANCE)
                .setSSLSocketFactory(sslSocketFactory).build();
                */
    }

}
