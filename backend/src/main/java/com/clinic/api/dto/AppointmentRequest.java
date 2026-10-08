package com.clinic.api.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AppointmentRequest {

    /**
     * Patient associated with this appointment.
     */
    @NotNull(message = "Patient ID is required.")
    private Long patientId;

    /**
     * Optional staff member assigned to the appointment.
     */
    private Long assignedStaffId;

    /**
     * Date of appointment.
     *
     * FutureOrPresent prevents creating appointments
     * for dates that have already passed.
     */
    @NotNull(message = "Appointment date is required.")
    @FutureOrPresent(message = "Appointment date cannot be in the past.")
    private LocalDate appointmentDate;

    /**
     * Time of appointment.
     */
    @NotNull(message = "Appointment time is required.")
    private LocalTime appointmentTime;

    /**
     * Appointment type/service.
     */
    @NotBlank(message = "Appointment type is required.")
    @Size(
        max = 50,
        message = "Appointment type cannot exceed 50 characters."
    )
    private String appointmentType;

    /**
     * Reason for appointment.
     */
    @Size(
        max = 1000,
        message = "Reason cannot exceed 1000 characters."
    )
    private String reason;

    /**
     * Additional notes.
     */
    @Size(
        max = 2000,
        message = "Notes cannot exceed 2000 characters."
    )
    private String notes;

    public AppointmentRequest() {
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getAssignedStaffId() {
        return assignedStaffId;
    }

    public void setAssignedStaffId(Long assignedStaffId) {
        this.assignedStaffId = assignedStaffId;
    }

    public LocalDate getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(LocalDate appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public LocalTime getAppointmentTime() {
        return appointmentTime;
    }

    public void setAppointmentTime(LocalTime appointmentTime) {
        this.appointmentTime = appointmentTime;
    }

    public String getAppointmentType() {
        return appointmentType;
    }

    public void setAppointmentType(String appointmentType) {
        this.appointmentType = appointmentType;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}