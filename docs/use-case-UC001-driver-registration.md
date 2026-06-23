# Use Case: UC-001 — Online Driver Registration
**BMW Kyalami Racetrack Platform**
Derivco Graduate Programme 2026 · SDLC Training Case Study

---

## 1. Overview

| Attribute       | Detail                                      |
|-----------------|---------------------------------------------|
| Use Case ID     | UC-001                                      |
| Name            | Online Driver Registration                  |
| Actor(s)        | Driver (Private or Professional)            |
| Priority        | High — Sprint 1                             |
| SDLC Phase      | Analysis → Deployment                       |
| Status          | In Development                              |

---

## 2. Business Context (Phase 1 — Planning)

**Problem Statement**
Race-day queues at BMW Kyalami are caused by manual, paper-based driver registration
at entry points. Drivers arrive on the day with no pre-verified identity, creating
bottlenecks and congestion.

**Business Goals**
- Increase online bookings by 40%
- Reduce race-day registration queues to zero paper forms
- Deliver a premium BMW brand digital experience

**Stakeholders**
- Racetrack Visitors / Drivers
- BMW Kyalami Management
- Event Organisers
- Security Team (gate verification)
- System Administrators
- Payment Providers

---

## 3. User Story (Phase 2 — Analysis)

```
As a   Driver (Private or Professional)
I want to  register online and upload my documents before race day
So that  I can avoid race-day queues and check in via a digital QR pass
```

---

## 4. Functional Requirements

| ID    | Requirement                                                                    |
|-------|--------------------------------------------------------------------------------|
| FR-01 | Driver can create a secure account using email and password                    |
| FR-02 | Driver enters: full name, email, phone number, driver licence number           |
| FR-03 | System validates all required fields before accepting the registration         |
| FR-04 | System saves driver profile with a unique Driver ID                            |
| FR-05 | System generates a unique QR code (M-Pass) upon successful registration        |
| FR-06 | Driver receives on-screen confirmation after registration completes            |
| FR-07 | Driver can log in with registered email and password                           |
| FR-08 | Security staff can scan QR at gate to verify driver without paper forms        |

---

## 5. Non-Functional Requirements

| Category    | Requirement                                                                 |
|-------------|-----------------------------------------------------------------------------|
| Performance | Registration form loads in < 2s. QR generation completes in < 3s.          |
| Security    | Passwords must be hashed. No PII stored in localStorage in production.      |
| Scalability | System must handle 5 000+ concurrent registrations during peak sign-up.     |
| Availability| 99.9% uptime in the 7-day window before each race event.                    |
| Usability   | Full registration completable on mobile in under 5 minutes.                 |
| Compliance  | Driver data handled in accordance with POPIA (SA).                          |

---

## 6. System Design (Phase 3 — Design)

### Architecture: 3-Tier

```
Frontend (registration.html)
    └── POST /auth/register  ──► API Layer (booking.js / future auth service)
                                     └── INSERT users  ──► Database (users table)
                                     └── GENERATE qr_pass_hash
                                     └── SEND confirmation email/SMS
```

### Main Success Flow

1. Driver opens registration page
2. Driver fills in name, email, phone, licence number, password
3. Frontend validates all fields client-side
4. Frontend sends `POST /auth/register` to API
5. API validates, stores driver record, generates QR hash
6. API triggers confirmation notification (email/SMS)
7. Frontend displays success screen with QR M-Pass

### Exception Flows

| Scenario                     | System Response                                           |
|------------------------------|-----------------------------------------------------------|
| Email already registered     | HTTP 409 — "Account already exists, please log in"        |
| Missing required field       | Inline validation error before submit                     |
| Invalid licence number format| Field-level error with format guidance                    |
| Network timeout              | "Retry" option shown; duplicate submission prevented      |

---

## 7. Acceptance Criteria (Phase 5 — Testing)

- [ ] Driver can successfully register with all valid fields
- [ ] System rejects submission with any missing required field
- [ ] Duplicate email address is rejected with a clear error
- [ ] Password must meet minimum complexity requirements
- [ ] Driver receives confirmation after successful registration
- [ ] Driver can log in with the registered email and password
- [ ] QR M-Pass is displayed post-registration
- [ ] Registration is completable on a mobile screen

### Test Cases

| ID    | Name                        | Expected Result                                      |
|-------|-----------------------------|------------------------------------------------------|
| TC-1.1| Valid registration           | Profile created, QR displayed, confirmation shown    |
| TC-1.2| Missing required field       | Inline validation error, form not submitted          |
| TC-1.3| Duplicate email              | Error: "Account already exists"                      |
| TC-1.4| Weak password                | Error: password complexity requirements shown        |
| TC-1.5| Successful login             | Dashboard shown with driver name and M-Pass QR       |
| TC-1.6| Wrong password on login      | Error: "Invalid email or password"                   |
| TC-1.7| Mobile responsiveness (UAT)  | Form usable on 375px viewport without horizontal scroll|

---

## 8. Squad Roles (Phase 4 — Development)

| Role              | Sprint 1 Responsibility                                             |
|-------------------|---------------------------------------------------------------------|
| Business Analyst  | Defined acceptance criteria and field validation rules              |
| Product Owner     | Sprint goal: "Enable drivers to register online before race day"    |
| Developer         | Build registration.html, form validation, localStorage simulation   |
| QA / Tester       | Execute TC-1.1 through TC-1.7 against acceptance criteria           |
| Scrum Master      | Facilitate standups, remove blockers                                |
| DevOps            | Ensure CI pipeline passes (lint, tests, security scan)              |

---

## 9. Success Metrics

| Metric                         | Target     |
|--------------------------------|------------|
| Online booking increase        | +40%       |
| QR generation time             | < 3s       |
| Paper forms at race-day entry  | 0          |
| System uptime (pre-race window)| 99.9%      |
| Mobile registration time       | < 5 min    |
