package org.wso2.carbon.apimgt.tutorial.telecombackends;


import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = { "*" })
@RequestMapping(value = "/wishque/v1", produces = { MediaType.APPLICATION_XML_VALUE })
public class WishqueTelecomController {

    @GetMapping({ "/metrics" })
    public String getMetrics() {
        return "<metrics>\n" +
                "\t<class>\n" +
                "\t\t<class1st>79</class1st>\n" +
                "\t\t<class2nd>68</class2nd>\n" +
                "\t\t<class3rd>54</class3rd>\n" +
                "\t</class>\n" +
                "\t<summary>201</summary>\n" +
                "</metrics>";
    }
}