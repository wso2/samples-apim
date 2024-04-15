# Sample Executors

## Publisher State change workflow for sending emails to subscribers for deprecated APIs

Add following config to `workflow-extensions.xml`

```
<APIStateChange executor="org.wso2.samples.APIDeprecateNotificationWorkflowExecutor">
    <Property name="sender"></Property>
    <Property name="senderPassword"></Property>
    <Property name="portalUrl"></Property>
</APIStateChange>
```