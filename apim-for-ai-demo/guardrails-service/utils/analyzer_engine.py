from presidio_analyzer import (
    AnalyzerEngine as BaseAnalyzerEngine,
    RecognizerResult,
    EntityRecognizer,
)
from presidio_analyzer.nlp_engine import NlpArtifacts
import re
from typing import Optional, List
import json


class AnalyzerEngine(BaseAnalyzerEngine):
    def analyze(
        self,
        text: str,
        language: str,
        entities: Optional[List[str]] = None,
        correlation_id: Optional[str] = None,
        score_threshold: Optional[float] = None,
        return_decision_process: Optional[bool] = False,
        ad_hoc_recognizers: Optional[List[EntityRecognizer]] = None,
        context: Optional[List[str]] = None,
        allow_list: Optional[List[str]] = None,
        allow_list_match: Optional[str] = "exact",
        regex_flags: Optional[int] = re.DOTALL | re.MULTILINE | re.IGNORECASE,
        nlp_artifacts: Optional[NlpArtifacts] = None,
        deduplicate: bool = True,
    ) -> List[RecognizerResult]:
        all_fields = not entities

        recognizers = self.registry.get_recognizers(
            language=language,
            entities=entities,
            all_fields=all_fields,
            ad_hoc_recognizers=ad_hoc_recognizers,
        )

        if all_fields:
            # Since all_fields=True, list all entities by iterating
            # over all recognizers
            entities = self.get_supported_entities(language=language)

        # run the nlp pipeline over the given text, store the results in
        # a NlpArtifacts instance
        if not nlp_artifacts:
            nlp_artifacts = self.nlp_engine.process_text(text, language)

        if self.log_decision_process and correlation_id:
            self.app_tracer.trace(
                correlation_id, "nlp artifacts:" + nlp_artifacts.to_json()
            )

        results = []
        for recognizer in recognizers:
            # Lazy loading of the relevant recognizers
            if not recognizer.is_loaded:
                recognizer.load()
                recognizer.is_loaded = True

            # analyze using the current recognizer and append the results
            current_results = recognizer.analyze(
                text=text, entities=entities, nlp_artifacts=nlp_artifacts
            )
            if current_results:
                # add recognizer name to recognition metadata inside results
                # if not exists
                super()._AnalyzerEngine__add_recognizer_id_if_not_exists( # type: ignore
                    current_results, recognizer
                )
                results.extend(current_results)

        results = self._enhance_using_context(
            text, results, nlp_artifacts, recognizers, context
        )

        if self.log_decision_process and correlation_id:
            self.app_tracer.trace(
                correlation_id,
                json.dumps([str(result.to_dict()) for result in results]),
            )

        # Remove duplicates or low score results
        if deduplicate:
            results = EntityRecognizer.remove_duplicates(results)
        results = super()._AnalyzerEngine__remove_low_scores(results, score_threshold) # type: ignore

        if allow_list and allow_list_match:
            results = self._remove_allow_list(
                results, allow_list, text, regex_flags, allow_list_match
            )

        if not return_decision_process:
            results = super()._AnalyzerEngine__remove_decision_process(results) # type: ignore

        return results
