# Fixinh Service Management Portal (SMT)

The Fixinh Service Management Portal manages repair-service bookings received from the Service Booking Portal (SBP). It provides a receptionist workspace for reviewing, confirming, scheduling, assigning Technicians, and completing bookings with final costs.

## Live deployment

| Component | URL |
|---|---|
| React portal | https://fixinh-smt-portal.vercel.app |
| Spring Boot API | https://servicemanagementportal.onrender.com |
| Health check | https://servicemanagementportal.onrender.com/actuator/health |

The Render free tier may take approximately two minutes to wake after a period of inactivity.

## Technology stack

- Java 21 and Spring Boot 3.4.2
- Spring Web, Validation, Security, Data JPA, and Actuator
- PostgreSQL 16 for persistent deployed and Docker data
- H2 for an optional lightweight local run
- React and Vite
- Docker and Docker Compose
- Render for the API and PostgreSQL deployment
- Vercel for the frontend deployment

## Architecture

```mermaid
flowchart LR
    SBP[Service Booking Portal] -->|Bearer-authenticated REST| API[Spring Boot SMT API]
    UI[React Reception Portal] -->|HTTPS REST| API
    API --> DB[(PostgreSQL)]
```

## Implemented functionality

- Active and complete repair-service catalogue retrieval
- Receptionist catalogue creation, editing, activation, and deactivation
- Booking creation with customer, service, availability, and address details
- Collision-safe human-readable booking references in `ORD-YYYY-NNNN` format
- Booking lookup by reference and customer
- Reception queue for newly created bookings
- Booking confirmation with estimated fee and duration
- Scheduling with one or more seeded Technicians
- Completion with service fee, material cost, and calculated total
- Technician IDs and names in booking responses
- Consistent validation and JSON error responses
- Stateless bearer-token authentication
- Health and readiness checks
- Responsive React screens for booking creation, reception queue, and the complete booking workflow

## Booking lifecycle

```text
CREATED → CONFIRMED → SCHEDULED → COMPLETED
```

Each transition is validated by the API. Invalid transitions return `422 Unprocessable Entity`.

## Run locally with Docker

Requirements: Docker Desktop or Docker Engine with Compose.

```bash
cp .env.example .env
docker compose up --build
```

The services will be available at:

- API: `http://localhost:9443/api/v1`
- Health: `http://localhost:9443/actuator/health`
- PostgreSQL: `localhost:5432`

Check API health:

```bash
curl http://localhost:9443/actuator/health
```

Expected response:

```json
{"status":"UP"}
```

Do not run `docker compose down -v` unless the PostgreSQL data is intentionally being deleted.

## Run the frontend locally

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

Required frontend variables:

```env
VITE_API_BASE_URL=http://localhost:9443/api/v1
VITE_SMT_SERVICE_TOKEN=local-integration-token
```

Vite variables are included in the browser bundle. The current service token is suitable only for the assessed integration demonstration and must be replaced by a production authentication mechanism for real-world use.

## Run the API without PostgreSQL

Java 21 and Maven 3.9+ are required. The default profile uses an in-memory H2 database.

```bash
mvn spring-boot:run
```

## Authentication

All API endpoints except `/actuator/health`, `/actuator/info`, and `/error` require:

```http
Authorization: Bearer <SMP_SERVICE_TOKEN>
```

Development example:

```bash
curl -H "Authorization: Bearer local-integration-token" \
  http://localhost:9443/api/v1/repair-services
```

## API contract

Local base URL: `http://localhost:9443/api/v1`

| Method | Path | Purpose |
|---|---|---|
| GET | `/repair-services?activeOnly=true` | List active catalogue services |
| GET | `/repair-services?activeOnly=false` | List all catalogue services |
| POST | `/repair-services` | Create a repair service |
| PUT | `/repair-services/{serviceId}` | Update a repair service |
| PATCH | `/repair-services/{serviceId}/status` | Activate or deactivate a service |
| POST | `/bookings` | Create a booking |
| GET | `/bookings?status=CREATED` | Retrieve the receptionist queue |
| GET | `/bookings?customerId={customerId}` | List a customer's bookings |
| GET | `/bookings/{bookingRef}` | Retrieve one booking |
| PATCH | `/bookings/{bookingRef}/confirmation` | Confirm a created booking |
| PATCH | `/bookings/{bookingRef}/schedule` | Schedule and assign Technicians |
| PATCH | `/bookings/{bookingRef}/completion` | Complete a scheduled booking |

### Create a booking

```json
{
  "customerId": "CUST-001",
  "customerFullName": "Nguyen Hong Anh",
  "serviceId": "SVC-PLUMB-01",
  "issueDescription": "Kitchen sink pipe is leaking under the cabinet.",
  "preferredServiceDate": "2026-09-18",
  "availableStartTime": "09:00",
  "availableEndTime": "10:30",
  "serviceAddress": {
    "streetNumber": "25",
    "streetName": "Nguyen Hue Street",
    "ward": "Ward 1",
    "provinceCode": "HCM",
    "provinceName": null
  },
  "originChannel": "SBP"
}
```

The availability window must be at least 60 minutes, the preferred date cannot be in the past, and SBP integration bookings must use `originChannel: "SBP"`.

### Confirm a booking

```json
{
  "estimatedServiceFee": 425000,
  "estimatedDurationMinutes": 75
}
```

### Schedule a booking

```json
{
  "scheduledAt": "2026-09-18T14:00:00",
  "technicianIds": ["TECH-001", "TECH-002"]
}
```

### Complete a booking

```json
{
  "completedServiceFee": 450000,
  "materialCost": 75000
}
```

The API calculates `totalCost` as `completedServiceFee + materialCost`.

## Seeded Technicians

| Technician ID | Full name |
|---|---|
| `TECH-001` | Nguyen Minh Anh |
| `TECH-002` | Tran Quoc Bao |
| `TECH-003` | Le Thu Ha |

Assigned Technicians are returned as objects containing both `technicianId` and `fullName`.

## Configuration

| Variable | Purpose | Development default |
|---|---|---|
| `PORT` | HTTP port assigned by the host | `9443` |
| `SMP_SERVICE_TOKEN` | Shared bearer token accepted from SBP | `local-integration-token` |
| `SMT_CORS_ALLOWED_ORIGIN` | Permitted React frontend origin | `http://localhost:5173` |
| `SPRING_PROFILES_ACTIVE` | Enables PostgreSQL configuration | `postgres` in Docker/deployment |
| `DB_HOST` / `DB_PORT` | PostgreSQL location | `localhost:5432` |
| `POSTGRES_DB` | Database name | `fixinh_smt` |
| `POSTGRES_USER` | Database user | `fixinh` |
| `POSTGRES_PASSWORD` | Database password | `fixinh-dev` |

Never commit `.env`, `.env.local`, production credentials, or Vercel project metadata.

## Verification

The following checks were completed successfully:

- Maven package build
- Docker image build
- PostgreSQL health check
- Spring Boot Actuator health and readiness check
- CORS preflight from the deployed Vercel origin
- Frontend lint with zero warnings and zero errors
- Vite production build
- Local UI booking lifecycle test
- Deployed end-to-end booking lifecycle test

Production verification booking `ORD-2026-9692` completed this path:

```text
Vercel frontend → Render API → PostgreSQL
CREATED → CONFIRMED → SCHEDULED → COMPLETED
```

The completed response retained the scheduled time, assigned Technician IDs and names, final service fee, material cost, and calculated total.

## Scope boundaries

The submitted Simplex scope does not include:

- Booking cancellation
- A full staff-administration or all-Technicians API
- Asynchronous SBP status notifications or webhooks
- Production OAuth2 or end-user authentication

SBP can retrieve the current booking status and assigned Technician data through `GET /api/v1/bookings/{bookingRef}`. Cancellation and staff-list behavior may be mocked by SBP for the demonstration, as agreed for the integration scope.
