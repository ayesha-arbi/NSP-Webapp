Use this EXACT UI design system for EVERY Issuer Portal screen, page, modal, popup, banner, drawer, table, form, dashboard, and state.

DO NOT invent, modify, reinterpret, or introduce a different visual style for any individual screen.

The entire Issuer Portal must look like ONE consistent desktop-first enterprise WEBSITE APPLICATION.

### 1. Overall Visual Style

Use a:

* Clean
* Flat
* Modern
* Professional
* Enterprise
* Desktop-first
* Light-mode

visual style.

STRICTLY DO NOT USE:

* Glassmorphism
* Transparency
* Semi-transparent surfaces
* Frosted glass
* Backdrop blur
* Gradients
* Glow effects
* Neon effects
* Excessive shadows
* 3D UI
* Floating glass cards
* Decorative visual effects
* Excessive rounded elements

All UI surfaces must be solid and clearly defined.

---

### 2. Color System

Use ONLY these colors unless a specific semantic status color is defined below.

Primary Navy:
`#0B2D4D`

Navy Hover:
`#0E3A63`

Teal Accent:
`#5DCAA5`

Deep Teal:
`#0F6E56`

Page Background:
`#F7F9FB`

White Surface:
`#FFFFFF`

Border:
`#D3D1C7`

Primary Text:
`#2C2C2A`

Secondary Text:
`#5F5E5A`

Muted Text:
`#888780`

Do not introduce arbitrary colors.

---

### 3. Typography

Use **Inter** for ALL normal interface text.

Use **IBM Plex Mono ONLY for:**

* CNIC
* Candidate IDs
* Record IDs
* Hashes
* Transaction IDs
* Credential IDs
* Device IDs
* Audit identifiers
* Technical/reference values

Recommended hierarchy:

* Page title: Inter, 24–28px, 600
* Section title: Inter, 18–20px, 600
* Card title: Inter, 16px, 600
* Body: Inter, 14px
* Labels: Inter, 13–14px, 500/600
* Secondary/muted information: Inter, 13–14px

Do not use decorative fonts.

---

### 4. Spacing System

Use ONLY this 4px spacing system:

`4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px`

Do not use arbitrary spacing values.

Desktop page padding:
`32px`

Mobile page padding:
`16px`

Use consistent spacing between:

* Sections
* Cards
* Form fields
* Table elements
* Navigation items
* Buttons
* Modal content

---

### 5. Website Layout

This is a WEBSITE INTERFACE, not a mobile app.

Use a consistent desktop web application structure across all authenticated screens:

* Left navigation/sidebar
* Top header
* Main content area
* Breadcrumbs where appropriate
* Page title
* Content sections/cards
* Tables/forms/dashboards depending on the screen

Keep the sidebar and header visually consistent across every authenticated screen.

Do not redesign the navigation for individual pages.

---

### 6. Navigation

Primary navigation background:
`#0B2D4D`

Navigation text/icons:
`#FFFFFF`

Active navigation item:
`#5DCAA5`

Navigation height:
`56px` for the primary navigation/header system.

Use consistent:

* Icon size
* Text size
* Item spacing
* Active-state treatment

Role-based navigation may hide/show permitted items, but the visual design must remain identical between roles.

Do not create different navigation styles for Trade Tester, Center Superintendent, or Super Admin.

---

### 7. Cards

Cards must ALWAYS use:

Background:
`#FFFFFF`

Border:
`1px solid #D3D1C7`

Radius:
`8px`

Padding:
`24px`

Shadow:
Very subtle only.

Cards must be completely opaque.

NEVER use:

* Glass cards
* Transparent cards
* Gradient cards
* Floating translucent panels
* Heavy shadows

Use cards for:

* Dashboard KPIs
* Candidate information
* Assessment information
* Credential information
* Device health
* Minting information
* Summary sections

---

### 8. Buttons

Buttons must be FLAT, SOLID and CLEAN.

NEVER use:

* Glass buttons
* Transparent buttons
* Gradient buttons
* Glow
* Backdrop blur
* Excessive rounded buttons

#### Primary Button

Background:
`#0B2D4D`

Text:
`#FFFFFF`

Hover:
`#0E3A63`

Radius:
`6px`

Minimum height:
`40px`

Padding:
`10px 20px`

Use for primary actions such as:

* Sign In
* Verify
* Save
* Submit
* Approve
* Confirm
* Continue

#### Secondary Button

Background:
`#FFFFFF`

Text:
`#2C2C2A`

Border:
`1px solid #D3D1C7`

Hover:
`#F1EFE8`

Radius:
`6px`

Use for:

* Cancel
* Back
* Close
* View
* Secondary actions

#### Destructive Button

Default:

Background:
`#FFFFFF`

Border:
`1px solid #E24B4A`

Text:
`#791F1F`

For final destructive confirmation:

Background:
`#E24B4A`

Text:
`#FFFFFF`

Use for:

* Revoke
* Reject
* Force session revoke
* Other irreversible actions

---

### 9. Status Pills

ALL status pills must use the same visual treatment.

Height:
`32px`

Radius:
`999px`

No border.

No shadow.

No glass effect.

Use a `20px` circular status icon.

Gap between icon and label:
`8px`

Label:
Inter, `14px`, weight `600`

#### DRAFT

Background:
`#F1EFE8`

Icon:
`#888780`

Text:
`#5F5E5A`

Icon:
Dashed circular outline.

#### IN-PROGRESS

Background:
`#FCE8D6`

Icon:
`#E0801A`

Text:
`#5C3300`

Icon:
Approximately 50% filled circle.

#### IN-REVIEW

Background:
`#E4EEFC`

Icon:
`#2E6FE0`

Text:
`#123B7A`

Icon:
Approximately 75% filled circle.

#### COMPLETED

Background:
`#EAF3DE`

Icon:
`#639922`

Text:
`#173404`

Icon:
Solid green circle with white checkmark.

#### FAILED

Background:
`#FCEBEB`

Icon:
`#E24B4A`

Text:
`#501313`

Icon:
Solid red circle with white X.

Use these exact status styles wherever statuses appear across the application.

---

### 10. Inputs and Form Controls

Input background:
`#FFFFFF`

Border:
`1px solid #D3D1C7`

Radius:
`6px`

Padding:
`10px 12px`

Focus border:
`#0B2D4D`

Focus ring:
`2px #5DCAA5`

Apply the same input style to:

* Text fields
* Search fields
* CNIC fields
* Date fields
* Select/dropdowns
* Textareas
* OTP inputs
* Passphrase inputs
* Filter controls

Do not create different input styles for different pages.

---

### 11. Tables

Use a consistent enterprise data-table style throughout the website.

Table:

* White background
* `1px` solid `#D3D1C7` borders
* Clean horizontal row separation
* No heavy shadows
* No gradient headers

Table header:

* Inter
* 13–14px
* 600 weight
* Primary or secondary text
* Light solid background

Table body:

* Inter
* 14px
* Primary text

Technical identifiers such as CNIC, transaction IDs, credential IDs and hashes must use IBM Plex Mono.

Use consistent:

* Row height
* Cell padding
* Pagination
* Sorting controls
* Filter controls
* Action buttons

---

### 12. Modals

All modals must use:

Background:
`#FFFFFF`

Border:
`1px solid #D3D1C7`

Radius:
`8px`

Padding:
`24px`

Very subtle shadow only.

NEVER use:

* Glassmorphism
* Transparency
* Blur
* Gradients
* Heavy shadows

Modal structure:

* Clear title
* Supporting description
* Content/form
* Primary action
* Secondary/cancel action

Destructive modals must clearly communicate the consequence before the final action.

---

### 13. Banners and Alerts

Use solid, flat surfaces.

Do not use gradients or translucent alerts.

Alerts should use:

* Clear icon
* Short heading
* Supporting text
* Appropriate action where required

Offline mode must use a compact banner rather than an oversized popup unless the specific prompt explicitly asks for a modal.

---

### 14. Icons

Use a single consistent modern outline icon style throughout the application.

Icons must:

* Be simple
* Be professional
* Have consistent stroke weight
* Use the established color system

Do not mix multiple icon styles.

Do not use decorative illustrations unless explicitly requested by the screen specification.

---

### 15. Forms

Forms should use:

* Clear section headings
* Consistent labels
* Consistent field widths
* 4px spacing system
* Required-field indicators
* Inline validation
* Clear error messages
* Consistent action placement

Do not unnecessarily split a simple form into multiple pages.

---

### 16. Dashboards

Dashboard pages should prioritize information hierarchy.

Use:

1. Page title/header
2. KPI cards
3. Main operational information
4. Tables/lists
5. Secondary information

Do not overcrowd dashboards with decorative charts.

Charts, if required, must use the existing color system only.

---

### 17. Security and System States

Security-related states such as:

* Account Locked
* Unauthorized Device
* MFA Required
* Step-Up MFA
* Failed Mint
* Credential Revocation
* Session Revocation

must use the same visual system as the rest of the website.

Do not create a separate "security" visual style.

---

### 18. Responsive Behavior

The primary design target is desktop web.

For smaller screens:

* Preserve the same visual system
* Reduce page padding from `32px` to `16px`
* Stack cards vertically
* Allow tables to scroll horizontally
* Collapse navigation appropriately
* Maintain button/input dimensions and styling

Do not redesign the interface into a completely different mobile application.

---

### 19. Consistency Rule

MOST IMPORTANT:

Every screen MUST look like it belongs to the SAME Issuer Portal application.

Reuse the exact same:

* Colors
* Typography
* Spacing
* Navigation
* Header
* Cards
* Inputs
* Buttons
* Tables
* Status pills
* Modals
* Icons
* Borders
* Corner radii
* Interaction patterns

A new screen must NEVER introduce a new visual language.

When generating a sub-screen, popup, modal, banner, or state, inherit the design system from the corresponding main screen.

Do not redesign existing components.

Do not invent new colors.

Do not invent new button styles.

Do not invent new card styles.

Do not invent new status-pill styles.

Do not change corner radii.

Do not change typography.

Do not introduce visual effects.

The result must feel like one unified enterprise Issuer Portal website designed by one product team.
