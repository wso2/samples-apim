## API Governance CLI Tool

- A CLI tool to validate existing API(s). You can validate API definition(s) using this CLI tool. It will create a report with violations contained in each API.

## Configuration
- Before using the CLI tool, configure your user credentials and server details as needed. These settings are used to authenticate against your API management solution and to specify the server with which the tool will communicate. Here's an example of how your `config.yaml` file should look:
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

The below commands can be used to validate API(s)

01. Validate all APIs at once

`./api-governance-cli-tool-linux validate  --all`

02. Validate one API by giving API ID.

`./api-governance-cli-tool-linux validate --api <API ID>`

03. Validate one API by giving the path of a local directory

`./api-governance-cli-tool-linux validate -d <path to the local directory>`

## Customizing the Rules

The rules defined in the rules/rules.yaml file are categorized based on the aspects they validate:

- API_Rules: Validate API(s) using the details provided in `api.yaml`file.
- Swagger_Rules: Validate API(s) using the details provided in `swagger.yaml` file.
- Docs_Rules: Validate API(s) using the details provided in `docs.yaml`file which is created inside each API when extracting.

### Example Rule Definition

Here's how you can define a custom rule in API_Rules:

```
  <rule_name>:
    description: "<describing_the_rule>"
    message: "<error_message_to_given_out>"
    severity: error
    given: "<path_inside_api.yaml_file>"
    then:
      field: "<filed_to_check>"
      function: pattern
      functionOptions:
        notMatch: "<matching_parameter>"
         min: <minimum_amount_to_check>
```
## Violation Report

You can find the violation reports inside `reports` directory with the timestmp and date.