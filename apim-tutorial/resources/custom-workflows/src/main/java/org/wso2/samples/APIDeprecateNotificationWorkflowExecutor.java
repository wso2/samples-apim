/*
 *  Copyright (c) 2024, WSO2 LLc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 LLc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.wso2.samples;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import javax.mail.*;
import javax.mail.internet.*;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.apimgt.api.APIManagementException;
import org.wso2.carbon.apimgt.api.WorkflowResponse;
import org.wso2.carbon.apimgt.api.model.APIIdentifier;
import org.wso2.carbon.apimgt.api.model.Identifier;
import org.wso2.carbon.apimgt.api.model.Subscriber;
import org.wso2.carbon.apimgt.impl.dao.ApiMgtDAO;
import org.wso2.carbon.apimgt.impl.dto.WorkflowDTO;
import org.wso2.carbon.apimgt.impl.token.ClaimsRetriever;
import org.wso2.carbon.apimgt.impl.utils.APIUtil;
import org.wso2.carbon.apimgt.impl.workflow.APIStateChangeSimpleWorkflowExecutor;
import org.wso2.carbon.apimgt.impl.workflow.APIStateWorkflowDTO;
import org.wso2.carbon.apimgt.impl.workflow.WorkflowException;

public class APIDeprecateNotificationWorkflowExecutor extends APIStateChangeSimpleWorkflowExecutor {
    
    private static final long serialVersionUID = 1L;
    private static final Log log = LogFactory.getLog(APIDeprecateNotificationWorkflowExecutor.class);
    private static final ApiMgtDAO apiMgtDAO;


    public String subject;
    public String sender;
    public String senderPassword;
    public String emailPayload;
    public String emailSubject;
    public String portalUrl;
    
    private final String DEFAULT_SUBJECT = "API {API} Deprecated - Please Update";
    private final String DEFAULT_PAYLOAD = 
            "<!DOCTYPE html>\n"
            + "<html>\n"
            + "<head>\n"
            + "    <title>API <b>{API}</b> Deprecated</title>\n"
            + "</head>\n"
            + "<body>\n"
            + "    <h1 style=\"color: #FF6347;\">API <b>{API}</b> is Deprecated</h1>\n"
            + "    <p style=\"font-size: 16px;\">Dear Developer,</p>\n"
            + "    <p style=\"font-size: 16px;\">This is to inform you that API <b>{API}</b> version <b>{API_VERSION}</b> has been deprecated. It is recommended to update to the latest version to ensure compatibility and security.</p>\n"
            + "    <p style=\"font-size: 16px;\">Please visit the <a href=\"" + portalUrl + "\" style=\"color: #007bff; text-decoration: none;\">Developer Portal</a> to get the latest version and migration guidelines.</p>\n"
            + "    <p style=\"font-size: 16px;\">Thank you for your attention to this matter.</p>\n"
            + "    <p style=\"font-size: 16px;\">Best regards,<br>Your GOGO API Team</p>\n"
            + "</body>\n"
            + "</html>";

            

    static {
        apiMgtDAO = ApiMgtDAO.getInstance();
    }

    @Override
    public WorkflowResponse execute(WorkflowDTO workflowDTO) throws WorkflowException {
        Map<Integer, Integer> subscriberMap = new HashMap<>();
        APIStateWorkflowDTO apiStateWorkFlowDTO = (APIStateWorkflowDTO) workflowDTO;
        Identifier identifier = new APIIdentifier(apiStateWorkFlowDTO.getApiProvider(),
                apiStateWorkFlowDTO.getApiName(), apiStateWorkFlowDTO.getApiVersion());
        if ("PUBLISHED".equals(apiStateWorkFlowDTO.getApiCurrentState())
                && "Deprecate".equals(apiStateWorkFlowDTO.getApiLCAction())) {
            ClaimsRetriever claimsRetriever = null;
            try {
                Set<Subscriber> subscribersOfAPI = apiMgtDAO.getSubscribersOfAPIWithoutDuplicates(identifier,
                        subscriberMap);
                Set<String> emailset = new HashSet<String>();
                for (Subscriber subscriber : subscribersOfAPI) {
                    String tenantUserName = subscriber.getName();
                    claimsRetriever = getClaimsRetriever("org.wso2.carbon.apimgt.impl.token.DefaultClaimsRetriever");
                    claimsRetriever.init();
                    String email = claimsRetriever.getClaims(tenantUserName).get("http://wso2.org/claims/emailaddress");

                    if (email != null && !email.isEmpty()) {
                        emailset.add(email);
                    }
                }
                if (subject == null) {
                    subject = DEFAULT_SUBJECT;
                }
                if (portalUrl == null) {
                    portalUrl = "https://localhost:9443/devportal/apis";
                }
                if (emailPayload == null) {
                    emailPayload = DEFAULT_PAYLOAD;
                }
                
                subject =  subject.replace("{API}", identifier.getName());
                emailPayload = emailPayload.replace("{API}", identifier.getName())
                        .replace("{API_VERSION}", identifier.getVersion());
                if (!emailset.isEmpty()) {
                    sendMail(emailset, emailPayload, subject);
                }

            } catch (APIManagementException | IllegalAccessException | InstantiationException | ClassNotFoundException e) {
                log.error("Error while sending notification to the subscribers ", e);
            }
        }
        

        return super.execute(workflowDTO);
    }
    

    public void sendMail(Set<String> emailNotifierList, String messageText, String subject) {

        // Set properties for the SMTP server
        Properties props = new Properties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");
        
        String[] to = emailNotifierList.toArray(new String[emailNotifierList.size()]);

        // Create a Session object to authenticate the sender's email and password
        Session session = Session.getInstance(props,
            new javax.mail.Authenticator() {
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(sender, senderPassword);
                }
            });

        try {
            // Create a MimeMessage object
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(sender));
            // Set BCC recipients
            InternetAddress[] toAddresses = new InternetAddress[to.length];
            for (int i = 0; i < to.length; i++) {
                toAddresses[i] = new InternetAddress(to[i]);
            }
            message.setRecipients(Message.RecipientType.TO, toAddresses);
            message.setSubject(subject);
            message.setContent(messageText, "text/html");
            //message.setText(messageText);

            // Send the message
            Transport.send(message);

            System.out.println("Email sent to " + String.join(",", to) + " successfully!");

        } catch (MessagingException e) {
            throw new RuntimeException(e);
        }
    }
    
    public String getSubject() {
        return subject;
    }


    public void setSubject(String subject) {
        this.subject = subject;
    }


    public String getSender() {
        return sender;
    }


    public void setSender(String sender) {
        this.sender = sender;
    }


    public String getSenderPassword() {
        return senderPassword;
    }


    public void setSenderPassword(String senderPassword) {
        this.senderPassword = senderPassword;
    }
    
    public String getEmailPayload() {
        return emailPayload;
    }


    public void setEmailPayload(String emailPayload) {
        this.emailPayload = emailPayload;
    }


    public String getEmailSubject() {
        return emailSubject;
    }


    public void setEmailSubject(String emailSubject) {
        this.emailSubject = emailSubject;
    }


    public String getPortalUrl() {
        return portalUrl;
    }


    public void setPortalUrl(String portalUrl) {
        this.portalUrl = portalUrl;
    }

    
    protected ClaimsRetriever getClaimsRetriever(String claimsRetrieverImplClass)
            throws IllegalAccessException, InstantiationException, ClassNotFoundException {
        return (ClaimsRetriever) APIUtil.getClassInstance(claimsRetrieverImplClass);
    }
}
