# Scope Update: Total Attendee Handling Correction

## Objective
Refine the implementation of **Total Attendee Count** to align with the correct business logic.

---

## Correct Definition

- **Total Attendee Count** represents the **total number of persons associated with a customer**.
- This value is **customer-specific**, not event-specific.

---

## Functional Requirements

### 1. Customer Add & Edit

- The **Total Attendee Count input** must be available:
  - On **Add Customer**
  - On **Edit Customer**

- This field should:
  - Be a **numeric input**
  - Have a **default value (e.g., 1)**
  - Be stored as part of the **customer data**

---

### 2. Event Association Behavior

- When a customer is **attached to an event**:
  - The **existing Total Attendee Count** from the customer record must be used
  - This value contributes to the **event-level attendee aggregation**

---

### 3. Add Customer from Event Page

- On the **“Add Customer” option within the Event page**:
  - Include the **Total Attendee Count input**
  - Ensure the value is saved as part of the **customer record**

---

### 4. Consistency Across Application

- Wherever a **Customer Add option** exists in the application:
  - The **Total Attendee Count field must be included**

---

### 5. Edit Behavior

- The **Total Attendee Count** should only be editable through:
  - The **Customer Edit form**

- It should **not be edited directly during event association**

---

## Constraints

- Ensure:
  - Existing functionalities remain **unaffected**
  - Data consistency is maintained across customer and event modules
  - No duplication or conflict in attendee calculations