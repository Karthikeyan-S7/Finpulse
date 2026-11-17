# report_data.py - Structured Data & Text for FinPulse University Project Report
# Student: Karthikeyan S (RA2411003010057) - SRM Institute of Science and Technology

STUDENT_NAME = "Karthikeyan S"
REGISTER_NO = "RA2411003010057"
COURSE_TITLE = "21CSE354T Full Stack Web Development"
DEGREE_TITLE = "BACHELOR OF TECHNOLOGY"
BRANCH_TITLE = "COMPUTER SCIENCE AND ENGINEERING"
DEPARTMENT = "DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING"
COLLEGE = "COLLEGE OF ENGINEERING AND TECHNOLOGY"
INSTITUTE = "SRM INSTITUTE OF SCIENCE AND TECHNOLOGY"
LOCATION = "KATTANKULATHUR - 603 203"
REPORT_DATE = "MAY 2026"
PROJECT_TITLE = "FINPULSE: PERSONAL FINANCIAL MANAGEMENT AND INTELLIGENT ANALYTICS PLATFORM"

ABSTRACT_TEXT = (
    "In the modern digital economy, personal financial management is severely hindered by fragmented accounts, "
    "delayed transaction synchronization, and the performance overhead associated with traditional object-relational "
    "mapping frameworks during complex analytical querying. This project presents FinPulse, a high-performance, "
    "cloud-native personal financial management and intelligent analytics platform developed using a microservice "
    "architecture. The platform cleanly decouples transactional state operations from heavy analytical aggregation "
    "through a dual-service architecture comprising a Core Relational Ledger Service running Spring Boot 3 with JPA "
    "and an isolated Analytics Service executing pure JDBC through HikariCP. The core ledger enforces strict double-entry "
    "bookkeeping, atomic inter-account transfers governed by Spring transaction boundaries, monthly category budgeting, "
    "recurring subscription billing cycles, and goal amortization tracking. The analytics engine leverages ANSI SQL "
    "correlated subqueries for real-time spending spike detection (>120% rolling 3-month baseline), relational set "
    "operations (UNION, INTERSECT, EXCEPT) for cashflow timelines, subscription identification, and unspent budget "
    "reclamation, along with formula-injection-safe streaming CSV exports. The presentation tier features a responsive "
    "Single-Page Application developed with React 18, Vite, and a custom HTML5 Canvas 2D charting visualizer supporting "
    "device pixel ratio scaling, hit-testing tooltips, and accessible semantic data table fallbacks. Rigorous automated "
    "testing across 49 JUnit test suites and 37 REST API smoke probes confirms zero calculation drift (using DECIMAL(15,2)), "
    "sub-50 millisecond query execution, and complete alignment with UN Sustainable Development Goals 8 and 12."
)

ABBREVIATIONS = [
    ("ACID", "Atomicity, Consistency, Isolation, Durability"),
    ("ADR", "Architectural Decision Record"),
    ("ANSI", "American National Standards Institute"),
    ("API", "Application Programming Interface"),
    ("CORS", "Cross-Origin Resource Sharing"),
    ("CSV", "Comma-Separated Values"),
    ("DDL", "Data Definition Language"),
    ("DOM", "Document Object Model"),
    ("DPR", "Device Pixel Ratio (window.devicePixelRatio)"),
    ("DTO", "Data Transfer Object"),
    ("ERD", "Entity-Relationship Diagram"),
    ("FIFO", "First-In, First-Out"),
    ("H2", "H2 In-Memory Relational Database Engine"),
    ("HiDPI", "High Dots Per Inch (Retina Display Resolution)"),
    ("HTTP", "Hypertext Transfer Protocol"),
    ("IEEE-754", "Standard for Floating-Point Arithmetic"),
    ("JPA", "Jakarta Persistence API"),
    ("JPQL", "Java Persistence Query Language"),
    ("JSON", "JavaScript Object Notation"),
    ("JWT", "JSON Web Token"),
    ("LOC", "Lines of Code"),
    ("MoSCoW", "Must have, Should have, Could have, Won't have (Prioritization)"),
    ("MVC", "Model-View-Controller"),
    ("ORM", "Object-Relational Mapping"),
    ("REST", "Representational State Transfer"),
    ("RFC", "Request for Comments (Internet Engineering Task Force)"),
    ("SDG", "Sustainable Development Goals (United Nations)"),
    ("SPA", "Single-Page Application"),
    ("SQL", "Structured Query Language"),
    ("UI / UX", "User Interface / User Experience"),
    ("URI", "Uniform Resource Identifier"),
    ("UUID", "Universally Unique Identifier"),
    ("Vite", "Next Generation Frontend Tooling Engine"),
    ("WCAG", "Web Content Accessibility Guidelines (W3C)")
]

TABLE_OF_CONTENTS = [
    ("BONAFIDE CERTIFICATE", "ii"),
    ("OWN WORK DECLARATION FORM", "iii"),
    ("ABSTRACT", "iv"),
    ("TABLE OF CONTENTS", "v"),
    ("LIST OF FIGURES", "vii"),
    ("LIST OF TABLES", "ix"),
    ("ABBREVIATIONS", "x"),
    ("CHAPTER 1: INTRODUCTION", "1"),
    ("    1.1 General (Introduction to Project)", "1"),
    ("    1.2 Motivation", "3"),
    ("    1.3 Problem Statement and Description", "5"),
    ("    1.4 Sustainable Development Goals of the Project", "7"),
    ("    1.5 Product Vision Statement", "9"),
    ("        1.5.1 Audience", "9"),
    ("        1.5.2 Needs", "10"),
    ("        1.5.3 Products", "11"),
    ("        1.5.4 Values and Differentiators", "12"),
    ("    1.6 Product Goal", "14"),
    ("    1.7 Product Backlog (Key User Stories with Desired Outcomes)", "15"),
    ("    1.8 Product Release Plan", "21"),
    ("CHAPTER 2: SPRINT PLANNING AND EXECUTION", "23"),
    ("    2.1 Sprint 1: Core Relational Ledger & Transaction Engine", "23"),
    ("        2.1.1 Sprint Goal with User Stories of Sprint 1", "23"),
    ("        2.1.2 Functional Document", "25"),
    ("        2.1.3 Architecture Document", "31"),
    ("        2.1.4 UI Design", "37"),
    ("        2.1.5 Functional Test Cases", "40"),
    ("        2.1.6 Daily Call Progress", "43"),
    ("        2.1.7 Committed vs Completed User Stories", "45"),
    ("        2.1.8 Sprint Retrospective", "47"),
    ("    2.2 Sprint 2: Pure JDBC Financial Analytics Engine", "49"),
    ("        2.2.1 Sprint Goal with User Stories of Sprint 2", "49"),
    ("        2.2.2 Functional Document", "51"),
    ("        2.2.3 Architecture Document", "57"),
    ("        2.2.4 UI Design", "63"),
    ("        2.2.5 Functional Test Cases", "66"),
    ("        2.2.6 Daily Call Progress", "69"),
    ("        2.2.7 Committed vs Completed User Stories", "71"),
    ("        2.2.8 Sprint Retrospective", "73"),
    ("    2.3 Sprint 3: Responsive SPA & Custom Canvas 2D Engine", "75"),
    ("        2.3.1 Sprint Goal with User Stories of Sprint 3", "75"),
    ("        2.3.2 Functional Document", "77"),
    ("        2.3.3 Architecture Document", "83"),
    ("        2.3.4 UI Design", "89"),
    ("        2.3.5 Functional Test Cases", "93"),
    ("        2.3.6 Daily Call Progress", "96"),
    ("        2.3.7 Committed vs Completed User Stories", "98"),
    ("        2.3.8 Sprint Retrospective", "100"),
    ("CHAPTER 3: RESULTS AND DISCUSSIONS", "102"),
    ("    3.1 Project Outcomes & Alignment with Product Goals", "102"),
    ("    3.2 Committed vs Completed User Stories & Velocity Analysis", "107"),
    ("CHAPTER 4: CONCLUSIONS & FUTURE ENHANCEMENTS", "110"),
    ("    4.1 Conclusion", "110"),
    ("    4.2 Future Enhancements (10 Technical Roadmap Initiatives)", "112"),
    ("APPENDIX", "116"),
    ("    A. PATENT DISCLOSURE FORM", "116"),
    ("    B. SAMPLE CODING (10 VERBATIM CODE EXCERPTS)", "120"),
    ("    C. PLAGIARISM REPORT", "136")
]

LIST_OF_FIGURES = [
    ("Figure 1.1", "FinPulse Agile Product Backlog Board (MS Planner / Kanban)", "17"),
    ("Figure 1.2", "FinPulse Product Release Roadmap Across 3 Sprints", "22"),
    ("Figure 2.1", "Sprint 1 Architecture: Core Relational Ledger Service (:8081)", "32"),
    ("Figure 2.2", "Sprint 1 Relational Ledger: Entity-Relationship (ER) Schema", "34"),
    ("Figure 2.3", "Sprint 1 UI Layout: Multi-Account Management & Ledger Toolbar", "38"),
    ("Figure 2.4", "Sprint 1 Daily Standup Call Progress & Story Point Burndown", "44"),
    ("Figure 2.5", "Sprint 1 Committed vs Completed User Stories Bar Graph", "46"),
    ("Figure 2.6", "Sprint 1 Retrospective Canvas (4Ls Framework)", "48"),
    ("Figure 2.7", "Sprint 2 Architecture: Pure JDBC Financial Analytics Microservice (:8082)", "58"),
    ("Figure 2.8", "Sprint 2 UI Layout: Financial Reports & Insight Analysis (/reports)", "64"),
    ("Figure 2.9", "Sprint 2 Daily Standup Call Progress & Story Point Burndown", "70"),
    ("Figure 2.10", "Sprint 2 Committed vs Completed User Stories Bar Graph", "72"),
    ("Figure 2.11", "Sprint 2 Retrospective Canvas (4Ls Framework)", "74"),
    ("Figure 2.12", "Sprint 3 Full Stack System Architecture: SPA, Canvas 2D & Microservices", "84"),
    ("Figure 2.13", "Sprint 3 React Component Hierarchy & State Propagation", "90"),
    ("Figure 2.14", "Sprint 3 Daily Standup Call Progress & Story Point Burndown", "97"),
    ("Figure 2.15", "Sprint 3 Committed vs Completed User Stories Bar Graph", "99"),
    ("Figure 2.16", "Sprint 3 Retrospective Canvas (4Ls Framework)", "101"),
    ("Figure 3.1", "Overall FinPulse Scrum Velocity: Committed vs Completed Story Points", "108")
]

LIST_OF_TABLES = [
    ("Table 1.1", "Detailed Product Backlog User Stories (US1–US12) with MoSCoW Prioritization", "18"),
    ("Table 1.2", "Three-Sprint Product Release Roadmap and Deliverable Schedule", "21"),
    ("Table 2.1", "Sprint 1 User Stories: Core Relational Ledger & Transaction Engine", "24"),
    ("Table 2.2", "Sprint 1 Role-Based Access Control and Tenant Authorization Matrix", "30"),
    ("Table 2.3", "Sprint 1 Functional Test Execution Matrix (TC-S1-01 to TC-S1-08)", "41"),
    ("Table 2.4", "Sprint 2 User Stories: Pure JDBC Financial Analytics Engine", "50"),
    ("Table 2.5", "Sprint 2 REST API Endpoint Contract and Analytical Query Specification", "60"),
    ("Table 2.6", "Sprint 2 Functional Test Execution Matrix (TC-S2-01 to TC-S2-08)", "67"),
    ("Table 2.7", "Sprint 3 User Stories: Responsive SPA & Custom Canvas 2D Engine", "76"),
    ("Table 2.8", "Sprint 3 Design System Tokens, CSS Variables, and Breakpoints", "91"),
    ("Table 2.9", "Sprint 3 Functional Test Execution Matrix (TC-S3-01 to TC-S3-10)", "94"),
    ("Table 3.1", "Quantitative Project Deliverable Summary and Performance Benchmark Audit", "104"),
    ("Table 3.2", "Overall Scrum Execution Metrics and Story Point Burn-Down Audit", "107")
]

# User Stories Data
USER_STORIES_ALL = [
    ("#US 1", "Multi-Account Ledger & Net Worth Tracking", "As a salaried user, I want to manage multiple financial accounts (checking, savings, credit card, cash, investment, loan) so that I can monitor my complete net worth in one unified ledger.", "Must Have", "8 SP", "Sprint 1"),
    ("#US 2", "Transaction Logging & Category Tagging", "As an individual spender, I want to log my daily income and expense transactions with category and merchant details so that I can keep an audit trail of my cash outflow.", "Must Have", "8 SP", "Sprint 1"),
    ("#US 3", "Atomic Inter-Account Fund Transfers", "As an account owner, I want to transfer money between my accounts (e.g., checking to savings) so that my balances stay synchronized without double-counting income or expenses.", "Must Have", "5 SP", "Sprint 1"),
    ("#US 4", "Category Monthly Budgeting & Risk Alerts", "As a budget-conscious user, I want to define monthly spending limits per category so that I receive visual warnings when my spending approaches or exceeds my threshold.", "Must Have", "5 SP", "Sprint 1"),
    ("#US 5", "Recurring Subscription & Bill Scheduler", "As a subscriber to services, I want to register recurring bills with renewal frequencies so that I can anticipate upcoming expenses and mark them paid in one click.", "Should Have", "5 SP", "Sprint 2"),
    ("#US 6", "Savings Goals & Target Amortization", "As a saver, I want to define savings goals with target amounts and dates so that I know exactly how much to deposit monthly to achieve my target.", "Should Have", "5 SP", "Sprint 2"),
    ("#US 7", "Pure JDBC Cash Flow Aggregator", "As a data-driven user, I want to view my monthly income vs expenses over a 6-month window so that I can evaluate my net savings trajectory.", "Must Have", "8 SP", "Sprint 2"),
    ("#US 8", "Anomaly Detection: Spending Spikes", "As a consumer, I want the system to alert me when any category's spending spikes significantly above normal (>120% 3-month baseline) so that I can catch lifestyle creep.", "Should Have", "5 SP", "Sprint 2"),
    ("#US 9", "Relational Set Operations: Vendor & Budget Optimization", "As a personal finance auditor, I want to identify repeat subscription vendors via SQL INTERSECT and unused budgets via SQL EXCEPT so that I can reclaim unspent capital.", "Should Have", "5 SP", "Sprint 2"),
    ("#US 10", "Unified Cash Flow Timeline (SQL UNION)", "As a cash flow planner, I want a single chronological timeline combining past transactions and future scheduled bills so that I can predict liquidity over the next 30 days.", "Could Have", "3 SP", "Sprint 2"),
    ("#US 11", "Secure Unbuffered CSV Transaction Export", "As a tax preparer, I want to export my transaction records to a CSV file so that I can analyze them in spreadsheet software without vulnerability to formula injection.", "Could Have", "3 SP", "Sprint 3"),
    ("#US 12", "Native Canvas 2D Data Visualizer & Accessibility", "As an end user, I want smooth, interactive 2D charts (donut, bar, spline area) rendered cleanly on high-DPI displays without third-party library overhead.", "Must Have", "8 SP", "Sprint 3")
]

TEST_CASES_S1 = [
    ("TC-S1-01", "Create Checking Account", "POST /api/accounts with name='HDFC Salary', type='CHECKING', balance=50000.00", "Account created, HTTP 201, balance=50000.00, is_archived=false", "Account created with ID 1, HTTP 201", "PASS"),
    ("TC-S1-02", "Negative Balance on Credit Card", "POST /api/accounts with type='CREDIT_CARD', balance=-15000.00", "Account created, HTTP 201, balance=-15000.00 (Liability convention)", "Liability recorded, HTTP 201", "PASS"),
    ("TC-S1-03", "Record Expense Transaction", "POST /api/transactions with amount=2500.00, type='EXPENSE', category='Groceries'", "Transaction stored, account balance debited by 2500.00", "Balance updated, HTTP 201", "PASS"),
    ("TC-S1-04", "Atomic Double-Entry Transfer", "POST /api/transfers with fromAccountId=1, toAccountId=2, amount=10000.00", "2 paired transactions (EXPENSE & INCOME) created with shared UUID transferGroupId; balances updated atomically", "Atomic transfer committed, HTTP 201", "PASS"),
    ("TC-S1-05", "Transfer Overdraft Rejection", "POST /api/transfers with amount=9999999.00 exceeding account balance", "HTTP 400 Bad Request: 'Insufficient funds for transfer'; transaction rolls back", "Rollback confirmed, HTTP 400", "PASS"),
    ("TC-S1-06", "Category Budget Exceed Warning", "Spend ₹12,000 on 'Dining' with ₹10,000 budget limit", "Budget percentUsed=120.0%, status='OVER', highlighted in red with warning text", "Status OVER returned, 120%", "PASS"),
    ("TC-S1-07", "Monthly Budget Copy", "POST /api/budgets/copy?sourceMonth=2026-10&targetMonth=2026-11", "All active budget limits from October replicated to November in single batch", "Budgets copied, HTTP 200", "PASS"),
    ("TC-S1-08", "Account Archive Protection", "DELETE /api/accounts/1 on account with active transaction history", "HTTP 409 Conflict: Cannot delete active ledger; recommends archive toggle instead", "Archive confirmation enforced", "PASS")
]

TEST_CASES_S2 = [
    ("TC-S2-01", "6-Month Cashflow Aggregation", "GET /api/analytics/cashflow?userId=1&months=6", "Returns monthly array of income, expenses, net savings via pure JDBC GROUP BY", "Array of 6 monthly summaries returned", "PASS"),
    ("TC-S2-02", "Spending Spike Subquery", "GET /api/analytics/spikes?userId=1 with current dining spend > 120% average", "Returns Dining category with current spend, 3-month baseline, and percentage surge", "Spike detected: Dining 142% above baseline", "PASS"),
    ("TC-S2-03", "SQL UNION Cashflow Timeline", "GET /api/analytics/timeline?userId=1", "Combines past 30 days ACTUAL transactions and next 30 days SCHEDULED bills in chronological order", "Unified stream returned with status flags", "PASS"),
    ("TC-S2-04", "SQL INTERSECT Recurring Vendors", "GET /api/analytics/recurring-merchants?userId=1", "Isolates merchants billed in both current and prior months (e.g. Netflix, Spotify)", "Returned 4 subscription merchants", "PASS"),
    ("TC-S2-05", "SQL EXCEPT Unused Budgets", "GET /api/analytics/unused-budgets?userId=1", "Subtracts active spending categories from budgeted categories to isolate zero-spend budgets", "Returned Travel and Books (unspent)", "PASS"),
    ("TC-S2-06", "Streaming CSV Formula Injection Guard", "GET /api/analytics/export with merchant '=cmd|\\' /C calc\\'!A0'", "Escapes formula trigger character with leading \\t; downloads valid RFC 4180 CSV", "Sanitized with leading tab in CSV stream", "PASS"),
    ("TC-S2-07", "Recurring Payment Advancement", "POST /api/recurring-payments/1/pay on MONTHLY bill", "Creates expense transaction and automatically advances next_due_date by exactly 1 month", "Logged transaction and advanced due date", "PASS"),
    ("TC-S2-08", "Savings Goal Amortization", "GET /api/goals/1 with target=100000, current=40000, 6 months remaining", "Computes remaining=60000, percentComplete=40%, requiredMonthly=10000.00", "Calculated required monthly contribution", "PASS")
]

TEST_CASES_S3 = [
    ("TC-S3-01", "Dual Theme Switching", "Toggle Theme Switcher between Light and Dark mode", "CSS variables update instantly on documentElement without page reload or state loss", "Instant CSS property transition observed", "PASS"),
    ("TC-S3-02", "Currency Context Formatting", "Switch currency from INR (₹) to USD ($) in Settings", "All 8 pages instantly reformat monetary values via browser Intl.NumberFormat", "Reformatted all values with $ symbol", "PASS"),
    ("TC-S3-03", "Canvas 2D Donut Chart HiDPI", "Render DonutChart on Retina display (devicePixelRatio=2)", "Canvas buffer scales by 2x; rendered crisp without pixelation or blurriness", "Verified crisp rendering on high-DPI", "PASS"),
    ("TC-S3-04", "Canvas Tooltip Hit-Testing", "Hover cursor over DonutChart arc sector at angle theta", "Triggers arc ray-distance calculation and displays formatted HTML tooltip", "Tooltip displayed with exact slice value", "PASS"),
    ("TC-S3-05", "Accessible Screen Reader Fallback", "Inspect CanvasChart DOM node in developer tools", "Contains visually-hidden semantic <table> with complete tabular data and role='img'", "Accessible fallback table verified", "PASS"),
    ("TC-S3-06", "Responsive Drawer Navigation", "Resize viewport to 390px (mobile width)", "Collapsible sidebar converts into slide-out drawer accessible via hamburger menu", "Mobile drawer navigation active", "PASS"),
    ("TC-S3-07", "Route-Level Code Splitting", "Inspect network tab during initial navigation to /reports", "React.lazy dynamically downloads separate chunk (~25 kB) with Suspense fallback", "Separate chunk loaded dynamically", "PASS"),
    ("TC-S3-08", "Client Error Boundary Recovery", "Simulate unhandled JavaScript runtime error in child component", "Catches error, renders friendly ErrorBoundary card, and provides 'Reload' and 'Dashboard' buttons", "Graceful recovery card rendered", "PASS"),
    ("TC-S3-09", "Debounced Ledger Search", "Type rapid search query 'supermarket' in Transactions toolbar", "Input debounces API filter execution by 300ms, eliminating redundant DOM re-renders", "Single filtered query executed", "PASS"),
    ("TC-S3-10", "End-to-End Smoke Test Suite", "Execute scripts/smoke-test.ps1 against running services", "All 37 REST API endpoints across Core and Analytics return HTTP 200/201 (0 failures)", "37 of 37 endpoints PASSED", "PASS")
]

print("Structured report data loaded successfully.")
