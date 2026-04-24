App Store Review — Actionable Fix Instructions for GitHub Copilot
Submission ID: `a119e83e-8d90-4298-afa1-e35a81e02558`
Review Date: April 22, 2026
Target Platform: iPadOS
Version: 1.0
---
Issue 1 — Guideline 2.1(a): Sign In Button Unresponsive on iPad
Problem
The `Sign In` button does not respond to tap events on iPad (tested on iPad Air 11-inch M3, iPadOS 26.4.1). The app is completely unresponsive after the button is tapped.
Root Causes to Investigate
The tap gesture recogniser or button action is not wired correctly for iPad layout (e.g., a view is overlapping the button and intercepting touches).
The button's action handler may be crashing silently (uncaught exception or a nil reference) on iPad-specific code paths.
Auto Layout constraints on iPad may be misplacing or hiding the button's interactive region.
If using `UIWindowScene` or multiple scenes (iPad supports multi-window), the sign-in flow may not be initialised correctly in a scene-based lifecycle.
Implementation Steps
Verify button action binding.
Confirm the `Sign In` button has a valid `@IBAction` or `addTarget` binding and is not accidentally `isUserInteractionEnabled = false` or `isEnabled = false` at runtime.
```swift
   // UIKit — ensure this is called and not overridden later
   signInButton.isEnabled = true
   signInButton.isUserInteractionEnabled = true
   ```
```swift
   // SwiftUI — ensure no .disabled() modifier is applied unexpectedly
   Button("Sign In") { viewModel.signIn() }
       .disabled(false) // Remove any conditional that evaluates incorrectly on iPad
   ```
Check for overlapping views blocking touch.
Use Xcode's View Debugger (`Debug → View Debugging → Capture View Hierarchy`) to check whether a transparent or invisible view sits above the button and consumes touches. Remove or set `isUserInteractionEnabled = false` on any such overlay.
Guard against crashes in the sign-in handler.
Wrap the sign-in action in error handling to surface silent failures:
```swift
   @IBAction func signInTapped(_ sender: UIButton) {
       guard let email = emailField.text, !email.isEmpty,
             let password = passwordField.text, !password.isEmpty else {
           // Show validation error to the user
           return
       }
       Task {
           do {
               try await authService.signIn(email: email, password: password)
           } catch {
               // Present error alert — do not fail silently
               presentErrorAlert(error)
           }
       }
   }
   ```
Audit iPad-specific layout constraints.
Ensure the button's frame is not zero-sized or off-screen on iPad. Add runtime assertions during debug builds:
```swift
   override func viewDidLayoutSubviews() {
       super.viewDidLayoutSubviews()
       assert(!signInButton.frame.isEmpty, "Sign In button has zero frame on this device")
   }
   ```
Test on a physical or simulated iPad.
Run the app on the `iPad Air 11-inch (M3)` simulator using the exact iPadOS version `26.x`. Reproduce the tap and inspect the console for errors or assertion failures.
---
Issue 2 — Guideline 5.1.1(v): Required Fields Violate Privacy — Phone Number & Address
Problem
The app forces users to provide Phone Number and Address during sign-up or onboarding. These fields are not essential to core app functionality and must be made optional per App Store guidelines.
Implementation Steps
Make Phone Number and Address fields optional in the UI.
Remove any validation logic that blocks form submission when these fields are empty.
```swift
   // BEFORE — blocks sign-up if phone is empty
   guard !phoneField.text!.isEmpty else { return }

   // AFTER — phone is optional, proceed without it
   let phone = phoneField.text?.isEmpty == false ? phoneField.text : nil
   ```
Update form validation logic.
Audit all validators, `FormValidator`, or similar utility classes. Ensure `phoneNumber` and `address` fields are marked as optional and excluded from required-field checks.
```swift
   struct RegistrationForm {
       var email: String       // Required
       var password: String    // Required
       var phoneNumber: String? // Optional — do not validate as required
       var address: String?    // Optional — do not validate as required
   }
   ```
Label the fields as optional in the UI.
Add "(Optional)" to the placeholder text or field label so users know these fields are not mandatory.
```swift
   phoneField.placeholder = "Phone Number (Optional)"
   addressField.placeholder = "Address (Optional)"
   ```
Do not block account creation when these fields are absent.
Trace the entire sign-up code path — from the UI action through the network call — and confirm `nil` or empty values for phone and address are handled without error at every layer (request serialisation, model mapping, etc.).
Update your Privacy Manifest (`PrivacyInfo.xcprivacy`) and App Store privacy nutrition labels in App Store Connect to accurately reflect that phone number and address are collected optionally, not required.
---
Issue 3 — Guideline 2.1: Demo Account Credentials Are Invalid
Problem
The demo account provided in App Store Connect (`9999999999` / `Admin@123`) could not be used by the reviewer to sign in and access the app. This blocked the review entirely.
Implementation Steps
Create a stable, always-available demo account.
Provision a dedicated test account in your backend/auth system with credentials that do not expire, are not rate-limited, and have access to all app features.
```
   Recommended format:
   Username: demo@yourapp.com
   Password: DemoPass2026!
   ```
Seed the demo account with representative content.
Ensure the account has pre-populated data (e.g., a profile, sample transactions, or onboarding already completed) so reviewers can immediately evaluate full functionality without manual setup.
Implement a Demo / Bypass Sign-In mode (recommended).
Add a hidden or visible "Use Demo Account" button on the sign-in screen that auto-fills credentials and signs in without requiring the reviewer to type anything. This eliminates credential errors entirely.
```swift
   #if DEBUG || DEMO
   Button("Use Demo Account") {
       emailField.text = "demo@yourapp.com"
       passwordField.text = "DemoPass2026!"
       signInTapped(signInButton)
   }
   #endif
   ```
> Use a build flag (`DEMO`) so this button can be included in App Review builds but excluded from production releases.
Update the credentials in App Store Connect immediately.
Navigate to App Store Connect → Your App → App Review Information and replace the current demo account details with the newly provisioned, verified credentials before resubmitting.
Smoke-test the credentials before every submission.
Add a pre-submission checklist step: log out, use a fresh simulator install, enter the exact demo credentials from App Store Connect, and confirm sign-in succeeds end-to-end.
---
Summary Checklist
#	Guideline	Fix	Priority
1	2.1(a) — App Completeness	Fix unresponsive Sign In button on iPad (check touch interception, action binding, crash handling)	🔴 Critical
2	5.1.1(v) — Privacy	Make Phone Number and Address optional; remove from required validation	🔴 Critical
3	2.1 — Information Needed	Provision a valid demo account and update App Store Connect credentials	🔴 Critical
All three issues must be resolved before resubmission. Address Issue 3 first — an invalid demo account will block the reviewer from even verifying fixes to Issues 1 and 2.