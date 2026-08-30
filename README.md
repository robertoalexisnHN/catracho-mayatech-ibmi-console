# Catracho MayaTech

## IBM i Operational Continuity Console

Catracho MayaTech is an IBM i operational continuity platform built for the IBM TechXchange 2026 Hackathon with IBM Bob 2.0.

The solution is designed for:

- Developers
- IBM i Administrators
- Operations Teams

It connects:

**Change Validation → Production Monitoring → Deployment Traceability → Incident Investigation**

---

## Problem

In many IBM i environments, moving objects from DEV to QA and PROD still depends on manual validation of versions, compiled dates, owners, object types, sizes, dependencies, and target availability.

This increases deployment risk, environment drift, and incident investigation time.

---

## Solution

Catracho MayaTech provides a single operational workflow for IBM i teams.

### Main capabilities

- DEV / QA / PROD object comparison
- Real IBM i object metadata validation
- Production system-health monitoring
- Deployment package traceability
- Incident investigation using IBM i joblogs
- Live connection to a real IBM i environment

---

## Architecture

React → Laravel → Java / JTOpen Bridge → IBM i / Db2 for i

The Java Bridge runs on a VPN-connected machine and exposes controlled HTTP endpoints consumed by Laravel.

---

## IBM Technologies

- IBM Bob 2.0
- IBM i
- Db2 for i
- JTOpen / JDBC
- watsonx.ai

---

## Demo Video

YouTube Demo:

[Watch the 3-minute demo](YOUR_YOUTUBE_LINK)

---

## IBM Bob Evidence

The IBM Bob exported task/session report and required session summary screenshots are available here:

`docs/ibm-bob/`

---

## Screenshots

### Operational Dashboard

![Dashboard](docs/screenshots/dashboard.png)

### Object Comparator

![Comparator](docs/screenshots/comparator.png)

### Incident Center

![Incident Center](docs/screenshots/incidents.png)

---

## Security

No production credentials, IBM Cloud API keys, passwords, VPN credentials, or secrets are included in this repository.

Environment-specific configuration must be provided locally using `.env`.

---

## Team

**Catracho MayaTech**

IBM TechXchange Hackathon 2026

---

Made with IBM Bob 2.0
