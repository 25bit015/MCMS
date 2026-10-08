package com.clinic.api.security;

import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.clinic.api.entity.Role;
import com.clinic.api.repository.RoleModuleRepository;
import com.clinic.api.repository.RoleRepository;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class ModulePermissionService {

    private final RoleRepository roleRepository;
    private final RoleModuleRepository roleModuleRepository;

    public ModulePermissionService(
            RoleRepository roleRepository,
            RoleModuleRepository roleModuleRepository
    ) {
        this.roleRepository = roleRepository;
        this.roleModuleRepository = roleModuleRepository;
    }

    public boolean hasPermission(
            Authentication authentication,
            HttpServletRequest request
    ) {

        if (authentication == null
                || !authentication.isAuthenticated()) {
            return false;
        }

        String uri = request.getRequestURI();
        String method = request.getMethod();

        if (uri == null) {
            return false;
        }

        // =========================================================
        // PUBLIC AUTHENTICATED SHARED ENDPOINTS
        // =========================================================

        if (uri.equals("/api/roles")
                && "GET".equalsIgnoreCase(method)) {
            return true;
        }

        if ((uri.equals("/api/users/me")
                || uri.equals("/api/users/me/password"))
                && ("GET".equalsIgnoreCase(method)
                || "PUT".equalsIgnoreCase(method))) {
            return true;
        }

        if (uri.equals("/api/modules")
                && "GET".equalsIgnoreCase(method)) {
            return true;
        }

        if (uri.startsWith("/api/role-modules/role/")
                && "GET".equalsIgnoreCase(method)) {
            return true;
        }

        // =========================================================
        // RESOLVE USER ROLE
        // =========================================================

        String roleName = resolveRoleName(authentication);

        if (roleName == null) {
            return false;
        }

        // =========================================================
        // PATIENT GET ACCESS
        //
        // Reception, Nurse, Doctor, Laboratory and Pharmacy
        // can view patient information.
        // =========================================================

        if (uri.startsWith("/api/patients")
                && "GET".equalsIgnoreCase(method)) {

            return hasAnyModulePermission(
                    roleName,
                    "RECEPTION",
                    "NURSE",
                    "DOCTOR",
                    "LABORATORY",
                    "PHARMACY",
                    "MATERNITY"
            );
        }

        // =========================================================
        // SHARED PATIENT QUEUE ENDPOINTS
        //
        // Reception, Nurse, Doctor, Laboratory and Pharmacy
        // can access shared queue information.
        // =========================================================

        if (isSharedPatientQueueEndpoint(request)) {

            return hasAnyModulePermission(
                    roleName,
                    "RECEPTION",
                    "NURSE",
                    "DOCTOR",
                    "LABORATORY",
                    "PHARMACY",
                    "MATERNITY"
            );
        }

        // =========================================================
        // CONSULTATION GET ACCESS
        //
        // Doctor and Laboratory can view consultations.
        // =========================================================

        if (uri.startsWith("/api/consultations")
                && "GET".equalsIgnoreCase(method)) {

            return hasAnyModulePermission(
                    roleName,
                    "DOCTOR",
                    "LABORATORY"
            );
        }

        // =========================================================
        // LABORATORY RESULTS GET ACCESS
        //
        // Doctor needs GET access to review laboratory results.
        // Laboratory also needs GET access.
        //
        // POST / PUT / DELETE continue to use
        // LABORATORY module permission below.
        // =========================================================

        if (uri.startsWith("/api/laboratory-results")
                && "GET".equalsIgnoreCase(method)) {

            return hasAnyModulePermission(
                    roleName,
                    "DOCTOR",
                    "LABORATORY"
            );
        }

        // =========================================================
        // MATERNITY
        //
        // All Maternity endpoints use the MATERNITY module.
        //
        // Access is still controlled by RoleModuleService:
        //
        // ROLE -> MATERNITY -> allowed
        //
        // Therefore we do NOT bypass security here.
        // =========================================================

        if (uri.startsWith("/api/maternity")) {

            return hasModulePermission(
                    roleName,
                    "MATERNITY"
            );
        }

        // =========================================================
        // RESOLVE MODULE FOR OTHER ENDPOINTS
        // =========================================================

        String moduleName = resolveModule(request);

        if (moduleName != null) {

            return hasModulePermission(
                    roleName,
                    moduleName
            );
        }

        return false;
    }

    // =============================================================
    // CHECK SINGLE MODULE PERMISSION
    // =============================================================

    public boolean hasModulePermission(
            String roleName,
            String moduleName
    ) {

        if (roleName == null
                || moduleName == null) {
            return false;
        }

        String cleanRoleName =
                roleName
                        .replace("ROLE_", "")
                        .trim()
                        .toUpperCase();

        String cleanModuleName =
                moduleName
                        .trim()
                        .toUpperCase();

        Optional<Role> roleOptional =
                roleRepository.findByName(cleanRoleName);

        if (roleOptional.isEmpty()) {
            return false;
        }

        Role role = roleOptional.get();

        return roleModuleRepository
                .findByRoleId(role.getId())
                .stream()
                .anyMatch(
                        roleModule ->
                                roleModule.getModule() != null
                                && cleanModuleName.equals(
                                        roleModule
                                                .getModule()
                                                .getName()
                                )
                                && roleModule.isAllowed()
                );
    }

    // =============================================================
    // CHECK IF USER HAS ANY OF THE GIVEN MODULE PERMISSIONS
    // =============================================================

    private boolean hasAnyModulePermission(
            String roleName,
            String... moduleNames
    ) {

        for (String moduleName : moduleNames) {

            if (hasModulePermission(
                    roleName,
                    moduleName
            )) {
                return true;
            }
        }

        return false;
    }

    // =============================================================
    // RESOLVE ROLE NAME FROM AUTHENTICATION
    // =============================================================

    private String resolveRoleName(
            Authentication authentication
    ) {

        return authentication
                .getAuthorities()
                .stream()
                .map(authority ->
                        authority.getAuthority()
                )
                .filter(
                        authority ->
                                authority != null
                                && authority.startsWith(
                                        "ROLE_"
                                )
                )
                .findFirst()
                .orElse(null);
    }

    // =============================================================
    // SHARED PATIENT QUEUE ENDPOINTS
    // =============================================================

    private boolean isSharedPatientQueueEndpoint(
            HttpServletRequest request
    ) {

        String uri =
                request.getRequestURI();

        if (uri == null) {
            return false;
        }

        if (uri.equals(
                "/api/patient-queue/date"
        )) {
            return true;
        }

        if (uri.equals(
                "/api/patient-queue/number"
        )) {
            return true;
        }

        if (uri.matches(
                "/api/patient-queue/\\d+"
        )) {
            return true;
        }

        if (uri.matches(
                "/api/patient-queue/\\d+/status"
        )) {
            return true;
        }

        return false;
    }

    // =============================================================
    // RESOLVE MODULE FROM API ENDPOINT
    // =============================================================

    private String resolveModule(
            HttpServletRequest request
    ) {

        String uri =
                request.getRequestURI();

        String method =
                request.getMethod();

        if (uri == null) {
            return null;
        }

        // =========================================================
        // DASHBOARD
        // =========================================================

        if (uri.startsWith(
                "/api/dashboard"
        )) {
            return "DASHBOARD";
        }

        // =========================================================
        // PATIENTS
        // =========================================================

        if (uri.startsWith(
                "/api/patients"
        )
                && !"GET".equalsIgnoreCase(method)) {

            return "RECEPTION";
        }

        // =========================================================
        // PATIENT QUEUE
        // =========================================================

        if (uri.equals(
                "/api/patient-queue"
        )
                && "POST".equalsIgnoreCase(method)) {

            return "RECEPTION";
        }

        if (uri.equals(
                "/api/patient-queue"
        )
                && "GET".equalsIgnoreCase(method)) {

            return "RECEPTION";
        }

        if (uri.startsWith(
                "/api/patient-queue/nurse"
        )) {
            return "NURSE";
        }

        if (uri.startsWith(
                "/api/patient-queue/doctor"
        )) {
            return "DOCTOR";
        }

        if (uri.startsWith(
                "/api/patient-queue/stats"
        )) {
            return "RECEPTION";
        }

        // =========================================================
        // VITALS
        // =========================================================

        if (uri.startsWith(
                "/api/vitals"
        )) {
            return "NURSE";
        }

        // =========================================================
// APPOINTMENTS
// =========================================================

if (uri.startsWith(
        "/api/appointments"
)) {
    return "APPOINTMENT";
}

        // =========================================================
        // CONSULTATIONS
        // =========================================================

        if (uri.startsWith(
                "/api/consultations"
        )) {
            return "DOCTOR";
        }

        // =========================================================
        // LABORATORY RESULTS
        //
        // GET is handled above as shared Doctor/Laboratory access.
        // Other methods remain Laboratory-only.
        // =========================================================

        if (uri.startsWith(
                "/api/laboratory-results"
        )) {
            return "LABORATORY";
        }

        // =========================================================
        // MEDICINES
        // =========================================================

        if (uri.startsWith(
                "/api/medicines"
        )) {
            return "PHARMACY";
        }

        // =========================================================
        // MEDICINE BATCHES
        // =========================================================

        if (uri.startsWith(
                "/api/medicine-batches"
        )) {
            return "PHARMACY";
        }

        // =========================================================
        // STOCK MOVEMENTS
        // =========================================================

        if (uri.startsWith(
                "/api/stock-movements"
        )) {
            return "PHARMACY";
        }

        // =========================================================
        // PRESCRIPTIONS
        // =========================================================

        if (uri.startsWith(
                "/api/prescriptions"
        )) {
            return "PHARMACY";
        }

        // =========================================================
        // DISPENSINGS
        // =========================================================

        if (uri.startsWith(
                "/api/dispensings"
        )) {
            return "PHARMACY";
        }

        // =========================================================
        // INVOICES
        // =========================================================

        if (uri.startsWith(
                "/api/invoices"
        )) {
            return "BILLING";
        }

        // =========================================================
        // PAYMENTS
        // =========================================================

        if (uri.startsWith(
                "/api/payments"
        )) {
            return "BILLING";
        }

        // =========================================================
        // INSURANCE CLAIMS
        // =========================================================

        if (uri.startsWith(
                "/api/insurance-claims"
        )) {
            return "BILLING";
        }

        // =========================================================
        // INSURANCE PROVIDERS
        // =========================================================

        if (uri.startsWith(
                "/api/insurance-providers"
        )) {
            return "BILLING";
        }

        // =========================================================
        // USERS
        // =========================================================

        if (uri.startsWith(
                "/api/users"
        )) {
            return "USERS";
        }

        // =========================================================
        // ROLE MODULES
        // =========================================================

        if (uri.startsWith(
                "/api/role-modules"
        )) {
            return "USERS";
        }

        return null;
    }
}