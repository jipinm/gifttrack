# UX Enhancement Prompt — Add Customer + Connect to Event

## Objective
Improve user experience by allowing **easy customer creation and direct connection to an Event** from the **Add Customer** screen.

The goal is to:
- Reduce user steps
- Avoid navigating separately to Event attachment
- Keep behavior consistent with existing Event–Customer rules

---

## Feature: Add Customer with Optional Event Connection

### Screen: Add Customer

Along with existing customer fields, add an **optional Event selection section**.

---

## Event Selection UI

- Events must be displayed as **selectable cards** (NOT a dropdown/DDL).
- Each card should show:
  - Event Name  
  - Event Date  
  - Event Category (Self Event / Customer Event)
- User can select **only one** Event card.
- Card must have a clear selected state (highlight/border/checkmark).

---

## Conditional Fields (Shown Only After Event Selection)

Only when the user selects an Event card, display the following inputs:

- **Invitation Status**
- **Care Of**

### Data Source Rule
- **Do NOT hardcode options.**
- Invitation Status and Care Of values must be:
  - Loaded dynamically from the database
  - Same source as used in the existing “Attach Customer to Event” flow

---

## Functional Flow

1. User opens **Add Customer** screen
2. User enters mandatory customer fields
3. User may optionally select one Event by tapping an Event card
4. Only after selecting an Event:
   - Show Invitation Status field
   - Show Care Of field
5. On Save:
   - Create the new Customer
   - If an Event is selected:
     - Automatically attach the customer to that Event
     - Save Invitation Status and Care Of values

---

## Business Rules

- If **no Event is selected**:
  - Only create the Customer (normal behavior)

- If **Event is selected**:
  - Create Customer
  - Then attach Customer to selected Event

---

## Event Category Constraints

- **Customer Event**:
  - Must have only **one customer**
  - Do not allow selecting an Event that already has a customer attached

- **Self Event**:
  - Can have **multiple customers**

Validation must enforce this rule before saving.

---

## UX Requirements

- Event card list must support:
  - Search by Event Name
  - Filter by Event Date (if available)

- Invitation Status & Care Of:
  - Must behave exactly like the existing “Attach Customer to Event” feature
  - Must not appear unless an Event is selected

- No duplicate logic:
  - Reuse existing attach-customer-to-event implementation

---

## Development Instructions

- Reuse:
  - Existing Customer form UI
  - Existing Event attachment logic
  - Existing validations
  - Existing database-driven master data for Invitation Status & Care Of

- Implement:
  - Event card selector UI
  - Conditional rendering of Invitation Status & Care Of
  - Auto-linking logic after customer creation

- Do not:
  - Change existing Event attachment flow
  - Hardcode master data values
  - Break current validations
  - Break any other current logic / functionalities / implementations

---

## Success Criteria

- User can:
  - Add a customer
  - Link them to an event in one flow
- Customer Event:
  - Never has more than one customer
- Self Event:
  - Supports multiple customers
- Invitation Status & Care Of:
  - Appear only when Event is selected
  - Are populated from database
- No regression in existing Customer or Event features




# Scope Change Prompt — Event Management & UX Enhancement

## Objective
Implement new scope changes for **Event management** with improved UX, extended Admin capabilities, and tighter role-based controls.

You must:
- Analyze the existing codebase first
- Reuse existing logic, UI components, and validations wherever possible
- Apply the changes strictly as defined below
- Ensure no regression in current working features

---

## A) Events — Role & Permission Changes

### 1. Event Access Rules

#### Admin Users
- Can **add new Events**
- Can **view all Events** (including those added by other Admins)
- Can **edit Events**:
  - Only if the Event was added by themselves
- Can **delete Events**:
  - Only if the Event was added by themselves
  - Must be implemented as **Safe Delete** (soft delete / status-based delete)
- Can view **attached customers**:
  - Limited to customers added by themselves

#### Super Admin
- Has **full control over all Events**, including:
  - Add
  - Edit
  - Delete
  - View attached customers  
- This applies even if the Event was created by an Admin

---

## B) Event Adding — Better UX Flow

### Feature: Add Event with Optional Customer & Gift

Enhance the **Add Event** screen with integrated flows for:
- Attaching a Customer
- Adding a Gift

This enhancement applies only when:
- **Event Type = Customer Event**  
  (Customer Event supports only one customer)

---

## Customer Attachment on Add Event Screen

### Behavior
- Customer attachment is **optional**
- Admin can search for a Customer by:
  - Name
  - Mobile Number
- Search results must include **only customers added by the logged-in Admin**
- Search results must be listed dynamically
- Admin can select **one Customer** to attach to the Event

---

## Invitation Status (Conditional)

- If a Customer is selected:
  - Display **Invitation Status** input
- Invitation Status:
  - Must use existing master data
  - Must reuse existing "Attach Customer" logic

---

## Gift Addition (Conditional)

- After selecting a Customer and Invitation Status:
  - Display **Add Gift** section

Gift fields:
- Gift Type
- Gift Value
- Description (optional)

Rules:
- Gift section is **optional**
- Only if Gift Value is entered:
  - Insert Gift into database
- Must reuse existing **Add Gift** implementation and validation

---

## New Customer Option (Fallback Flow)

If:
- No customers are found in search  
OR  
- Admin chooses not to select an existing customer  

Then:
- Show option: **Add New Customer**

Flow:
1. Create new Customer
2. Attach that Customer to the Event
3. Show Invitation Status input
4. Show Gift section (same behavior as above)

All rules remain identical to existing attach-customer flow.

---

## C) Event Details Page — Customer Search (Self Events)

### Feature: Search Customer in Event

Applicable only for:
- **Self Events**

On Event Details page:
- Provide a **Search Customer** option

### Search Rules
Search must filter only:
- Customers already attached to that Event

Role-based filtering:
- **Super Admin** → can search among **all customers attached** to the Event
- **Admin** → can search only among **customers attached by themselves** to the Event

Search by:
- Name
- Mobile Number

---

## Development Instructions

- Reuse:
  - Existing Event forms
  - Existing Customer search logic
  - Existing Attach Customer logic
  - Existing Gift creation logic
  - Existing validation rules

- Implement:
  - Role-based permissions for Event edit/delete
  - Event creation with optional:
    - Customer attachment
    - Gift creation
  - Safe delete for Events
  - Customer search inside Event Details (Self Events only)

- Do not:
  - Duplicate logic
  - Hardcode master data
  - Change unrelated workflows
  - Break existing APIs unless required

---

## Success Criteria

- Admins can:
  - Add Events
  - View all Events
  - Edit/Delete only their own Events
  - Attach only their own Customers
- Super Admin can:
  - Manage all Events without restriction
- Add Event screen supports:
  - Optional Customer attach
  - Conditional Invitation Status
  - Optional Gift creation
- Self Events support:
  - Customer search within attached list with role-based filtering
- No regression in existing Event, Customer, or Gift features