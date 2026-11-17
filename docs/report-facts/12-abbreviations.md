# 12. Abbreviations & Technical Acronyms Glossary — FinPulse

This glossary contains every technical acronym, abbreviation, and standard used across the FinPulse codebase, architectural designs, and project documentation:

| Acronym | Full Expansion | Contextual Usage in FinPulse |
|:---|:---|:---|
| **ACID** | Atomicity, Consistency, Isolation, Durability | Database transaction properties guaranteed by Spring `@Transactional` during atomic inter-account transfers. |
| **ADR** | Architectural Decision Record | Documentation format capturing architectural choices in `docs/DECISIONS.md`. |
| **ANSI** | American National Standards Institute | Standard SQL syntax (`UNION`, `INTERSECT`, `EXCEPT`) compatible with MySQL and H2. |
| **API** | Application Programming Interface | RESTful HTTP interfaces exposed by Core (:8081) and Analytics (:8082) microservices. |
| **CORS** | Cross-Origin Resource Sharing | Security protocol allowing frontend (:5173) to consume backend services (:8081, :8082). |
| **CRUD** | Create, Read, Update, Delete | Basic lifecycle operations implemented across accounts, transactions, budgets, recurring bills, and goals. |
| **CSV** | Comma-Separated Values | Export format for transaction records streamed via pure JDBC `ResultSet`. |
| **DDE** | Dynamic Data Exchange | Protocol targeted by CSV formula injection attacks; mitigated by tab prefixing. |
| **DDL** | Data Definition Language | SQL commands defining database tables, columns, constraints, and indexes (`schema.sql`). |
| **DML** | Data Manipulation Language | SQL commands inserting, updating, and deleting seed data (`data.sql`). |
| **DOM** | Document Object Model | Browser node tree manipulated by React and queried by Canvas hit-testing. |
| **DPI / HiDPI**| Dots Per Inch / High Dots Per Inch | Display density handled by `window.devicePixelRatio` canvas scaling. |
| **DTO** | Data Transfer Object | Java records with Jakarta validation separating domain entities from API contracts. |
| **ER / ERD** | Entity-Relationship / Entity-Relationship Diagram | Conceptual and logical modeling of the 6 core relational database tables. |
| **FK** | Foreign Key | Relational constraint linking child tables to parent primary keys with cascade deletes. |
| **FSWD** | Full Stack Web Development | Course subject and university capstone track (21CSE354T). |
| **H2** | H2 Database Engine | Embedded in-memory / file-backed relational database used in default development profile. |
| **HiDPI** | High Dots Per Inch | High-resolution screen rendering optimized in custom Canvas 2D charts. |
| **HTML / HTML5**| HyperText Markup Language (version 5) | Markup structure, semantic elements, and `<canvas>` graphics rendering context. |
| **HTTP** | Hypertext Transfer Protocol | Underlying transport protocol for all REST communication and CSV streaming. |
| **IDE** | Integrated Development Environment | Development environment (Antigravity, VS Code, IntelliJ IDEA). |
| **JDBC** | Java Database Connectivity | Low-level database API (`Connection`, `PreparedStatement`, `ResultSet`) used in Analytics Service. |
| **JPA** | Jakarta Persistence API (formerly Java Persistence API) | Object-relational mapping specification implemented by Hibernate in Core Service. |
| **JPQL** | Java Persistence Query Language | Object-oriented query language used in Spring Data repositories with fetch joins. |
| **JSON** | JavaScript Object Notation | Standard payload serialization format for all REST requests and responses. |
| **JWT** | JSON Web Token | Standard compact token format proposed for future stateless authentication. |
| **LOC** | Lines of Code | Quantitative measurement metric of source code size. |
| **MoSCoW** | Must have, Should have, Could have, Won't have | Agile user story prioritization framework used in product backlog. |
| **MVC** | Model-View-Controller | Architectural pattern underlying Spring Web and MockMvc integration tests. |
| **OCR** | Optical Character Recognition | Proposed future enhancement for scanning merchant receipts. |
| **OIDC** | OpenID Connect | Identity layer built on OAuth 2.0 proposed for user sign-in. |
| **ORM** | Object-Relational Mapping | Technology mapping database tables to Java classes (Hibernate ORM). |
| **PFM** | Personal Finance Management | Software domain category encompassing budgeting, ledger, and wealth tracking. |
| **PK** | Primary Key | Unique identifier column (`id BIGINT AUTO_INCREMENT`) on all relational tables. |
| **RBAC** | Role-Based Access Control | Authorization framework proposed with `USER`, `AUDITOR`, and `ADMIN` roles. |
| **REST** | Representational State Transfer | Architectural style for microservice APIs using standard HTTP verbs. |
| **RFC** | Request for Comments | Official internet standards (e.g., RFC 4180 defining CSV format). |
| **SDG** | Sustainable Development Goal | United Nations global goals; FinPulse targets SDG 8 (Target 8.10) and SDG 12 (Target 12.8). |
| **SPA** | Single Page Application | Web application architecture loading a single HTML shell and updating dynamically (React). |
| **SQL** | Structured Query Language | Domain-specific language for managing and querying relational databases. |
| **UI / UX** | User Interface / User Experience | Visual design, typography, spacing, and interaction ergonomics of the frontend. |
| **URI / URL** | Uniform Resource Identifier / Uniform Resource Locator | Endpoint address strings for HTTP requests and API routing. |
| **UUID** | Universally Unique Identifier | 128-bit label used for `transfer_group_id` linking paired transfer records. |
| **Vite** | Vite (French for "quick", pronounced /vit/) | Frontend build tool and local dev server replacing webpack. |
| **WCAG** | Web Content Accessibility Guidelines | Accessibility standard (WCAG 2.1 AA) achieved across contrast, focus, and screen readers. |
