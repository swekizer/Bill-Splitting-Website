package com.billsplit.backend.Config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        // Creates a standalone instance instantly at startup,
        // bypassing any Spring-managed auto-configuration delays
        return new ObjectMapper();
    }
}
