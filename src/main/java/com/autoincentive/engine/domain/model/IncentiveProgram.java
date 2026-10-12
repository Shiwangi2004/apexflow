package com.autoincentive.engine.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;

/**
 * Entity representing a manufacturer incentive program.
 *
 * WHY BigDecimal:
 * Floating-point numbers (float/double) suffer from IEEE 754 binary rounding errors.
 * In financial domains (incentives, interest, discounts), BigDecimal guarantees exact precision.
 *
 * WHY EnumType.STRING:
 * By default, JPA stores enums as ordinals (0, 1, 2). If someone adds an enum value in the middle,
 * all existing database rows get corrupted. STRING stores the human-readable text safely.
 */
@Entity
@Table(name = "incentive_programs")
public class IncentiveProgram {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "program_code", nullable = false, unique = true, length = 64)
    private String programCode;

    @Column(name = "name", nullable = false, length = 128)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 32)
    private ProgramType type;

    @Column(name = "vehicle_model", length = 64)
    private String vehicleModel;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "apr_rate", precision = 5, scale = 2)
    private BigDecimal aprRate;

    @Column(name = "term_months")
    private Integer termMonths;

    @Column(name = "standard_apr_rate", precision = 5, scale = 2)
    private BigDecimal standardAprRate = new BigDecimal("6.50");

    @Column(name = "stackable", nullable = false)
    private boolean stackable = true;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public IncentiveProgram() {
    }

    public IncentiveProgram(Long id, String programCode, String name, ProgramType type,
                            String vehicleModel, BigDecimal discountAmount, BigDecimal aprRate,
                            Integer termMonths, BigDecimal standardAprRate, boolean stackable,
                            LocalDate startDate, LocalDate endDate) {
        this.id = id;
        this.programCode = programCode;
        this.name = name;
        this.type = type;
        this.vehicleModel = vehicleModel;
        this.discountAmount = discountAmount;
        this.aprRate = aprRate;
        this.termMonths = termMonths;
        this.standardAprRate = standardAprRate != null ? standardAprRate : new BigDecimal("6.50");
        this.stackable = stackable;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public boolean isActiveOn(LocalDate date) {
        return !date.isBefore(startDate) && !date.isAfter(endDate);
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getProgramCode() {
        return programCode;
    }

    public void setProgramCode(String programCode) {
        this.programCode = programCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ProgramType getType() {
        return type;
    }

    public void setType(ProgramType type) {
        this.type = type;
    }

    public String getVehicleModel() {
        return vehicleModel;
    }

    public void setVehicleModel(String vehicleModel) {
        this.vehicleModel = vehicleModel;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public BigDecimal getAprRate() {
        return aprRate;
    }

    public void setAprRate(BigDecimal aprRate) {
        this.aprRate = aprRate;
    }

    public Integer getTermMonths() {
        return termMonths;
    }

    public void setTermMonths(Integer termMonths) {
        this.termMonths = termMonths;
    }

    public BigDecimal getStandardAprRate() {
        return standardAprRate;
    }

    public void setStandardAprRate(BigDecimal standardAprRate) {
        this.standardAprRate = standardAprRate;
    }

    public boolean isStackable() {
        return stackable;
    }

    public void setStackable(boolean stackable) {
        this.stackable = stackable;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof IncentiveProgram that)) return false;
        return Objects.equals(programCode, that.programCode);
    }

    @Override
    public int hashCode() {
        return Objects.hash(programCode);
    }
}
