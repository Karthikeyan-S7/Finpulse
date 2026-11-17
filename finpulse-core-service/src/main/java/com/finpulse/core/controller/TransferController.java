package com.finpulse.core.controller;

import com.finpulse.core.dto.TransferRequest;
import com.finpulse.core.dto.TransferResponse;
import com.finpulse.core.service.TransferService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transfers")
public class TransferController {

    private final TransferService transferService;

    public TransferController(TransferService transferService) {
        this.transferService = transferService;
    }

    @PostMapping
    public ResponseEntity<TransferResponse> createTransfer(@Valid @RequestBody TransferRequest request) {
        TransferResponse response = transferService.executeTransfer(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
