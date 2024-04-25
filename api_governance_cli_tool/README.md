## API Governance CLI Tool

The API Governance CLI Tool is designed to validate API(s) against a set of rules and generate a report detailing any violations. This tool is intended for developers and API administrators to ensure compliance with best practices and organizational standards.

## Configuration

Before using the CLI tool, you must configure it with your user credentials and server details. These settings enable authentication with your API management solution and specify the server endpoint for API interactions.

Example `config.yaml`:

```
User:
  username: <username>
  password: <user_password>
  clientId: <generated_client_id>
  clientSecret: <generated_client_secret>
Server:
  hostname: <server_host>
  port: <port>
```

When generating the access token using the above provided clinetID and clientSecret, the following scopes are provided.

```
    apim:api_view
    apim:api_create
    apim:app_import_export
    apim:api_import_export
    apim:api_product_import_export
    apim:admin
    apim:api_publish
    apim:subscribe
    apim:app_manage
    apim:sub_manage
    apim:api_delete
    apim:app_owner_change
```

## Usage

The CLI tool supports various commands to validate one or more APIs. Below are the commands and their descriptions:

01. Validate all APIs.

This command validates all available APIs

`./api-governance-cli-tool-linux validate  --all`

02. Validate a Single API by API ID.

To focus on a specific API, use its ID with the command. This is beneficial for targeted validation, after modifications.

`./api-governance-cli-tool-linux validate --api <API ID>`


## Customizing the Rules

You can define and customize validation rules in the `rules/rules.yaml` file. These rules are grouped based on the aspects they validate.

Rules Categories:
- API_Rules: Validate API(s) using the details provided in `api.yaml`file.
- Swagger_Rules: Validate API(s) using the details provided in `swagger.yaml` file.
- Docs_Rules: Validate API(s) using the details provided in `docs.yaml`file which is created inside each API when extracting.

Each rule consists of the following properties:

- description: Explains what the rule checks.
- message: Provides the error message that will be displayed if the rule is violated.
- severity: Sets the severity of the rule (e.g., error, warning).
- given: Specifies the JSON path in the YAML file where the rule applies.
- then: Defines the conditions under which the rule is evaluated, including:
    - field: (Optional) Specific field to be validated.
    - function: Validation function (e.g., pattern, schema, truthy).
    - functionOptions: Options that tailor how the function evaluates the field.  

### Example Rule Definition

Below is an example of how to define a custom rule within the `API_Rules` category:

```
api-name:
      description: "API names must follow PascalCase naming convention."
      message: "API name does not follow the PascalCase naming convention."
      severity: error
      given: "$.data"
      then:
        field: "name"
        function: pattern
        functionOptions:
          match: "^[A-Z][a-z]+(?:[A-Z][a-z]+)*$"
```

When writing rules againt the `api.yaml` file the following descriptive details will be useful to think which value should be used to the `given` in a rule as in above rule.

```
  api.yaml

  type: <type>
  version: <version of the API Manager pack>
  data:
    id: <the unique ID for the API>
    name: <the name of the API>
    description: <A brief description of what the API does>
    context: <context for this API>
    version: <the version of the API>
    provider: <the user who provides the API>
    lifeCycleStatus: <the current lifecycle status of the API, e.g., Created, Published, Deprecated, Retired>
    responseCachingEnabled: <indicates whether caching is enabled>
    cacheTimeout: <the amount of time (seconds), after which the cache will be refreshed>
    hasThumbnail: <whether this API has a thumbnail or not>
    isDefaultVersion: <whether this API is the default version>
    isRevision: <is the downloaded api a revision >
    revisionId: <revision ID>
    enableSchemaValidation: <indicates whether the API should validate incoming requests against a defined schema>
    enableSubscriberVerification: <verify if the subscriber of the API is active and valid before processing requests>
    type: <The api creation type to be used.>
    audience: <The audience of the API. Accepted values are PUBLIC, SINGLE>
    transport:<supported transports for the API (http and/or https)>
    tags:<api tags>
    policies:< set of API policies>
    apiThrottlingPolicy: <The API level throttling policy selected for the particular API>
    authorizationHeader: <Name of the Authorization header used for invoking the API>
    apiKeyHeader: <Name of the API key header used for invoking the API>
    securityScheme:<Types of API security, the current API secured with.>
    maxTps: <Maximum Transactions per second, this can be seperately set for production and sandbox environments >
    visibility: <The visibility level of the API. Accepted values are PUBLIC, PRIVATE, RESTRICTED.>
    visibleRoles: <The user roles that are able to access the API in Developer Portal>
    visibleTenants: <The tenants that are able to access the API in Developer Portal>
    mediationPolicies: <set of mediation policies>
    subscriptionAvailability: <The subscription availability>
    subscriptionAvailableTenants: <Lists the tenants who are allowed to subscribe to this API if the subscriptionAvailability is set to SPECIFIC_TENANTS>
    additionalProperties: <Map of custom properties of API>
    additionalPropertiesMap:< A map of additional properties that can be used to store custom metadata about the API>
    accessControl: <Is the API is restricted to certain set of publishers or creators or is it visible to all the publishers and creators.>
    accessControlRoles: <The user roles that are able to view/modify as API publisher or creator>
    businessInformation:
      businessOwner: <Name of the business owner>
      businessOwnerEmail: <Email of the business owner>
      technicalOwner: <Name of the technical owner>
      technicalOwnerEmail: <Email of the technical owner>
    corsConfiguration: <Cross-Origin Resource Sharing settings for the API>
      corsConfigurationEnabled: <CORS is enabled or not for the API>
      accessControlAllowOrigins: <origins allowed to access the API>
      accessControlAllowCredentials: <credentials are supported for CORS requests or not>
      accessControlAllowHeaders: <headers allowed during CORS requests>
      accessControlAllowMethods: <methods allowed during CORS requests>
    websubSubscriptionConfiguration: <Configuration settings related to WebSub subscriptions>
      enable: <WebSub subscription is enabled or not>
      secret: <A secret used for signing WebSub content>
      signingAlgorithm: <algorithm used for signing the WebSub messages>
      signatureHeader: <header in which the WebSub signature is included>
    createdTime: <The creation timestamp of the API>
    lastUpdatedTimestamp: <The timestamp when the API was last updated>
    lastUpdatedTime: <The last time the API was updated>
    endpointConfig: <Endpoint configurations of the API>
      endpoint_type: <ype of endpoint such as HTTP/HTTPS>
    endpointImplementationType: <how the endpoint is implemented>
    scopes:<API Scopes>
    operations: <API Operations>
    categories: <API Categories>
    keyManagers: <Key Managers list>
    advertiseInfo: <data related to advertising the API>
      apiOwner: <owner of the API>
      vendor: <Vendor of the API>
    gatewayVendor: <vendor of the API Gateway in use>
    gatewayType: <The gateway type selected for the API policies. Accepts one of the following. wso2/synapse, wso2/apk>
    asyncTransportProtocols:<Supported transports for the async API (http and/or https).>
    organizationId: <organization ID>

```
## Violation Report

Upon validation, the tool generates reports detailing any rule violations. These reports are timestamped and saved in the `reports` directory for audit purposes and further review.

Report Example: The file might be named `Violation_Report_28-3-2024_14-35-12.csv`, containing detailed entries of each API and the specific rules they violated.