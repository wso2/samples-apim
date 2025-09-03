import json
import os
from typing import Any, Callable, Dict, Optional, List, Tuple, Sequence, cast

from guardrails.validator_base import (
    FailResult,
    PassResult,
    ValidationResult,
    Validator,
    register_validator,
)
from guardrails.validator_base import ErrorSpan
from presidio_anonymizer import AnonymizerEngine
from presidio_analyzer import (
    RecognizerRegistry,
    EntityRecognizer,
    RecognizerResult as AnalyzerRecognizerResult,
)
from presidio_anonymizer import RecognizerResult as AnonymizerRecognizerResult
from utils.analyzer_engine import AnalyzerEngine
from utils.gliner_recognizer import GLiNERRecognizer
from utils.constants import PRESIDIO_TO_GLINER, DEFAULT_THRESHOLDS

from pydantic import BaseModel, Field

def get_entity_threshold(entity: str) -> float:
    if entity in DEFAULT_THRESHOLDS:
        return DEFAULT_THRESHOLDS[entity]
    if entity in PRESIDIO_TO_GLINER:
        return 0.5
    else:
        return 0.0

class InferenceInput(BaseModel):
    text: str
    entities: List[str]


class InferenceOutputResult(BaseModel):
    entity_type: str
    start: int
    end: int
    score: float

class InferenceOutput(BaseModel):
    results: List[InferenceOutputResult]
    anonymized_text: str

class PIIDetectionRequest(BaseModel):
    text: str = Field(..., description="Text to validate for PII")
    piiEntities: List[str] = Field(..., description="List of PII entity types to detect and filter")
    
class PIIEntity(BaseModel):
    piiEntity: str
    piiValue: str


class PIIValidationResponse(BaseModel):
    verdict: bool
    assessment: List[PIIEntity]

@register_validator(name="guardrails/guardrails_pii", data_type="string")
class GuardrailsPII(Validator):
    PII_ENTITIES_MAP = {
        "pii": [
            "EMAIL_ADDRESS",
            "PHONE_NUMBER",
            "DOMAIN_NAME",
            "IP_ADDRESS",
            "DATE_TIME",
            "LOCATION",
            "PERSON",
            "URL",
        ],
        "spi": [
            "CREDIT_CARD",
            "CRYPTO",
            "IBAN_CODE",
            "NRP",
            "MEDICAL_LICENSE",
            "US_BANK_NUMBER",
            "US_DRIVER_LICENSE",
            "US_ITIN",
            "US_PASSPORT",
            "US_SSN",
        ],
    }
    def __init__(
        self,
        entities: str | List[str] | None = None,
        model_name: str = "urchade/gliner_small-v2.1",
        get_entity_threshold: Callable = get_entity_threshold,
        on_fail: Optional[Callable] = None,
        use_local: bool = True,
        **kwargs,
    ):
        """Validates that the LLM-generated text does not contain Personally Identifiable Information (PII).

        This validator uses Presidio and GLiNER to detect and anonymize PII in the generated text.

        **Key Properties**

        | Property                      | Description                         |
        | ----------------------------- | ----------------------------------- |
        | Name for `format` attribute   | `guardrails/guardrails_pii`    |
        | Supported data types          | `string`                            |
        | Programmatic fix              | Anonymized text                     |

        Args:
            entities (List[str]): A list of entity types to detect and anonymize.
            model_name (str, optional): The name of the GLiNER model to use.
                Defaults to "urchade/gliner_small-v2.1".
            get_entity_threshold (Callable[[str], float], optional): A callable to get the threshold
                for each entity type. Defaults to a function that returns 0.5 for
                most entities.
            on_fail (Optional[Callable], optional): A callable to execute when the
                validation fails. Defaults to None.
        """
        if entities is None:
            entities = [
                "CREDIT_CARD",
                "CRYPTO",
                "DATE_TIME",
                "EMAIL_ADDRESS",
                "IBAN_CODE",
                "IP_ADDRESS",
                "NRP",
                "LOCATION",
                "PERSON",
                "PHONE_NUMBER",
                "MEDICAL_LICENSE",
                "URL",
                "US_BANK_NUMBER",
                "US_DRIVER_LICENSE",
                "US_ITIN",
                "US_PASSPORT",
                "US_SSN",
                "UK_NHS",
                "ES_NIF",
                "ES_NIE",
                "IT_FISCAL_CODE",
                "IT_DRIVER_LICENSE",
                "IT_VAT_CODE",
                "IT_PASSPORT",
                "IT_IDENTITY_CARD",
                "PL_PESEL",
                "SG_NRIC_FIN",
                "SG_UEN",
                "AU_ABN",
                "AU_ACN",
                "AU_TFN",
                "AU_MEDICARE",
                "IN_PAN",
                "IN_AADHAAR",
                "IN_VEHICLE_REGISTRATION",
                "IN_VOTER",
                "IN_PASSPORT",
                "FI_PERSONAL_IDENTITY_CODE"
            ]
        
        super().__init__(
            on_fail=on_fail,
            model_name=model_name,
            entities=entities,
            get_entity_threshold=get_entity_threshold,
            use_local=use_local,
            **kwargs,
        )

        if isinstance(entities, str):
            assert entities in self.PII_ENTITIES_MAP, f"Invalid entity type: {entities}"
            self.entities = self.PII_ENTITIES_MAP[entities]
        else:
            self.entities = entities
        self.model_name = model_name
        self.get_entity_threshold = get_entity_threshold

        if self.use_local:
            self.gliner_recognizer = GLiNERRecognizer(
                supported_entities=self.entities,
                model_name=model_name,
            )
            registry = RecognizerRegistry()
            registry.load_predefined_recognizers(languages=["en", "es", "it", "pl"])
            registry.add_recognizer(self.gliner_recognizer)
            self.pii_analyzer = AnalyzerEngine(
                registry=registry, supported_languages=["en"]
            )
            self.pii_anonymizer = AnonymizerEngine()

    def _inference_local(self, model_input: InferenceInput):

        text = model_input.text
        entities = model_input.entities

        results = self.pii_analyzer.analyze(
            text=text,
            language="en",
            entities=entities,
            deduplicate=False,
        )

        results = [
            r
            for r in results
            if (
                r.entity_type in PRESIDIO_TO_GLINER
                and r.recognition_metadata[AnalyzerRecognizerResult.RECOGNIZER_NAME_KEY]
                == self.gliner_recognizer.name
            )
            or (r.entity_type not in PRESIDIO_TO_GLINER and r.entity_type in entities)
        ]

        results = [
            r for r in results if r.score >= self.get_entity_threshold(r.entity_type)
        ]

        results = EntityRecognizer.remove_duplicates(results)

        anonymizer_results: Sequence[AnonymizerRecognizerResult] = [
            AnonymizerRecognizerResult(
                entity_type=r.entity_type, start=r.start, end=r.end, score=r.score
            )
            for r in results
        ]

        anonymized_text = self.pii_anonymizer.anonymize(text, anonymizer_results).text

        # covert to simpler pydantic schema which is json serializable and used in remote endpoint
        results = [
            InferenceOutputResult(
                entity_type=r.entity_type, start=r.start, end=r.end, score=r.score
            )
            for r in results
        ]

        return InferenceOutput(anonymized_text=anonymized_text, results=results)

    def _inference_remote(self, model_input: InferenceInput):
        request_body = {
            "text": model_input.text,
            "entities": model_input.entities,
        }
        response = self._hub_inference_request(json.dumps(request_body), self.validation_endpoint)  # type: ignore

        return InferenceOutput.model_validate(response)

    def anonymize(self, text: str, entities: list[str]) -> Tuple[str, list[ErrorSpan]]:
        input_request = InferenceInput(text=text, entities=entities)
        output = self._inference(input_request)

        output = cast(InferenceOutput, output)
        error_spans = [
            ErrorSpan(start=r.start, end=r.end, reason=r.entity_type) for r in output.results
        ]

        return output.anonymized_text, error_spans


    def _validate(self, value: Any, metadata: Dict = {}) -> ValidationResult:
        entities = metadata.get("entities", self.entities)
        if entities is None:
            raise ValueError(
                "`entities` must be set in order to use the `GlinerPII` validator."
            )

        anonymized_text, error_spans = self.anonymize(text=value, entities=entities)

        if len(error_spans) == 0:
            return PassResult()
        else:
            return FailResult(
                error_message=f"The following text contains PII:\n{value}",
                fix_value=anonymized_text,
                error_spans=error_spans,
            )
