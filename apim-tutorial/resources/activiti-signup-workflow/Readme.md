

## APIM Configuration

1. Build workflow-executor and add to repository/component/lib folder
2. Add below to workflow extension

```
<UserSignUp executor="com.sample.workflowexecutor.ActivitiUserSignupWorkflow">
    <Property name="serviceEndpoint">http://localhost:8080/activiti-rest/service</Property>
    <Property name="username">kermit</Property>
    <Property name="password">kermit</Property>
</UserSignUp>


```