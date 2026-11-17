# 01. Project Overview — FinPulse

## Project Metadata
- **Project Name:** FinPulse
- **Tagline:** Personal Financial Management & Intelligent Analytics Platform
- **Repository Location:** `C:\Users\karth\OneDrive\Desktop\FSWD\FinPulse`
- **Primary Domain:** Personal Finance Management (PFM), Financial Health Analytics, and Automated Wealth Tracking
- **Academic Context:** 21CSE354T Full Stack Web Development Capstone Implementation

---

## One-Paragraph Product Description
FinPulse is a full-stack personal finance web application that unifies multi-account ledger management (checking, savings, credit cards, cash, investments, loans), atomic double-entry inter-account transfers, category-based monthly budgeting, recurring subscription tracking with next-due-date progression, and goal amortization tracking with an independent pure-JDBC analytics microservice. The analytics service executes high-performance SQL set operations (`UNION`, `INTERSECT`, `EXCEPT`), multi-table joins, and correlated subqueries to deliver historical cash flow tracking, spending spike anomaly detection (>120% of 3-month rolling average), repeat vendor audits, unused budget analysis, combined actual/scheduled cash flow timelines, and cursor-streamed CSV exports protected against CSV formula injection. The frontend delivers a calm, information-dense fintech UI (Stripe/Linear inspired) utilizing CSS custom properties for instant light/dark theme switching, responsive 12-column CSS Grid and Flexbox layouts, route-level code-splitting with `React.lazy`, and a custom HTML5 Canvas 2D charting engine built without third-party chart dependencies.

---

## Target Audience
1. **Primary Audience (End Users):**
   - Young working professionals, salaried employees, and university graduates managing multiple bank accounts, recurring monthly utility/entertainment subscriptions, credit card balances, and personal savings goals.
   - Individuals seeking a privacy-focused personal financial tracker that operates locally without mandatory third-party cloud aggregator lock-in or financial hallucinations.
2. **Secondary Audience (Academic & Technical Evaluators):**
   - Academic evaluators assessing adherence to the 21CSE354T Full Stack Web Development course syllabus across all 5 units: CSS Grid/Flexbox layouts and Canvas 2D graphics (Unit 1), React Router and state hooks (Unit 2), pure JDBC and ANSI SQL set operations (Unit 3), Spring Boot 3-tier REST architecture and DTO validation (Unit 4), and Spring Data JPA microservice decomposition (Unit 5).

---

## Technology Stack & Exact Versions

### Backend: Core Microservice (`finpulse-core-service`)
- **Runtime Environment:** Java SE 21 / 24 (Target: Java 21 via `<java.version>21</java.version>`)
- **Framework:** Spring Boot `3.3.5` (`spring-boot-starter-parent`)
- **Build Tool:** Apache Maven `3.9.11`
- **Data Access:** Spring Data JPA (`spring-boot-starter-data-jpa`) with Hibernate ORM `6.5.3.Final`
- **Validation:** Jakarta Bean Validation (`spring-boot-starter-validation`) via Hibernate Validator `8.0.1.Final`
- **Embedded Database:** H2 Database `2.3.232` (Runtime scope)
- **Production Database Driver:** MySQL Connector/J `8.3.0` (`com.mysql:mysql-connector-j`)
- **Testing Suite:** JUnit Jupiter 5 (`spring-boot-starter-test`), Mockito `5.11.0`, ByteBuddy `1.15.11`
- **Default Port:** `8081`

### Backend: Analytics Microservice (`finpulse-analytics-service`)
- **Runtime Environment:** Java SE 21 / 24 (Target: Java 21 via `<java.version>21</java.version>`)
- **Framework:** Spring Boot `3.3.5` (`spring-boot-starter-parent`)
- **Build Tool:** Apache Maven `3.9.11`
- **Data Access:** Pure JDBC via Spring JDBC DataSource (`spring-boot-starter-jdbc`), HikariCP connection pool, and ANSI SQL execution (`java.sql.Connection`, `java.sql.PreparedStatement`, `java.sql.Statement`, `java.sql.ResultSet`). **Zero JPA / Zero Hibernate**.
- **Inter-Service Communication:** Spring `RestTemplate` (in `CoreServiceClient.java`)
- **Embedded Database:** H2 Database `2.3.232`
- **Production Database Driver:** MySQL Connector/J `8.3.0`
- **Testing Suite:** JUnit 5, Mockito `5.11.0`, Spring Boot MockMvc
- **Default Port:** `8082`

### Frontend Application (`finpulse-frontend`)
- **Runtime & Package Manager:** Node.js `v22.18.0`, npm `11.19.1`
- **Build System:** Vite `5.4.11` (Vite Core `5.4.21` at build time)
- **UI Library:** React `18.3.1`, ReactDOM `18.3.1`
- **Client Routing:** React Router DOM `6.28.0` (`BrowserRouter`, `Routes`, `Route`, `NavLink`)
- **Icons:** Lucide React `0.460.0`
- **Compiler Plugin:** `@vitejs/plugin-react` `4.3.4`
- **Styling Architecture:** Pure CSS3 with CSS Variables / Design Tokens (`tokens.css`, `base.css`, `layout.css`, `components.css`). **Zero CSS frameworks (Tailwind, Bootstrap, or Material UI are NOT PRESENT)**.
- **Charts Engine:** Custom HTML5 Canvas 2D Charting Layer (`CanvasChart.jsx`, `LineAreaChart.jsx`, `BarChart.jsx`, `DonutChart.jsx`). **Zero third-party charting libraries (Chart.js, Recharts, or D3 are NOT PRESENT)**.
- **Default Dev Server Port:** `5173`

---

## Architectural Modules & Responsibilities

| Module Directory | Component Type | Primary Responsibilities | Network Port |
|:---|:---|:---|:---|
| `finpulse-core-service` | Spring Boot REST Microservice | Manages the source of truth for financial transactions, accounts, budgets, recurring commitments, and savings goals. Handles account balance updates, overdraft checks, atomic transfers, and JPA persistence. | `8081` |
| `finpulse-analytics-service` | Spring Boot JDBC Microservice | Read-heavy analytical processor. Executes raw ANSI SQL set operations (`UNION`, `INTERSECT`, `EXCEPT`), multi-table joins, rolling 3-month spending spikes, and streams unbuffered CSV exports. | `8082` |
| `finpulse-frontend` | Single Page Application (SPA) | Responsive dashboard interface with 8 lazy-loaded page views, dark/light theme switching, custom Canvas 2D charts, responsive data tables, and client validation. | `5173` |
| `database` | Relational Storage & Seed Scripts | DDL definitions (`schema.sql`) and relative-date seed dataset (`data.sql`) containing 6 calendar months of transactions compatible with both MySQL 8.0 and H2. | `3306` (MySQL) / File (H2) |

---

## Repository Size & Code Metrics
*(Measured excluding `target/`, `node_modules/`, `dist/`, and `.git/` directories)*

| Module | File Count | Lines of Code (LOC) | Primary Languages / File Types |
|:---|:---:|:---:|:---|
| `finpulse-core-service` | 73 | 3,663 | Java (Entities, DTOs, Controllers, Services, Repositories), YAML, XML |
| `finpulse-analytics-service` | 30 | 2,112 | Java (Controllers, Services, JDBC Repositories, SQL Catalogs), YAML, XML |
| `finpulse-frontend` | 84 | 13,074 | JavaScript (JSX), CSS, HTML, JSON |
| `database` | 4 | 1,693 | SQL (`schema.sql`, `data.sql`) |
| `docs` | 4 | 758 | Markdown (`REFACTOR_PLAN.md`, `DECISIONS.md`, `QA_CHECKLIST.md`, `SYLLABUS_MAPPING.md`) |
| **Total Project** | **195** | **21,290** | **Java, JavaScript, SQL, CSS, Markdown** |
