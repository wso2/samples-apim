from presidio_analyzer import EntityRecognizer, RecognizerResult
from gliner import GLiNER
from .constants import PRESIDIO_TO_GLINER, GLINER_TO_PRESIDIO


class GLiNERRecognizer(EntityRecognizer):
    def __init__(self, supported_entities, model_name):
        self.model_name = model_name
        self.supported_entities = supported_entities

        gliner_entities = set()

        for entity in supported_entities:
            if entity not in PRESIDIO_TO_GLINER:
                continue
            gliner_entities.update(PRESIDIO_TO_GLINER[entity])
        self.gliner_entities = list(gliner_entities)

        super().__init__(supported_entities=supported_entities)

    def load(self) -> None:
        """No loading required as the model is loaded in the constructor"""
        self.model = GLiNER.from_pretrained(self.model_name)

    def analyze(self, text, entities=None, nlp_artifacts=None):
        results = self.model.predict_entities(text, self.gliner_entities)
        return [
            RecognizerResult(
                entity_type=GLINER_TO_PRESIDIO[entity["label"]],
                start=entity["start"],
                end=entity["end"],
                score=entity.get("score"),
                recognition_metadata={
                    RecognizerResult.RECOGNIZER_NAME_KEY: self.name,
                    RecognizerResult.RECOGNIZER_IDENTIFIER_KEY: self.id,
                },
            )
            for entity in results
        ]
