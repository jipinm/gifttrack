# Scope Change Instruction for AI Code Agent (GitHub Copilot)

## Objective
There is a major **scope and flow change** in the mobile application.  
Some features are already implemented.

You must:
- **Analyze the existing codebase first**
- **Reuse existing logic, components, styles, and validations wherever possible**
- Implement the new flow strictly as defined below
- Do **not** break existing working features unless required by this scope

---

## User Roles

### 1. Super Admin (App Owner)
- Default system user
- Full control over:
  - Admin users
  - Events
  - Master data (Event Types, Gift Types)
  - Can view all customers
  - Can view all gifts of all customers

### 2. Admin (Data Management Users)
- Created and managed only by Super Admin
- Can manage:
  - Their own customers
  - Attach customers to events based on rules
  - View gifts only for related Events and Customers added by self

---

## Entities & Rules

### 1. Admin Users  
**Managed only by Super Admin**

**Fields:**
- Name *(required)*
- Mobile Number *(required, unique)*
- Password *(required)*
- Address
- State
- District
- City
- Branch

**Operations:**
- CRUD only by Super Admin

---

### 2. Customers  
**Managed only by Admin users**

**Fields:**
- Name *(required)*
- Mobile Number *(required)*
- Address
- State
- District
- City
- Notes

**Rules:**
- Admin can manage **only customers added by themselves**
- Existing validation must be reused:
  - Mobile number + added_by (mutual inclusive uniqueness)

**Operations:**
- CRUD only by Admin users

---

### 3. Events  
**Managed only by Super Admin**

**Fields:**
- Event Name *(required)*
- Date *(required)*
- Event Type *(required)*  
  (Reception, Wedding, Birthday, Anniversary, Engagement, House Warming, Others)
- Event Category *(required, default = Self Event)*  
  (Self Event / Customer Event)
- Notes

**Operations:**
- CRUD only by Super Admin

**Additional:**
- Event Type master must support CRUD (Super Admin only)

---

### 4. Event–Customer Attachment Rules

#### Case 1: Customer Event
- One customer must be attached
- Customer is the inviter

#### Case 2: Self Event
- Multiple customers can be attached
- Inviter is the App Owner

**Attachment permissions:**
- **Super Admin:**
  - Can attach any customer from full list
  - Must support search by name or mobile number
- **Admin:**
  - Can attach only customers created by themselves
  - Must support search by name or mobile number

**Additional fields while attaching:**
- Invitation Status *(required, default = "Called")*  
  Options:
  - Called  
  - Not Called

- Care Of *(required for Self Event)*  
  Dropdown values:
  - Self  
  - Father  
  - Mother  
  - Brother  
  - Sister  
  - Son  
  - Daughter  
  - Others

---

### 5. Gifts  

**Rules:**
- Gift is always related to:
  - One Event
  - One Customer

**Gift direction:**
- If Event Category = Self Event → Gift = **Received**
- If Event Category = Customer Event → Gift = **Given**

**Fields:**
- Gift Type *(required)*  
  (Cash, Physical Gift, Voucher, Others)
- Gift Value *(required)*
- Description *(optional)*

**Operations:**
- Gift Type master CRUD → Super Admin only
- Gift CRUD → as per related Event & Customer

---

## Visibility Rules

- Admin list → visible only to Super Admin

- Customer list:
  - Super Admin → sees all customers
  - Admin → sees only customers added by self

- Events → visible to all users

- Gifts:
  - Super Admin → can view all gifts of all customers
  - Admin → can view only gifts related to:
    - Events they are associated with
    - Customers added by themselves

---

## Filtering & Selection

Filtering must be implemented for:
- All master data lists
- All selection dropdowns (customer selection, event selection, gift selection)

Filters must support:
- Name-based search
- Mobile-number-based search (where applicable)

---

## Development Instructions

- First analyze existing:
  - Models
  - API endpoints
  - Validation logic
  - UI components
- Reuse:
  - Existing styles
  - Existing forms
  - Existing mobile number validation
- Modify only where required to support new role-based flow
- Implement role-based access strictly
- Ensure data integrity between:
  - Admin → Customers
  - Events → Customers
  - Gifts → Events & Customers

---

## Constraints

- Do not change existing logic unless it conflicts with this scope
- Do not redesign UI unless required
- Prioritize minimal refactor with maximum reuse