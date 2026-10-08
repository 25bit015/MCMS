package com.clinic.api.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.clinic.api.dto.AppointmentRequest;
import com.clinic.api.dto.AppointmentResponse;
import com.clinic.api.entity.Appointment.AppointmentStatus;
import com.clinic.api.service.AppointmentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "http://localhost:5173")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(
            AppointmentService appointmentService) {

        this.appointmentService = appointmentService;
    }

    /*
     * ============================================================
     * CREATE
     * ============================================================
     */

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'NURSE', 'DOCTOR')")
    public ResponseEntity<AppointmentResponse> create(
            @Valid @RequestBody AppointmentRequest request) {

        AppointmentResponse response =
                appointmentService.create(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    /*
     * ============================================================
     * GET ALL
     * ============================================================
     */

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'NURSE', 'DOCTOR')")
    public ResponseEntity<List<AppointmentResponse>> getAll() {

        return ResponseEntity.ok(
                appointmentService.getAll()
        );
    }

    /*
     * ============================================================
     * GET BY ID
     * ============================================================
     */

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'NURSE', 'DOCTOR')")
    public ResponseEntity<AppointmentResponse> getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                appointmentService.getById(id)
        );
    }

    /*
     * ============================================================
     * GET BY APPOINTMENT NUMBER
     * ============================================================
     */

    @GetMapping("/number/{appointmentNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'NURSE', 'DOCTOR')")
    public ResponseEntity<AppointmentResponse> getByAppointmentNumber(
            @PathVariable String appointmentNumber) {

        return ResponseEntity.ok(
                appointmentService
                        .getByAppointmentNumber(appointmentNumber)
        );
    }

    /*
     * ============================================================
     * GET BY PATIENT
     * ============================================================
     */

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'NURSE', 'DOCTOR')")
    public ResponseEntity<List<AppointmentResponse>> getByPatient(
            @PathVariable Long patientId) {

        return ResponseEntity.ok(
                appointmentService.getByPatient(patientId)
        );
    }

    /*
     * ============================================================
     * GET BY PATIENT + STATUS
     * ============================================================
     */

    @GetMapping("/patient/{patientId}/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'NURSE', 'DOCTOR')")
    public ResponseEntity<List<AppointmentResponse>> getByPatientAndStatus(
            @PathVariable Long patientId,
            @PathVariable AppointmentStatus status) {

        return ResponseEntity.ok(
                appointmentService.getByPatientAndStatus(
                        patientId,
                        status
                )
        );
    }

    /*
     * ============================================================
     * GET BY DATE
     * ============================================================
     */

    @GetMapping("/date/{date}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'NURSE', 'DOCTOR')")
    public ResponseEntity<List<AppointmentResponse>> getByDate(
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {

        return ResponseEntity.ok(
                appointmentService.getByDate(date)
        );
    }

    /*
     * ============================================================
     * GET BY DATE + STATUS
     * ============================================================
     */

    @GetMapping("/date/{date}/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'NURSE', 'DOCTOR')")
    public ResponseEntity<List<AppointmentResponse>> getByDateAndStatus(
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date,
            @PathVariable AppointmentStatus status) {

        return ResponseEntity.ok(
                appointmentService.getByDateAndStatus(
                        date,
                        status
                )
        );
    }

    /*
     * ============================================================
     * GET ACTIVE APPOINTMENTS BY DATE
     * ============================================================
     */

    @GetMapping("/date/{date}/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'NURSE', 'DOCTOR')")
    public ResponseEntity<List<AppointmentResponse>> getActiveByDate(
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {

        return ResponseEntity.ok(
                appointmentService.getActiveByDate(date)
        );
    }

    /*
     * ============================================================
     * GET BY DATE RANGE
     * ============================================================
     */

    @GetMapping("/range")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'NURSE', 'DOCTOR')")
    public ResponseEntity<List<AppointmentResponse>> getByDateRange(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate) {

        return ResponseEntity.ok(
                appointmentService.getByDateRange(
                        startDate,
                        endDate
                )
        );
    }

    /*
     * ============================================================
     * GET ACTIVE BY PATIENT
     * ============================================================
     */

    @GetMapping("/patient/{patientId}/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'NURSE', 'DOCTOR')")
    public ResponseEntity<List<AppointmentResponse>> getActiveByPatient(
            @PathVariable Long patientId) {

        return ResponseEntity.ok(
                appointmentService.getActiveByPatient(patientId)
        );
    }

    /*
     * ============================================================
     * UPDATE
     * ============================================================
     */

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'NURSE', 'DOCTOR')")
    public ResponseEntity<AppointmentResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentRequest request) {

        return ResponseEntity.ok(
                appointmentService.update(
                        id,
                        request
                )
        );
    }

    /*
     * ============================================================
     * CONFIRM
     * ============================================================
     */

    @PutMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'NURSE', 'DOCTOR')")
    public ResponseEntity<AppointmentResponse> confirm(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                appointmentService.confirm(id)
        );
    }

    /*
     * ============================================================
     * CHECK-IN
     * ============================================================
     */

    @PutMapping("/{id}/check-in")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'NURSE', 'DOCTOR')")
    public ResponseEntity<AppointmentResponse> checkIn(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                appointmentService.checkIn(id)
        );
    }

    /*
     * ============================================================
     * COMPLETE
     * ============================================================
     */

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'NURSE', 'DOCTOR')")
    public ResponseEntity<AppointmentResponse> complete(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                appointmentService.complete(id)
        );
    }

    /*
     * ============================================================
     * CANCEL
     * ============================================================
     */

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'NURSE', 'DOCTOR')")
    public ResponseEntity<AppointmentResponse> cancel(
            @PathVariable Long id,
            @RequestParam String reason) {

        return ResponseEntity.ok(
                appointmentService.cancel(
                        id,
                        reason
                )
        );
    }

    /*
     * ============================================================
     * NO-SHOW
     * ============================================================
     */

    @PutMapping("/{id}/no-show")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'NURSE', 'DOCTOR')")
    public ResponseEntity<AppointmentResponse> markNoShow(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                appointmentService.markNoShow(id)
        );
    }

    /*
     * ============================================================
     * COUNTS
     * ============================================================
     */

    @GetMapping("/count/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'NURSE', 'DOCTOR')")
    public ResponseEntity<Long> countByStatus(
            @PathVariable AppointmentStatus status) {

        return ResponseEntity.ok(
                appointmentService.countByStatus(status)
        );
    }

    @GetMapping("/count/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTION', 'NURSE', 'DOCTOR')")
    public ResponseEntity<Long> countByPatient(
            @PathVariable Long patientId) {

        return ResponseEntity.ok(
                appointmentService.countByPatient(patientId)
        );
    }

    /*
     * ============================================================
     * ILLEGAL ARGUMENT / BUSINESS RULE ERRORS
     * ============================================================
     *
     * AppointmentService uses IllegalArgumentException for
     * business-rule violations such as:
     *
     * - duplicate active appointment
     * - invalid status transition
     * - editing completed appointment
     * - editing cancelled appointment
     * - changing appointment to another patient
     * - invalid appointment lifecycle operation
     *
     * These are client/business conflicts, therefore return
     * HTTP 409 CONFLICT instead of HTTP 500.
     * ============================================================
     */

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(
            IllegalArgumentException exception) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(
                        Map.of(
                                "message",
                                exception.getMessage() != null
                                        ? exception.getMessage()
                                        : "Appointment operation could not be completed."
                        )
                );
    }
}