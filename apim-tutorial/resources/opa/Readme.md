This rego policy is works with https://github.com/wso2/samples-apim/blob/demo_2024/apim-tutorial/resources/employee-api/swagger.yaml Employee API. Apply this to GET /employees/contract/{employee-name} resource

To deploy the rego policy 
1. Start opa server './opa run --server'
2. Run `sh opapolicy.sh` to deploy the policy
3. Add a OPA policy to the resource from publisher portal. Set `Policy: employees` and `Rule: allow`