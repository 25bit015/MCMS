package com.clinic.api.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.clinic.api.dto.LabourRecordRequest;
import com.clinic.api.dto.LabourRecordResponse;
import com.clinic.api.entity.LabourRecord;
import com.clinic.api.entity.Patient;
import com.clinic.api.entity.Pregnancy;
import com.clinic.api.repository.LabourRecordRepository;
import com.clinic.api.repository.PregnancyRepository;

@Service
@Transactional
public class LabourRecordService {

    private final LabourRecordRepository labourRecordRepository;
    private final PregnancyRepository pregnancyRepository;

    public LabourRecordService(
            LabourRecordRepository labourRecordRepository,
            PregnancyRepository pregnancyRepository) {

        this.labourRecordRepository = labourRecordRepository;
        this.pregnancyRepository = pregnancyRepository;
    }

    // =========================================================
    // GET ALL
    // =========================================================

    @Transactional(readOnly = true)
    public List<LabourRecordResponse> getAll() {

        return labourRecordRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================================
    // GET BY ID
    // =========================================================

    @Transactional(readOnly = true)
    public LabourRecordResponse getById(Long id) {

        LabourRecord record = labourRecordRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Labour record with ID " + id
                                        + " was not found."
                        ));

        return toResponse(record);
    }

    // =========================================================
    // GET BY PREGNANCY
    // =========================================================

    @Transactional(readOnly = true)
    public List<LabourRecordResponse> getByPregnancy(
            Long pregnancyId) {

        if (pregnancyId == null) {
            throw new IllegalArgumentException(
                    "Pregnancy ID is required."
            );
        }

        if (!pregnancyRepository.existsById(pregnancyId)) {
            throw new IllegalArgumentException(
                    "Pregnancy with ID " + pregnancyId
                            + " was not found."
            );
        }

        return labourRecordRepository
                .findByPregnancyIdOrderByAdmissionDateDesc(
                        pregnancyId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================================
    // GET ACTIVE BY PREGNANCY
    // =========================================================

    @Transactional(readOnly = true)
    public List<LabourRecordResponse> getActiveByPregnancy(
            Long pregnancyId) {

        if (pregnancyId == null) {
            throw new IllegalArgumentException(
                    "Pregnancy ID is required."
            );
        }

        if (!pregnancyRepository.existsById(pregnancyId)) {
            throw new IllegalArgumentException(
                    "Pregnancy with ID " + pregnancyId
                            + " was not found."
            );
        }

        return labourRecordRepository
                .findByPregnancyIdAndRecordStatusOrderByAdmissionDateDesc(
                        pregnancyId,
                        "ACTIVE"
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================================
    // CREATE
    // =========================================================

    public LabourRecordResponse create(
            LabourRecordRequest request) {

        validateRequest(request);

        Pregnancy pregnancy =
                getActivePregnancy(
                        request.getPregnancyId()
                );

        boolean activeRecordExists =
                labourRecordRepository
                        .existsByPregnancyIdAndRecordStatus(
                                pregnancy.getId(),
                                "ACTIVE"
                        );

        if (activeRecordExists) {
            throw new IllegalArgumentException(
                    "An active Labour record already exists "
                            + "for this pregnancy."
            );
        }

        LabourRecord record = new LabourRecord();

        record.setPregnancy(pregnancy);

        applyRequest(record, request);

        // New Labour episodes always start as ACTIVE.
        record.setRecordStatus("ACTIVE");
        record.setArchiveReason(null);

        LabourRecord saved =
                labourRecordRepository.save(record);

        return toResponse(saved);
    }

    // =========================================================
    // UPDATE
    // =========================================================

    public LabourRecordResponse update(
            Long id,
            LabourRecordRequest request) {

        validateRequest(request);

        LabourRecord record =
                labourRecordRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Labour record with ID "
                                                + id
                                                + " was not found."
                                ));

        String currentStatus =
                normalizeStatus(
                        record.getRecordStatus()
                );

        // -----------------------------------------------------
        // ARCHIVED RECORDS
        // -----------------------------------------------------

        if ("ARCHIVED".equals(currentStatus)) {

            throw new IllegalArgumentException(
                    "Archived Labour records are historical "
                            + "records and cannot be edited."
            );
        }

        // -----------------------------------------------------
        // COMPLETED RECORDS
        // -----------------------------------------------------

        if ("COMPLETED".equals(currentStatus)) {

            throw new IllegalArgumentException(
                    "Completed Labour records are finalized "
                            + "delivery records and cannot be edited."
            );
        }

        // -----------------------------------------------------
        // ONLY ACTIVE RECORDS CAN REACH THIS POINT
        // -----------------------------------------------------

        if (!"ACTIVE".equals(currentStatus)) {

            throw new IllegalArgumentException(
                    "Only ACTIVE Labour records can be edited."
            );
        }

        // -----------------------------------------------------
        // PREGNANCY RELATIONSHIP
        // -----------------------------------------------------

        if (request.getPregnancyId() == null) {

            throw new IllegalArgumentException(
                    "Pregnancy ID is required."
            );
        }

        // Prevent moving a Labour record to another pregnancy.
        if (!record.getPregnancy()
                .getId()
                .equals(request.getPregnancyId())) {

            throw new IllegalArgumentException(
                    "A Labour record cannot be moved to "
                            + "another pregnancy. The original "
                            + "pregnancy relationship must be preserved."
            );
        }

        Pregnancy pregnancy =
                getActivePregnancy(
                        request.getPregnancyId()
                );

        record.setPregnancy(pregnancy);

        applyRequest(record, request);

        // Only ACTIVE records reach this point.
        record.setRecordStatus("ACTIVE");

        LabourRecord saved =
                labourRecordRepository.save(record);

        return toResponse(saved);
    }

    // =========================================================
    // COMPLETE
    // =========================================================

    public LabourRecordResponse complete(
            Long id) {

        LabourRecord record =
                labourRecordRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Labour record with ID "
                                                + id
                                                + " was not found."
                                ));

        String currentStatus =
                normalizeStatus(
                        record.getRecordStatus()
                );

        // -----------------------------------------------------
        // ONLY ACTIVE RECORDS CAN BE COMPLETED
        // -----------------------------------------------------

        if ("COMPLETED".equals(currentStatus)) {

            throw new IllegalArgumentException(
                    "Labour record is already completed."
            );
        }

        if ("ARCHIVED".equals(currentStatus)) {

            throw new IllegalArgumentException(
                    "Archived Labour records cannot be completed."
            );
        }

        if (!"ACTIVE".equals(currentStatus)) {

            throw new IllegalArgumentException(
                    "Only ACTIVE Labour records can be completed."
            );
        }

        // -----------------------------------------------------
        // DELIVERY VALIDATION
        // -----------------------------------------------------

        if (record.getDeliveryDate() == null) {

            throw new IllegalArgumentException(
                    "Labour record cannot be completed "
                            + "without a delivery date."
            );
        }

        if (isBlank(record.getDeliveryMode())) {

            throw new IllegalArgumentException(
                    "Labour record cannot be completed "
                            + "without a delivery mode."
            );
        }

        if (isBlank(record.getDeliveryOutcome())) {

            throw new IllegalArgumentException(
                    "Labour record cannot be completed "
                            + "without a delivery outcome."
            );
        }

        // -----------------------------------------------------
        // COMPLETE RECORD
        // -----------------------------------------------------

        record.setRecordStatus("COMPLETED");
        record.setArchiveReason(null);

        LabourRecord saved =
                labourRecordRepository.save(record);

        return toResponse(saved);
    }

    // =========================================================
    // ARCHIVE
    // =========================================================

    public void archive(
            Long id,
            String archiveReason) {

        LabourRecord record =
                labourRecordRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Labour record with ID "
                                                + id
                                                + " was not found."
                                ));

        String currentStatus =
                normalizeStatus(
                        record.getRecordStatus()
                );

        if ("ARCHIVED".equals(currentStatus)) {

            throw new IllegalArgumentException(
                    "Labour record is already archived."
            );
        }

        /*
         * Archive is intentionally allowed for both:
         *
         * ACTIVE    -> ARCHIVED
         * COMPLETED -> ARCHIVED
         *
         * This is a historical-record operation, not
         * a clinical edit.
         */

        String reason =
                archiveReason == null
                        ? ""
                        : archiveReason.trim();

        if (reason.isBlank()) {
            reason = "Archived by clinical user.";
        }

        record.setRecordStatus("ARCHIVED");
        record.setArchiveReason(reason);

        labourRecordRepository.save(record);
    }

    // =========================================================
    // GET ACTIVE PREGNANCY
    // =========================================================

    private Pregnancy getActivePregnancy(
            Long pregnancyId) {

        if (pregnancyId == null) {
            throw new IllegalArgumentException(
                    "Pregnancy ID is required."
            );
        }

        Pregnancy pregnancy =
                pregnancyRepository.findById(pregnancyId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Pregnancy with ID "
                                                + pregnancyId
                                                + " was not found."
                                ));

        if (!"ACTIVE".equalsIgnoreCase(
                pregnancy.getStatus())) {

            throw new IllegalArgumentException(
                    "Labour records can only be created "
                            + "or edited for an ACTIVE pregnancy."
            );
        }

        return pregnancy;
    }

    // =========================================================
    // VALIDATE REQUEST
    // =========================================================

    private void validateRequest(
            LabourRecordRequest request) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Labour record data is required."
            );
        }

        if (request.getPregnancyId() == null) {
            throw new IllegalArgumentException(
                    "Pregnancy ID is required."
            );
        }

        if (request.getAdmissionDate() == null) {
            throw new IllegalArgumentException(
                    "Admission date is required."
            );
        }

        if (request.getDeliveryDate() != null
                && request.getDeliveryDate()
                        .isBefore(
                                request.getAdmissionDate()
                        )) {

            throw new IllegalArgumentException(
                    "Delivery date cannot be before "
                            + "admission date."
            );
        }
    }

    // =========================================================
    // APPLY REQUEST TO ENTITY
    // =========================================================

    private void applyRequest(
            LabourRecord record,
            LabourRecordRequest request) {

        // -----------------------------------------------------
        // Admission
        // -----------------------------------------------------

        record.setAdmissionDate(
                request.getAdmissionDate()
        );

        record.setAdmissionTime(
                request.getAdmissionTime()
        );

        record.setAdmissionReason(
                request.getAdmissionReason()
        );

        // -----------------------------------------------------
        // Labour
        // -----------------------------------------------------

        record.setLabourOnset(
                request.getLabourOnset()
        );

        record.setLabourStage(
                request.getLabourStage()
        );

        record.setMembraneStatus(
                request.getMembraneStatus()
        );

        record.setLiquor(
                request.getLiquor()
        );

        record.setCervicalDilation(
                request.getCervicalDilation()
        );

        record.setCervicalEffacement(
                request.getCervicalEffacement()
        );

        record.setFetalDescent(
                request.getFetalDescent()
        );

        record.setContractionFrequency(
                request.getContractionFrequency()
        );

        record.setContractionDuration(
                request.getContractionDuration()
        );

        // -----------------------------------------------------
        // Maternal
        // -----------------------------------------------------

        record.setMaternalWeight(
                request.getMaternalWeight()
        );

        record.setBloodPressureSystolic(
                request.getBloodPressureSystolic()
        );

        record.setBloodPressureDiastolic(
                request.getBloodPressureDiastolic()
        );

        record.setPulse(
                request.getPulse()
        );

        record.setTemperature(
                request.getTemperature()
        );

        record.setRespiratoryRate(
                request.getRespiratoryRate()
        );

        record.setMaternalCondition(
                request.getMaternalCondition()
        );

        record.setPainScore(
                request.getPainScore()
        );

        record.setBleeding(
                request.getBleeding()
        );

        record.setComplications(
                request.getComplications()
        );

        // -----------------------------------------------------
        // Fetal
        // -----------------------------------------------------

        record.setFetalHeartRate(
                request.getFetalHeartRate()
        );

        record.setFetalCondition(
                request.getFetalCondition()
        );

        record.setFetalPresentation(
                request.getFetalPresentation()
        );

        record.setFetalLie(
                request.getFetalLie()
        );

        record.setFetalPosition(
                request.getFetalPosition()
        );

        record.setFetalMovement(
                request.getFetalMovement()
        );

        // -----------------------------------------------------
        // Delivery
        // -----------------------------------------------------

        record.setDeliveryDate(
                request.getDeliveryDate()
        );

        record.setDeliveryTime(
                request.getDeliveryTime()
        );

        record.setDeliveryMode(
                request.getDeliveryMode()
        );

        record.setDeliveryIndication(
                request.getDeliveryIndication()
        );

        record.setDeliveryOutcome(
                request.getDeliveryOutcome()
        );

        record.setDeliveryComplications(
                request.getDeliveryComplications()
        );

        // -----------------------------------------------------
        // Mother after delivery
        // -----------------------------------------------------

        record.setMaternalOutcome(
                request.getMaternalOutcome()
        );

        record.setPostpartumBleeding(
                request.getPostpartumBleeding()
        );

        record.setPlacentaStatus(
                request.getPlacentaStatus()
        );

        record.setEstimatedBloodLoss(
                request.getEstimatedBloodLoss()
        );

        // -----------------------------------------------------
        // Clinical
        // -----------------------------------------------------

        record.setAssessment(
                request.getAssessment()
        );

        record.setDiagnosis(
                request.getDiagnosis()
        );

        record.setTreatment(
                request.getTreatment()
        );

        record.setMedication(
                request.getMedication()
        );

        record.setReferral(
                request.getReferral()
        );

        record.setNotes(
                request.getNotes()
        );
    }

    // =========================================================
    // ENTITY -> RESPONSE
    // =========================================================

    private LabourRecordResponse toResponse(
            LabourRecord record) {

        LabourRecordResponse response =
                new LabourRecordResponse();

        response.setId(
                record.getId()
        );

        Pregnancy pregnancy =
                record.getPregnancy();

        if (pregnancy != null) {

            response.setPregnancyId(
                    pregnancy.getId()
            );

            Patient patient =
                    pregnancy.getPatient();

            if (patient != null) {

                response.setPatientId(
                        patient.getId()
                );

                response.setPatientNumber(
                        patient.getPatientNumber()
                );

                response.setPatientName(
                        buildPatientName(patient)
                );
            }
        }

        // -----------------------------------------------------
        // Admission
        // -----------------------------------------------------

        response.setAdmissionDate(
                record.getAdmissionDate()
        );

        response.setAdmissionTime(
                record.getAdmissionTime()
        );

        response.setAdmissionReason(
                record.getAdmissionReason()
        );

        // -----------------------------------------------------
        // Labour
        // -----------------------------------------------------

        response.setLabourOnset(
                record.getLabourOnset()
        );

        response.setLabourStage(
                record.getLabourStage()
        );

        response.setMembraneStatus(
                record.getMembraneStatus()
        );

        response.setLiquor(
                record.getLiquor()
        );

        response.setCervicalDilation(
                record.getCervicalDilation()
        );

        response.setCervicalEffacement(
                record.getCervicalEffacement()
        );

        response.setFetalDescent(
                record.getFetalDescent()
        );

        response.setContractionFrequency(
                record.getContractionFrequency()
        );

        response.setContractionDuration(
                record.getContractionDuration()
        );

        // -----------------------------------------------------
        // Maternal
        // -----------------------------------------------------

        response.setMaternalWeight(
                record.getMaternalWeight()
        );

        response.setBloodPressureSystolic(
                record.getBloodPressureSystolic()
        );

        response.setBloodPressureDiastolic(
                record.getBloodPressureDiastolic()
        );

        response.setPulse(
                record.getPulse()
        );

        response.setTemperature(
                record.getTemperature()
        );

        response.setRespiratoryRate(
                record.getRespiratoryRate()
        );

        response.setMaternalCondition(
                record.getMaternalCondition()
        );

        response.setPainScore(
                record.getPainScore()
        );

        response.setBleeding(
                record.getBleeding()
        );

        response.setComplications(
                record.getComplications()
        );

        // -----------------------------------------------------
        // Fetal
        // -----------------------------------------------------

        response.setFetalHeartRate(
                record.getFetalHeartRate()
        );

        response.setFetalCondition(
                record.getFetalCondition()
        );

        response.setFetalPresentation(
                record.getFetalPresentation()
        );

        response.setFetalLie(
                record.getFetalLie()
        );

        response.setFetalPosition(
                record.getFetalPosition()
        );

        response.setFetalMovement(
                record.getFetalMovement()
        );

        // -----------------------------------------------------
        // Delivery
        // -----------------------------------------------------

        response.setDeliveryDate(
                record.getDeliveryDate()
        );

        response.setDeliveryTime(
                record.getDeliveryTime()
        );

        response.setDeliveryMode(
                record.getDeliveryMode()
        );

        response.setDeliveryIndication(
                record.getDeliveryIndication()
        );

        response.setDeliveryOutcome(
                record.getDeliveryOutcome()
        );

        response.setDeliveryComplications(
                record.getDeliveryComplications()
        );

        // -----------------------------------------------------
        // Mother after delivery
        // -----------------------------------------------------

        response.setMaternalOutcome(
                record.getMaternalOutcome()
        );

        response.setPostpartumBleeding(
                record.getPostpartumBleeding()
        );

        response.setPlacentaStatus(
                record.getPlacentaStatus()
        );

        response.setEstimatedBloodLoss(
                record.getEstimatedBloodLoss()
        );

        // -----------------------------------------------------
        // Clinical
        // -----------------------------------------------------

        response.setAssessment(
                record.getAssessment()
        );

        response.setDiagnosis(
                record.getDiagnosis()
        );

        response.setTreatment(
                record.getTreatment()
        );

        response.setMedication(
                record.getMedication()
        );

        response.setReferral(
                record.getReferral()
        );

        response.setNotes(
                record.getNotes()
        );

        // -----------------------------------------------------
        // Record protection
        // -----------------------------------------------------

        response.setRecordStatus(
                record.getRecordStatus()
        );

        response.setArchiveReason(
                record.getArchiveReason()
        );

        // -----------------------------------------------------
        // Timestamps
        // -----------------------------------------------------

        response.setCreatedAt(
                record.getCreatedAt()
        );

        response.setUpdatedAt(
                record.getUpdatedAt()
        );

        return response;
    }

    // =========================================================
    // BUILD PATIENT NAME
    // =========================================================

    private String buildPatientName(
            Patient patient) {

        StringBuilder name =
                new StringBuilder();

        if (patient.getFirstName() != null
                && !patient.getFirstName().isBlank()) {

            name.append(
                    patient.getFirstName().trim()
            );
        }

        if (patient.getLastName() != null
                && !patient.getLastName().isBlank()) {

            if (name.length() > 0) {
                name.append(" ");
            }

            name.append(
                    patient.getLastName().trim()
            );
        }

        return name.toString();
    }

    // =========================================================
    // NORMALIZE STATUS
    // =========================================================

    private String normalizeStatus(
            String status) {

        if (status == null
                || status.isBlank()) {

            return "ACTIVE";
        }

        return status.trim().toUpperCase();
    }

    // =========================================================
    // CHECK BLANK STRING
    // =========================================================

    private boolean isBlank(
            String value) {

        return value == null
                || value.isBlank();
    }
}