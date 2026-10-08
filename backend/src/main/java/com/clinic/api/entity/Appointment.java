package com.clinic.api.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "appointments",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_appointment_number",
            columnNames = "appointment_number"
        ),
        @UniqueConstraint(
            name = "uk_appointment_active_slot",
            columnNames = "active_slot_key"
        )
    }
)
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Human-readable unique appointment number.
     * Example: APT-000001
     */
    @Column(
        name = "appointment_number",
        nullable = false,
        unique = true,
        length = 50
    )
    private String appointmentNumber;

    /**
     * Patient who owns this appointment.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "patient_id",
        nullable = false,
        foreignKey = @ForeignKey(
            name = "fk_appointment_patient"
        )
    )
    private Patient patient;

    /**
     * Staff member assigned to the appointment.
     *
     * This is optional because an appointment may initially
     * be created without assigning a specific staff member.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "assigned_staff_id",
        foreignKey = @ForeignKey(
            name = "fk_appointment_assigned_staff"
        )
    )
    private User assignedStaff;

    /**
     * Date of the appointment.
     */
    @Column(
        name = "appointment_date",
        nullable = false
    )
    private LocalDate appointmentDate;

    /**
     * Time of the appointment.
     */
    @Column(
        name = "appointment_time",
        nullable = false
    )
    private LocalTime appointmentTime;

    /**
     * Type/service of appointment.
     *
     * Examples:
     * GENERAL_CONSULTATION
     * FOLLOW_UP
     * MATERNITY
     * LABORATORY
     * PHARMACY
     * OTHER
     */
    @Column(
        name = "appointment_type",
        nullable = false,
        length = 50
    )
    private String appointmentType;

    /**
     * Reason provided for the appointment.
     */
    @Column(length = 1000)
    private String reason;

    /**
     * Appointment lifecycle status.
     */
    @Enumerated(EnumType.STRING)
    @Column(
        nullable = false,
        length = 30
    )
    private AppointmentStatus status;

    /**
     * Additional notes.
     */
    @Column(length = 2000)
    private String notes;

    /**
     * Internal database protection key used to prevent
     * duplicate active appointments for the same patient,
     * date, time and appointment type.
     *
     * This value is NULL for historical/inactive records
     * such as COMPLETED, CANCELLED and NO_SHOW.
     *
     * Because the column is nullable, MariaDB allows multiple
     * historical NULL values while still enforcing uniqueness
     * for active appointments.
     */
    @Column(
        name = "active_slot_key",
        unique = true,
        length = 255
    )
    private String activeSlotKey;

    /**
     * Creation timestamp.
     */
    @Column(
        name = "created_at",
        nullable = false,
        updatable = false
    )
    private LocalDateTime createdAt;

    /**
     * Last update timestamp.
     */
    private LocalDateTime updatedAt;

    public enum AppointmentStatus {
        SCHEDULED,
        CONFIRMED,
        CHECKED_IN,
        COMPLETED,
        CANCELLED,
        NO_SHOW
    }

    public Appointment() {
    }

    @PrePersist
    public void onCreate() {

        if (status == null) {
            status = AppointmentStatus.SCHEDULED;
        }

        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }

        updatedAt = LocalDateTime.now();

        updateActiveSlotKey();
    }

    @PreUpdate
    public void onUpdate (){

        updatedAt = LocalDateTime.now();

        updateActiveSlotKey();
    }

    /**
     * Builds the uniqueness key only for active appointments.
     *
     * Active:
     * SCHEDULED
     * CONFIRMED
     * CHECKED_IN
     *
     * Historical/inactive:
     * COMPLETED
     * CANCELLED
     * NO_SHOW
     */
    private void updateActiveSlotKey() {

        if (patient == null
                || patient.getId() == null
                || appointmentDate == null
                || appointmentTime == null
                || appointmentType == null
                || appointmentType.isBlank()
                || status == null) {

            activeSlotKey = null;
            return;
        }

        if (status == AppointmentStatus.SCHEDULED
                || status == AppointmentStatus.CONFIRMED
                || status == AppointmentStatus.CHECKED_IN) {

            activeSlotKey =
                patient.getId()
                + "|"
                + appointmentDate
                + "|"
                + appointmentTime
                + "|"
                + appointmentType.trim().toUpperCase();

        } else {

            /*
             * Completed, cancelled and no-show appointments
             * remain in the database as historical records,
             * but their slot becomes available for a new booking.
             */
            activeSlotKey = null;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAppointmentNumber() {
        return appointmentNumber;
    }

    public void setAppointmentNumber(String appointmentNumber) {
        this.appointmentNumber = appointmentNumber;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
        updateActiveSlotKey();
    }

    public User getAssignedStaff() {
        return assignedStaff;
    }

    public void setAssignedStaff(User assignedStaff) {
        this.assignedStaff = assignedStaff;
    }

    public LocalDate getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(LocalDate appointmentDate) {
        this.appointmentDate = appointmentDate;
        updateActiveSlotKey();
    }

    public LocalTime getAppointmentTime() {
        return appointmentTime;
    }

    public void setAppointmentTime(LocalTime appointmentTime) {
        this.appointmentTime = appointmentTime;
        updateActiveSlotKey();
    }

    public String getAppointmentType() {
        return appointmentType;
    }

    public void setAppointmentType(String appointmentType) {
        this.appointmentType = appointmentType;
        updateActiveSlotKey();
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    public void setStatus(AppointmentStatus status) {
        this.status = status;
        updateActiveSlotKey();
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getActiveSlotKey() {
        return activeSlotKey;
    }

    public void setActiveSlotKey(String activeSlotKey) {
        this.activeSlotKey = activeSlotKey;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}