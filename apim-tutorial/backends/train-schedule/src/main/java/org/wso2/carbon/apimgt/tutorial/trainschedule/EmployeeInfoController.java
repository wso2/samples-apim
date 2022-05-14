package org.wso2.carbon.apimgt.tutorial.trainschedule;

import java.util.Date;

import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = { "*" })
@RequestMapping({ "/v1" })
public class EmployeeInfoController {

    @GetMapping({ "/employees" })
    public EmployeeInfo getGetResponse() {
        String value = "Request Successful";
        return new EmployeeInfo(value);
    }

    @PostMapping({ "/employees" })
    public EmployeeInfo getPostResponse() {
        String value = "Request Successful";
        return new EmployeeInfo(value);
    }

    @GetMapping({ "/employees/{id}/finance-info" })
    public EmployeeInfo getFinanceResponse() {
        String value = "Request Successful";
        return new EmployeeInfo(value);
    }

    @GetMapping({ "/employees/contacts" })
    public EmployeeInfo getContactResponse() {
        String value = "Request Successful";
        return new EmployeeInfo(value);
    }

    @GetMapping({ "/employees/contract/{employee-name}" })
    public EmployeeInfo getContractOfEmployeeResponse() {
        String value = "Request Successful";
        return new EmployeeInfo(value);
    }

    @PostMapping({ "/employee/register" })
    public EmployeeInfo getEmployeeRegisteredResponse() {
        String value = "Request Successful";
        return new EmployeeInfo(value);
    }

    @PostMapping({ "/employee/{employee-id}" })
    public EmployeeInfo updateEmployeeDetailsResponse() {
        String value = "Request Successful";
        return new EmployeeInfo(value);
    }
}
