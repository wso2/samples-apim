import sys
import os
import asyncio

# Disable OpenTelemetry to prevent connection errors to localhost:4318
# This MUST be done before importing any other packages
os.environ["OTEL_SDK_DISABLED"] = "true"
os.environ["OTEL_TRACES_EXPORTER"] = "none"
os.environ["OTEL_METRICS_EXPORTER"] = "none"
os.environ["OTEL_LOGS_EXPORTER"] = "none"
os.environ["OTEL_EXPORTER_OTLP_TRACES_ENDPOINT"] = ""
os.environ["OTEL_EXPORTER_OTLP_METRICS_ENDPOINT"] = ""
os.environ["OTEL_EXPORTER_OTLP_LOGS_ENDPOINT"] = ""
os.environ["OTEL_RESOURCE_ATTRIBUTES"] = ""
os.environ["OTEL_SERVICE_NAME"] = ""
os.environ["OTEL_PYTHON_DISABLED_INSTRUMENTATIONS"] = "all"

# Add the parent directory to the Python path to enable imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from huggingface_hub import login

# Paste your HF token here
login(os.getenv("HF_TOKEN"))

from fastapi import FastAPI, HTTPException
from guardrails import Guard, AsyncGuard
import uvicorn

from guards.ContentSafetyGuardrail import ContentSafetyGuardrail, ContentSafetyRequest, ContentSafetyResponse
from guards.GuardrailsPII import GuardrailsPII, PIIValidationResponse, PIIDetectionRequest
from guards.JailbreakDetectGuardrail import JailbreakDetectGuardrail, JailbreakRequest, JailbreakResponse
from guards.GroundedAIHallucination import GroundedAIHallucination, HallucinationGuardRequest, HallucinationGuardResponse

# Setup Guard with PII detection
piiGuard = AsyncGuard().use(
    GuardrailsPII(on_fail="noop")
)
asyncio.run(piiGuard.validate(""))

# Setup Guard with Jailbreak detection
jailbreakGuard = AsyncGuard().use(
    JailbreakDetectGuardrail(on_fail="noop")
)
asyncio.run(jailbreakGuard.validate(""))

# Setup Guard with content safety detection
contentSafetyGuard = AsyncGuard().use(
    ContentSafetyGuardrail(on_fail="noop")
)
asyncio.run(contentSafetyGuard.validate(""))

# Setup Guard with Hallucination detection
hallucinationGuard = AsyncGuard().use(
    GroundedAIHallucination(quant=True, on_fail="noop")
)
asyncio.run(hallucinationGuard.validate("", metadata={"question": "", "context": ""}))

app = FastAPI(title="PII Detection API", version="1.0.0")

@app.post("/validate/pii", response_model=PIIValidationResponse)
async def validate_pii(request: PIIDetectionRequest):
    """Webhook endpoint to validate a single text field for PII."""
    try:
        if not request.text:
            raise HTTPException(status_code=400, detail="Missing or empty 'text' field in request")

        # Require piiEntities to be present and non-empty
        if not request.piiEntities or not isinstance(request.piiEntities, list):
            raise HTTPException(status_code=400, detail="Missing or empty 'piiEntities' field in request")

        result = await piiGuard.validate(request.text)
        # result = await asyncio.to_thread(piiGuard.validate, request.text)
        
        pii_entities = []
        replacement_map = {}
        
        if hasattr(result, 'validation_summaries') and result.validation_summaries:
            for summary in result.validation_summaries:
                for error in summary.error_spans:
                    pii_value = request.text[error.start:error.end]
                    pii_type = error.reason

                    if (pii_type not in request.piiEntities): continue
                    
                    if pii_value not in replacement_map:
                        replacement_map[pii_value] = pii_type
        
        for pii_val, pii_type in replacement_map.items():
            pii_entities.append({
                "piiEntity": pii_type,
                "piiValue": pii_val
            })

        return PIIValidationResponse(
            verdict=not result.validation_passed,
            assessment=pii_entities
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/validate/jailbreak", response_model=JailbreakResponse)
async def validate_jailbreak(request: JailbreakRequest):
    """Endpoint to validate a single text field for jailbreak attempts."""
    try:
        if not request.text:
            raise HTTPException(status_code=400, detail="Missing or empty 'text' field in request")

        result = await jailbreakGuard.validate(request.text)
        if hasattr(result, 'validation_summaries') and result.validation_summaries:
            score = float(result.validation_summaries[0].error_spans[0].reason)
            return JailbreakResponse(verdict=True, score=score)
        return JailbreakResponse(verdict=False, score=0)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/validate/content-safety", response_model=ContentSafetyResponse)
async def validate_content_safety(request: ContentSafetyRequest):
    """Endpoint to validate a single text field for unsafe content (content safety categories)."""
    try:
        if not request.text:
            raise HTTPException(status_code=400, detail="Missing or empty 'text' field in request")

        result = await contentSafetyGuard.validate(request.text, metadata=request.categories)

        if hasattr(result, "validation_summaries") and result.validation_summaries:
            # Grab categories from the first error span
            reason = result.validation_summaries[0].error_spans[0].reason
            return ContentSafetyResponse(verdict=True, categories=reason.split(","))

        # If no validation errors → safe
        return ContentSafetyResponse(verdict=False, categories=None)

    except Exception as e:
        print("Error in content-safety validation:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/validate/hallucination", response_model=HallucinationGuardResponse)
async def validate_hallucination(request: HallucinationGuardRequest):
    """Endpoint to validate hallucinated content."""
    try:
        if not request.answer or not request.question:
            raise HTTPException(status_code=400, detail="Missing or empty 'answer', 'question' fields in request")

        metadata = {
            "question": request.question,
            "context": request.context or ""
        }
        result = await hallucinationGuard.validate(request.answer, metadata=metadata)
        # print("answer: ", request.answer)
        # print("result: ", result)

        if hasattr(result, "validation_summaries") and result.validation_summaries:
            # Grab categories from the first error span
            reason = result.validation_summaries[0].failure_reason
            return HallucinationGuardResponse(verdict=True, reason=reason)

        # If no validation errors → safe
        return HallucinationGuardResponse(verdict=False, reason="")

    except Exception as e:
        print("Error in hallucination detection:", e)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)

# gunicorn -w 4 -k uvicorn.workers.UvicornWorker server:app -b 0.0.0.0:8000