package com.clinic.api.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.clinic.api.dto.AppointmentRequest;
import com.clinic.api.dto.AppointmentResponse;
import com.clinic.api.entity.Appointment;
import com.clinic.api.entity.Appointment.AppointmentStatus;
import com.clinic.api.entity.Patient;
import com.clinic.api.entity.User;
import com.clinic.api.repository.AppointmentRepository;
import com.clinic.api.repository.PatientRepository;
import com.clinic.api.repository.UserRepository;

@Service
@Transactional
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            PatientRepository patientRepository,
            UserRepository userRepository) {

        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
    }

    /*
     * ============================================================
     * CREATE
     * ============================================================
     */

    public AppointmentResponse create(AppointmentRequest request) {

        validateRequest(request);

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Patient not found."
                        )
                );

        User assignedStaff = resolveStaff(request.getAssignedStaffId());

        String appointmentType = normalizeAppointmentType(
                request.getAppointmentType()
        );

        /*
         * New appointments always start as SCHEDULED.
         * Frontend cannot create an appointment directly as
         * COMPLETED, CANCELLED, etc.
         */
        AppointmentStatus status = AppointmentStatus.SCHEDULED;

        String activeSlotKey = buildActiveSlotKey(
                patient.getId(),
                request.getAppointmentDate(),
                request.getAppointmentTime(),
                appointmentType
        );

        if (appointmentRepository.existsByActiveSlotKey(activeSlotKey)) {

            throw new IllegalArgumentException(
                    "An active appointment already exists for this patient at the selected date, time and appointment type."
            );
        }

        Appointment appointment = new Appointment();

        appointment.setAppointmentNumber(generateAppointmentNumber());
        appointment.setPatient(patient);
        appointment.setAssignedStaff(assignedStaff);
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setAppointmentTime(request.getAppointmentTime());
        appointment.setAppointmentType(appointmentType);
        appointment.setReason(clean(request.getReason()));
        appointment.setNotes(clean(request.getNotes()));
        appointment.setStatus(status);

        try {

            Appointment saved = appointmentRepository.save(appointment);

            return toResponse(saved);

        } catch (DataIntegrityViolationException ex) {

            /*
             * Protect against two simultaneous requests attempting
             * to create the same appointment.
             */
            throw new IllegalArgumentException(
                    "The appointment could not be created because another active appointment already occupies this slot."
            );
        }
    }

    /*
     * ============================================================
     * UPDATE
     * ============================================================
     */

    public AppointmentResponse update(
            Long id,
            AppointmentRequest request) {

        validateRequest(request);

        Appointment appointment = getEntity(id);

        AppointmentStatus currentStatus = appointment.getStatus();

        /*
         * Historical records are preserved and locked.
         */
        if (currentStatus == AppointmentStatus.COMPLETED) {

            throw new IllegalArgumentException(
                    "Completed appointments are historical records and cannot be edited."
            );
        }

        if (currentStatus == AppointmentStatus.CANCELLED) {

            throw new IllegalArgumentException(
                    "Cancelled appointments cannot be edited."
            );
        }

        if (currentStatus == AppointmentStatus.NO_SHOW) {

            throw new IllegalArgumentException(
                    "No-show appointments cannot be edited."
            );
        }

        Patient originalPatient = appointment.getPatient();

        if (originalPatient == null
                || originalPatient.getId() == null) {

            throw new IllegalArgumentException(
                    "Appointment has no valid patient relationship."
            );
        }

        /*
         * Appointment must never be moved to another patient.
         */
        if (!originalPatient.getId().equals(request.getPatientId())) {

            throw new IllegalArgumentException(
                    "An appointment cannot be moved to another patient. The original patient relationship must be preserved."
            );
        }

        User assignedStaff = resolveStaff(request.getAssignedStaffId());

        String appointmentType = normalizeAppointmentType(
                request.getAppointmentType()
        );

        /*
         * Only active appointment statuses participate in
         * duplicate-slot protection.
         */
        if (isActiveStatus(currentStatus)) {

            String activeSlotKey = buildActiveSlotKey(
                    originalPatient.getId(),
                    request.getAppointmentDate(),
                    request.getAppointmentTime(),
                    appointmentType
            );

            if (appointmentRepository.existsByActiveSlotKeyAndIdNot(
                    activeSlotKey,
                    id)) {

                throw new IllegalArgumentException(
                        "Another active appointment already exists for this patient at the selected date, time and appointment type."
                );
            }
        }

        appointment.setAssignedStaff(assignedStaff);
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setAppointmentTime(request.getAppointmentTime());
        appointment.setAppointmentType(appointmentType);
        appointment.setReason(clean(request.getReason()));
        appointment.setNotes(clean(request.getNotes()));

        /*
         * Status is deliberately NOT taken from the request.
         * Status changes must go through the lifecycle methods below.
         */

        try {

            Appointment updated = appointmentRepository.save(appointment);

            return toResponse(updated);

        } catch (DataIntegrityViolationException ex) {

            throw new IllegalArgumentException(
                    "The appointment could not be updated because another active appointment already occupies this slot."
            );
        }
    }

    /*
     * ============================================================
     * STATUS LIFECYCLE
     * ============================================================
     */

    public AppointmentResponse confirm(Long id) {

        Appointment appointment = getEntity(id);

        requireStatus(
                appointment,
                AppointmentStatus.SCHEDULED
        );

        appointment.setStatus(AppointmentStatus.CONFIRMED);

        return toResponse(
                appointmentRepository.save(appointment)
        );
    }

    public AppointmentResponse checkIn(Long id) {

        Appointment appointment = getEntity(id);

        if (appointment.getStatus() != AppointmentStatus.CONFIRMED
                && appointment.getStatus() != AppointmentStatus.SCHEDULED) {

            throw new IllegalArgumentException(
                    "Only scheduled or confirmed appointments can be checked in."
            );
        }

        appointment.setStatus(AppointmentStatus.CHECKED_IN);

        return toResponse(
                appointmentRepository.save(appointment)
        );
    }

    public AppointmentResponse complete(Long id) {

        Appointment appointment = getEntity(id);

        requireStatus(
                appointment,
                AppointmentStatus.CHECKED_IN
        );

        appointment.setStatus(AppointmentStatus.COMPLETED);

        return toResponse(
                appointmentRepository.save(appointment)
        );
    }

    public AppointmentResponse cancel(
            Long id,
            String reason) {

        Appointment appointment = getEntity(id);

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {

            throw new IllegalArgumentException(
                    "Completed appointments cannot be cancelled."
            );
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {

            throw new IllegalArgumentException(
                    "Appointment is already cancelled."
            );
        }

        if (appointment.getStatus() == AppointmentStatus.NO_SHOW) {

            throw new IllegalArgumentException(
                    "A no-show appointment cannot be cancelled."
            );
        }

        String cancellationReason = clean(reason);

        if (cancellationReason == null) {

            throw new IllegalArgumentException(
                    "Cancellation reason is required."
            );
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);

        String existingNotes = clean(appointment.getNotes());

        if (existingNotes == null) {

            appointment.setNotes(
                    "Cancellation reason: " + cancellationReason
            );

        } else {

            appointment.setNotes(
                    existingNotes
                            + "\nCancellation reason: "
                            + cancellationReason
            );
        }

        return toResponse(
                appointmentRepository.save(appointment)
        );
    }

    public AppointmentResponse markNoShow(Long id) {

        Appointment appointment = getEntity(id);

        if (appointment.getStatus() != AppointmentStatus.SCHEDULED
                && appointment.getStatus() != AppointmentStatus.CONFIRMED) {

            throw new IllegalArgumentException(
                    "Only scheduled or confirmed appointments can be marked as no-show."
            );
        }

        appointment.setStatus(AppointmentStatus.NO_SHOW);

        return toResponse(
                appointmentRepository.save(appointment)
        );
    }

    /*
     * ============================================================
     * FIND / READ
     * ============================================================
     */

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAll() {

        return appointmentRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getById(Long id) {

        return toResponse(getEntity(id));
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getByAppointmentNumber(
            String appointmentNumber) {

        if (appointmentNumber == null
                || appointmentNumber.isBlank()) {

            throw new IllegalArgumentException(
                    "Appointment number is required."
            );
        }

        Appointment appointment =
                appointmentRepository.findByAppointmentNumber(
                        appointmentNumber.trim()
                ).orElseThrow(() ->
                        new IllegalArgumentException(
                                "Appointment not found."
                        )
                );

        return toResponse(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getByPatient(
            Long patientId) {

        ensurePatientExists(patientId);

        return appointmentRepository
                .findByPatientIdOrderByAppointmentDateDescAppointmentTimeDesc(
                        patientId
                )
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getByPatientAndStatus(
            Long patientId,
            AppointmentStatus status) {

        ensurePatientExists(patientId);

        if (status == null) {

            throw new IllegalArgumentException(
                    "Appointment status is required."
            );
        }

        return appointmentRepository
                .findByPatientIdAndStatusOrderByAppointmentDateDescAppointmentTimeDesc(
                        patientId,
                        status
                )
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getByDate(
            LocalDate date) {

        if (date == null) {

            throw new IllegalArgumentException(
                    "Appointment date is required."
            );
        }

        return appointmentRepository
                .findByAppointmentDateOrderByAppointmentTimeAsc(date)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getByDateRange(
            LocalDate startDate,
            LocalDate endDate) {

        validateDateRange(startDate, endDate);

        return appointmentRepository
                .findByAppointmentDateBetweenOrderByAppointmentDateAscAppointmentTimeAsc(
                        startDate,
                        endDate
                )
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getByDateAndStatus(
            LocalDate date,
            AppointmentStatus status) {

        if (date == null) {

            throw new IllegalArgumentException(
                    "Appointment date is required."
            );
        }

        if (status == null) {

            throw new IllegalArgumentException(
                    "Appointment status is required."
            );
        }

        return appointmentRepository
                .findByAppointmentDateAndStatusOrderByAppointmentTimeAsc(
                        date,
                        status
                )
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getActiveByDate(
            LocalDate date) {

        if (date == null) {

            throw new IllegalArgumentException(
                    "Appointment date is required."
            );
        }

        List<AppointmentStatus> activeStatuses = List.of(
                AppointmentStatus.SCHEDULED,
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.CHECKED_IN
        );

        return appointmentRepository
                .findByAppointmentDateAndStatusInOrderByAppointmentTimeAsc(
                        date,
                        activeStatuses
                )
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getActiveByPatient(
            Long patientId) {

        ensurePatientExists(patientId);

        List<AppointmentStatus> activeStatuses = List.of(
                AppointmentStatus.SCHEDULED,
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.CHECKED_IN
        );

        return appointmentRepository
                .findByPatientIdAndStatusInOrderByAppointmentDateDescAppointmentTimeDesc(
                        patientId,
                        activeStatuses
                )
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /*
     * ============================================================
     * COUNTS
     * ============================================================
     */

    @Transactional(readOnly = true)
    public long countByStatus(AppointmentStatus status) {

        if (status == null) {

            throw new IllegalArgumentException(
                    "Appointment status is required."
            );
        }

        return appointmentRepository.countByStatus(status);
    }

    @Transactional(readOnly = true)
    public long countByPatient(Long patientId) {

        ensurePatientExists(patientId);

        return appointmentRepository.countByPatientId(patientId);
    }

    /*
     * ============================================================
     * VALIDATION
     * ============================================================
     */

    private void validateRequest(
            AppointmentRequest request) {

        if (request == null) {

            throw new IllegalArgumentException(
                    "Appointment data is required."
            );
        }

        if (request.getPatientId() == null) {

            throw new IllegalArgumentException(
                    "Patient ID is required."
            );
        }

        if (request.getAppointmentDate() == null) {

            throw new IllegalArgumentException(
                    "Appointment date is required."
            );
        }

        if (request.getAppointmentTime() == null) {

            throw new IllegalArgumentException(
                    "Appointment time is required."
            );
        }

        if (request.getAppointmentType() == null
                || request.getAppointmentType().isBlank()) {

            throw new IllegalArgumentException(
                    "Appointment type is required."
            );
        }

        if (request.getAppointmentType().trim().length() > 50) {

            throw new IllegalArgumentException(
                    "Appointment type cannot exceed 50 characters."
            );
        }

        /*
         * Do not allow new appointments in the past.
         */
        if (request.getAppointmentDate().isBefore(LocalDate.now())) {

            throw new IllegalArgumentException(
                    "Appointment date cannot be in the past."
            );
        }
    }

    private void validateDateRange(
            LocalDate startDate,
            LocalDate endDate) {

        if (startDate == null || endDate == null) {

            throw new IllegalArgumentException(
                    "Start date and end date are required."
            );
        }

        if (endDate.isBefore(startDate)) {

            throw new IllegalArgumentException(
                    "End date cannot be before start date."
            );
        }
    }

    private void ensurePatientExists(Long patientId) {

        if (patientId == null) {

            throw new IllegalArgumentException(
                    "Patient ID is required."
            );
        }

        if (!patientRepository.existsById(patientId)) {

            throw new IllegalArgumentException(
                    "Patient not found."
            );
        }
    }

    private User resolveStaff(Long staffId) {

        if (staffId == null) {
            return null;
        }

        return userRepository.findById(staffId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Assigned staff member not found."
                        )
                );
    }

    /*
     * ============================================================
     * HELPERS
     * ============================================================
     */

    private Appointment getEntity(Long id) {

        if (id == null) {

            throw new IllegalArgumentException(
                    "Appointment ID is required."
            );
        }

        return appointmentRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Appointment not found."
                        )
                );
    }

    private void requireStatus(
            Appointment appointment,
            AppointmentStatus expectedStatus) {

        if (appointment.getStatus() != expectedStatus) {

            throw new IllegalArgumentException(
                    "Appointment status must be "
                            + expectedStatus
                            + " before this action."
            );
        }
    }

    private boolean isActiveStatus(
            AppointmentStatus status) {

        return status == AppointmentStatus.SCHEDULED
                || status == AppointmentStatus.CONFIRMED
                || status == AppointmentStatus.CHECKED_IN;
    }

    private String normalizeAppointmentType(
            String appointmentType) {

        if (appointmentType == null) {
            return null;
        }

        return appointmentType
                .trim()
                .replaceAll("\\s+", "_")
                .toUpperCase(Locale.ROOT);
    }

    private String clean(String value) {

        if (value == null) {
            return null;
        }

        String cleaned = value.trim();

        return cleaned.isEmpty() ? null : cleaned;
    }

    private String buildActiveSlotKey(
            Long patientId,
            LocalDate appointmentDate,
            java.time.LocalTime appointmentTime,
            String appointmentType) {

        return patientId
                + "|"
                + appointmentDate
                + "|"
                + appointmentTime
                + "|"
                + appointmentType;
    }

    private String generateAppointmentNumber() {

        long nextNumber = appointmentRepository.count() + 1;

        String appointmentNumber;

        do {

            appointmentNumber = String.format(
                    "APT-%06d",
                    nextNumber
            );

            nextNumber++;

        } while (
                appointmentRepository
                        .findByAppointmentNumber(appointmentNumber)
                        .isPresent()
        );

        return appointmentNumber;
    }

    /*
     * ============================================================
     * RESPONSE MAPPING
     * ============================================================
     */

    private AppointmentResponse toResponse(
            Appointment appointment) {

        AppointmentResponse response =
                new AppointmentResponse();

        response.setId(appointment.getId());

        response.setAppointmentNumber(
                appointment.getAppointmentNumber()
        );

        Patient patient = appointment.getPatient();

        if (patient != null) {

            response.setPatientId(patient.getId());

            response.setPatientNumber(
                    patient.getPatientNumber()
            );

            response.setPatientName(
                    buildPatientName(patient)
            );
        }

        User staff = appointment.getAssignedStaff();

        if (staff != null) {

            response.setAssignedStaffId(
                    staff.getId()
            );

            response.setAssignedStaffName(
                    buildStaffName(staff)
            );
        }

        response.setAppointmentDate(
                appointment.getAppointmentDate()
        );

        response.setAppointmentTime(
                appointment.getAppointmentTime()
        );

        response.setAppointmentType(
                appointment.getAppointmentType()
        );

        response.setReason(
                appointment.getReason()
        );

        response.setStatus(
                appointment.getStatus()
        );

        response.setNotes(
                appointment.getNotes()
        );

        response.setCreatedAt(
                appointment.getCreatedAt()
        );

        response.setUpdatedAt(
                appointment.getUpdatedAt()
        );

        return response;
    }

    private String buildPatientName(
            Patient patient) {

        StringBuilder name = new StringBuilder();

        /*
         * Patient entity does not expose getMiddleName().
         * Therefore use only the fields that exist.
         */
        if (patient.getFirstName() != null
                && !patient.getFirstName().isBlank()) {

            name.append(patient.getFirstName().trim());
        }

        if (patient.getLastName() != null
                && !patient.getLastName().isBlank()) {

            appendSpace(name);
            name.append(patient.getLastName().trim());
        }

        return name.toString();
    }

    private String buildStaffName(User staff) {

        /*
         * User entity structure is respected here.
         * Username is used as a reliable fallback if fullName
         * is unavailable.
         */
        if (staff.getFullName() != null
                && !staff.getFullName().isBlank()) {

            return staff.getFullName().trim();
        }

        if (staff.getUsername() != null
                && !staff.getUsername().isBlank()) {

            return staff.getUsername().trim();
        }

        return "Unassigned Staff";
    }

    private void appendSpace(
            StringBuilder builder) {

        if (builder.length() > 0) {
            builder.append(" ");
        }
    }
}