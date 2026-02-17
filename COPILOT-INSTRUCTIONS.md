# Additional Scope Requirement — Customers List Advanced Filtering

## Objective
Enhance the **Customers List** screen with advanced filtering options while keeping all existing filters intact.

This feature must work for both:
- **Super Admin**
- **Admin**

With strict role-based data visibility.

---

## Role-Based Data Scope

- **Super Admin**
  - Can view **all customers**
- **Admin**
  - Can view **only customers added by themselves**

These rules apply before any filtering is performed.

---

## New Filtering Capabilities

In addition to existing filters, introduce the following **Event-based filters**:

---

## 1. Event-wise Filter

- Display an **Event list as a dropdown (DDL)**
- When an Event is selected:
  - Show only customers **attached to that selected Event**
  - Other filters must work in combination with this Event filter

---

## 2. Care-Of Filter  
*(Visible only when an Event is selected)*

- Filter customers by **Care Of** value related to the selected Event
- Values must come from existing master data (no hardcoding)

---

## 3. Invitation Status Filter  
*(Visible only when an Event is selected)*

- Filter customers by **Invitation Status** related to the selected Event
- Values must come from existing master data (no hardcoding)

---

## 4. Gift Filter  
*(Visible only when an Event is selected)*

Filter customers based on Gift status:
- **Gifted** → customers who have at least one Gift entry for the selected Event  
- **Not Gifted** → customers who have no Gift entry for the selected Event

---

## UI / UX Rules

- Existing filters must continue to work as-is
- Event-based filters:
  - Must appear only after selecting an Event
  - Must be combinable with existing filters
- Filters must be:
  - Fast
  - Clear
  - Resettable

---

## Functional Rules

Filtering logic must follow this order:
1. Apply role-based visibility (Super Admin vs Admin)
2. Apply Event filter (if selected)
3. Apply Care Of filter (if selected)
4. Apply Invitation Status filter (if selected)
5. Apply Gift filter (if selected)
6. Apply existing filters (name, mobile, etc.)

---

## Development Instructions

- Reuse:
  - Existing customer list UI
  - Existing filtering logic
  - Existing Event–Customer relation data
  - Existing master data for Care Of and Invitation Status

- Implement:
  - Event dropdown filter
  - Conditional display of Care Of, Invitation Status, and Gift filters
  - Combined filtering logic

- Do not:
  - Hardcode filter values
  - Break existing filters
  - Change role-based visibility rules

---

## Success Criteria

- Super Admin:
  - Can filter across all customers
- Admin:
  - Can filter only their own customers
- Event filter:
  - Shows only customers attached to selected Event
- Care Of, Invitation Status, and Gift filters:
  - Appear only after Event selection
  - Work correctly in combination
- Existing filters continue to work without regression