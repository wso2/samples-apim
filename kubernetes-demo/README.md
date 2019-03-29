# Deploying API Manager In Kubernetes in gcloud
*This documentation is to deploy of WSO2 API Manager deployment pattern 1 in gcloud Kubernetes Engine and automating a sample backend service.
This is the simplest deployment pattern consists of a scalable deployment of WSO2 API Manager with WSO2 API Manager Analytics support.*
![WSO2 API Manager deployment with WSO2 API Manager Analytics support](pattern01.jpg)

**Overview**

This development would require main steps ,please follow the each step in details.

1.1 Install Prerequisites

1.2 Deploying WSO2 API Manager

           
		      A. Creating a Single node file server in gcloud
	              B. Creating a kubernetes Cluster in gcloud
	              C. Deploying WSO2 API Manager and Analytics
	              D. Deploying NGINX Ingress
	   	      E. Access Management Consoles

1.3 Deploying Sample Back end service.

*In order to use WSO2 Kubernetes resources, you need an active WSO2 subscription. If you do not possess an active WSO2 subscription already, you can sign up for a WSO2 Free Trial Subscription from [here](https://wso2.com/free-trial-subscription).*
### Getting Started

## **1.1 Install Prerequisites**


-   Install Docker v17.09.0 or above
    

	-   [https://docs.docker.com/install/](https://docs.docker.com/install/)
    

-   Install gcloud-sdk
    

	-   [https://cloud.google.com/sdk/install](https://cloud.google.com/sdk/install)
    

-   Install kubectl
    

-   gcloud components install kubectl
    
	-   [https://kubernetes.io/docs/tasks/tools/install-kubectl/](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
    

-   Install [](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) Git
    

	-   [https://git-scm.com/book/en/v2/Getting-Started-Installing-Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
    

-   [Kubernetes client](https://kubernetes.io/docs/tasks/tools/install-kubectl/) (compatible with v1.10)
    

-   Create a Google Cloud Platform [](https://console.cloud.google.com/projectselector/compute/instances) Project
    

	-   [https://cloud.google.com/resource-manager/docs/creating-managing-projects?visit_id=636882414440593811-4047135311&rd=1#identifying_projects](https://cloud.google.com/resource-manager/docs/creating-managing-projects?visit_id=636882414440593811-4047135311&rd=1#identifying_projects)


## **1.2 Deploying WSO2 API Manager pattern-1**

**A.  Creating a Single node file server in gcloud**
    Steps to create a Single node file server
1.  Login to Google Cloud Console using your Google Account.    
2.  Visit GCP [Marketplace]( https://console.cloud.google.com/marketplace/details/click-to-deploy-images/singlefs)
3.  Click LAUNCH ON COMPUTE ENGINE and select your specific project  
4.  Choose the default configurations ,provide a unique name and the corresponding Zone.
(Name: It must be unique within the project and the zone.
[Zone and Region](https://cloud.google.com/compute/docs/regions-zones/#available) : choosing according to region)

5.  Click Deploy
- A pre-configured [Single node file server](https://cloud.google.com/marketplace/docs/single-node-fileserver) to be used as the persistent volume for artifact sharing and persistence.

 **Ssh to the Single node file server instance by gcloud UI,**

-   create a Linux system user account named wso2carbon with user id 802 and a system group named wso2 with group id   `802`. Add the wso2carbon user to the group wso2.
    
	  ```
	sudo groupadd --system -g 802 wso2  
	sudo useradd --system -g 802 -u 802 wso2carbon
	  ```
-   Create unique directories within the Single node file server instance for each Kubernetes Persistent Volume
    
	   ```
	   mkdir /data/<directory_name>
	   mkdir /data/<directory_name_database>
	   ```
  
-   Grant ownership to wso2carbon user and wso2 group, for each of the previously created directories.
	```
	sudo chown -R wso2carbon:wso2 <directory_name_apim>
	 ```
-   Grant read-write-execute permissions to the wso2carbon user, for each of the previously created directories.
    
	 ```
	sudo chmod -R 700 <directory_name_apim>
	sudo chmod -R 757 <directory_name_database>
	 ```
  
**B.  Creating a kubernetes Cluster in gcloud**
    

Steps to create a kubernetes Cluster

1.  Visit the Google Kubernetes Engine menu in GCP Console.
    
2.  Click Create cluster.
    
3.  Choose the Standard cluster template and Customize the template with the necessary following fields

	-   Name: It must be unique within the project and the zone.
    
	-   [Zone and Region](https://cloud.google.com/compute/docs/regions-zones/#available) : choosing according to region
	-   node pool:choose the default nood pool and customized with necessary fields
	-   Cluster size: The number of nodes to create in the cluster. For this use case **number of nodes are 2.**
	-   Machine type: Compute Engine [machine type](https://cloud.google.com/compute/docs/machine-types) to use for the instances. Each machine type is billed differently. The default machine type is n1-standard-1. This should change to **n1-standard-4 15GB memory**.
	
**C.  Deploying WSO2 API Manager and Analytics**
 
   Clone the [wso2/samples-apim](https://github.com/wso2/samples-apim) master Branch for Kubernetes Resources.
-   Update the Kubernetes Persistent Volume resource with the corresponding Single node file server IP (NFS_SERVER_IP) and exported, NFS server directory path (NFS_LOCATION_PATH) in

	 ```
	kubernetes-apim-2.6x/pattern-1/extras/rdbms/volumes/persistent-volumes.yaml
	kubernetes-apim-2.6x/pattern-1/volumes/persistent-volumes.yaml
	 ```
	(to get the IP address of Single node file server visit VM Instance under the Compute Engine)
  
Next connect to the Kubernetes cluster by Command-line access,follow the steps below to connect to the Kubernetes Cluster.
   
-  Navigate to Clusters under the Kubernetes Engine in gcloud UI
    
-   Select the specific cluster and Click on Connect and copy the Command-line access command and paste it in your local machine (Configure [kubectl](http://kubernetes.io/docs/user-guide/kubectl-overview/) command line access by running the following command: gcloud container clusters get-credentials <CLUSTER_NAME> --zone <ZONE> --project <PROJECT_NAME>)
    

-   Export your WSO2 Username and password as an environmental variable.
    
	```
	export username="< username >"
	export password="< password >"
	```
-   Execute deploy. sh  script in kubernetes-apim-2.6.x/pattern-1/scripts with Kubernetes cluster admin password(visit to your cluster in kubernetes Engine and click Show credentials ).
	 ```
	./deploy.sh --wu=$username--wp=$password--cap=<Kubernetes cluster admin password>
	```
-   Check the status of the pod.
	```
	kubect get pods -n wso2
	```
**D.  Deploying NGINX Ingress**
   
-   Execute nginx-deploy. sh in kubernetes-demo/niginx with Kubernetes cluster admin password.
This will create NGINX Ingress Controller.
    
	```
	./nginx-deploy.sh --cap=<Kubernetes cluster admin password>
	```
**E.  Access Management Consoles.**
    

-   Obtain the external IP (EXTERNAL-IP) of the Ingress resources by listing down the Kubernetes Ingresses.
	```
	 kubectl get ing
	```
-   Add the above host as an entry in /etc/hosts file as follows:
	```
	< EXTERNAL-IP > wso2apim
	< EXTERNAL-IP > wso2apim-gateway
	```
-   navigate to [https://wso2apim/carbon](https://wso2apim/carbon) , [https://wso2apim/publisher](https://wso2apim/publisher) and [https://wso2apim/store](https://wso2apim/store) from your browser.
    

  
## **1.3 Deploying Sample Backend Service**
-   Execute service-deploy. sh in kubernetes-demo/sample_service_kubernetes.
    This will create service and the deployment of the sample backend service.
	```
	./service-deploy.sh
	```
-   Check the status of the pod.
	```
	kubect get pods -n wso2
	```
