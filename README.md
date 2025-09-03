# WSO2 API Manager Samples

This repository contains comprehensive samples and examples for WSO2 API Manager, covering various use cases from basic configurations to advanced AI-powered guardrails and deployment patterns.

## Table of Contents

- [Analytics & Monitoring](#analytics--monitoring)
- [Authentication & Security](#authentication--security)
- [AI & Machine Learning](#ai--machine-learning)
- [Backend Services](#backend-services)
- [Deployment & DevOps](#deployment--devops)
- [API Governance](#api-governance)
- [Tutorials & Demos](#tutorials--demos)
- [Streaming APIs](#streaming-apis)

---

## Analytics & Monitoring

### [Analytics Custom Data Provider](./analytics-custom-data-provider/)
Add custom analytics data to the existing event schema in WSO2 API Manager. This sample allows you to extend the default analytics events with custom attributes and data points.

**Key Features:**
- Custom data provider implementation
- Extensible event schema
- Integration with existing analytics pipeline

### [Analytics Event Publisher](./analytics-event-publisher/)
Sample implementation for writing analytics event details to logs. Provides a custom reporter for API-M 4.0.0 that logs detailed analytics information.

**Key Features:**
- Custom analytics reporter
- Detailed event logging
- Easy integration with existing systems

### [Thrift Analytics Data Provider](./thrift-analytics-data-provider/)
Extracts and populates necessary attributes of API Analytics events from WSO2 APIM 4.2.0 for Thrift-based analytics publishing.

**Key Features:**
- Thrift-based analytics
- Custom data extraction
- Response message size collection

### [Thrift Analytics Publisher](./thrift-analytics-publisher/)
Publishes API Analytics events to Thrift streams including request, fault, and throttle events with comprehensive attribute mapping.

**Key Features:**
- Multiple event types (Request, Fault, Throttle)
- Comprehensive attribute mapping
- Thrift stream integration

---

## Authentication & Security

### [XACML Handler](./XACML-handler/)
Entitlement handler implementation for role-based access control using XACML policies. Enables fine-grained authorization based on user roles and attributes.

**Key Features:**
- XACML-based authorization
- Role-based access control
- Policy-driven security

**Documentation:**
- [Enabling Role-Based Access Control Using XACML](https://docs.wso2.com/display/AM210/Enabling+Role-Based+Access+Control+Using+XACML)
- [Tutorial: Role-Based Access Control](https://wso2.com/library/tutorials/2016/02/tutorial-how-to-enable-role-based-access-control-for-wso2-api-manager-using-xacml/)

### [Custom JWT Generator](./CustomJWTGenerator/)
Custom JWT token generator for passing end-user attributes to backend services. Allows you to include custom claims and user information in JWT tokens.

**Key Features:**
- Custom JWT generation
- End-user attribute passing
- Backend integration

**Documentation:**
- [Passing Enduser Attributes to the Backend Using JWT](https://docs.wso2.com/display/AM260/Passing+Enduser+Attributes+to+the+Backend+Using+JWT)

### [Custom Gateway JWT Generator](./CustomGatewayJWTGenerator/)
Gateway-specific JWT token generator for API-M 3.1.0, providing enhanced JWT generation capabilities at the gateway level.

**Key Features:**
- Gateway-level JWT generation
- Enhanced token customization
- API-M 3.1.0 compatibility

### [Custom JWT Transformer](./CustomJWTTransformer/)
JWT claim transformation component for API-M 3.1.0, allowing you to modify and transform JWT claims according to your requirements.

**Key Features:**
- JWT claim transformation
- Configurable claim mapping
- Default claim mapping properties

### [Custom Lambda Authorizer](./custom-lambda-authorizer/)
AWS Lambda function implementation for API Gateway authorization using JWT tokens. Validates JWT tokens and returns allow/deny policies.

**Key Features:**
- AWS Lambda integration
- JWT token validation
- JWKS endpoint support
- Allow/deny policy generation

---

## AI & Machine Learning

### [APIM for AI Demo](./apim-for-ai-demo/)
This comprehensive guide covers the configuration, deployment, and usage of all available AI guardrails for WSO2 API Manager Universal Gateway. These guardrails provide essential protection, validation, and enhancement capabilities for AI APIs.

---

## Backend Services

### [GraphQL Backend](./graphql-backend/)
Star Wars example GraphQL server using Apollo Server and GraphQL Tools. Demonstrates GraphQL API implementation with a comprehensive schema.

**Key Features:**
- Apollo Server implementation
- Star Wars example schema
- GraphQL Tools integration
- RESTful API compatibility

### [Streaming API Backends](./streaming-api-backends/)
Collection of backend services for streaming APIs including Server-Sent Events (SSE) and WebSocket implementations.

#### [SSE Backend](./streaming-api-backends/sse/)
Server-Sent Events backend implementation for real-time data streaming with configurable timing and intervals.

**Key Features:**
- Configurable event timing
- Memory monitoring endpoint
- Real-time data streaming

#### [WebSocket Backend](./streaming-api-backends/websocket-backend/)
WebSocket chat room server demonstrating real-time bidirectional communication capabilities.

**Key Features:**
- Real-time chat functionality
- WebSocket protocol implementation
- Simple chat room architecture

---

## Deployment & DevOps

### [Kubernetes Demo](./kubernetes-demo/)
Comprehensive Kubernetes deployment guide for WSO2 API Manager with automation scripts and best practices.

**Key Features:**
- **Pattern-1 Deployment**: Complete API Manager deployment in GCP Kubernetes Engine
- **Rolling Updates**: Zero-downtime deployment updates
- **Autoscaling**: Production load-based horizontal pod autoscaling
- **Sample Backend**: Automated backend service deployment
- **NGINX Ingress**: Load balancing and external access

**Components:**
- WSO2 API Manager deployment
- WSO2 API Manager Analytics
- MySQL database
- NGINX Ingress Controller
- Sample backend services

### [Micro Integrator CI/CD](./mi-cicd/)
CI/CD pipeline implementations for WSO2 Micro Integrator with both VM-based and Kubernetes-based deployment strategies.

**Key Features:**
- VM-based CI/CD flow
- Kubernetes-based CI/CD flow
- Jenkins automation
- Docker containerization
- Nexus artifact management

### [Streaming Integrator CI/CD](./si-cicd/)
Kubernetes-based CI/CD pipeline for WSO2 Streaming Integrator with automated deployment and scaling capabilities.

**Key Features:**
- Kubernetes-native deployment
- Automated scaling
- CI/CD pipeline integration
- Container orchestration

---

## API Governance

### [API Governance CLI Tool](./api_governance_cli_tool/)
Command-line tool for validating APIs against configurable rules and generating compliance reports. Ensures adherence to organizational standards and best practices.

**Key Features:**
- **Rule-based Validation**: Customizable validation rules
- **Multiple API Support**: Validate single or all APIs
- **Comprehensive Reporting**: Detailed violation reports
- **Configurable Rules**: API, Swagger, and documentation rules
- **Severity Levels**: Error, warning, and info classifications

**Rule Categories:**
- API Rules: Validate API metadata and configuration
- Swagger Rules: Validate OpenAPI specifications
- Documentation Rules: Validate API documentation

---

## Tutorials & Demos

### [APIM Tutorial](./apim-tutorial/)
Complete tutorial resources for WSO2 API Manager 4.1.0 with Docker Compose setup and sample backend services.

**Key Features:**
- **Docker Compose Setup**: Complete environment with APIM, MI, SI, and backends
- **Sample Backends**: Multiple backend services for different scenarios
- **Integration Examples**: SOAP, REST, and telecom service integrations
- **Configuration Examples**: Various deployment configurations

**Components:**
- WSO2 API Manager 4.1.0
- WSO2 Micro Integrator 4.1.0
- WSO2 Streaming Integrator 4.1.0
- Sample REST API backends
- SOAP service backends
- Train operations simulator

### [APIM Certifications](./apim-certifications/)
Sample backend services and resources for API Manager certification scenarios and testing.

**Key Features:**
- Books service backend
- Reservations service backend
- Train operations backend
- OpenAPI specifications
- GraphQL schemas

### [Single CP Multi GW Tutorial](./single-cp-multi-gw-tutorial/)
Tutorial for deploying WSO2 API Manager with a single control plane and multiple gateways for distributed API management.

**Key Features:**
- Single control plane deployment
- Multiple gateway configuration
- API definitions and configurations
- Sample backend services
- Compliance and HR system examples

---

## Streaming APIs

### [Streaming API Backends](./streaming-api-backends/)
Complete collection of backend services for streaming API implementations including real-time data streaming and WebSocket communications.

**Available Implementations:**
- **Server-Sent Events (SSE)**: Real-time data streaming with configurable intervals
- **WebSocket**: Bidirectional real-time communication for chat applications

---

## Getting Started

### Prerequisites
- Java 8 or above
- Docker and Docker Compose (for tutorial samples)
- Node.js (for JavaScript-based samples)
- Maven (for Java-based samples)

### Quick Start
1. Clone the repository:
   ```bash
   git clone https://github.com/wso2/samples-apim.git
   cd samples-apim
   ```

2. Choose a sample from the categories above
3. Follow the specific README instructions in each sample directory
4. Build and deploy according to the sample requirements

### Contributing
We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on how to submit pull requests and report issues.

### Support
- [WSO2 API Manager Documentation](https://apim.docs.wso2.com/)
- [WSO2 Community Forums](https://wso2.com/community/)
- [WSO2 Support](https://wso2.com/support/)

### License
This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

---

## Sample Categories Summary

| Category | Samples | Description |
|----------|---------|-------------|
| **Analytics** | 4 samples | Custom data providers, event publishers, and Thrift analytics |
| **Security** | 5 samples | XACML handlers, JWT generators/transformers, Lambda authorizers |
| **AI/ML** | 1 comprehensive demo | AI guardrails, content safety, PII protection |
| **Backends** | 3 samples | GraphQL, SSE, and WebSocket implementations |
| **DevOps** | 3 samples | Kubernetes deployment, CI/CD pipelines |
| **Governance** | 1 tool | CLI tool for API validation and compliance |
| **Tutorials** | 3 comprehensive guides | Complete tutorials with Docker setups |
| **Streaming** | 2 implementations | Real-time data streaming solutions |

---

*For detailed information about each sample, please refer to the individual README files in each directory.*
