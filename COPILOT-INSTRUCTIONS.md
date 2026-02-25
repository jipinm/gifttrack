# Scope Change – Updated Requirements

Please review the following scope changes carefully and update the implementation accordingly.

---

## 1. Events – Access & Visibility Change

### Current Behavior
- All events are listed for **Superadmin** and **Admins**, regardless of who created them.

### Required Change
Update the event listing logic based on user roles:

- **Superadmin:**
  - Can view **all events** (no restriction).

- **Admin:**
  - Can view only:
    - Events created by the **Superadmin**, and  
    - Events created by **themselves**.
  - Must **not** see events created by other admins.

---

## 2. Master Data – “Care Of” (Ownership & Customization Change)

### Current Behavior
- “Care Of” master data can be created, updated, and deleted only by the **Superadmin**.
- The same “Care Of” options are shown to all admins in selection fields.

### Required Change
“Care Of” data must become **user-specific (custom per admin/superadmin)**.

- Each **Superadmin** and **Admin** should be able to:
  - Create, edit, and delete their own **custom “Care Of” options**.
  - Manage their own “Care Of” data independently.

- During selection:
  - The **Care Of dropdown/list must display only the options created by the logged-in user**.
  - Users must not see “Care Of” options created by other admins or the superadmin.

- UI Requirement:
  - Add a **“Manage Care Of”** option for **Admins** (not only Superadmin), so they can maintain their own Care Of master data.

---

## Goal of This Change

These updates are required to:
- Enforce **data ownership and isolation** between admins.
- Prevent unintended sharing of events and master data.
- Allow each admin to work with **their own customized Care Of values**.
- Maintain full visibility only for the **Superadmin**.

---

## Notes
- Existing data should not be deleted without approval.
- Any required database or API changes should be documented.
- Role-based access rules must be strictly followed.