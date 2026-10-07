package com.clinic.api.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.clinic.api.dto.LabourRecordRequest;
import com.clinic.api.dto.LabourRecordResponse;
import com.clinic.api.service.LabourRecordService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/maternity/labour-records")
@CrossOrigin(origins = "http://localhost:5173")
public class LabourRecordController {

    private final LabourRecordService labourRecordService;

    public LabourRecordController(
            LabourRecordService labourRecordService) {

        this.labourRecordService = labourRecordService;
    }

    // ---------------------------------------------------------
    // GET ALL LABOUR RECORDS
    // ---------------------------------------------------------
    @GetMapping
    public ResponseEntity<List<LabourRecordResponse>> getAll() {

        return ResponseEntity.ok(
                labourRecordService.getAll()
        );
    }

    // ---------------------------------------------------------
    // GET LABOUR RECORD BY ID
    // ---------------------------------------------------------
    @GetMapping("/{id}")
    public ResponseEntity<LabourRecordResponse> getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                labourRecordService.getById(id)
        );
    }

    // ---------------------------------------------------------
    // GET LABOUR RECORDS BY PREGNANCY
    // ---------------------------------------------------------
    @GetMapping("/pregnancy/{pregnancyId}")
    public ResponseEntity<List<LabourRecordResponse>> getByPregnancy(
            @PathVariable Long pregnancyId) {

        return ResponseEntity.ok(
                labourRecordService.getByPregnancy(
                        pregnancyId
                )
        );
    }

    // ---------------------------------------------------------
    // GET ACTIVE LABOUR RECORDS BY PREGNANCY
    // ---------------------------------------------------------
    @GetMapping("/pregnancy/{pregnancyId}/active")
    public ResponseEntity<List<LabourRecordResponse>> getActiveByPregnancy(
            @PathVariable Long pregnancyId) {

        return ResponseEntity.ok(
                labourRecordService.getActiveByPregnancy(
                        pregnancyId
                )
        );
    }

    // ---------------------------------------------------------
    // CREATE LABOUR RECORD
    // ---------------------------------------------------------
    @PostMapping
    public ResponseEntity<LabourRecordResponse> create(
            @Valid @RequestBody LabourRecordRequest request) {

        LabourRecordResponse response =
                labourRecordService.create(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // ---------------------------------------------------------
    // UPDATE LABOUR RECORD
    // ---------------------------------------------------------
    @PutMapping("/{id}")
    public ResponseEntity<LabourRecordResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody LabourRecordRequest request) {

        return ResponseEntity.ok(
                labourRecordService.update(
                        id,
                        request
                )
        );
    }

    // ---------------------------------------------------------
    // COMPLETE LABOUR RECORD
    // ---------------------------------------------------------
    @PutMapping("/{id}/complete")
    public ResponseEntity<LabourRecordResponse> complete(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                labourRecordService.complete(id)
        );
    }

    // ---------------------------------------------------------
    // ARCHIVE LABOUR RECORD
    // ---------------------------------------------------------
    @PutMapping("/{id}/archive")
    public ResponseEntity<Map<String, String>> archive(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {

        labourRecordService.archive(id, reason);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Labour record archived successfully."
                )
        );
    }

    // ---------------------------------------------------------
    // GET LABOUR RECORDS BY ADMISSION DATE
    // ---------------------------------------------------------
    @GetMapping("/date/{date}")
    public ResponseEntity<List<LabourRecordResponse>> getByAdmissionDate(
            @PathVariable LocalDate date) {

        /*
         * Date-based querying can be added to the service when
         * the Labour & Delivery dashboard requires it.
         *
         * Currently the service exposes:
         * - getAll()
         * - getById()
         * - getByPregnancy()
         * - getActiveByPregnancy()
         */

        throw new UnsupportedOperationException(
                "Date-based Labour record retrieval is not yet exposed by the service."
        );
    }

    // ---------------------------------------------------------
    // ERROR HANDLING
    // ---------------------------------------------------------
    @org.springframework.web.bind.annotation.ExceptionHandler(
            IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(
            IllegalArgumentException exception) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(
                        Map.of(
                                "message",
                                exception.getMessage()
                        )
                );
    }
}