package com.finpulse.analytics.client;

import com.finpulse.analytics.exception.CoreServiceUnavailableException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Inter-Service REST Client communicating with finpulse-core-service (Unit 5: Microservices).
 *
 * Configured with strict connect and read timeouts to prevent thread starvation.
 * Throws CoreServiceUnavailableException (mapped to HTTP 503) when core service is unreachable.
 */
@Component
public class CoreServiceClient {

    private final RestTemplate restTemplate;
    private final String coreServiceUrl;

    @Autowired
    public CoreServiceClient(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${finpulse.core-service.url:http://localhost:8081}") String coreServiceUrl,
            @Value("${finpulse.core-service.connect-timeout-ms:2000}") int connectTimeoutMs,
            @Value("${finpulse.core-service.read-timeout-ms:3000}") int readTimeoutMs) {
        this.coreServiceUrl = coreServiceUrl;
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofMillis(connectTimeoutMs))
                .setReadTimeout(Duration.ofMillis(readTimeoutMs))
                .build();
    }

    // Direct constructor for unit tests
    public CoreServiceClient(RestTemplate restTemplate, String coreServiceUrl) {
        this.restTemplate = restTemplate;
        this.coreServiceUrl = coreServiceUrl;
    }

    public String getCoreServiceUrl() {
        return coreServiceUrl;
    }

    /**
     * Fetches executive financial summary from core service:
     * GET /api/summary?userId={userId}&month={month}
     */
    public Map<String, Object> getSummary(Long userId, String monthYear) {
        String url = String.format("%s/api/summary?userId=%d&month=%s", coreServiceUrl, userId, monthYear);
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyMap();
        } catch (RestClientException ex) {
            throw new CoreServiceUnavailableException(
                    String.format("Core service unavailable at %s: %s", coreServiceUrl, ex.getMessage()),
                    ex
            );
        }
    }

    /**
     * Legacy helper fetching account summaries from core.
     */
    public List<Map<String, Object>> getAccountSummaries(Long userId) {
        String url = String.format("%s/api/accounts?userId=%d", coreServiceUrl, userId);
        try {
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }
}
