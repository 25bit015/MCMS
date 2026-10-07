package com.clinic.api.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.clinic.api.dto.NewbornRecordRequest;
import com.clinic.api.dto.NewbornRecordResponse;
import com.clinic.api.entity.LabourRecord;
import com.clinic.api.entity.NewbornRecord;
import com.clinic.api.entity.Patient;
import com.clinic.api.entity.Pregnancy;
import com.clinic.api.repository.LabourRecordRepository;
import com.clinic.api.repository.NewbornRecordRepository;

@Service
@Transactional
public class NewbornRecordService {

    private final NewbornRecordRepository newbornRecordRepository;
    private final LabourRecordRepository labourRecordRepository;

    public NewbornRecordService(
            NewbornRecordRepository newbornRecordRepository,
            LabourRecordRepository labourRecordRepository
    ) {
        this.newbornRecordRepository = newbornRecordRepository;
        this.labourRecordRepository = labourRecordRepository;
    }

    // =========================================================
    // CREATE
    // =========================================================

    public NewbornRecordResponse create(NewbornRecordRequest request) {

        validateRequest(request);

        LabourRecord labourRecord =
                getLabourRecord(request.getLabourRecordId());

        validateLabourRecord(labourRecord);

        NewbornRecord newbornRecord = new NewbornRecord();

        newbornRecord.setLabourRecord(labourRecord);

        mapRequestToEntity(request, newbornRecord);

        // Status is controlled by the service.
        newbornRecord.setRecordStatus("ACTIVE");
        newbornRecord.setArchiveReason(null);

        NewbornRecord saved =
                newbornRecordRepository.save(newbornRecord);

        return mapToResponse(saved);
    }

    // =========================================================
    // UPDATE
    // =========================================================

    public NewbornRecordResponse update(
            Long id,
            NewbornRecordRequest request
    ) {

        validateRequest(request);

        NewbornRecord newbornRecord =
                getNewbornRecord(id);

        // -----------------------------------------------------
        // ARCHIVED NEWBORN RECORDS
        // -----------------------------------------------------

        if ("ARCHIVED".equalsIgnoreCase(
                newbornRecord.getRecordStatus()
        )) {

            throw new IllegalArgumentException(
                    "Archived newborn records are historical "
                            + "records and cannot be edited."
            );
        }

        // -----------------------------------------------------
        // EXISTING LABOUR RELATIONSHIP
        // -----------------------------------------------------

        if (newbornRecord.getLabourRecord() == null) {

            throw new IllegalArgumentException(
                    "Newborn record has no associated Labour record."
            );
        }

        Long existingLabourRecordId =
                newbornRecord.getLabourRecord().getId();

        if (!existingLabourRecordId.equals(
                request.getLabourRecordId()
        )) {

            throw new IllegalArgumentException(
                    "A newborn cannot be moved to another Labour "
                            + "record. The original Labour relationship "
                            + "must be preserved."
            );
        }

        LabourRecord labourRecord =
                getLabourRecord(
                        request.getLabourRecordId()
                );

        /*
         * Both ACTIVE and COMPLETED Labour records are valid
         * parents for newborn records.
         *
         * ARCHIVED Labour records are rejected.
         */
        validateLabourRecord(labourRecord);

        mapRequestToEntity(
                request,
                newbornRecord
        );

        // Preserve the original relationship.
        newbornRecord.setLabourRecord(
                labourRecord
        );

        // Status is controlled by the service.
        newbornRecord.setRecordStatus("ACTIVE");

        NewbornRecord updated =
                newbornRecordRepository.save(
                        newbornRecord
                );

        return mapToResponse(updated);
    }

    // =========================================================
    // GET ALL
    // =========================================================

    @Transactional(readOnly = true)
    public List<NewbornRecordResponse> getAll() {

        return newbornRecordRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // =========================================================
    // GET BY ID
    // =========================================================

    @Transactional(readOnly = true)
    public NewbornRecordResponse getById(Long id) {

        NewbornRecord newbornRecord =
                getNewbornRecord(id);

        return mapToResponse(newbornRecord);
    }

    // =========================================================
    // GET BY LABOUR RECORD
    // =========================================================

    @Transactional(readOnly = true)
    public List<NewbornRecordResponse> getByLabourRecord(
            Long labourRecordId
    ) {

        if (labourRecordId == null) {

            throw new IllegalArgumentException(
                    "Labour record ID is required."
            );
        }

        if (!labourRecordRepository.existsById(
                labourRecordId
        )) {

            throw new IllegalArgumentException(
                    "Labour record not found with ID: "
                            + labourRecordId
            );
        }

        return newbornRecordRepository
                .findByLabourRecordIdOrderByDateOfBirthDesc(
                        labourRecordId
                )
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // =========================================================
    // GET ACTIVE BY LABOUR RECORD
    // =========================================================

    @Transactional(readOnly = true)
    public List<NewbornRecordResponse> getActiveByLabourRecord(
            Long labourRecordId
    ) {

        if (labourRecordId == null) {

            throw new IllegalArgumentException(
                    "Labour record ID is required."
            );
        }

        if (!labourRecordRepository.existsById(
                labourRecordId
        )) {

            throw new IllegalArgumentException(
                    "Labour record not found with ID: "
                            + labourRecordId
            );
        }

        return newbornRecordRepository
                .findByLabourRecordIdAndRecordStatusOrderByDateOfBirthDesc(
                        labourRecordId,
                        "ACTIVE"
                )
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // =========================================================
    // ARCHIVE
    // =========================================================

    public void archive(
            Long id,
            String reason
    ) {

        NewbornRecord newbornRecord =
                getNewbornRecord(id);

        if ("ARCHIVED".equalsIgnoreCase(
                newbornRecord.getRecordStatus()
        )) {

            throw new IllegalArgumentException(
                    "Newborn record is already archived."
            );
        }

        String archiveReason =
                normalize(reason);

        if (archiveReason == null) {
            archiveReason = "Newborn record archived.";
        }

        newbornRecord.setRecordStatus(
                "ARCHIVED"
        );

        newbornRecord.setArchiveReason(
                archiveReason
        );

        newbornRecordRepository.save(
                newbornRecord
        );
    }

    // =========================================================
    // COUNT BY LABOUR RECORD
    // =========================================================

    @Transactional(readOnly = true)
    public long countByLabourRecord(
            Long labourRecordId
    ) {

        if (labourRecordId == null) {

            throw new IllegalArgumentException(
                    "Labour record ID is required."
            );
        }

        return newbornRecordRepository
                .countByLabourRecordId(
                        labourRecordId
                );
    }

    // =========================================================
    // COUNT ACTIVE BY LABOUR RECORD
    // =========================================================

    @Transactional(readOnly = true)
    public long countActiveByLabourRecord(
            Long labourRecordId
    ) {

        if (labourRecordId == null) {

            throw new IllegalArgumentException(
                    "Labour record ID is required."
            );
        }

        return newbornRecordRepository
                .countByLabourRecordIdAndRecordStatus(
                        labourRecordId,
                        "ACTIVE"
                );
    }

    // =========================================================
    // INTERNAL VALIDATION
    // =========================================================

    private void validateRequest(
            NewbornRecordRequest request
    ) {

        if (request == null) {

            throw new IllegalArgumentException(
                    "Newborn record request is required."
            );
        }

        if (request.getLabourRecordId() == null) {

            throw new IllegalArgumentException(
                    "Labour record ID is required."
            );
        }

        if (request.getDateOfBirth() == null) {

            throw new IllegalArgumentException(
                    "Date of birth is required."
            );
        }
    }

    // =========================================================
    // LABOUR RECORD VALIDATION
    // =========================================================

    private void validateLabourRecord(
            LabourRecord labourRecord
    ) {

        if (labourRecord == null) {

            throw new IllegalArgumentException(
                    "Labour record not found."
            );
        }

        String labourStatus =
                normalizeStatus(
                        labourRecord.getRecordStatus()
                );

        // -----------------------------------------------------
        // ARCHIVED LABOUR
        // -----------------------------------------------------

        if ("ARCHIVED".equals(labourStatus)) {

            throw new IllegalArgumentException(
                    "Newborn cannot be registered against "
                            + "an archived Labour record."
            );
        }

        // -----------------------------------------------------
        // ONLY ACTIVE OR COMPLETED LABOUR IS VALID
        // -----------------------------------------------------

        if (!"ACTIVE".equals(labourStatus)
                && !"COMPLETED".equals(labourStatus)) {

            throw new IllegalArgumentException(
                    "Newborn records can only be registered "
                            + "against ACTIVE or COMPLETED Labour records."
            );
        }

        // -----------------------------------------------------
        // PREGNANCY RELATIONSHIP
        // -----------------------------------------------------

        if (labourRecord.getPregnancy() == null) {

            throw new IllegalArgumentException(
                    "Labour record has no associated pregnancy."
            );
        }

        Pregnancy pregnancy =
                labourRecord.getPregnancy();

        // -----------------------------------------------------
        // PREGNANCY MUST STILL BE ACTIVE
        // -----------------------------------------------------

        if (!"ACTIVE".equalsIgnoreCase(
                pregnancy.getStatus()
        )) {

            throw new IllegalArgumentException(
                    "The pregnancy associated with this "
                            + "Labour record is not active."
            );
        }
    }

    // =========================================================
    // FIND LABOUR RECORD
    // =========================================================

    private LabourRecord getLabourRecord(
            Long labourRecordId
    ) {

        return labourRecordRepository
                .findById(labourRecordId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Labour record not found with ID: "
                                        + labourRecordId
                        )
                );
    }

    // =========================================================
    // FIND NEWBORN
    // =========================================================

    private NewbornRecord getNewbornRecord(
            Long id
    ) {

        if (id == null) {

            throw new IllegalArgumentException(
                    "Newborn record ID is required."
            );
        }

        return newbornRecordRepository
                .findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Newborn record not found with ID: "
                                        + id
                        )
                );
    }

    // =========================================================
    // MAP REQUEST TO ENTITY
    // =========================================================

    private void mapRequestToEntity(
            NewbornRecordRequest request,
            NewbornRecord entity
    ) {

        entity.setDateOfBirth(
                request.getDateOfBirth()
        );

        entity.setTimeOfBirth(
                normalize(
                        request.getTimeOfBirth()
                )
        );

        entity.setSex(
                normalize(
                        request.getSex()
                )
        );

        entity.setBirthOrder(
                request.getBirthOrder()
        );

        // -----------------------------------------------------
        // Birth measurements
        // -----------------------------------------------------

        entity.setBirthWeight(
                request.getBirthWeight()
        );

        entity.setBirthLength(
                request.getBirthLength()
        );

        entity.setHeadCircumference(
                request.getHeadCircumference()
        );

        // -----------------------------------------------------
        // APGAR
        // -----------------------------------------------------

        entity.setApgarOneMinute(
                request.getApgarOneMinute()
        );

        entity.setApgarFiveMinutes(
                request.getApgarFiveMinutes()
        );

        entity.setApgarTenMinutes(
                request.getApgarTenMinutes()
        );

        // -----------------------------------------------------
        // Condition at birth
        // -----------------------------------------------------

        entity.setConditionAtBirth(
                normalize(
                        request.getConditionAtBirth()
                )
        );

        entity.setCryAtBirth(
                normalize(
                        request.getCryAtBirth()
                )
        );

        entity.setBreathingAtBirth(
                normalize(
                        request.getBreathingAtBirth()
                )
        );

        entity.setMuscleTone(
                normalize(
                        request.getMuscleTone()
                )
        );

        entity.setSkinColour(
                normalize(
                        request.getSkinColour()
                )
        );

        // -----------------------------------------------------
        // Resuscitation
        // -----------------------------------------------------

        entity.setResuscitationRequired(
                request.getResuscitationRequired() != null
                        ? request.getResuscitationRequired()
                        : false
        );

        entity.setResuscitationMethod(
                normalize(
                        request.getResuscitationMethod()
                )
        );

        entity.setResuscitationDuration(
                normalize(
                        request.getResuscitationDuration()
                )
        );

        // -----------------------------------------------------
        // Clinical findings
        // -----------------------------------------------------

        entity.setCongenitalAbnormalities(
                normalize(
                        request.getCongenitalAbnormalities()
                )
        );

        entity.setClinicalCondition(
                normalize(
                        request.getClinicalCondition()
                )
        );

        entity.setTemperature(
                request.getTemperature()
        );

        entity.setHeartRate(
                request.getHeartRate()
        );

        entity.setRespiratoryRate(
                request.getRespiratoryRate()
        );

        // -----------------------------------------------------
        // Immediate newborn care
        // -----------------------------------------------------

        entity.setBreastfeedingStarted(
                request.getBreastfeedingStarted() != null
                        ? request.getBreastfeedingStarted()
                        : false
        );

        entity.setBreastfeedingTime(
                normalize(
                        request.getBreastfeedingTime()
                )
        );

        entity.setSkinToSkin(
                request.getSkinToSkin() != null
                        ? request.getSkinToSkin()
                        : false
        );

        entity.setVitaminKGiven(
                request.getVitaminKGiven() != null
                        ? request.getVitaminKGiven()
                        : false
        );

        entity.setBcgGiven(
                request.getBcgGiven() != null
                        ? request.getBcgGiven()
                        : false
        );

        entity.setOpvGiven(
                request.getOpvGiven() != null
                        ? request.getOpvGiven()
                        : false
        );

        // -----------------------------------------------------
        // Outcome
        // -----------------------------------------------------

        entity.setNewbornOutcome(
                normalize(
                        request.getNewbornOutcome()
                )
        );

        entity.setPlaceOfCare(
                normalize(
                        request.getPlaceOfCare()
                )
        );

        entity.setReferralRequired(
                request.getReferralRequired() != null
                        ? request.getReferralRequired()
                        : false
        );

        entity.setReferralReason(
                normalize(
                        request.getReferralReason()
                )
        );

        // -----------------------------------------------------
        // Clinical notes
        // -----------------------------------------------------

        entity.setAssessment(
                normalize(
                        request.getAssessment()
                )
        );

        entity.setTreatment(
                normalize(
                        request.getTreatment()
                )
        );

        entity.setNotes(
                normalize(
                        request.getNotes()
                )
        );
    }

    // =========================================================
    // MAP ENTITY TO RESPONSE
    // =========================================================

    private NewbornRecordResponse mapToResponse(
            NewbornRecord entity
    ) {

        NewbornRecordResponse response =
                new NewbornRecordResponse();

        response.setId(
                entity.getId()
        );

        LabourRecord labourRecord =
                entity.getLabourRecord();

        if (labourRecord != null) {

            response.setLabourRecordId(
                    labourRecord.getId()
            );

            Pregnancy pregnancy =
                    labourRecord.getPregnancy();

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
        }

        // -----------------------------------------------------
        // Basic information
        // -----------------------------------------------------

        response.setDateOfBirth(
                entity.getDateOfBirth()
        );

        response.setTimeOfBirth(
                entity.getTimeOfBirth()
        );

        response.setSex(
                entity.getSex()
        );

        response.setBirthOrder(
                entity.getBirthOrder()
        );

        // -----------------------------------------------------
        // Measurements
        // -----------------------------------------------------

        response.setBirthWeight(
                entity.getBirthWeight()
        );

        response.setBirthLength(
                entity.getBirthLength()
        );

        response.setHeadCircumference(
                entity.getHeadCircumference()
        );

        // -----------------------------------------------------
        // APGAR
        // -----------------------------------------------------

        response.setApgarOneMinute(
                entity.getApgarOneMinute()
        );

        response.setApgarFiveMinutes(
                entity.getApgarFiveMinutes()
        );

        response.setApgarTenMinutes(
                entity.getApgarTenMinutes()
        );

        // -----------------------------------------------------
        // Condition
        // -----------------------------------------------------

        response.setConditionAtBirth(
                entity.getConditionAtBirth()
        );

        response.setCryAtBirth(
                entity.getCryAtBirth()
        );

        response.setBreathingAtBirth(
                entity.getBreathingAtBirth()
        );

        response.setMuscleTone(
                entity.getMuscleTone()
        );

        response.setSkinColour(
                entity.getSkinColour()
        );

        // -----------------------------------------------------
        // Resuscitation
        // -----------------------------------------------------

        response.setResuscitationRequired(
                entity.getResuscitationRequired()
        );

        response.setResuscitationMethod(
                entity.getResuscitationMethod()
        );

        response.setResuscitationDuration(
                entity.getResuscitationDuration()
        );

        // -----------------------------------------------------
        // Clinical findings
        // -----------------------------------------------------

        response.setCongenitalAbnormalities(
                entity.getCongenitalAbnormalities()
        );

        response.setClinicalCondition(
                entity.getClinicalCondition()
        );

        response.setTemperature(
                entity.getTemperature()
        );

        response.setHeartRate(
                entity.getHeartRate()
        );

        response.setRespiratoryRate(
                entity.getRespiratoryRate()
        );

        // -----------------------------------------------------
        // Immediate care
        // -----------------------------------------------------

        response.setBreastfeedingStarted(
                entity.getBreastfeedingStarted()
        );

        response.setBreastfeedingTime(
                entity.getBreastfeedingTime()
        );

        response.setSkinToSkin(
                entity.getSkinToSkin()
        );

        response.setVitaminKGiven(
                entity.getVitaminKGiven()
        );

        response.setBcgGiven(
                entity.getBcgGiven()
        );

        response.setOpvGiven(
                entity.getOpvGiven()
        );

        // -----------------------------------------------------
        // Outcome
        // -----------------------------------------------------

        response.setNewbornOutcome(
                entity.getNewbornOutcome()
        );

        response.setPlaceOfCare(
                entity.getPlaceOfCare()
        );

        response.setReferralRequired(
                entity.getReferralRequired()
        );

        response.setReferralReason(
                entity.getReferralReason()
        );

        // -----------------------------------------------------
        // Clinical notes
        // -----------------------------------------------------

        response.setAssessment(
                entity.getAssessment()
        );

        response.setTreatment(
                entity.getTreatment()
        );

        response.setNotes(
                entity.getNotes()
        );

        // -----------------------------------------------------
        // Record protection
        // -----------------------------------------------------

        response.setRecordStatus(
                entity.getRecordStatus()
        );

        response.setArchiveReason(
                entity.getArchiveReason()
        );

        // -----------------------------------------------------
        // Timestamps
        // -----------------------------------------------------

        response.setCreatedAt(
                entity.getCreatedAt()
        );

        response.setUpdatedAt(
                entity.getUpdatedAt()
        );

        return response;
    }

    // =========================================================
    // PATIENT NAME
    // =========================================================

    private String buildPatientName(
            Patient patient
    ) {

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
    // STRING NORMALIZATION
    // =========================================================

    private String normalize(
            String value
    ) {

        if (value == null) {
            return null;
        }

        String trimmed =
                value.trim();

        return trimmed.isEmpty()
                ? null
                : trimmed;
    }

    // =========================================================
    // STATUS NORMALIZATION
    // =========================================================

    private String normalizeStatus(
            String status
    ) {

        if (status == null
                || status.isBlank()) {

            return "ACTIVE";
        }

        return status
                .trim()
                .toUpperCase();
    }
}