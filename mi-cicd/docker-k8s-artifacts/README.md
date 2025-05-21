# Build a CI/CD Pipeline for Integrations (K8s deployment)

This guide provides step-by-step instructions on how to build a CI/CD pipeline to
- Build and release an integration project
- Deploy the integration on a K8s environment using helm charts

## 1. Update the plugins.txt with the latest plugin versions

1. Download the latest Jenkins-plugin-manager jar from https://github.com/jenkinsci/plugin-installation-manager-tool/releases
2. Obtain the  Jenkins.war. It is recommended that the version of the Jenkins.war matches with the Jenkins image version specified in the Dockerfile. One way of obtaining the Jenkins.war file is through the Jenkins docker image.
    - Create a temperory container:
    ```
    docker create --name jenkins-tmp jenkins/jenkins:lts-jdk21
    ```
    - Copy the war file from the container:
    ```
    docker cp jenkins-tmp:/usr/share/jenkins/jenkins.war jenkins.war
    ```
    - Remove the container:
    ```
    docker rm <containerId>
    ```

3. Get the latest versions of the plugins in the plugins.txt file.
```
java -jar jenkins-plugin-manager-2.13.2.jar -d . --war jenkins.war --plugin-file plugins.txt --output TXT --available-updates
```
This will provide a text output containing the latest versions of the plugins which you can copy to the plugins.txt file

## 2. Update the environmental variables in the Dockerfile

1. You need to have a Github repository containing the integration project. Update the `GIT_SCM_CONFIG_USERNAME`, `GIT_SCM_CONFIG_EMAIL`, `GIT_SCM_CONFIG_PASSWORD_TOKEN`, `SOURCE_GIT_RESPOSITORY` values accordingly.
2. Update the `DOCKER_REGISTRY_USERNAME` and `DOCKER_REGISTRY_PASSWORD` with values of the docker registry to push the integration project docker iamge.

## 3. Update the integration project
1. Update the `scm` section in the pom.xml file of your integration project
```
<scm>
    <connection>scm:git:https://github.com/username/repository.git</connection>
    <developerConnection>scm:git:https://github.com/username/repository.git</developerConnection>
    <url>https://github.com/username/repository.git</url>
  </scm>
```
2. Update the `distributionManagement` section of the pom.xml file to facilitate github releases
```
<distributionManagement>
    <repository>
      <id><repository-id></id>
      <name><project name></name>
      <url>https://maven.pkg.github.com/<username>/<repository></url>
    </repository>
  </distributionManagement>
```
3. Make sure the artifact id of the integration project is in lowercase letters and the version has `-SNAPSHOT` added to it.
4. In the `goals` section of the `io.fabric8` plugin, add a new goal for pushing docker images. The name of the image should follow the format `<DOCKER_REGISTRY_USERNAME>/<project.artifactId>:<project.version>`
```
<groupId>io.fabric8</groupId>
<artifactId>docker-maven-plugin</artifactId>
<version>0.45.0</version>
<extensions>true</extensions>
<executions>
    <execution>
        <id>docker-build</id>
        <phase>package</phase>
        <goals>
            <goal>build</goal>
            <goal>push</goal>
        </goals>
        <configuration>
            <images>
            <image>
                <name><docker_registry_username>/${project.artifactId}:${project.version}</name>
        ...
```

## 4. Start the docker and Jenkins containers
Since the Jenkins build job will be using Docker, we will also need a `docker:dind` container as well.
Run `docker-compose up -d --build` to build the images and start the containers.

The Jenkins jobs can be accessed via `http://localhost:8080`.
