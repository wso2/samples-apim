package org.wso2.carbon.apimgt.tutorial.trainschedule;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.wso2.carbon.apimgt.tutorial.trainschedule.models.employee.Address;
import org.wso2.carbon.apimgt.tutorial.trainschedule.models.employee.Employee;
import org.wso2.carbon.apimgt.tutorial.trainschedule.models.employee.PhoneNumber;
import org.wso2.carbon.apimgt.tutorial.trainschedule.models.employee.User;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.annotation.PostConstruct;

@RestController
@RequestMapping("/v1")
public class EmployeeController {

    private List<Employee> employees = new ArrayList<>();
    private List<User> users = new ArrayList<User>();

    // Endpoint to register a new employee
    @PostMapping("/employees/register")
    public ResponseEntity<User> registerEmployee(@RequestBody User user) {
        // In a real application, you might save this employee to a database
        // For simplicity, we'll just add them to the list
        users.add(user);
        return new ResponseEntity<>(user, HttpStatus.CREATED);
    }

    // Endpoint to update an existing employee
    @PutMapping("/employees/{employeeId}")
    public ResponseEntity<Employee> updateEmployee(@PathVariable String employeeId, @RequestBody Employee updatedEmployee) {
        // In a real application, you might update the employee in the database
        // For simplicity, we'll just look for the employee in our list and update
        /*for (Employee employee : employees) {
            if (employee.getId().equals(employeeId)) {
                employee.setFirstName(updatedEmployee.getFirstName());
                employee.setLastName(updatedEmployee.getLastName());
                employee.setAge(updatedEmployee.getAge());
                employee.setEmail(updatedEmployee.getEmail());
                employee.setDob(updatedEmployee.getDob());
                employee.setRoles(updatedEmployee.getRoles());
                employee.setAddress(updatedEmployee.getAddress());
                employee.setPhoneNumbers(updatedEmployee.getPhoneNumbers());
                return new ResponseEntity<>(updatedEmployee, HttpStatus.OK);
            }
        }*/
        return new ResponseEntity<>(updatedEmployee, HttpStatus.OK);
    }

    // Endpoint to delete an employee
    @DeleteMapping("/employees/{employeeId}")
    public ResponseEntity<String> deleteEmployee(@PathVariable String employeeId) {
        // In a real application, you might delete the employee from the database
        // For simplicity, we'll just remove them from the list
        for (Employee employee : employees) {
            if (employee.getId().equals(employeeId)) {
                employees.remove(employee);
                return new ResponseEntity<>("Employee deleted successfully", HttpStatus.OK);
            }
        }
        return new ResponseEntity<>("Employee not found", HttpStatus.NOT_FOUND);
    }

    // Endpoint to get employee contract details by name
    @GetMapping("/employees/contract/{employeeName}")
    public ResponseEntity<EmployeeContract> getContractDetails(@PathVariable String employeeName) {
        ContractManager contractManager = new ContractManager();
        EmployeeContract employeeContract = contractManager.getContract(employeeName);
        return new ResponseEntity<>(employeeContract, HttpStatus.OK);
    }

    // Endpoint to get all employees (for testing)
    @GetMapping("/employees")
    public ResponseEntity<List<Employee>> getAllEmployees() {
        // In a real application, you might fetch all employees from a database
        // For simplicity, we'll just return the list we have
        return new ResponseEntity<>(employees, HttpStatus.OK);
    }

    // Endpoint to get an employee by ID (for testing)
    @GetMapping("/employees/{employeeId}")
    public ResponseEntity<Employee> getEmployeeById(@PathVariable String employeeId) {
        // In a real application, you might fetch the employee from a database
        // For simplicity, we'll just return a sample employee
        for (Employee employee : employees) {
            if (employee.getId().equals(employeeId)) {
                return new ResponseEntity<>(employee, HttpStatus.OK);
            }
        }
        return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
    }

    // Initialize with some sample data (for testing)
    @PostConstruct
    public void init() {
        Employee employee1 = new Employee();
        employee1.setId("empID-234-34-7382");
        employee1.setUsername("suzy");
        employee1.setFirstName("Suzy");
        employee1.setLastName("Doe");
        employee1.setAge(30);
        employee1.setEmail("suzy@gogo.com");
        employee1.setDob(new Date());
        List<String> roles1 = new ArrayList<>();
        roles1.add("Developer");
        roles1.add("Manager");
        employee1.setRoles(roles1);

        Address address1 = new Address();
        address1.setStreetAddress("123 Street");
        address1.setCity("City");
        address1.setPostalCode("12345");
        employee1.setAddress(address1);

        PhoneNumber phone1 = new PhoneNumber();
        phone1.setPhoneType("Mobile");
        phone1.setNumber("123-456-7890");

        PhoneNumber phone2 = new PhoneNumber();
        phone2.setPhoneType("Home");
        phone2.setNumber("987-654-3210");

        List<PhoneNumber> phoneNumbers1 = new ArrayList<>();
        phoneNumbers1.add(phone1);
        phoneNumbers1.add(phone2);
        employee1.setPhoneNumbers(phoneNumbers1);

        employees.add(employee1);

        Employee employee2 = new Employee();
        employee2.setId("empID-134-64-5432");
        employee2.setUsername("tom");
        employee2.setFirstName("Tom");
        employee2.setLastName("Smith");
        employee2.setAge(25);
        employee2.setEmail("tom@gogo.com");
        employee2.setDob(new Date());
        List<String> roles2 = new ArrayList<>();
        roles2.add("Designer");
        employee2.setRoles(roles2);

        Address address2 = new Address();
        address2.setStreetAddress("456 Road");
        address2.setCity("Town");
        address2.setPostalCode("54321");
        employee2.setAddress(address2);

        PhoneNumber phone3 = new PhoneNumber();
        phone3.setPhoneType("Work");
        phone3.setNumber("555-123-4567");

        List<PhoneNumber> phoneNumbers2 = new ArrayList<>();
        phoneNumbers2.add(phone3);
        employee2.setPhoneNumbers(phoneNumbers2);

        employees.add(employee2);
    }
}
