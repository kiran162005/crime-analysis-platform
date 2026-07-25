Crime Analysis Platform – Security Plan

1. Authentication Method
    Provider: Native Catalyst Authentication
    Login Type: Hosted Authentication
    Authentication: Email and Password
    Public Signup: Disabled
    Social Login: Disabled
    Password Reset: Catalyst managed
    Session Management: Catalyst managed

2. User Roles
- Current Catalyst Roles
    App Administrator
    App User
- Planned Application Roles (to be finalized with the team)
    Admin
    Police Officer
    Investigator
    Crime Analyst

3. IAM Permissions
| Role              | Permissions                          |
| ----------------- | ------------------------------------ |
| App Administrator | Full Catalyst project administration |
| App User          | Standard authenticated user          |
| Admin             | Full application management          |
| Police Officer    | Create and update incidents          |
| Investigator      | Manage assigned investigations       |
| Crime Analyst     | View dashboards and generate reports |

(The last four will be mapped after the team finalizes application workflows.)

4. API Protection

To be implemented in Phase 2 – API Gateway:
    Protect all APIs using Catalyst Authentication.
    Allow only authenticated users to access secured endpoints.
    Restrict administrative APIs to administrator roles.
    Apply rate limiting where appropriate.

5. Route Protection

Frontend routes will be protected based on authentication state and user role.
Examples:
    /login → Public
    /dashboard → Authenticated users
    /admin/* → Administrators
    /analytics → Crime Analysts
    /investigations → Investigators
These mappings will be refined once the frontend is complete.

6. Session Handling

Managed by Catalyst:
    Secure login sessions
    Logout support
    Session expiration
    Password reset
    Token management
No custom session implementation is required unless future project requirements change.