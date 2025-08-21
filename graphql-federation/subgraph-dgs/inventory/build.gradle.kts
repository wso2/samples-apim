plugins {
    id("org.springframework.boot").version("2.5.4")
    id("io.spring.dependency-management").version("1.0.11.RELEASE")
    java
}

group = "org.example"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    implementation(platform("com.netflix.graphql.dgs:graphql-dgs-platform-dependencies:3.10.2"))
    implementation("com.netflix.graphql.dgs:graphql-dgs-spring-boot-starter")

    implementation("org.springframework.boot:spring-boot-starter-web")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

tasks.getByName<Test>("test") {
    useJUnitPlatform()
}