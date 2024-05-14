package org.example;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;

/**
 * Class serves as a purpose to have a single instance of ObjectMapper referenced throughout the application.
 */
public class Mapper {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static final ObjectMapper YAML_MAPPER = new ObjectMapper(new YAMLFactory())
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    /**
     * Prevent instantiation of this class.
     */
    private Mapper() {
    }

    public static ObjectMapper mapper() {
        return MAPPER;
    }

    /**
     * n.b. automatically ignores unknown fields when mapping to a value
     *
     * @return a singleton mapper
     */
    public static ObjectMapper yamlMapper() {
        return YAML_MAPPER;
    }
}

