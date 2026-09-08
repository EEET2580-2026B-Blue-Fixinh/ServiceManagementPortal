# Fixinh Service Management Portal (SMT)

Runnable Spring Boot service implementing the initial SMT/SBP integration contract for Blue Squad.

## Implemented

- Repair-service catalogue: list active/all services
- Receptionist repair-service operations: create, update, activate/deactivate
- Booking integration: create, list by customer, retrieve by reference
- Request validation and consistent JSON errors
- Bearer-token service authentication (`sbp-service` identity)
- PostgreSQL and Docker Compose deployment
- H2 in-memory database for a quick local demonstration
- Actuator health endpoint

## Run immediately with Docker

Requirements: Docker Desktop or Docker Engine with Compose.

```bash
cp .env.example .env
docker compose up --build
```

Health check:

```bash
curl http://localhost:9443/actuator/health
```

Expected response: `{"status":"UP"}`.

All API calls use the service token from `SMP_SERVICE_TOKEN`:

```bash
export SMT_TOKEN=local-integration-token
curl -H "Authorization: Bearer $SMT_TOKEN" \
  http://localhost:9443/api/v1/repair-services
```

## Run without PostgreSQL

Java 21 and Maven 3.9+ are required. The default profile uses an in-memory H2 database.

```bash
mvn spring-boot:run
```

## API contract

Base URL: `http://localhost:9443/api/v1`

| Method | Path | Purpose |
|---|---|---|
| GET | `/repair-services?activeOnly=false` | Catalogue consumed by SBP; includes inactive services by default |
| POST | `/repair-services` | Create a repair service |
| PUT | `/repair-services/{serviceId}` | Update a repair service |
| PATCH | `/repair-services/{serviceId}/status` | Activate/deactivate a service |
| POST | `/bookings` | Create a booking |
| GET | `/bookings?customerId={customerId}` | List a customer's bookings |
| GET | `/bookings/{bookingRef}` | Retrieve one booking |

### Create a booking

```bash
curl -i -X POST http://localhost:9443/api/v1/bookings \
  -H "Authorization: Bearer $SMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUS-001",
    "customerFullName": "Nguyen Hong Anh",
    "serviceId": "SVC-PLUMB-01",
    "issueDescription": "Kitchen sink pipe is leaking under the cabinet.",
    "preferredServiceDate": "2026-09-10",
    "availableStartTime": "18:00",
    "availableEndTime": "20:00",
    "serviceAddress": {
      "streetNumber": "123",
      "streetName": "Green Street",
      "ward": "Ward 5",
      "provinceName": "Ho Chi Minh City"
    },
    "originChannel": "SBP"
  }'
```

## Configuration

| Variable | Purpose | Development default |
|---|---|---|
| `SMP_SERVICE_TOKEN` | Shared bearer token accepted from SBP | `local-integration-token` |
| `DB_HOST` / `DB_PORT` | PostgreSQL location | `localhost:5432` |
| `POSTGRES_DB` | Database name | `fixinh_smt` |
| `POSTGRES_USER` | Database user | `fixinh` |
| `POSTGRES_PASSWORD` | Database password | `fixinh-dev` |

Do not commit `.env` or real credentials. The current bearer token is an integration baseline; OAuth2 client credentials can replace it without changing endpoint DTOs.

## Current scope/status

This commit is the first runnable vertical slice. Technician assignment, receptionist booking confirmation, completed booking costs, React screens, HTTPS certificates, and production OAuth2 token issuance remain pending. This status is stated explicitly so progress evidence is accurate.
