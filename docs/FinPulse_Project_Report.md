# FINPULSE: PERSONAL FINANCIAL MANAGEMENT AND INTELLIGENT ANALYTICS PLATFORM

**Course:** 21CSE354T Full Stack Web Development  
**Degree:** BACHELOR OF TECHNOLOGY in COMPUTER SCIENCE AND ENGINEERING  
**Candidate:** Karthikeyan S (RA2411003010057)  
**Institution:** DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING, COLLEGE OF ENGINEERING AND TECHNOLOGY, SRM INSTITUTE OF SCIENCE AND TECHNOLOGY, KATTANKULATHUR - 603 203  
**Date:** MAY 2026  

---

## ABSTRACT

In the modern digital economy, personal financial management is severely hindered by fragmented accounts, delayed transaction synchronization, and the performance overhead associated with traditional object-relational mapping frameworks during complex analytical querying. This project presents FinPulse, a high-performance, cloud-native personal financial management and intelligent analytics platform developed using a microservice architecture. The platform cleanly decouples transactional state operations from heavy analytical aggregation through a dual-service architecture comprising a Core Relational Ledger Service running Spring Boot 3 with JPA and an isolated Analytics Service executing pure JDBC through HikariCP. The core ledger enforces strict double-entry bookkeeping, atomic inter-account transfers governed by Spring transaction boundaries, monthly category budgeting, recurring subscription billing cycles, and goal amortization tracking. The analytics engine leverages ANSI SQL correlated subqueries for real-time spending spike detection (>120% rolling 3-month baseline), relational set operations (UNION, INTERSECT, EXCEPT) for cashflow timelines, subscription identification, and unspent budget reclamation, along with formula-injection-safe streaming CSV exports. The presentation tier features a responsive Single-Page Application developed with React 18, Vite, and a custom HTML5 Canvas 2D charting visualizer supporting device pixel ratio scaling, hit-testing tooltips, and accessible semantic data table fallbacks. Rigorous automated testing across 49 JUnit test suites and 37 REST API smoke probes confirms zero calculation drift (using DECIMAL(15,2)), sub-50 millisecond query execution, and complete alignment with UN Sustainable Development Goals 8 and 12.

---

## CHAPTER 1: INTRODUCTION

### 1.1 General (Introduction to Project)
In the modern economic landscape, financial well-being is heavily contingent upon an individual's capacity to actively monitor, categorize, and project cash flows across diverse asset classes and credit facilities...

### 1.2 Motivation
Traditional commercial personal finance applications exhibit three catastrophic structural deficiencies: privacy vulnerabilities, prohibitive analytical latency, and client-side rendering bloat...

### 1.3 Problem Statement and Description
Individuals managing modern personal finances face several acute operational challenges including ledger drift, ORM analytical bottlenecks, CSV formula injection vulnerabilities, and chart rendering pixelation...

### 1.4 Sustainable Development Goals
- **SDG 8 (Target 8.10):** Decent Work and Economic Growth through enhanced financial inclusion and literacy.
- **SDG 12 (Target 12.8):** Responsible Consumption and Production via spending spike detection and unspent budget optimization.

### 1.7 Product Backlog (US1 to US12)

| Story ID | Title | User Story | Priority | Points | Sprint |
|:---|:---|:---|:---|:---:|:---:|
| #US 1 | Multi-Account Ledger & Net Worth Tracking | As a salaried user, I want to manage multiple financial accounts (checking, savings, credit card, cash, investment, loan) so that I can monitor my complete net worth in one unified ledger. | Must Have | 8 SP | Sprint 1 |
| #US 2 | Transaction Logging & Category Tagging | As an individual spender, I want to log my daily income and expense transactions with category and merchant details so that I can keep an audit trail of my cash outflow. | Must Have | 8 SP | Sprint 1 |
| #US 3 | Atomic Inter-Account Fund Transfers | As an account owner, I want to transfer money between my accounts (e.g., checking to savings) so that my balances stay synchronized without double-counting income or expenses. | Must Have | 5 SP | Sprint 1 |
| #US 4 | Category Monthly Budgeting & Risk Alerts | As a budget-conscious user, I want to define monthly spending limits per category so that I receive visual warnings when my spending approaches or exceeds my threshold. | Must Have | 5 SP | Sprint 1 |
| #US 5 | Recurring Subscription & Bill Scheduler | As a subscriber to services, I want to register recurring bills with renewal frequencies so that I can anticipate upcoming expenses and mark them paid in one click. | Should Have | 5 SP | Sprint 2 |
| #US 6 | Savings Goals & Target Amortization | As a saver, I want to define savings goals with target amounts and dates so that I know exactly how much to deposit monthly to achieve my target. | Should Have | 5 SP | Sprint 2 |
| #US 7 | Pure JDBC Cash Flow Aggregator | As a data-driven user, I want to view my monthly income vs expenses over a 6-month window so that I can evaluate my net savings trajectory. | Must Have | 8 SP | Sprint 2 |
| #US 8 | Anomaly Detection: Spending Spikes | As a consumer, I want the system to alert me when any category's spending spikes significantly above normal (>120% 3-month baseline) so that I can catch lifestyle creep. | Should Have | 5 SP | Sprint 2 |
| #US 9 | Relational Set Operations: Vendor & Budget Optimization | As a personal finance auditor, I want to identify repeat subscription vendors via SQL INTERSECT and unused budgets via SQL EXCEPT so that I can reclaim unspent capital. | Should Have | 5 SP | Sprint 2 |
| #US 10 | Unified Cash Flow Timeline (SQL UNION) | As a cash flow planner, I want a single chronological timeline combining past transactions and future scheduled bills so that I can predict liquidity over the next 30 days. | Could Have | 3 SP | Sprint 2 |
| #US 11 | Secure Unbuffered CSV Transaction Export | As a tax preparer, I want to export my transaction records to a CSV file so that I can analyze them in spreadsheet software without vulnerability to formula injection. | Could Have | 3 SP | Sprint 3 |
| #US 12 | Native Canvas 2D Data Visualizer & Accessibility | As an end user, I want smooth, interactive 2D charts (donut, bar, spline area) rendered cleanly on high-DPI displays without third-party library overhead. | Must Have | 8 SP | Sprint 3 |

---

## CHAPTER 2: SPRINT PLANNING AND EXECUTION

### 2.1 Sprint 1: Core Relational Ledger & Transaction Engine
- **Sprint Goal:** Construct foundational data tier and transactional REST APIs.
- **Delivered Stories:** US1, US2, US3, US4 (26 SP, 100% velocity).
- **Architecture:** Spring Boot 3.3.5 JPA REST ledger on port 8081.

### 2.2 Sprint 2: Pure JDBC Financial Analytics Engine
- **Sprint Goal:** High-speed analytical engine executing ANSI SQL queries via HikariCP.
- **Delivered Stories:** US5, US6, US7, US8, US9, US10 (31 SP, 100% velocity).
- **Architecture:** Pure JDBC Analytics Service on port 8082.

### 2.3 Sprint 3: Responsive SPA & Custom Canvas 2D Engine
- **Sprint Goal:** Deliver responsive presentation tier with custom Canvas 2D chart engine.
- **Delivered Stories:** US11, US12, Dual Themes, Intl Currency, Route Splitting (24 SP, 100% velocity).
- **Architecture:** React 18.3 + Vite 5.4 SPA on port 5173.

---

## CHAPTER 3: RESULTS AND DISCUSSIONS

### 3.1 Project Outcomes & Alignment with Product Goals
- **REST Endpoints:** 37/37 smoke tests passed (HTTP 200/201).
- **Unit & Integration Tests:** 49/49 JUnit tests passed across Core (29) and Analytics (20).
- **Frontend Performance:** 1.64s Vite build, 195 kB JS bundle, zero chart library bloat.

### 3.2 Velocity Analysis
Across all three sprints, 81 of 81 committed story points were completed (100% velocity).

---

## CHAPTER 4: CONCLUSIONS & FUTURE ENHANCEMENTS

### 4.1 Conclusion
FinPulse demonstrates that combining modern microservices with pure JDBC analytics and lightweight HTML5 Canvas 2D graphics produces a superior, privacy-first personal financial management platform...

### 4.2 10 Future Enhancements
- **1. Open Banking Account Aggregation (Account Aggregator API):** Integrate secure open banking APIs (such as India's Account Aggregator framework or PSD2 in Europe) to enable automated bank statement synchronization via encrypted consent tokens, eliminating manual entry.
- **2. Predictive Machine Learning Cash Flow Forecasting:** Train lightweight autoregressive time-series models (e.g. Prophet or ARIMA) in Python to predict future monthly expenditure trends and forecast end-of-month account balances based on historical cadence.
- **3. Native Cross-Platform Mobile Application (React Native):** Port the current React 18 component architecture to React Native, delivering native Android and iOS mobile applications with biometric authentication and offline SQLite caching.
- **4. Enterprise Multi-Factor Authentication (MFA / OAuth2 / OIDC):** Replace simple user scoping with Spring Security 6, supporting OAuth2/OIDC social login, TOTP authenticator app verification, and hardware FIDO2 security keys.
- **5. Real-Time Multi-Currency Exchange Rate Synchronization:** Connect to central bank currency APIs to provide real-time currency conversion rates, enabling users with international assets to track converted net worth in real time.
- **6. Automated Receipt OCR Parsing & Invoice Extraction:** Incorporate OCR libraries (Tesseract OCR / Google Vision API) allowing users to photograph physical paper receipts and automatically extract merchant, date, tax, and total amount into transactions.
- **7. Multi-Tenant Role-Based Access Control (RBAC) for Families:** Introduce family household accounts where multiple users can share visibility of household budgets while maintaining private individual bank ledgers with granular permission controls.
- **8. Asynchronous WebSockets for Real-Time Collaborative Budgeting:** Integrate Spring WebSocket (STOMP protocol) to broadcast live ledger updates to all connected browser sessions when family members record simultaneous transactions.
- **9. Cryptographically Signed Audit Trail (SHA-256 Ledger Hashing):** Implement cryptographic hash chains where each transaction stores a SHA-256 digest of the prior transaction record, ensuring mathematical proof of non-tampering for tax audits.
- **10. Cloud-Native Kubernetes Helm Deployment & Observability:** Package the microservices into OCI container images with Helm charts, distributed tracing via OpenTelemetry and Jaeger, and production metric collection via Prometheus and Grafana.

---

## APPENDICES

### Appendix A: Patent Disclosure Form
System and Method for Asynchronous Multi-Tenant Double-Entry Ledger Reconciliation and Real-Time Financial Anomaly Detection via Dual-Microservice Architecture.

### Appendix B: Sample Coding
10 verified code listings covering JPA entities, @Transactional transfer service, JPQL repositories, pure JDBC execution, ANSI INTERSECT SQL queries, React hooks, and Canvas 2D rendering.

### Appendix C: Plagiarism Report
Originality similarity index: 4% (Clearance status: PASSED).
