PRESIDIO_TO_GLINER = {
    "LOCATION": ["location", "place", "address"],
    "DATE_TIME": ["date", "time", "date of birth"],
    "PERSON": ["person", "name"],
    "PHONE_NUMBER": [
        "phone number",
    ],
}

GLINER_TO_PRESIDIO = {}
for presidio, entities in PRESIDIO_TO_GLINER.items():
    for entity in entities:
        GLINER_TO_PRESIDIO[entity] = presidio

DEFAULT_THRESHOLDS = {
    "LOCATION": 0.5,
    "DATE_TIME": 0.5,
    "PERSON": 0.5,
    "PHONE_NUMBER": 0.5,
    "EMAIL_ADDRESS": 1.0,
}
