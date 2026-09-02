# Sahakari Backend — Known Issues & Gotchas

This document records known bugs, deferred items, and "gotcha" notes discovered during development. These are intentionally NOT fixed in the branch where they were found — each entry describes who owns the fix and what test is required before closing.

---

## Section 1: Infrastructure & Configuration Gotchas

### Firebase Storage requires Blaze billing plan
- **Symptom**: Attempting to use Firebase Storage without a billing plan enabled fails with `404: bucket does not exist` — the error looks like a missing bucket, but the root cause is billing, not code.
- **Resolution**: Pivoted KYC document storage to Cloudinary with `type: "authenticated"` under folder `sahakari/worker/documents/`. Firestore stores only `cloudinaryPublicId` + `resourceType`, never a temporary signed URL.
- **Firebase Storage bucket name** (if ever re-enabled): set `FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com` in `.env`.

---

## Section 2: Cloudinary Gotchas

### resource_type must be "raw" for PDFs, "image" for images
- **Symptom**: Uploading a PDF with `resource_type: "image"` returns a broken URL or Cloudinary rejects the file.
- **Resolution**: `uploadToCloudinaryKYC.js` detects MIME type and sets `resource_type: "raw"` for PDFs, `"image"` for images. The two utilities (`uploadToCloudinary.js` vs `uploadToCloudinaryKYC.js`) are not interchangeable — different `resource_type` / `type` params.

---

## Section 3: Firestore Schema Gotchas

### Availability and location use nested fields, not flat fields
- **Field path**: `availability.status` (not `availabilityStatus`), `location.lat` + `location.lng` (not `lat`/`lng` at root).
- **Resolution**: Use Firestore dot-notation updates (`"availability.status": value`) to avoid accidentally overwriting sibling fields on the `availability` object.

---

## Section 4: Worker Module Gotchas

### `insuranceClaims/{claimId}` Firestore Schema & Timezone Convention
- **Collection**: `insuranceClaims`
- **Fields**:
  - `workerId` (string): Worker Firestore document ID.
  - `userId` (string): Worker Auth UID.
  - `caseType` (string): Enum `["ACCIDENT_ON_WORK", "PERMANENT_DISABILITY", "DEATH", "MAJOR_INJURY", "MINOR_INJURY"]`.
  - `incidentDate` (string): `YYYY-MM-DD` (input assumed in IST, UTC+05:30).
  - `incidentTime` (string): `HH:MM` (input assumed in IST, UTC+05:30).
  - `incidentTimestamp` (string): Server-reconstructed ISO 8601 UTC string via `new Date(`${incidentDate}T${incidentTime}:00+05:30`).toISOString()`.
  - `description` (string): Incident description.
  - `claimedAmount` (number): Server-determined payout amount (client value ignored):
    - `MINOR_INJURY`: 5,000
    - `MAJOR_INJURY`: 50,000
    - `ACCIDENT_ON_WORK`: 100,000
    - `PERMANENT_DISABILITY`: 250,000
    - `DEATH`: 500,000
  - `status` (string): Default `"SUBMITTED"`. (To be managed by Admin claim-review workflows).
  - `bookingId` (string|null): Associated booking ID if incident occurred during active booking.
  - `documents` (array): List of Cloudinary evidence document objects:
    - `{ docType, cloudinaryPublicId, resourceType, format }`.
  - `createdAt` (FieldValue): Server timestamp.
  - `updatedAt` (FieldValue): Server timestamp.
- **Timezone Convention**:
  - `workerShiftLogs` `CLOCK_IN` and `CLOCK_OUT` timestamps are stored in Firestore as UTC ISO strings (`toISOString()`).
  - When Admin or Worker logic compares an incident time against shift logs or booking times, `incidentTimestamp` (stored as UTC ISO string) must be compared directly against the UTC shift log timestamps. Never parse raw `incidentDate + incidentTime` without the `+05:30` IST offset.

---

## Section 5: Customer Module Gotchas

_(none yet)_

---

## Section 6: Negotiation Module Gotchas

### turnOf field drives two-sided access, not just role
- `turnOf: "CUSTOMER"` → only the customer on that thread can counter/accept/reject (HTTP 400 if wrong role, HTTP 403 if wrong owner).
- `turnOf: "WORKER"` → only the assigned worker on that thread can counter/accept/reject (same enforcement).
- Both `CUSTOMER` and `GIG_WORKER` roles are allowed by the route middleware (`authorize("CUSTOMER", "GIG_WORKER")`); the per-thread ownership check in `verifyNegotiationParticipant` is where the actual isolation happens.

---

## Section 7: Latent Bugs — Deferred Fixes

### BUG-001: `acceptNegotiationService` crashes on service requests without `serviceId`

- **File**: [`src/services/customer/negotiation.service.js`](file:///d:/Sahakari/Backend/src/services/customer/negotiation.service.js)
- **Location**: `acceptNegotiationService`, in the `bookingData` object construction.
- **Code**:
  ```js
  serviceId: reqData.serviceId,  // crashes if serviceId is absent from the serviceRequest doc
  ```
- **Root cause**: Firestore throws `Cannot use "undefined" as a Firestore value (found in field "serviceId")` if the associated `serviceRequests` document does not have a `serviceId` field. The `services` collection uses the category name as the document ID (`plumbing`, `electrical`, etc.), but nothing enforces that every `serviceRequest` carries a `serviceId`. A document created without one will cause `acceptNegotiationService` to crash with HTTP 500 on every accept attempt.
- **Observed in**: W4 integration test suite (`scratch/test_phase_w4.js`) when test service requests were created without `serviceId`. The W4 test data was corrected to always include a real `serviceId` from the seeded services collection — `negotiation.service.js` was NOT modified.
- **Proposed fix** (customer-side, deliberate, with test): Add `|| ""` (or `|| null`) guard:
  ```js
  serviceId: reqData.serviceId || "",
  ```
- **Owner**: Whoever owns `src/services/customer/negotiation.service.js` (customer-side).
- **Required test before closing**: A C4-level test must verify that after the fix, the existing Customer-side behaviors still pass:
  1. Turn enforcement (HTTP 400 wrong turn).
  2. Booking created with `status: "PENDING_PAYMENT"` and correct `agreedPrice`.
  3. Service request updated to `status: "CONFIRMED"`.
  4. Competing threads on the same request auto-rejected with `status: "REJECTED"`.
- **Do NOT merge a fix for this without that test passing.**

### BUG-001b: `acceptNegotiationService` also crashes if `preferredDate` or `preferredTime` are absent from service request

- **File**: [`src/services/customer/negotiation.service.js`](file:///d:/Sahakari/Backend/src/services/customer/negotiation.service.js)
- **Location**: Same `bookingData` object, fields `scheduledDate: reqData.preferredDate` and `scheduledTime: reqData.preferredTime`.
- **Root cause**: Same class as BUG-001 — `preferredDate` and `preferredTime` are not schema-enforced on `serviceRequests`. If absent, these write `undefined` to Firestore and crash with the same error.
- **Fix**: Guard with `|| null` — `scheduledDate: reqData.preferredDate || null`. Fix together with BUG-001 in the same deliberate customer-side PR, with the same C4 test requirement before merging.

---

## Section 8: Testing Standards & Guidelines

### Image File Buffers in Integration Tests (Known Bug #3)
- **Rule**: NEVER use hand-constructed synthetic byte arrays or raw base64 string snippets (e.g. `[0xFF, 0xD8, ...]`) for image upload test cases.
- **Reason**: Cloudinary inspects image dimensions and binary headers strictly. Synthetic byte buffers cause Cloudinary to fail with `Cloudinary KYC upload failed: Invalid image file` or `Resource is invalid`.
- **Standard**: All future test scripts MUST read the valid minimal 16x16 JPEG file located at `scratch/fixtures/test-image.jpg` using Node `fs`:
  ```js
  import fs from "fs";
  const imageBuffer = fs.readFileSync("./scratch/fixtures/test-image.jpg");
  ```
- **Shared Code Integrity**: NEVER bypass Cloudinary or shared upload code for test environments (`NODE_ENV === "test"` bypasses are strictly prohibited). All tests must run against the real Cloudinary API using real fixture files.


