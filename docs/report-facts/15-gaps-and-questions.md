# 15. Report Template Gaps, Missing Administrative Data & Inconsistencies — FinPulse

## 1. Information NOT PRESENT in Codebase (Required by University Report Template)

The university report template typically requires institutional, administrative, and process artifacts that do not exist in the code repository. The following items must be supplied by the student / report author:

| Required Report Section | Status in Codebase | Guidance / What the Student Must Fill In |
|:---|:---:|:---|
| **Author Details** | **NOT PRESENT** | Student Full Name, University Register / Roll Number, Degree Program (B.Tech CSE), Section / Batch. |
| **Faculty Supervisor / Guide** | **NOT PRESENT** | Project Guide Name, Designation (Assistant Professor / Associate Professor), Department of Computer Science & Engineering, Institution Name. |
| **Academic Term & Dates** | **NOT PRESENT** | Course Code (`21CSE354T`), Semester, Academic Year (e.g., 2026–2027), Submission Date. |
| **Agile Project Management Board** | **NOT PRESENT** | Screenshots of MS Planner, Jira, or Trello sprint boards, user story cards, and task assignment boards. *(The project tracked engineering progress via `docs/REFACTOR_PLAN.md` and `docs/DECISIONS.md`)*. |
| **Formal Daily Scrum Records** | **NOT PRESENT** | Formal meeting minutes, voice logs, or transcripts of daily 15-minute stand-ups. *(Evidence of progress is provided via timestamped file logs in `09-development-timeline.md`)*. |
| **Automated Burndown / Velocity Charts** | **NOT PRESENT** | Agile velocity charts and story point burndown charts from Jira/Planner. |
| **Plagiarism Check Certificate** | **NOT PRESENT** | Turnitin or Urkund originality report percentage and signed declaration certificate. |
| **Patent / Intellectual Property Disclosures** | **NOT PRESENT** | Institutional IPR disclosure forms or copyright declaration pages. |

---

## 2. Technical Inconsistencies Reconciled Between Early Docs and Final Code

During the modernization refactor from the initial baseline (2026-11-02) to the final production state (2026-11-12), several architectural discrepancies and bugs were identified and reconciled:

1. **Static Currency Conversion Rates:**
   - *Early State:* Prototype code contained hardcoded, static currency conversion multiplier dictionaries (e.g., `USD = 83.2 INR`).
   - *Final Code:* Completely removed fake exchange rates. Replaced with native browser `Intl.NumberFormat` localized formatting via `CurrencyContext.jsx`. The application formats numbers based on the user's selected preference without fabricating exchange rate conversions.
2. **Mock Investment Feeds & Dividends:**
   - *Early State:* Legacy plans proposed mock stock tickers and simulated dividend yield feeds.
   - *Final Code:* Eliminated financial hallucinations. `INVESTMENT` accounts are treated as asset balance ledgers with explicit "Update Balance" actions that record genuine balance adjustment transactions.
3. **Non-Existent Merchant Column in SQL INTERSECT:**
   - *Early State:* Legacy SQL draft attempted an `INTERSECT` query filtering on `t.merchant`, but the original database schema lacked a `merchant` column.
   - *Final Code:* Schema updated with `merchant VARCHAR(100) NULL` and indexed with `idx_transactions_merchant`. `SqlQueryCatalog.java` successfully executes `RECURRING_MERCHANTS_INTERSECT_QUERY`.
4. **Subquery Logic ("80% of Average"):**
   - *Early State:* Preliminary draft attempted an anomaly query where current spend was $< 80\%$ of average spend.
   - *Final Code:* Corrected to a true anomaly surge detector where current spend $> 120\%$ of the rolling average over the prior 3 calendar months with `HAVING SUM(amount) > 0` to prevent division-by-zero errors (`SPENDING_SPIKES_QUERY`).
5. **Academic "Unit N" Wording in UI:**
   - *Early State:* Component headers originally contained academic course tags (e.g., "Unit 1: Canvas Charts", "Unit 3: SQL Set Operations", "Unit 4: Spring Data").
   - *Final Code:* Completely purged all academic labels from user-facing components, replacing them with professional fintech terminology (e.g., "Cash Flow Analytics", "Spending Spikes", "Recurring Vendor Audit"). Course mapping is preserved strictly in [`docs/SYLLABUS_MAPPING.md`](file:///C:/Users/karth/OneDrive/Desktop/FSWD/FinPulse/docs/SYLLABUS_MAPPING.md).
6. **Git Repository Boundaries:**
   - *Observation:* The project directory `C:\Users\karth\OneDrive\Desktop\FSWD\FinPulse` does not contain its own `.git` directory; it is untracked inside a parent home folder repository. Version timeline is accurately documented as **INFERRED** based on file modification timestamps and documented chunk milestones.
