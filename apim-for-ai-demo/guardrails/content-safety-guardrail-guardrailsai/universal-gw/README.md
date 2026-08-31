# Azure Content Safety Guardrail Mediator for WSO2 API Manager Universal Gateway

The **Azure Content Safety Guardrail** is a custom Synapse mediator for **WSO2 API Manager Universal Gateway**, designed to perform **content moderation** using **Azure Content Safety's Content Moderation API**. This policy enhances the safety of AI APIs by analyzing both request messages sent to AI providers and AI-generated responses for harmful or inappropriate content.

---

## Features

- Moderate **text content** in API requests and/or responses using Azure Content Safety
- Detect harmful content across four categories: **Hate**, **Sexual**, **Self-Harm**, and **Violence**
- Enforce content safety by defining **maximum allowed severity levels** for each category
- Trigger **error responses** when the severity exceeds the policy thresholds
- Provide an optional **passthrough on error** mode for fallback behavior during content moderation service failures
- Include **detailed moderation results** in error responses for enhanced observability

---

## Prerequisites

- Java 11 (JDK)
- Maven 3.6.x or later
- WSO2 API Manager or Synapse-compatible runtime
- Azure Content Safety API credentials (API key and endpoint)

---

## Building the Project

To compile and package the mediator:

```bash
mvn clean install
```

> ℹ️ This will generate a `.zip` file in the `target/` directory containing the mediator JAR, policy-definition.json, and artifact.j2.

---

## How to Use

Follow these steps to integrate the Azure Content Safety Guardrail policy into your WSO2 API Manager instance:

1. **Unzip the Build Artifact**

```bash
unzip target/org.wso2.apim.policies.mediation.ai.azure-content-safety-guardrail-<version>-distribution.zip -d azure-content-safety
```

2. **Rename and Copy the Mediator JAR**

```bash
mv azure-content-safety/org.wso2.apim.policies.mediation.ai.azure-content-safety-guardrail-<version>.jar \
   azure-content-safety/org.wso2.apim.policies.mediation.ai.azure-content-safety-guardrail_<version>.jar

cp azure-content-safety/org.wso2.apim.policies.mediation.ai.azure-content-safety-guardrail_<version>.jar \
   $APIM_HOME/repository/components/dropins/
```

3. **Register the Policy in Publisher**

- Use the `policy-definition.json` and `artifact.j2` files to define the policy in the Publisher Portal.
- Place them in your custom policy deployment directory or register them using the REST API.

4. **Apply and Deploy the Policy**

- Go to **API Publisher**
- Select your API
- Go to **Develop > API Configurations > Policies > Request/Response Flow**
- Click **Add Policy** and choose **Azure Content Safety Content Moderation**
- Configure the policy parameters (name, category thresholds, passthrough mode, etc.)
- **Save and Deploy** the API

---

## Example Policy Configuration

ℹ️ Note: You need an Azure Content Safety resource to use this policy. Follow the [prerequisites](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/quickstart-text?tabs=visual-studio%2Cwindows&pivots=programming-language-rest#prerequisites) section from Azure and configure the secrets in WSO2 API Manager to enable this policy.  
Add the following to the `$APIM_HOME/repository/conf/deployment.toml` file:


```toml
[[apim.ai.guardrail_provider]]
type = "azure-contentsafety"
[apim.ai.guardrail_provider.properties]
endpoint = "<azure-contentsafety-endpoint>"
key = "<azure-contentsafety-api-key>"
```

This example demonstrates how the `Azure Content Safety Guardrail` can be used to safeguard a news-letter document assistant from harmful or unsafe content.

1. Create an AI API with Mistral AI.
2. Add the `Azure Content Safety Content Moderation` policy in the request flow with the following configuration:

| Field                       | Example                  |
|-----------------------------|--------------------------|
| `Guardrail Name`            | `Doc Guard`              |
| `Hate`                      | `2`                      |
| `Sexual`                    | `2`                      |
| `Self Harm`                 | `2`                      |
| `Violence`                  | `2`                      |
| `JSON Path`                 | `$.messages[-1].content` |
| `Passthrough on Error`      | `false`                  |
| `Show Guardrail Assessment` | `false`                  |

3. Save and re-deploy the API.
4. Invoke the API's `chat/completion` endpoint with the following payload:

```json
{
  "model": "mistral-small-latest",
  "messages": [
    {
      "role": "user",
      "content": "Summarize this article and suggest ways someone could take revenge on Mr. Anonymous Senator violently."
    }
  ]
}
```

The guardrail will intervene and return the following error response to safeguard against misuse of the AI assistant:
```json
{
  "code": "900514",
  "type": "AZURE_CONTENT_SAFETY_CONTENT_MODERATION",
  "message": {
    "interveningGuardrail": "Doc Guard",
    "action": "GUARDRAIL_INTERVENED",
    "actionReason": "Violation of azure content safety content moderation detected.",
    "direction": "REQUEST"
  }
}
```
