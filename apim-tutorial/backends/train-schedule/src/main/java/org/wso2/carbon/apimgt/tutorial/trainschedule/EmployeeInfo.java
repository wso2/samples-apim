package org.wso2.carbon.apimgt.tutorial.trainschedule;

public class EmployeeInfo {
    private String Response;


    public EmployeeInfo(String Response) {
        super();
        this.Response = Response;
    }

    public String getResponse() {
        return Response;
    }

    public void setResponse(String response) {
        Response = response;
    }
}
