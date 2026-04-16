# SkyServe (Skyrunner) System Design Document

Status: Draft v1  
Date: 2026-04-13  
Preferred Cloud: AWS

## 1. Purpose

This document defines the target architecture for **SkyServe**, a drone-based food delivery platform operating across multiple hubs in Lagos.

The platform includes:

- Consumer mobile app
- Restaurant app
- Admin dashboard
- Backend API and domain services
- Drone fleet system
- Real-time tracking

The design covers:

- High-level platform architecture
- Service decomposition and ownership
- API boundaries
- Database schema outline
- Event topics and payload contracts
- End-to-end data flow
- AWS deployment architecture

## 2. Goals and Non-Goals

### Goals

- Support the full customer delivery lifecycle:
  `order -> accepted -> preparing -> picked up -> in-flight -> delivered`
- Provide near real-time order and drone tracking to consumer, restaurant, and admin clients
- Support both simulated drones and future real drones using the same backend contracts
- Scale to multiple Lagos hubs without redesigning the core platform
- Keep ordering, dispatch, telemetry, and tracking loosely coupled
- Maintain a clear operational view for hub operators and platform admins

### Non-Goals for v1

- Flight controller firmware design
- Advanced air-traffic or regulatory UTM integration
- Multi-drop route optimization
- Autonomous obstacle avoidance logic
- Dynamic weather modeling beyond policy-based routing constraints

## 3. Assumptions and Planning Targets

These assumptions size the initial architecture and can be revised later.

- 5 to 10 active hubs in Lagos
- Up to 500 registered drones, with 100 to 200 concurrently active
- Telemetry at 1 Hz per active drone, with bursts up to 2 Hz during takeoff and landing
- 1,000 concurrent tracked orders during peak periods
- Single-restaurant, single-destination delivery per order in v1
- One drone mission per order in v1
- Payments are handled by an external PSP through the Payment Service

## 4. Architecture Overview

### 4.1 Context Diagram

```text
                       +--------------------------------------+
                       |          Admin Dashboard             |
                       |  Fleet Ops, Hub Ops, Incidents, SLA  |
                       +------------------+-------------------+
                                          |
                                          v
+--------------------+          +---------+----------+          +--------------------+
| Consumer Mobile App| <------> |  API Gateway Layer | <------> |   Restaurant App   |
| Browse, Order, Pay,|          |  HTTP APIs + WS    |          | Accept, Prepare,   |
| Track              |          +---------+----------+          | Handoff            |
+----------+---------+                    |                     +----------+---------+
           |                              v                                |
           |                 +------------+-------------------------------+ |
           |                 |            Core Domain Services            | |
           |                 |--------------------------------------------| |
           |                 | Auth / Identity                            | |
           |                 | User / Profile                             | |
           |                 | Restaurant / Catalog                       | |
           |                 | Order                                      | |
           |                 | Dispatch / Assignment                      | |
           |                 | Hub                                        | |
           |                 | Drone Fleet / Mission                      | |
           |                 | Tracking / ETA                             | |
           |                 | Payment                                    | |
           |                 | Notification                               | |
           |                 | Admin / Audit                              | |
           |                 +------------+-------------------------------+ |
           |                              |                                 |
           |                              v                                 |
           |                 +------------+------------------+              |
           |                 |   Streaming / Event Backbone  |              |
           |                 |   domain events + telemetry   |              |
           |                 +------------+------------------+              |
           |                              |                                 |
           |                              v                                 |
           |                 +------------+------------------------------+  |
           |                 |              Data Layer                   |  |
           |                 | Aurora PostgreSQL                         |  |
           |                 | ElastiCache                               |  |
           |                 | Timestream                                |  |
           |                 | S3 / Logs / Analytics                     |  |
           |                 +------------+------------------------------+  |
           |                              ^                                 |
           |                              |                                 |
           v                              |                                 v
+----------+------------------------------+-------------------------+--------+---------+
|                           Drone Connectivity & Fleet Edge                                    |
|-----------------------------------------------------------------------------------------------|
| AWS IoT Core (MQTT), Device Shadows, Drone Simulator Workers, Future Real Drone Agents       |
| GPS, battery, heading, speed, altitude, mission state, health, alerts                        |
+-----------------------------------------------------------------------------------------------+
```

### 4.2 Primary Design Principle

SkyServe is designed as an **event-driven, hub-aware platform**:

- **Order state** is the source of truth for customer-facing delivery progress
- **Mission state** is the source of truth for flight execution
- **Telemetry state** is the source of truth for real-time position and drone health

These three state models are linked, but intentionally separated.

## 5. Domain Services and Responsibilities

| Service | Responsibility | System of Record |
|---|---|---|
| Auth / Identity Service | User role mapping, token validation, session policy | Cognito + Aurora |
| User Service | Customer profiles, addresses, saved locations | Aurora |
| Restaurant Service | Restaurant onboarding, branches, operating hours, prep capacity | Aurora |
| Catalog Service | Menus, items, modifiers, availability | Aurora |
| Order Service | Order creation, lifecycle state machine, order history | Aurora |
| Payment Service | Payment authorization, capture, refund, reconciliation status | Aurora |
| Dispatch Service | Hub selection, drone assignment, mission request orchestration | Aurora + events |
| Hub Service | Hub metadata, coverage zones, slot capacity, charging slots | Aurora |
| Drone Fleet Service | Drone registry, health, availability, digital twin metadata | Aurora + IoT shadow |
| Mission Service | Flight mission lifecycle, command issuance, acknowledgements | Aurora + events |
| Telemetry Ingestion Service | Normalize telemetry from simulator and future real drones | Timestream + stream |
| Tracking Service | Build live order tracking projection and ETA updates | Redis + events |
| Notification Service | Push, SMS, email, in-app events | Aurora + external channels |
| Admin Service | Operational controls, incident workflows, audit access | Aurora |
| Reporting / Analytics | SLA, fleet utilization, hub throughput, incident analysis | S3 / Athena / BI |

## 6. State Model

### 6.1 Customer-Facing Order Lifecycle

The `Order Service` owns the customer-visible lifecycle:

```text
order -> accepted -> preparing -> picked_up -> in_flight -> delivered
```

Allowed exceptions:

- `cancelled`
- `failed`
- `returned`

### 6.2 Mission Lifecycle

The `Mission Service` owns the flight execution lifecycle:

```text
planned -> assigned -> awaiting_pickup -> loaded -> takeoff -> en_route -> landing -> completed
```

Allowed exceptions:

- `aborted`
- `rerouted`
- `failed`
- `recalled`

### 6.3 Rule

Only the `Order Service` may publish customer-visible order state transitions. Other services request transitions by emitting commands or events.

## 7. API Boundaries

API boundaries are intentionally separated by actor and trust level.

### 7.1 External Boundaries

| Boundary | Clients | Protocol | Auth | Owner | Notes |
|---|---|---|---|---|---|
| Consumer API | Mobile apps | HTTPS REST | Cognito JWT | API Gateway + domain services | Public internet-facing |
| Restaurant Partner API | Restaurant app / tablet | HTTPS REST | Cognito JWT + partner role | API Gateway + domain services | Separate rate limits and scopes |
| Admin API | Dashboard | HTTPS REST | Cognito JWT + admin role | API Gateway + admin services | Restricted by WAF and RBAC |
| Realtime Tracking API | Consumer, restaurant, admin clients | WebSocket | Cognito JWT / signed token | API Gateway WS + Tracking Service | Push status and position updates |
| Drone Device API | Simulated drones, future real drones | MQTT over TLS / HTTPS fallback | IoT certificates / IoT policies | AWS IoT Core | Device-specific trust boundary |

### 7.2 Internal Boundaries

| Boundary | Clients | Protocol | Auth | Owner | Notes |
|---|---|---|---|---|---|
| Service-to-service APIs | Internal services | REST/gRPC | IAM / mTLS / private network | ECS services | Used for synchronous domain calls |
| Event backbone | Internal services | Kafka protocol | IAM/SASL per service | MSK | Used for async workflows |
| Data stores | Internal services only | Native DB protocol | SG + IAM + secrets | Aurora / ElastiCache / Timestream | Never internet-facing |

### 7.3 Public API Surface

#### Consumer API

- `GET /v1/restaurants?lat={lat}&lng={lng}`
- `GET /v1/restaurants/{branch_id}/menu`
- `POST /v1/orders`
- `GET /v1/orders/{order_id}`
- `POST /v1/orders/{order_id}/cancel`
- `GET /v1/orders/{order_id}/tracking`
- `GET /v1/payments/{payment_id}`

Rules:

- `POST /v1/orders` must support an idempotency key
- Tracking endpoint returns the latest materialized tracking view, not raw telemetry

#### Restaurant Partner API

- `GET /v1/partner/orders/pending`
- `POST /v1/partner/orders/{order_id}/accept`
- `POST /v1/partner/orders/{order_id}/reject`
- `POST /v1/partner/orders/{order_id}/status`
- `POST /v1/partner/orders/{order_id}/handoff-ready`
- `GET /v1/partner/metrics/today`

Rules:

- Restaurant clients may move orders only within restaurant-owned steps:
  `accepted`, `preparing`, `handoff_ready`
- Restaurant clients cannot set `in_flight` or `delivered`

#### Admin API

- `GET /v1/admin/hubs`
- `GET /v1/admin/drones`
- `GET /v1/admin/missions`
- `GET /v1/admin/orders`
- `POST /v1/admin/missions/{mission_id}/abort`
- `POST /v1/admin/drones/{drone_id}/hold`
- `POST /v1/admin/drones/{drone_id}/resume`
- `GET /v1/admin/incidents`
- `POST /v1/admin/incidents`

Rules:

- Admin operations are fully audited
- Destructive operations require elevated role claims

#### Realtime WebSocket API

Client subscriptions:

- `subscribe.order.{order_id}`
- `subscribe.hub.{hub_id}`
- `subscribe.drone.{drone_id}` for admin only

Server push events:

- `tracking.snapshot`
- `tracking.position_updated`
- `tracking.eta_updated`
- `order.status_changed`
- `drone.alert`

#### Drone MQTT Boundary

Publish topics:

- `skyserve/{env}/drone/{drone_id}/telemetry`
- `skyserve/{env}/drone/{drone_id}/status`
- `skyserve/{env}/drone/{drone_id}/ack`
- `skyserve/{env}/drone/{drone_id}/alert`

Subscribe topics:

- `skyserve/{env}/drone/{drone_id}/command`
- `skyserve/{env}/drone/{drone_id}/shadow/update/delta`

### 7.4 Boundary Ownership Rules

- Mobile and partner apps never talk directly to databases or the event bus
- Drones never talk directly to business services; they talk through AWS IoT Core
- Order status changes visible to users are emitted by the `Order Service` only
- Telemetry ingestion never blocks order creation or restaurant workflows

## 8. Database Schema Outline

SkyServe uses multiple data stores by workload.

### 8.1 Aurora PostgreSQL (Transactional Core)

Recommended: **Aurora PostgreSQL** with **PostGIS** enabled for geospatial queries.

#### Identity and Access

`users`

- `id` UUID PK
- `cognito_sub` text unique
- `role` enum(`consumer`, `restaurant_staff`, `hub_operator`, `admin`, `service_account`)
- `phone`
- `email`
- `status`
- `created_at`
- `updated_at`

`user_addresses`

- `id` UUID PK
- `user_id` FK -> users.id
- `label`
- `address_text`
- `location` geography(Point, 4326)
- `geohash`
- `zone_id`
- `is_default`

#### Restaurants and Catalog

`restaurant_brands`

- `id` UUID PK
- `name`
- `status`

`restaurant_branches`

- `id` UUID PK
- `brand_id` FK
- `name`
- `phone`
- `location` geography(Point, 4326)
- `hub_id` FK
- `service_zone_id` FK
- `prep_time_minutes_default`
- `status`

`menus`

- `id` UUID PK
- `branch_id` FK
- `name`
- `currency`
- `active_from`
- `active_to`
- `status`

`menu_items`

- `id` UUID PK
- `menu_id` FK
- `name`
- `description`
- `price_minor`
- `prep_time_minutes`
- `weight_grams`
- `is_available`

#### Hubs and Fleet

`hubs`

- `id` UUID PK
- `code` text unique
- `name`
- `location` geography(Point, 4326)
- `coverage_zone` geography(Polygon, 4326)
- `capacity_drones`
- `charging_slots`
- `status`

`drones`

- `id` UUID PK
- `serial_number` text unique
- `iot_thing_name` text unique
- `home_hub_id` FK
- `model`
- `max_payload_grams`
- `max_range_meters`
- `battery_capacity_mah`
- `firmware_version`
- `status`
- `health_status`
- `last_seen_at`

`drone_assignments`

- `id` UUID PK
- `drone_id` FK
- `hub_id` FK
- `effective_from`
- `effective_to`

#### Ordering and Delivery

`orders`

- `id` UUID PK
- `customer_id` FK -> users.id
- `restaurant_branch_id` FK
- `hub_id` FK
- `mission_id` FK nullable
- `payment_id` FK nullable
- `delivery_address_id` FK
- `status` enum
- `subtotal_minor`
- `delivery_fee_minor`
- `discount_minor`
- `total_minor`
- `currency`
- `placed_at`
- `accepted_at`
- `picked_up_at`
- `delivered_at`
- `cancelled_at`

`order_items`

- `id` UUID PK
- `order_id` FK
- `menu_item_id` FK
- `item_name_snapshot`
- `qty`
- `unit_price_minor`
- `line_total_minor`

`order_status_history`

- `id` UUID PK
- `order_id` FK
- `from_status`
- `to_status`
- `source_service`
- `source_actor_id` nullable
- `occurred_at`
- `metadata_json`

#### Mission and Tracking

`missions`

- `id` UUID PK
- `order_id` FK unique
- `drone_id` FK
- `hub_id` FK
- `restaurant_branch_id` FK
- `pickup_location` geography(Point, 4326)
- `dropoff_location` geography(Point, 4326)
- `planned_distance_meters`
- `planned_duration_seconds`
- `status`
- `assigned_at`
- `takeoff_at`
- `landing_at`
- `completed_at`
- `abort_reason` nullable

`mission_waypoints`

- `id` UUID PK
- `mission_id` FK
- `sequence_no`
- `location` geography(Point, 4326)
- `target_altitude_meters`
- `eta_at_waypoint`

`tracking_views`

- `order_id` PK
- `mission_id`
- `drone_id`
- `current_location` geography(Point, 4326)
- `current_battery_pct`
- `current_heading_deg`
- `current_speed_mps`
- `eta_seconds`
- `order_status`
- `mission_status`
- `last_telemetry_at`
- `updated_at`

#### Payment, Notifications, Audit

`payments`

- `id` UUID PK
- `order_id` FK unique
- `provider`
- `provider_ref`
- `status`
- `authorized_minor`
- `captured_minor`
- `refunded_minor`
- `currency`
- `created_at`
- `updated_at`

`notifications`

- `id` UUID PK
- `user_id` nullable
- `order_id` nullable
- `channel` enum(`push`, `sms`, `email`, `in_app`)
- `template_code`
- `status`
- `sent_at`
- `provider_ref`

`audit_logs`

- `id` UUID PK
- `actor_type`
- `actor_id`
- `action`
- `resource_type`
- `resource_id`
- `before_json`
- `after_json`
- `occurred_at`

### 8.2 ElastiCache

Recommended use: **ElastiCache for Valkey or Redis OSS compatibility** for hot operational data.

Key patterns:

- `tracking:order:{order_id}` -> latest tracking snapshot
- `tracking:drone:{drone_id}` -> latest drone position/state
- `hub:{hub_id}:available_drones` -> sorted set
- `ws:connection:{connection_id}` -> subscription metadata
- `rate_limit:{actor}:{window}` -> throttling

Redis is not the system of record; it is a low-latency projection/cache layer.

### 8.3 Timestream

Recommended use: raw telemetry and time-series analytics.

`drone_telemetry`

- Dimensions:
  `drone_id`, `hub_id`, `mission_id`, `model`, `env`
- Measures:
  `lat`, `lng`, `altitude_m`, `speed_mps`, `heading_deg`, `battery_pct`, `signal_quality`, `status_code`
- Time:
  event timestamp from device

`drone_health_metrics`

- Dimensions:
  `drone_id`, `hub_id`
- Measures:
  `motor_temp_c`, `battery_temp_c`, `cpu_pct`, `storage_pct`
- Time:
  event timestamp

### 8.4 S3 Data Lake

Use S3 for:

- Event archival
- Operational exports
- Analytics snapshots
- Audit evidence and incident attachments
- Long-term telemetry export from stream processors

## 9. Event Model

### 9.1 Eventing Strategy

The platform uses two event channels:

1. **Domain event bus** for business workflows and projections
2. **MQTT device topics** for drone connectivity and command/telemetry exchange

Recommended AWS mapping:

- **Amazon MSK** for domain events
- **AWS IoT Core** for device messaging

### 9.2 Common Domain Event Envelope

All domain events should follow a shared envelope:

```json
{
  "event_id": "9b1df1fe-3908-4c64-95f1-e4fbb2de9b81",
  "event_type": "order.accepted.v1",
  "occurred_at": "2026-04-13T13:21:04Z",
  "producer": "order-service",
  "trace_id": "6a2ad423b0d14ef0b2433f1f6f3ea01b",
  "hub_id": "hub-lg-01",
  "correlation_id": "order_01JQ...",
  "payload": {}
}
```

Rules:

- Events are immutable
- Events are versioned using the topic or `event_type`
- Consumers must be idempotent
- Business writes use the transactional outbox pattern before publish

### 9.3 Domain Event Topics

| Topic | Producer | Consumers | Purpose |
|---|---|---|---|
| `order.created.v1` | Order Service | Payment, Dispatch, Notifications, Analytics | New order placed |
| `order.accepted.v1` | Order Service | Tracking, Notifications, Analytics | Restaurant accepted order |
| `order.preparing.v1` | Order Service | Tracking, Notifications | Prep started |
| `order.handoff_ready.v1` | Order Service | Dispatch, Mission | Ready for drone pickup |
| `order.picked_up.v1` | Order Service | Tracking, Notifications | Order loaded onto drone |
| `order.in_flight.v1` | Order Service | Tracking, Notifications, Admin | Flight started |
| `order.delivered.v1` | Order Service | Payment, Notifications, Analytics | Delivery completed |
| `order.cancelled.v1` | Order Service | Payment, Notifications, Analytics | Order cancelled |
| `dispatch.assignment.requested.v1` | Dispatch Service | Mission, Hub Ops | Match order to hub and drone |
| `dispatch.assignment.confirmed.v1` | Dispatch Service | Order, Mission, Tracking | Hub and drone assigned |
| `mission.created.v1` | Mission Service | Fleet, Tracking, Admin | Mission record created |
| `mission.commanded.v1` | Mission Service | Fleet, Admin | Command issued to drone |
| `mission.status.changed.v1` | Mission Service | Order, Tracking, Admin | Mission lifecycle transition |
| `drone.telemetry.v1` | Telemetry Ingestion | Tracking, Admin, Analytics | Normalized position stream |
| `drone.status.changed.v1` | Fleet Service | Admin, Dispatch | Availability or health change |
| `drone.low_battery.v1` | Fleet Service | Dispatch, Admin, Mission | Battery exception |
| `tracking.position.updated.v1` | Tracking Service | WebSocket gateway, Analytics | Updated live position |
| `tracking.eta.updated.v1` | Tracking Service | WebSocket gateway, Notifications | Updated ETA |
| `incident.created.v1` | Admin Service | Notifications, Analytics | Operations incident created |

### 9.4 Sample Payloads

#### `order.created.v1`

```json
{
  "event_id": "evt_01",
  "event_type": "order.created.v1",
  "occurred_at": "2026-04-13T13:20:00Z",
  "producer": "order-service",
  "trace_id": "trc_01",
  "hub_id": "hub-lg-01",
  "correlation_id": "ord_100245",
  "payload": {
    "order_id": "ord_100245",
    "customer_id": "cus_0098",
    "restaurant_branch_id": "rst_045",
    "delivery_address_id": "addr_77",
    "subtotal_minor": 18500,
    "delivery_fee_minor": 2500,
    "total_minor": 21000,
    "currency": "NGN",
    "placed_at": "2026-04-13T13:20:00Z"
  }
}
```

#### `dispatch.assignment.confirmed.v1`

```json
{
  "event_id": "evt_02",
  "event_type": "dispatch.assignment.confirmed.v1",
  "occurred_at": "2026-04-13T13:22:11Z",
  "producer": "dispatch-service",
  "trace_id": "trc_01",
  "hub_id": "hub-lg-01",
  "correlation_id": "ord_100245",
  "payload": {
    "order_id": "ord_100245",
    "mission_id": "msn_712",
    "drone_id": "drn_113",
    "hub_id": "hub-lg-01",
    "estimated_takeoff_at": "2026-04-13T13:29:00Z",
    "estimated_delivery_at": "2026-04-13T13:42:00Z"
  }
}
```

#### `drone.telemetry.v1`

```json
{
  "event_id": "evt_03",
  "event_type": "drone.telemetry.v1",
  "occurred_at": "2026-04-13T13:31:09Z",
  "producer": "telemetry-ingestion-service",
  "trace_id": "trc_55",
  "hub_id": "hub-lg-01",
  "correlation_id": "msn_712",
  "payload": {
    "drone_id": "drn_113",
    "mission_id": "msn_712",
    "lat": 6.465422,
    "lng": 3.406448,
    "altitude_m": 64.0,
    "speed_mps": 12.4,
    "heading_deg": 118.0,
    "battery_pct": 74,
    "status": "en_route",
    "captured_at": "2026-04-13T13:31:08Z"
  }
}
```

#### `tracking.eta.updated.v1`

```json
{
  "event_id": "evt_04",
  "event_type": "tracking.eta.updated.v1",
  "occurred_at": "2026-04-13T13:31:10Z",
  "producer": "tracking-service",
  "trace_id": "trc_55",
  "hub_id": "hub-lg-01",
  "correlation_id": "ord_100245",
  "payload": {
    "order_id": "ord_100245",
    "mission_id": "msn_712",
    "eta_seconds": 642,
    "confidence": "medium",
    "derived_from_telemetry_at": "2026-04-13T13:31:08Z"
  }
}
```

### 9.5 Drone MQTT Payloads

#### Telemetry publish payload

Topic:
`skyserve/prod/drone/drn_113/telemetry`

```json
{
  "drone_id": "drn_113",
  "mission_id": "msn_712",
  "ts": "2026-04-13T13:31:08Z",
  "gps": {
    "lat": 6.465422,
    "lng": 3.406448,
    "altitude_m": 64.0
  },
  "motion": {
    "speed_mps": 12.4,
    "heading_deg": 118.0
  },
  "battery": {
    "pct": 74,
    "voltage_mv": 22650
  },
  "status": "en_route"
}
```

#### Command payload

Topic:
`skyserve/prod/drone/drn_113/command`

```json
{
  "command_id": "cmd_883",
  "mission_id": "msn_712",
  "type": "start_mission",
  "issued_at": "2026-04-13T13:28:55Z",
  "desired_state": "takeoff",
  "waypoints": [
    { "seq": 1, "lat": 6.452000, "lng": 3.392000, "altitude_m": 45.0 },
    { "seq": 2, "lat": 6.465422, "lng": 3.406448, "altitude_m": 64.0 }
  ]
}
```

## 10. Data Flow

### 10.1 Order to Delivery

1. Consumer app calls `POST /v1/orders`.
2. `Order Service` creates the order in `order` state and records an outbox event.
3. `Payment Service` authorizes payment.
4. `Restaurant App` receives the order and responds with accept/reject.
5. `Order Service` moves status to `accepted`.
6. Restaurant updates status to `preparing`.
7. Restaurant publishes `handoff_ready`; `Dispatch Service` evaluates hub, drone, and route.
8. `Dispatch Service` emits `dispatch.assignment.confirmed.v1`.
9. `Mission Service` creates a mission and sends a command to the drone through AWS IoT Core.
10. On physical pickup confirmation, `Order Service` moves status to `picked_up`.
11. On takeoff confirmation, `Order Service` moves status to `in_flight`.
12. Telemetry streams continuously through IoT Core -> ingestion -> Timestream/MSK.
13. `Tracking Service` computes live position and ETA and updates Redis.
14. WebSocket gateway pushes updates to consumer, restaurant, and admin clients.
15. On delivery confirmation, `Mission Service` completes the mission and `Order Service` moves status to `delivered`.
16. `Payment Service` captures funds if using auth/capture.

### 10.2 Multi-Hub Assignment Logic

Dispatch prioritizes:

1. Serviceable hub by destination polygon
2. Restaurant-to-hub pickup feasibility
3. Drone availability at that hub
4. Payload and remaining battery margin
5. Estimated mission duration and SLA
6. Operational overrides from admin

### 10.3 Simulator Data Flow

1. Simulator workers run as containerized services.
2. Each simulated drone registers as an IoT thing with its own identity.
3. Mission commands are delivered over MQTT or device shadow delta.
4. Simulator emits telemetry using the same topic structure as a real drone.
5. Backend services remain unchanged whether the fleet is simulated or physical.

## 11. AWS Deployment Architecture

### 11.1 Recommended AWS Services

| Concern | AWS Service | Why |
|---|---|---|
| DNS | Route 53 | Managed DNS and health-aware routing |
| CDN / edge | CloudFront | Low-latency delivery for dashboard assets and API edge presence |
| Web protection | AWS WAF | Rate limiting, bot filtering, request filtering |
| Identity | Amazon Cognito | Managed user pools and JWT issuance for apps |
| Public API ingress | Amazon API Gateway HTTP APIs | API management, auth, throttling, versioning |
| Realtime push | Amazon API Gateway WebSocket APIs | Bidirectional client updates |
| Device connectivity | AWS IoT Core | MQTT over TLS, device identity, topic policies |
| Device digital twin | AWS IoT Device Shadow | Desired and reported drone state |
| Compute | Amazon ECS on Fargate | Lower ops burden for containerized services |
| Streaming backbone | Amazon MSK | Durable event streaming for domain workflows |
| Transaction DB | Aurora PostgreSQL | ACID relational core + PostGIS support |
| Cache / live projection | ElastiCache | Sub-millisecond hot reads for tracking |
| Time-series telemetry | Amazon Timestream | Managed storage for telemetry workloads |
| Object storage | Amazon S3 | Archival, analytics, incident evidence |
| Secrets | AWS Secrets Manager | Secret storage and rotation |
| Monitoring | Amazon CloudWatch | Metrics, logs, alarms, dashboards |
| Tracing | AWS Distro for OpenTelemetry / X-Ray compatible pipeline | Service traces and latency diagnosis |

### 11.2 AWS Topology

```text
Internet / Mobile Apps / Partner Apps / Admin Web
                |
             Route 53
                |
        +-------+--------+
        | CloudFront +   |
        | AWS WAF        |
        +-------+--------+
                |
      +---------+-------------------+
      |                             |
      v                             v
Admin static assets            API Gateway
S3 + CloudFront                HTTP APIs + WebSocket APIs
                                    |
                                    v
                         VPC Link / Internal ALB
                                    |
                     +--------------+----------------+
                     |       ECS Fargate Services    |
                     | Order, Dispatch, Mission,     |
                     | Tracking, Payment, Admin      |
                     +--------------+----------------+
                                    |
         +--------------------------+-------------------------------+
         |                          |                               |
         v                          v                               v
     Aurora PG                 ElastiCache                         MSK
         |                          |                               |
         +--------------------------+-------------------------------+
                                    |
                                    v
                              Stream processors
                                    |
                                    v
                               Timestream / S3

Simulated and future real drones
                |
                v
          AWS IoT Core
      MQTT + Device Shadows
                |
                +--> IoT Rules -> Timestream
                |
                +--> Telemetry bridge -> MSK topic(s)
```

### 11.3 Network Layout

Deploy the platform in a single AWS region using **three Availability Zones**.

Recommended VPC layout:

- 3 public subnets
  - NAT Gateways
  - Internet-facing edge integrations where required
- 3 private app subnets
  - ECS Fargate services
  - internal load balancers
- 3 private data subnets
  - Aurora
  - ElastiCache
  - MSK

Notes:

- Keep application services in private subnets
- Use security groups to isolate API, app, and data tiers
- Use one NAT Gateway per AZ for resilience

### 11.4 Deployment Units

ECS services:

- `api-bff-consumer`
- `api-bff-partner`
- `api-bff-admin`
- `order-service`
- `restaurant-service`
- `catalog-service`
- `dispatch-service`
- `hub-service`
- `fleet-service`
- `mission-service`
- `telemetry-bridge`
- `tracking-service`
- `notification-service`
- `payment-service`
- `simulator-service`

This can start as a modular monolith split into a few services, but the contracts in this document should remain stable even if deployment is consolidated at first.

### 11.5 Real-Time Tracking Path on AWS

1. Drone publishes telemetry to AWS IoT Core.
2. IoT Rules send raw telemetry to Timestream.
3. Telemetry bridge normalizes the message and publishes `drone.telemetry.v1` to MSK.
4. Tracking Service consumes telemetry and order events, computes live state, and writes Redis projections.
5. WebSocket API pushes `tracking.position_updated` and `tracking.eta_updated` to subscribed clients.

### 11.6 Security Model on AWS

- **Consumers, restaurant staff, and admins** authenticate with Cognito user pools
- **Roles** map to JWT scopes/groups
- **Drones** authenticate with AWS IoT certificates and restrictive IoT policies
- **Secrets** are stored in Secrets Manager
- **Encryption at rest** uses KMS-managed keys for Aurora, MSK, S3, and Timestream
- **Encryption in transit** is mandatory for public APIs, service-to-service traffic, and MQTT
- **Admin API** should also be protected with stricter WAF rules and optional office/VPN IP allowlisting

### 11.7 Availability and Disaster Recovery

Recommended initial posture:

- Single-region, multi-AZ production deployment
- Automated backups for Aurora
- Cross-AZ replication for managed services
- S3 versioning for archives and exports

Recommended phase 2 DR posture:

- Warm standby in a secondary AWS region
- Aurora cross-region strategy
- MSK replication for critical domain topics
- Route 53 failover routing for admin/control-plane entry points

## 12. Key Technical Decisions

### 12.1 AWS IoT Core for Drone Connectivity

Reason:

- Drones are devices, not ordinary app clients
- MQTT over TLS suits low-latency state exchange
- Device Shadows provide a clean reported/desired state pattern
- Simulators can use the exact same contract as physical drones

### 12.2 MSK for Domain Eventing

Reason:

- Order, dispatch, mission, and tracking updates form a high-value event stream
- Consumers can build projections independently
- Multi-service fan-out is easier than point-to-point coupling

### 12.3 Aurora PostgreSQL + PostGIS for Core Transactions

Reason:

- Strong consistency for orders, missions, and payments
- Geospatial support for hubs, service zones, and delivery coordinates
- Familiar relational model for operational reporting

### 12.4 Timestream for Telemetry

Reason:

- Telemetry is append-heavy and time-series shaped
- Query patterns differ from OLTP
- Separation protects the transaction database from telemetry load

### 12.5 Redis Projection Layer for Live Tracking

Reason:

- Tracking is read-heavy and latency-sensitive
- Consumers need fresh snapshots, not raw telemetry joins on every request
- Redis supports hot data and WebSocket fan-out helpers efficiently

### 12.6 Clear Separation of Order and Mission State

Reason:

- A drone may fail, reroute, or be reassigned without corrupting order history
- Customer-visible order status remains simple and trustworthy
- Ops workflows can evolve without changing the customer contract

### 12.7 Transactional Outbox Pattern

Reason:

- Prevents missed events after a successful DB write
- Preserves consistency between relational truth and event publication

### 12.8 Hub as a First-Class Partition Key

Reason:

- SkyServe expands operationally by hubs, not by a single city-wide queue
- Hub-aware routing reduces dispatch contention and improves observability
- `hub_id` becomes a natural partition for routing, reporting, and operations

## 13. Operational Concerns

### 13.1 Observability

Track these metrics from day one:

- Order creation latency
- Order state transition lag
- Dispatch decision latency
- Time from handoff-ready to pickup
- Telemetry ingest rate
- Telemetry freshness per drone
- ETA error by percentile
- Drone battery alert frequency
- Mission failure and abort rate
- Hub utilization

### 13.2 Failure Handling

Examples:

- If telemetry is stale for more than threshold X, show `tracking_degraded`
- If a drone battery falls below minimum mission reserve, emit `drone.low_battery.v1`
- If mission start fails after restaurant handoff, allow operator reassignment
- If payment capture fails after delivery, keep order closed but mark finance exception

### 13.3 Compliance and Audit

- Admin actions must be fully auditable
- Status transitions should retain actor and source metadata
- Incident records should link to affected orders, missions, and drones

## 14. Recommended Delivery Sequence

### Phase 1

- Consumer app, restaurant app, admin dashboard
- Order lifecycle
- Hub management
- Drone simulator
- Basic dispatch
- Live tracking

### Phase 2

- Enhanced route optimization
- Operational incident tooling
- Secondary-region DR
- Real drone hardware integration

### Phase 3

- Multi-order batching
- Predictive ETA using historical telemetry
- Dynamic hub balancing

## 15. Summary

SkyServe should be built as an AWS-first, event-driven delivery platform with:

- Aurora PostgreSQL as the transactional core
- AWS IoT Core as the drone connectivity layer
- Amazon MSK as the domain event backbone
- Timestream as the telemetry store
- ElastiCache as the real-time tracking projection layer
- ECS Fargate as the application compute platform
- API Gateway HTTP and WebSocket APIs as the client-facing ingress

This design cleanly supports:

- Multiple Lagos hubs
- Simulated and future real drones
- Real-time delivery tracking
- A strict and auditable delivery lifecycle
