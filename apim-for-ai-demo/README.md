# AI Guardrails User Guide - WSO2 API Manager Universal Gateway

This comprehensive guide covers the configuration, deployment, and usage of all available AI guardrails for WSO2 API Manager Universal Gateway. These guardrails provide essential protection, validation, and enhancement capabilities for AI APIs.

## Table of Contents

1. [Overview](#overview)
2. [Guardrail Categories](#guardrail-categories)
3. [Prerequisites](#prerequisites) 
4. [Service Configuration](#service-configuration)
5. [How to Add Guardrails to APIs](#how-to-add-guardrails-to-apis)
6. [Guardrail Configuration Details](#guardrail-configuration-details)
7. [Common Configuration Parameters](#common-configuration-parameters)


## Overview

The AI Guardrails collection provides comprehensive protection and enhancement for AI APIs through multiple categories of policies:

- **Content Safety & Filtering**: Detect and block harmful content across multiple categories
- **AI-Specific Protection**: Prevent AI hallucinations and prompt injection attacks  
- **PII Protection**: Detect and mask sensitive personal information
- **Content Validation**: Validate content structure, format, and size limits
- **Prompt Enhancement**: Modify and template prompts for better AI interactions
- **Performance Optimization**: Cache and optimize AI API responses

All guardrails work by extracting content using JSONPath expressions, analyzing it through specialized services or rules, and taking appropriate action when violations are detected or enhancements are needed.

## Guardrail Categories

### Content Safety & Filtering
- **Advanced Content Safety Guardrail by WSO2** - Multi-category harmful content detection
- **Azure Content Safety Content Moderation** - Azure-powered content filtering with severity levels
- **AWS Bedrock Guardrail** - AWS Bedrock-powered content safety and PII protection

### AI-Specific Protection  
- **Advanced Hallucination Guardrail by WSO2** - Detects AI-generated misinformation with optional knowledge grounding
- **Advanced Prompt Injection Guardrail by WSO2** - Prevents prompt injection attacks
- **Semantic Prompt Guardrail** - Uses semantic similarity to allow/deny prompts based on predefined rules

### PII Protection
- **Advanced PII Guardrail by WSO2** - AI-powered PII detection and masking
- **PII Masking with Regex** - Regex-based PII detection and masking

### Content Validation
- **Regex Guardrail** - Pattern-based content validation
- **JSON Schema Guardrail** - Enforce JSON structure compliance
- **Content Length Guardrail** - Validate content size limits
- **Word Count Guardrail** - Enforce word count boundaries
- **Sentence Count Guardrail** - Validate sentence count limits
- **URL Guardrail** - Extract and validate URLs with DNS/connection checks

### Prompt Enhancement
- **Prompt Decorator** - Dynamically modify prompts with custom decorations
- **Prompt Template** - Apply template-based prompt transformations

### Performance & Caching
- **Semantic Cache** - Cache AI responses based on semantic similarity (available in enterprise versions)

## Prerequisites

Before using these guardrails, ensure you have:

1. **WSO2 API Manager** with Universal Gateway
2. **GuardrailsAI service** (required for WSO2-powered guardrails: Content Safety, Hallucination, Prompt Injection, PII) [WSO2 GuardrailsAI Provider Configuration](#service-configuration)
3. **Vector database** (optional, needed for semantic caching and hallucination detection with knowledge grounding)
4. **Embedding provider service** (optional, needed for semantic caching and hallucination detection with knowledge grounding)

## Service Configuration

### 1. WSO2 GuardrailsAI Provider Configuration

For WSO2-powered guardrails (Content Safety, Hallucination, Prompt Injection, PII):

```toml
[[apim.ai.guardrail_provider]]
type = "wso2-guardrails"
[apim.ai.guardrail_provider.properties]
endpoint = "http://23.98.91.151:8000"
```

### 2. Azure Content Safety Configuration

For Azure Content Safety Content Moderation:

```toml
[[apim.ai.guardrail_provider]]
type = "azure-contentsafety"
[apim.ai.guardrail_provider.properties]
endpoint = "<azure-contentsafety-endpoint>"
key = "<azure-contentsafety-api-key>"
```

### 3. AWS Bedrock Configuration

For AWS Bedrock Guardrails:

```toml
[[apim.ai.guardrail_provider]]
type = "awsbedrock-guardrails"
[apim.ai.guardrail_provider.properties]
access_key = "<your-access-key>"
secret_key = "<your-secret-key>"
session_token = "<your-session-token>" # Optional, if using temporary credentials
#role_arn = ""
#role_region = ""
#role_external_id = ""
```

### 4. Vector Database Configuration (For Semantic Cache and Hallucination Detection with Knowledge Grounding)

```toml
[apim.ai.vector_db_provider]
type = "zilliz"
[apim.ai.vector_db_provider.properties]
uri = "your-zilliz-instance-uri"
token = "your-zilliz-token"
```

#### Knowledge Base Setup (Hallucination Detection)
- Use **L2 (Euclidean) distance** metric for similarity search
- Ensure only **one embedding column** per collection
- Match embedding dimensions with your model (e.g., 1536 for text-embedding-ada-002)

### 5. Embedding Provider Configuration (For Hallucination Detection and Semantic Guardrails)

Choose one of the following embedding providers:

#### Mistral
```toml
[apim.ai.embedding_provider]
type = "mistral"
[apim.ai.embedding_provider.properties]
apikey = "<your-mistral-api-key>"
embedding_endpoint = "https://api.mistral.ai/v1/embeddings"
embedding_model = "mistral-embed"
```

#### Azure OpenAI
```toml
[apim.ai.embedding_provider]
type = "azure-openai"
[apim.ai.embedding_provider.properties]
apikey = "<your-azure-openai-api-key>"
embedding_endpoint = "<your-azure-openai-embedding-endpoint>"
```

#### OpenAI
```toml
[apim.ai.embedding_provider]
type = "openai"
[apim.ai.embedding_provider.properties]
apikey = "<your-openai-api-key>"
embedding_endpoint = "https://api.openai.com/v1/embeddings"
embedding_model = "<openai-embedding-model>"
```

### 6. Configure WSO2 Advanced Guardrails Service

- First login to [Hugging Face](https://huggingface.co/login).
- Request to access the following models.
  - https://huggingface.co/meta-llama/Llama-3.2-3B
  - https://huggingface.co/meta-llama/Llama-Guard-3-1B
  - https://huggingface.co/meta-llama/Llama-Prompt-Guard-2-86M
- Generate a token from [Hugging Face](https://huggingface.co/settings/tokens) and set as an environment variable. (i.e. `export HF_TOKEN="your_huggingface_token"`)
- Start the [guardrails service](./guardrails-service/). This will launch a Python FastAPI application listening on port `8000`.

## How to Add Guardrails to APIs

Follow these steps to integrate any guardrail policy into your WSO2 API Manager AI APIs:

1. **Access API Publisher**: Log in to the API Publisher Portal at `https://<host>:<port>/publisher`

2. **Select Your API**: Choose the AI API you want to protect

3. **Navigate to Policies**: Go to **Develop > API Configurations > Policies > Request/Response Flow**

4. **Add Guardrail**: 
   - Click **Add Policy**
   - Choose the desired guardrail from the available categories:
     
     **Content Safety & Filtering:**
     - **Advanced Content Safety Guardrail by WSO2**
     - **Azure Content Safety Content Moderation**
     - **AWS Bedrock Guardrail**
     
     **AI-Specific Protection:**
     - **Advanced Hallucination Guardrail by WSO2**
     - **Advanced Prompt Injection Guardrail by WSO2**
     - **Semantic Prompt Guardrail**
     
     **PII Protection:**
     - **Advanced PII Guardrail by WSO2**
     - **PII Masking with Regex**
     
     **Content Validation:**
     - **Regex Guardrail**
     - **JSON Schema Guardrail**
     - **Content Length Guardrail**
     - **Word Count Guardrail**
     - **Sentence Count Guardrail**
     - **URL Guardrail**
     
     **Prompt Enhancement:**
     - **Prompt Decorator**
     - **Prompt Template**

5. **Configure Parameters**: Fill in the required settings (see specific configurations below)

6. **Save and Deploy**: Save your changes and deploy the API

## Guardrail Configuration Details

### Content Safety & Filtering

#### Advanced Content Safety Guardrail by WSO2

**Purpose**: Multi-category harmful content detection using WSO2's AI models

**Applicable Flows**: Request, Response

**Key Configuration Options**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `Guardrail Name` | String | Unique name for tracking | `"Content Safety Guard"` |
| `JSON Path` | String | Path to extract content | `"$.messages[-1].content"` |
| Content Categories | Boolean | Enable/disable specific harm categories | |
| - `Violent Crimes` | Boolean | Detect violent crime content | `true` |
| - `Non-Violent Crimes` | Boolean | Detect non-violent crime content | `true` |
| - `Sex-Related Crimes` | Boolean | Detect sexual crime content | `true` |
| - `Child Sexual Exploitation` | Boolean | Detect child exploitation | `true` |
| - `Hate` | Boolean | Detect hate speech | `true` |
| - `Sexual Content` | Boolean | Detect sexual content | `false` |
| - `Suicide & Self-Harm` | Boolean | Detect self-harm content | `true` |

#### Azure Content Safety Content Moderation

**Purpose**: Azure-powered content filtering with configurable severity levels

**Applicable Flows**: Request, Response

**Key Configuration Options**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `Guardrail Name` | String | Unique name for tracking | `"Azure Content Filter"` |
| `JSON Path` | String | Path to extract content | `"$.messages[-1].content"` |
| `Hate` | Integer | Max severity level (0-7) | `2` |
| `Sexual` | Integer | Max severity level (0-7) | `2` |
| `Self Harm` | Integer | Max severity level (0-7) | `2` |
| `Violence` | Integer | Max severity level (0-7) | `2` |

#### AWS Bedrock Guardrail

**Purpose**: AWS Bedrock-powered content safety and PII protection

**Applicable Flows**: Request, Response

**Key Configuration Options**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `Guardrail Name` | String | Unique name for tracking | `"AWS Bedrock Guard"` |
| `Guardrail Region` | String | AWS region of the guardrail | `"us-east-1"` |
| `Guardrail ID` | String | AWS Bedrock guardrail ID | `"guardrail-123abc"` |
| `Guardrail Version` | String | Version of the guardrail | `"1"` |
| `JSON Path` | String | Path to extract content | `"$.messages[-1].content"` |
| `Redact PII` | Boolean | Permanently redact detected PII | `false` |

### AI-Specific Protection

#### Advanced Hallucination Guardrail by WSO2

**Purpose**: Detects AI-generated misinformation with optional knowledge grounding

**Applicable Flows**: Request, Response (should be configured in both)

**Key Configuration Options**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `Guardrail Name` | String | Unique name for tracking | `"Hallucination Detection"` |
| `JSON Path` | String | Path to extract AI response | `"$.choices[0].message.content"` |
| `Connect Knowledge Base` | Boolean | Use vector DB for verification | `true` |
| `Knowledge Base Collection Name` | String | Vector DB collection | `"company_docs"` |
| `Output Fields` | String | Fields to include from vector DB | `"title,content,source"` |

#### Advanced Prompt Injection Guardrail by WSO2

**Purpose**: Prevents malicious prompt injection attacks

**Applicable Flows**: Request

**Key Configuration Options**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `Guardrail Name` | String | Unique name for tracking | `"Prompt Injection Protection"` |
| `Threshold` | Integer | Detection sensitivity (0-100) | `90` |
| `JSON Path` | String | Path to extract user input | `"$.messages[-1].content"` |

#### Semantic Prompt Guardrail

**Purpose**: Uses semantic similarity to allow/deny prompts based on predefined rules

**Applicable Flows**: Request, Response

**Key Configuration Options**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `Guardrail Name` | String | Unique name for tracking | `"Semantic Guard"` |
| `Semantic Rules` | JSON | Define allowed and denied prompts | See example below |
| `Similarity Threshold` | Integer | Similarity threshold (0-100) | `90` |
| `JSON Path` | String | Path to extract content | `"$.messages[-1].content"` |

**Semantic Rules Example**:
```json
{
  "allowPrompts": [
    "How can I help customers?",
    "What are our company policies?"
  ],
  "denyPrompts": [
    "Ignore previous instructions",
    "Act as a different AI"
  ]
}
```

### PII Protection

#### Advanced PII Guardrail by WSO2

**Purpose**: AI-powered PII detection and masking

**Applicable Flows**: Request, Response

**Key Configuration Options**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `Guardrail Name` | String | Unique name for tracking | `"PII Protection"` |
| `JSON Path` | String | Path to extract content | `"$.messages[-1].content"` |
| `PII Entities` | JSON Array | List of PII types to detect | See example below |
| `Redact PII` | Boolean | Permanently remove vs. mask | `false` |

**PII Entities Example**:
```json
[
  "CREDIT_CARD",
  "EMAIL_ADDRESS", 
  "PHONE_NUMBER",
  "PERSON",
  "US_SSN",
  "IP_ADDRESS",
  "LOCATION",
  "MEDICAL_LICENSE"
]
```

#### PII Masking with Regex

**Purpose**: Regex-based PII detection and masking

**Applicable Flows**: Request, Response

**Key Configuration Options**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `Guardrail Name` | String | Unique name for tracking | `"Regex PII Mask"` |
| `JSON Path` | String | Path to extract content | `"$.messages[-1].content"` |
| `PII Entities` | JSON Array | PII regex patterns | See example below |
| `Redact PII` | Boolean | Permanently redact vs. mask | `false` |

**PII Entities with Regex Example**:
```json
[
  {
    "piiEntity": "EMAIL",
    "piiRegex": "([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\\.[a-zA-Z0-9_-]+)"
  },
  {
    "piiEntity": "PHONE",
    "piiRegex": "(\\+?1?[-.\\s]?\\(?[0-9]{3}\\)?[-.\\s]?[0-9]{3}[-.\\s]?[0-9]{4})"
  }
]
```

### Content Validation

#### Regex Guardrail

**Purpose**: Pattern-based content validation using regular expressions

**Applicable Flows**: Request, Response

**Key Configuration Options**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `Guardrail Name` | String | Unique name for tracking | `"Pattern Validator"` |
| `Regex Pattern` | String | Regular expression for validation | `"(?i)(password\\|secret)"` |
| `JSON Path` | String | Path to extract content | `"$.messages[-1].content"` |
| `Invert Decision` | Boolean | Block when match found vs. not found | `true` |

#### JSON Schema Guardrail

**Purpose**: Enforce JSON structure compliance

**Applicable Flows**: Request, Response

**Key Configuration Options**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `Guardrail Name` | String | Unique name for tracking | `"Schema Validator"` |
| `JSON Schema` | JSON | Schema definition for validation | See JSON Schema spec |
| `JSON Path` | String | Path to extract content | `"$"` |
| `Invert Decision` | Boolean | Block on match vs. no match | `false` |

#### Content Length Guardrail

**Purpose**: Validate content size limits in bytes

**Applicable Flows**: Request, Response

**Key Configuration Options**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `Guardrail Name` | String | Unique name for tracking | `"Size Validator"` |
| `Minimum Content Length` | Integer | Min bytes required | `10` |
| `Maximum Content Length` | Integer | Max bytes allowed | `10000` |
| `JSON Path` | String | Path to extract content | `"$.messages[-1].content"` |
| `Invert Decision` | Boolean | Block when within limits | `false` |

#### Word Count Guardrail

**Purpose**: Enforce word count boundaries

**Applicable Flows**: Request, Response

**Key Configuration Options**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `Guardrail Name` | String | Unique name for tracking | `"Word Counter"` |
| `Minimum Word Count` | Integer | Min words required | `5` |
| `Maximum Word Count` | Integer | Max words allowed | `500` |
| `JSON Path` | String | Path to extract content | `"$.messages[-1].content"` |
| `Invert Decision` | Boolean | Block when within limits | `false` |

#### Sentence Count Guardrail

**Purpose**: Validate sentence count limits

**Applicable Flows**: Request, Response

**Key Configuration Options**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `Guardrail Name` | String | Unique name for tracking | `"Sentence Counter"` |
| `Minimum Sentence Count` | Integer | Min sentences required | `1` |
| `Maximum Sentence Count` | Integer | Max sentences allowed | `20` |
| `JSON Path` | String | Path to extract content | `"$.messages[-1].content"` |
| `Invert Decision` | Boolean | Block when within limits | `false` |

#### URL Guardrail

**Purpose**: Extract and validate URLs with DNS/connection checks

**Applicable Flows**: Request, Response

**Key Configuration Options**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `Guardrail Name` | String | Unique name for tracking | `"URL Validator"` |
| `JSON Path` | String | Path to extract content | `"$.messages[-1].content"` |
| `Perform DNS Lookup` | Boolean | DNS lookup vs. connection test | `true` |
| `Connection Timeout` | Integer | Timeout in milliseconds | `3000` |

### Prompt Enhancement

#### Prompt Decorator

**Purpose**: Dynamically modify prompts with custom decorations

**Applicable Flows**: Request

**Key Configuration Options**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `Decorator Name` | String | Unique name for tracking | `"Safety Decorator"` |
| `Prompt Decorator Configuration` | JSON | Decoration rules | See example below |
| `JSON Path` | String | Path to modify | `"$.messages"` |
| `Append Decorated Content` | Boolean | Append vs. replace | `true` |

**Prompt Decorator Configuration Example**:
```json
{
  "decoration": [
    {
      "role": "system",
      "content": "You are a helpful assistant. Always be respectful and professional."
    }
  ]
}
```

#### Prompt Template

**Purpose**: Apply template-based prompt transformations

**Applicable Flows**: Request

**Key Configuration Options**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `Template Name` | String | Unique name for tracking | `"Standard Template"` |
| `Prompt Template Configuration` | JSON Array | Template definitions | See example below |

**Prompt Template Configuration Example**:
```json
[
  {
    "name": "customer_service",
    "prompt": "You are a customer service representative for {company}. Help the user with their inquiry: {user_input}"
  },
  {
    "name": "code_review",
    "prompt": "Review the following code and provide feedback: {code_snippet}"
  }
]
```

## Common Configuration Parameters

### Standard Parameters

Most guardrails share these common parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Guardrail Name` | String | Required | Unique identifier for tracking and logging |
| `JSON Path` | String | Optional | JSONPath expression to extract content |
| `Passthrough on Error` | Boolean | `false` | Continue processing if service fails |
| `Show Guardrail Assessment` | Boolean | `false` | Include detailed assessment in error responses |

### Validation Guardrails Parameters

Content validation guardrails (Regex, Length, Word/Sentence Count) share:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Invert Decision` | Boolean | `false` | Reverse the blocking logic |

### JSONPath Examples

Common JSONPath expressions for different AI providers:

| AI Provider | Request Path | Response Path |
|-------------|--------------|---------------|
| OpenAI | `$.messages[-1].content` | `$.choices[0].message.content` |
| Anthropic | `$.messages[-1].content` | `$.content[0].text` |
| Azure OpenAI | `$.messages[-1].content` | `$.choices[0].message.content` |
| Mistral | `$.messages[-1].content` | `$.choices[0].message.content` |

### Advanced JSONPath Patterns

| Purpose | JSONPath Expression | Description |
|---------|-------------------|-------------|
| Extract system message | `$.messages[?(@.role == 'system')].content` | Get system prompt |
| Extract all user messages | `$.messages[?(@.role == 'user')].content` | All user inputs |
| Extract multiple choice responses | `$.choices[*].message.content` | All response choices |
| Extract specific response index | `$.choices[1].message.content` | Second response choice |
| Extract function call arguments | `$.choices[0].message.tool_calls[0].function.arguments` | Function calling |
