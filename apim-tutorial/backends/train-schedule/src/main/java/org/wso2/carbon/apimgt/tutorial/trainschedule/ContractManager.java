package org.wso2.carbon.apimgt.tutorial.trainschedule;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ContractManager {
    private Map<String, EmployeeContract> employeeContracts;

    public ContractManager() {
        employeeContracts = new HashMap<>();
        // Add sample contracts for Suzy and Bob
        addContract("suzy", createSuzyContract());
        addContract("bob", createBobContract());
    }

    public void addContract(String employeeName, EmployeeContract contract) {
        employeeContracts.put(employeeName, contract);
    }

    public EmployeeContract getContract(String employeeName) {
        return employeeContracts.get(employeeName);
    }

    // Method to create a sample contract for Suzy
    private EmployeeContract createSuzyContract() {
        EmployeeContract contract = new EmployeeContract();
        contract.setEmployee_id(1);
        contract.setEmployeeName("Suzy");
        contract.setContract_type("Full-time");
        contract.setStart_date("2022-01-15");
        contract.setEnd_date("2024-01-15");
        contract.setSalary(70000);
        contract.setBenefits(Arrays.asList("Health Insurance", "Paid Time Off"));
        EmployeeContract.Manager suzyManager = new EmployeeContract.Manager();
        suzyManager.setId(123);
        suzyManager.setName("Alice Manager");
        suzyManager.setDepartment("Human Resources");
        contract.setManager(suzyManager);
        EmployeeContract.Department suzyDepartment = new EmployeeContract.Department();
        suzyDepartment.setId(456);
        suzyDepartment.setName("Human Resources");
        suzyDepartment.setLocation("New York");
        contract.setDepartment(suzyDepartment);
        contract.setStatus("Active");
        return contract;
    }

    // Method to create a sample contract for Bob
    private EmployeeContract createBobContract() {
        EmployeeContract contract = new EmployeeContract();
        contract.setEmployee_id(2);
        contract.setEmployeeName("Bob");
        contract.setContract_type("Part-time");
        contract.setStart_date("2023-02-20");
        contract.setEnd_date("2023-08-20");
        contract.setSalary(40000);
        contract.setBenefits(Arrays.asList("Paid Time Off"));
        EmployeeContract.Manager bobManager = new EmployeeContract.Manager();
        bobManager.setId(456);
        bobManager.setName("Bob's Boss");
        bobManager.setDepartment("Human Resources");
        contract.setManager(bobManager);
        EmployeeContract.Department bobDepartment = new EmployeeContract.Department();
        bobDepartment.setId(789);
        bobDepartment.setName("Human Resources");
        bobDepartment.setLocation("Chicago");
        contract.setDepartment(bobDepartment);
        contract.setStatus("Active");
        return contract;
    }
}
