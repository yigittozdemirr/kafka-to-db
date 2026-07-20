# 🚀 Distributed Kafka Microservices Architecture

[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=flat-square&logo=spring-boot)](https://spring.io/projects/spring-boot)
[![Kafka](https://img.shields.io/badge/Apache_Kafka-3.x-231F20?style=flat-square&logo=apache-kafka)](https://kafka.apache.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)

A modern, production-grade distributed system demonstrating an **Event-Driven Microservices Architecture** using Apache Kafka, Spring Boot, and PostgreSQL.

This project highlights a key architectural pattern: **Real-Time Stream Enrichment**, where a fast-moving transaction stream is joined with static database reference data, and visualizes the results on a high-performance React dashboard.

---

## 📖 Overview

This repository contains a multi-module microservice ecosystem designed for high-throughput messaging. It separates concerns strictly into **Producer** and **Consumer** microservices, mimicking real-world backend infrastructures used by large tech companies.

The architecture ensures **Data Consistency, Parallel Processing, and Fault Tolerance** utilizing a **Dead Letter Queue (DLQ)** for unrecoverable errors.

---

## 🏗️ Architecture

```mermaid
graph TD
    CLIENT[Client / Swagger UI] -->|POST /api/orders/stress-test| PRODUCER(kafka-producer-app :8085)
    
    PRODUCER -->|Produces Event| KAFKA((Apache Kafka Broker\n'orders' Topic - 3 Partitions))
    
    KAFKA -->|Partition 0| APP1(kafka-message - Instance 1 :8080)
    KAFKA -->|Partition 1| APP2(kafka-message - Instance 2 :8081)
    KAFKA -->|Partition 2| APP3(kafka-message - Instance 3 :8082)
    
    APP1 -->|1. Joins Static CRM Data\n2. Preserves customer_index| DB[(PostgreSQL :5433)]
    APP2 -->|1. Joins Static CRM Data\n2. Preserves customer_index| DB
    APP3 -->|1. Joins Static CRM Data\n2. Preserves customer_index| DB
    
    KAFKA -.->|Failed Msgs| DLQ((DLQ - 'orders-dlt' Topic))
    DLQ -.-> APP1

    APP1 == "WebSocket (STOMP + customerIndex)" ==> DASHBOARD[React Dashboard :5173]
    APP2 == "WebSocket (STOMP + customerIndex)" ==> DASHBOARD
    APP3 == "WebSocket (STOMP + customerIndex)" ==> DASHBOARD
    style DASHBOARD fill:#111,stroke:#fff,color:#fff
```

---

## 🛠️ Key Architectural Patterns Implemented

### 1. Real-Time Stream Enrichment (Reference Table Joining)
To keep the network payload light, the Kafka producer publishes minimal transactional order messages (containing only `orderId`, `customerName`, and `amount`).
*   **Static Reference Data:** Upon startup, a `DataInitializer` pre-populates a PostgreSQL table `customer_details` with 1,000 reference records (containing emails, addresses, and customer indexes) representing a mock CRM system.
*   **The Enrichment Process:** When the consumer microservices retrieve order messages from Kafka, they query the `customer_details` table using `customerName` as a **join key**. They merge the transaction details with the reference details to write a complete `EnrichedOrder` entity into the database.

### 2. Distributed Out-of-Order Solution (Logical Sorting Key)
Because 3 consumer microservice instances concurrently process messages from 3 partitions, the order in which messages are written to PostgreSQL is inherently non-deterministic (a race condition based on thread execution speed).
*   **The Problem:** The database Primary Key (`id`) values are assigned based on arrival sequence, making chronological insertion order appear random when viewed.
*   **The Solution:** We extracted the numeric suffix from the customer name (e.g. `"Customer-42"` $\to$ `42`) to create a persistent **Logical Sorting Key** (`customer_index`).
*   **The Resolution:** 
    *   **In Database:** Running `SELECT * FROM enriched_orders ORDER BY customer_index ASC;` groups and displays all customer orders in their natural sequential order regardless of when they physically arrived.
    *   **In React Dashboard:** The consumer sends the `customerIndex` through the WebSocket event payload. The React client dynamically sorts the live stream data on the client side, showing a clean sequence from `Customer-0` to `Customer-99`.

---

## ✨ Features

- **Microservices Separation:** Clear boundary between producing events (`kafka-producer-app`) and consuming/processing events (`kafka-message`).
- **Horizontal Scalability:** The consumer is deployed as **3 separate independent containers** processing data concurrently from 3 Kafka partitions, maximizing throughput.
- **Real-Time Monitoring Dashboard:** A React/TypeScript minimalist dashboard connects via WebSockets (SockJS/STOMP) directly to all consumer instances, rendering live processing metrics, throughput, and DLT logs. optimized with `requestAnimationFrame` for 10K+ messages.
- **Stress Testing Built-in:** The producer application includes a dedicated endpoint to fire 10,000+ messages in milliseconds to test cluster performance.
- **Dead Letter Queue (DLQ) & Retry Mechanism:** Automatic backoff and retries for failed messages. Unrecoverable messages are elegantly routed to the DLQ and persisted in a `failed_messages` table.
- **Integration Testing:** Comprehensive end-to-end testing of the distributed structure using **Testcontainers** (spinning up ephemeral Kafka & PostgreSQL containers).
- **Timezone Synchronization:** Container timezones are strictly mapped to `Europe/Istanbul` to ensure accurate database timestamps.

---

## 📂 Project Structure

- `kafka-producer-app/` - The Producer Microservice (API Gateway). Validates incoming requests and publishes them to Kafka.
- `kafka-message/` - The Consumer Microservice (Worker). Listens to Kafka partitions, processes data, queries the CRM data, and persists it to PostgreSQL.
- `monitoring-dashboard/` - React + TypeScript Frontend application using Tailwind CSS v4 to visualize live Kafka message processing.
- `docker-compose.yml` - Root orchestration file to spin up the entire infrastructure (Kafka, Postgres, UI, Producer, 3x Consumers).

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) and Docker Compose installed.

### Installation & Run

1. Clone the repository:
```bash
git clone <your-repo-url>
cd <project-folder>
```

2. Start the entire infrastructure (7 containers) using Docker Compose:
```bash
docker compose up -d --build
```

### 🔗 Access Points

Once the containers are running, you can access the following services:

| Service | URL | Description |
|---------|-----|-------------|
| **Monitoring Dashboard** | [http://localhost:5173](http://localhost:5173) | Live React dashboard showing message processing, active connections, and Dead Letter Queue |
| **Producer Swagger UI** | [http://localhost:8085/swagger-ui.html](http://localhost:8085/swagger-ui.html) | **(Start Here)** Send Stress Test REST requests to the cluster |
| **Kafka UI** | [http://localhost:8090](http://localhost:8090) | Monitor Kafka topics, partitions, and consumers |
| **PostgreSQL** | `localhost:5433` | DB Access (User: `postgres`, Pass: `1`) |

> **Note:** To prevent conflicts with local PostgreSQL installations, the Docker PostgreSQL port is mapped to `5433`.

---

## 🔥 How to perform a Stress Test

1. Open the **Producer Swagger UI**: `http://localhost:8085/swagger-ui.html`
2. Navigate to `POST /api/orders/stress-test`
3. Enter a count (e.g., `1000`) and hit Execute.
4. Open the **Monitoring Dashboard** (`http://localhost:5173`) and watch the 3 Consumer instances process the massive load in parallel!

---

## 📊 Live Monitoring Dashboard

To visualize the message throughput during a stress test, a specialized React dashboard is provided. It connects directly to the backend instances via WebSockets.

![Monitoring Dashboard](dashboard.png)

### How to Run the Dashboard locally (Optional):
```bash
cd monitoring-dashboard
npm install
npm run dev
```

---
*Developed as a project to demonstrate advanced distributed system patterns.*
