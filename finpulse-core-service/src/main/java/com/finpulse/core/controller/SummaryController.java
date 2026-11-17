package com.finpulse.core.controller;

import com.finpulse.core.dto.SummaryDto;
import com.finpulse.core.service.SummaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/summary")
public class SummaryController {

    private final SummaryService summaryService;

    public SummaryController(SummaryService summaryService) {
        this.summaryService = summaryService;
    }

    @GetMapping({"", "/overview"})
    public ResponseEntity<SummaryDto> getSummary(
            @RequestParam(required = false, defaultValue = "1") Long userId,
            @RequestParam(required = false) String month) {
        return ResponseEntity.ok(summaryService.getExecutiveSummary(userId, month));
    }
}
