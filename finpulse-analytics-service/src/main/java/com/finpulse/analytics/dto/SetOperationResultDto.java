package com.finpulse.analytics.dto;

import java.util.List;
import java.util.Map;

public class SetOperationResultDto {
    private String operation; // UNION, INTERSECT, EXCEPT
    private String description;
    private String sqlQuery;
    private List<Map<String, Object>> records;

    public SetOperationResultDto() {}

    public SetOperationResultDto(String operation, String description, String sqlQuery, List<Map<String, Object>> records) {
        this.operation = operation;
        this.description = description;
        this.sqlQuery = sqlQuery;
        this.records = records;
    }

    public String getOperation() { return operation; }
    public void setOperation(String operation) { this.operation = operation; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSqlQuery() { return sqlQuery; }
    public void setSqlQuery(String sqlQuery) { this.sqlQuery = sqlQuery; }

    public List<Map<String, Object>> getRecords() { return records; }
    public void setRecords(List<Map<String, Object>> records) { this.records = records; }
}
