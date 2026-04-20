# Admin Open Registration with Super Admin Approval

## Overview

This document defines the implementation of an **open registration system for Admin users**, where new admins can create an account but require **Super Admin approval** before gaining access.

---

## Objective

- Allow users to register as Admins via a public registration form  
- Ensure all registrations are **reviewed and approved by Super Admin**  
- Prevent login access until approval is granted  

---

## Feature Workflow

1. User submits Admin registration form  
2. System creates admin account with **pending status**  
3. Super Admin reviews the request  
4. Super Admin:
   - Approves → Admin can log in  
   - Rejects → Admin cannot access the system  

---

## Functional Requirements

### 1. Admin Registration Page

- Add a **“Create Admin Account”** option on the login page  
- Redirect to a **registration form**

#### Required Fields (example)
- Name  
- Email  
- Mobile number  
- Password  
- Confirm password  

---

### 2. Registration Submission

- On submit:
  - Validate all inputs  
  - Create a new admin account with:
    ```
    status = pending
    ```
  - Do NOT allow login at this stage  

---

### 3. User Communication

Display a confirmation message after registration:

> "Your registration request has been submitted and is pending approval by the Super Admin. You will be able to log in once approved."

---

### 4. Login Restriction

- Prevent login for:
  - `pending` admins  
  - `rejected` admins  

- Allow login only when:
status = approved


---

### 5. Super Admin Approval Panel

Provide functionality for Super Admin to:

- View all registration requests  
- Filter by status (pending / approved / rejected)  
- Take actions:
- Approve  
- Reject  

#### Actions

- **On Approval:**
- Update status to `approved`  
- Admin can log in  

- **On Rejection:**
- Update status to `rejected`  
- Admin access remains blocked  

---

## Codebase Analysis Requirements

- Analyze existing admin management:
- Authentication flow  
- Admin creation logic  
- Role and permission system  

- Identify:
- Where to integrate registration  
- Where to enforce approval checks in login flow  

---

## Notifications (Optional)

- Notify user when:
- Registration submitted  
- Account approved  
- Account rejected  

---

## Scope Limitation

- Do not modify existing admin roles/permissions unnecessarily  
- Only extend current admin system to support registration + approval  
- Maintain existing login and security flow  

---

## Expected Outcome

- Public admin registration available  
- Secure approval-based access control  
- Only approved admins can log in  
- Clean and scalable admin onboarding process  

---