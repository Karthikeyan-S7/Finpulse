import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

OUTPUT_DIR = r"C:/Users/karth/OneDrive/Desktop/FSWD/FinPulse/docs/report_figures"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Set common font and style
plt.rcParams['font.sans-serif'] = 'Arial'
plt.rcParams['axes.edgecolor'] = '#cbd5e1'
plt.rcParams['axes.linewidth'] = 1.0

# -------------------------------------------------------------
# 1. Figure 1.1: MS Planner Board / Story Map
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 5), dpi=200)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

# Header
ax.add_patch(patches.Rectangle((0, 88), 100, 12, facecolor='#1e293b'))
ax.text(50, 94, "FinPulse — Agile Product Backlog Board (MS Planner / Kanban)", 
        color='white', fontsize=12, fontweight='bold', ha='center', va='center')

columns = [
    ("SPRINT 1: CORE LEDGER", 2, 30, '#eff6ff', '#3b82f6', [
        ("[US1] Multi-Account Ledger", "Must Have | 8 SP | Closed"),
        ("[US2] Transaction Logging", "Must Have | 8 SP | Closed"),
        ("[US3] Atomic Inter-Account Transfer", "Must Have | 5 SP | Closed"),
        ("[US4] Category Monthly Budgeting", "Must Have | 5 SP | Closed")
    ]),
    ("SPRINT 2: JDBC ANALYTICS", 35, 30, '#f0fdf4', '#10b981', [
        ("[US5] Recurring Subscription Scheduler", "Should Have | 5 SP | Closed"),
        ("[US6] Savings Goals Amortization", "Should Have | 5 SP | Closed"),
        ("[US7] Pure JDBC Cashflow Aggregator", "Must Have | 8 SP | Closed"),
        ("[US8] Anomaly Spike Detection", "Should Have | 5 SP | Closed"),
        ("[US9] Set Operations (INTERSECT/EXCEPT)", "Should Have | 5 SP | Closed"),
        ("[US10] Cashflow Timeline (UNION)", "Could Have | 3 SP | Closed")
    ]),
    ("SPRINT 3: SPA & CANVAS 2D", 68, 30, '#faf5ff', '#8b5cf6', [
        ("[US11] Unbuffered CSV Export", "Could Have | 3 SP | Closed"),
        ("[US12] Native Canvas 2D Visualizer", "Must Have | 8 SP | Closed"),
        ("Dual Theme (Light/Dark/System)", "Must Have | 5 SP | Closed"),
        ("Currency & Locale Context", "Must Have | 3 SP | Closed"),
        ("Route Splitting & Error Boundary", "Should Have | 3 SP | Closed")
    ])
]

for title, x, w, bg_col, border_col, cards in columns:
    ax.add_patch(patches.FancyBboxPatch((x, 5), w, 80, boxstyle="round,pad=1", facecolor=bg_col, edgecolor=border_col, linewidth=1.5))
    ax.add_patch(patches.Rectangle((x+1, 77), w-2, 6, facecolor=border_col))
    ax.text(x + w/2, 80, title, color='white', fontsize=8.5, fontweight='bold', ha='center', va='center')
    
    y = 70
    for card_title, card_sub in cards:
        ax.add_patch(patches.FancyBboxPatch((x+2, y-8), w-4, 10, boxstyle="round,pad=0.5", facecolor='white', edgecolor='#e2e8f0', linewidth=1))
        ax.text(x+3.5, y-1, card_title, fontsize=7.5, fontweight='bold', color='#1e293b')
        ax.text(x+3.5, y-5.5, card_sub, fontsize=6.5, color='#64748b')
        # status pill
        ax.add_patch(patches.FancyBboxPatch((x+w-9, y-7), 5.5, 3.5, boxstyle="round,pad=0.2", facecolor='#dcfce7', edgecolor='#86efac', linewidth=0.5))
        ax.text(x+w-6.25, y-5.25, "DONE", fontsize=5.5, fontweight='bold', color='#15803d', ha='center', va='center')
        y -= 11.5

plt.tight_layout()
fig.savefig(os.path.join(OUTPUT_DIR, "fig1_1_planner_board.png"), bbox_inches='tight')
plt.close(fig)

# -------------------------------------------------------------
# 2. Figure 1.2: Product Release Plan
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 4), dpi=200)
ax.set_xlim(0, 100)
ax.set_ylim(0, 45)
ax.axis('off')

ax.text(50, 40, "FinPulse — Product Release Roadmap Across 3 Sprints", fontsize=11, fontweight='bold', ha='center', color='#0f172a')

releases = [
    ("Sprint 1 (Release 1.0)", "Foundation: Core Relational Ledger", 5, 25, 26, '#3b82f6', [
        "Account & Transaction CRUD", "ACID Double-Entry Transfers", "Monthly Category Budgets", "H2 / MySQL 8.0 DDL"
    ]),
    ("Sprint 2 (Release 2.0)", "Intelligence: Pure JDBC Analytics", 37, 25, 26, '#10b981', [
        "High-Speed JDBC Aggregations", "Spending Spikes (>120% Subquery)", "Set Queries (UNION/INTERSECT/EXCEPT)", "Streaming CSV Export"
    ]),
    ("Sprint 3 (Release 3.0)", "Experience: Responsive UI & Canvas", 69, 25, 26, '#8b5cf6', [
        "React 18 SPA + Vite Architecture", "Custom Canvas 2D Charting Engine", "Dual Theme + Currency Localization", "Zero-Defect Production Smoke Tests"
    ])
]

for tag, subtitle, x, y, w, color, bullets in releases:
    ax.add_patch(patches.FancyBboxPatch((x, y-18), w, 22, boxstyle="round,pad=0.8", facecolor='white', edgecolor=color, linewidth=2))
    ax.add_patch(patches.FancyBboxPatch((x, y), w, 4, boxstyle="round,pad=0.4", facecolor=color, edgecolor=color))
    ax.text(x + w/2, y + 2, tag, color='white', fontsize=8.5, fontweight='bold', ha='center', va='center')
    ax.text(x + w/2, y - 2, subtitle, color=color, fontsize=7.5, fontweight='bold', ha='center', va='center')
    
    by = y - 5.5
    for b in bullets:
        ax.text(x + 2, by, f"• {b}", fontsize=6.8, color='#334155')
        by -= 3.2

# Arrows connecting sprints
ax.annotate("", xy=(36, 16), xytext=(32, 16), arrowprops=dict(arrowstyle="->", color="#64748b", lw=2))
ax.annotate("", xy=(68, 16), xytext=(64, 16), arrowprops=dict(arrowstyle="->", color="#64748b", lw=2))

plt.tight_layout()
fig.savefig(os.path.join(OUTPUT_DIR, "fig1_2_release_plan.png"), bbox_inches='tight')
plt.close(fig)

# -------------------------------------------------------------
# 3. Figure 2.1: Sprint 1 System Architecture
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 4.5), dpi=200)
ax.set_xlim(0, 100)
ax.set_ylim(0, 50)
ax.axis('off')

ax.text(50, 46, "Sprint 1 Architecture: Core Relational Ledger Service (:8081)", fontsize=11, fontweight='bold', ha='center', color='#0f172a')

# Client Box
ax.add_patch(patches.FancyBboxPatch((4, 16), 18, 18, boxstyle="round,pad=0.6", facecolor='#f8fafc', edgecolor='#64748b', linewidth=1.5))
ax.text(13, 27, "HTTP / REST Client", fontsize=8.5, fontweight='bold', ha='center', color='#1e293b')
ax.text(13, 23, "Postman / Curl / SPA", fontsize=7.5, ha='center', color='#64748b')
ax.text(13, 19, "JSON DTO Payloads", fontsize=7, ha='center', color='#3b82f6')

# Core Service Container
ax.add_patch(patches.FancyBboxPatch((28, 5), 44, 37, boxstyle="round,pad=1", facecolor='#eff6ff', edgecolor='#3b82f6', linewidth=2))
ax.text(50, 39, "finpulse-core-service (Spring Boot 3.3.5, Port :8081)", fontsize=8.5, fontweight='bold', ha='center', color='#1e40af')

layers = [
    ("REST Controller Layer", "AccountController, TransactionController, TransferController, BudgetController", 31, 5),
    ("Service Layer (@Transactional)", "AccountService, TransactionService, TransferService (Atomic ACID)", 23, 5),
    ("Data Access Layer (Spring Data JPA)", "AccountRepository, TransactionRepository, BudgetRepository (JPQL)", 15, 5),
    ("Domain Entity Model", "Account, Transaction, Budget, RecurringPayment, SavingsGoal, User", 7, 5)
]

for ltitle, ldesc, ly, lh in layers:
    ax.add_patch(patches.FancyBboxPatch((30, ly), 40, lh, boxstyle="round,pad=0.3", facecolor='white', edgecolor='#93c5fd', linewidth=1))
    ax.text(50, ly + 3.2, ltitle, fontsize=7.5, fontweight='bold', ha='center', color='#1e293b')
    ax.text(50, ly + 1.2, ldesc, fontsize=6.2, ha='center', color='#64748b')

# Database Box
ax.add_patch(patches.FancyBboxPatch((78, 14), 18, 22, boxstyle="round,pad=0.6", facecolor='#f0fdf4', edgecolor='#10b981', linewidth=1.5))
ax.text(87, 31, "Relational Database", fontsize=8.5, fontweight='bold', ha='center', color='#065f46')
ax.text(87, 27, "MySQL 8.0 (Prod)", fontsize=7.5, ha='center', color='#047857')
ax.text(87, 24, "H2 In-Memory (Dev/Test)", fontsize=7, ha='center', color='#059669')
ax.text(87, 20, "HikariCP Pool (max 10)", fontsize=7, ha='center', color='#059669')
ax.text(87, 17, "6 Relational Tables", fontsize=7, fontweight='bold', ha='center', color='#047857')

# Connecting Arrows
ax.annotate("", xy=(28, 25), xytext=(22, 25), arrowprops=dict(arrowstyle="<->", color="#3b82f6", lw=1.8))
ax.annotate("", xy=(78, 25), xytext=(72, 25), arrowprops=dict(arrowstyle="<->", color="#10b981", lw=1.8))

plt.tight_layout()
fig.savefig(os.path.join(OUTPUT_DIR, "fig2_1_sprint1_arch.png"), bbox_inches='tight')
plt.close(fig)

# -------------------------------------------------------------
# 4. Figure 2.2: Sprint 1 ER Diagram
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 5), dpi=200)
ax.set_xlim(0, 100)
ax.set_ylim(0, 60)
ax.axis('off')

ax.text(50, 57, "Sprint 1 Relational Ledger: Entity-Relationship (ER) Schema", fontsize=11, fontweight='bold', ha='center', color='#0f172a')

def draw_table(x, y, w, title, cols):
    h = 5 + len(cols)*3.5
    ax.add_patch(patches.FancyBboxPatch((x, y-h), w, h, boxstyle="round,pad=0.3", facecolor='white', edgecolor='#64748b', linewidth=1.2))
    ax.add_patch(patches.Rectangle((x, y-4), w, 4, facecolor='#1e293b'))
    ax.text(x + w/2, y-2, title, color='white', fontsize=7.5, fontweight='bold', ha='center', va='center')
    cy = y - 7
    for col in cols:
        pk_or_fk = " [PK]" if "(PK)" in col else (" [FK]" if "(FK)" in col else "")
        clean_col = col.replace(" (PK)", "").replace(" (FK)", "")
        color = '#b91c1c' if "PK" in pk_or_fk else ('#1d4ed8' if "FK" in pk_or_fk else '#334155')
        ax.text(x + 1.5, cy, clean_col, fontsize=6.5, color=color)
        if pk_or_fk:
            ax.text(x + w - 1.5, cy, pk_or_fk, fontsize=5.5, fontweight='bold', color=color, ha='right')
        cy -= 3.5

# Tables
draw_table(3, 50, 24, "users", ["id (PK) INT", "email VARCHAR(100)", "name VARCHAR(100)", "currency VARCHAR(10)", "created_at DATETIME"])
draw_table(38, 50, 25, "accounts", ["id (PK) INT", "user_id (FK) INT", "name VARCHAR(100)", "account_type VARCHAR(20)", "balance DECIMAL(15,2)", "is_archived BOOLEAN"])
draw_table(73, 50, 24, "transactions", ["id (PK) INT", "account_id (FK) INT", "amount DECIMAL(15,2)", "type VARCHAR(20)", "category VARCHAR(50)", "date DATE", "transfer_group_id UUID"])
draw_table(3, 24, 24, "budgets", ["id (PK) INT", "user_id (FK) INT", "category VARCHAR(50)", "limit_amount DECIMAL(15,2)", "month_year VARCHAR(7)"])
draw_table(38, 24, 25, "recurring_payments", ["id (PK) INT", "user_id (FK) INT", "merchant VARCHAR(100)", "amount DECIMAL(15,2)", "frequency VARCHAR(20)", "next_due_date DATE"])
draw_table(73, 24, 24, "savings_goals", ["id (PK) INT", "user_id (FK) INT", "name VARCHAR(100)", "target_amount DECIMAL(15,2)", "current_amount DECIMAL", "target_date DATE"])

# Relationships
ax.annotate("", xy=(38, 42), xytext=(27, 42), arrowprops=dict(arrowstyle="->", color="#1d4ed8", lw=1.5)) # users -> accounts
ax.annotate("", xy=(73, 42), xytext=(63, 42), arrowprops=dict(arrowstyle="->", color="#1d4ed8", lw=1.5)) # accounts -> transactions
ax.annotate("", xy=(15, 24), xytext=(15, 30), arrowprops=dict(arrowstyle="->", color="#1d4ed8", lw=1.5)) # users -> budgets
ax.annotate("", xy=(50, 24), xytext=(20, 30), arrowprops=dict(arrowstyle="->", color="#1d4ed8", lw=1.5)) # users -> recurring
ax.annotate("", xy=(85, 24), xytext=(22, 30), arrowprops=dict(arrowstyle="->", color="#1d4ed8", lw=1.5)) # users -> goals

plt.tight_layout()
fig.savefig(os.path.join(OUTPUT_DIR, "fig2_2_sprint1_er.png"), bbox_inches='tight')
plt.close(fig)

# -------------------------------------------------------------
# 5. Figure 2.3: Sprint 1 UI Layout & Interaction Wireframe
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 4.5), dpi=200)
ax.set_xlim(0, 100)
ax.set_ylim(0, 50)
ax.axis('off')

ax.text(50, 47, "Sprint 1 UI Layout: Multi-Account Management & Ledger Toolbar", fontsize=11, fontweight='bold', ha='center', color='#0f172a')

# Browser Window Frame
ax.add_patch(patches.FancyBboxPatch((2, 2), 96, 42, boxstyle="round,pad=0.5", facecolor='#f8fafc', edgecolor='#cbd5e1', linewidth=1.5))
ax.add_patch(patches.Rectangle((2, 40), 96, 4, facecolor='#e2e8f0'))
for cx, cc in [(5, '#ef4444'), (8, '#f59e0b'), (11, '#10b981')]:
    ax.add_patch(patches.Circle((cx, 42), 1, facecolor=cc))
ax.text(50, 42, "http://localhost:5173/accounts & /transactions", fontsize=7.5, color='#64748b', ha='center', va='center')

# Sidebar
ax.add_patch(patches.Rectangle((3, 3), 18, 36, facecolor='#1e293b'))
ax.text(12, 35, "FinPulse", fontsize=10, fontweight='bold', color='white', ha='center')
for ny, nlabel in [(30, "Dashboard"), (26, "Transactions*"), (22, "Accounts*"), (18, "Budgets*"), (14, "Recurring"), (10, "Settings")]:
    active = "*" in nlabel
    ax.text(6, ny, nlabel.replace("*", ""), fontsize=7.5, color='#38bdf8' if active else '#94a3b8', fontweight='bold' if active else 'normal')

# Content Area
# Top Metric Cards
ax.add_patch(patches.FancyBboxPatch((23, 28), 22, 10, boxstyle="round,pad=0.3", facecolor='white', edgecolor='#e2e8f0'))
ax.text(25, 35, "NET WORTH", fontsize=6.5, color='#64748b', fontweight='bold')
ax.text(25, 30.5, "₹ 2,84,500.00", fontsize=10, color='#0f172a', fontweight='bold')

ax.add_patch(patches.FancyBboxPatch((47, 28), 22, 10, boxstyle="round,pad=0.3", facecolor='white', edgecolor='#e2e8f0'))
ax.text(49, 35, "TOTAL ASSETS", fontsize=6.5, color='#16a34a', fontweight='bold')
ax.text(49, 30.5, "₹ 3,45,000.00", fontsize=10, color='#16a34a', fontweight='bold')

ax.add_patch(patches.FancyBboxPatch((71, 28), 25, 10, boxstyle="round,pad=0.3", facecolor='white', edgecolor='#e2e8f0'))
ax.text(73, 35, "TOTAL LIABILITIES", fontsize=6.5, color='#dc2626', fontweight='bold')
ax.text(73, 30.5, "-₹ 60,500.00", fontsize=10, color='#dc2626', fontweight='bold')

# Transactions Table Mock
ax.add_patch(patches.FancyBboxPatch((23, 4), 73, 22, boxstyle="round,pad=0.3", facecolor='white', edgecolor='#e2e8f0'))
ax.text(25, 23, "Recent Transactions Ledger (Double-Entry Atomicity)", fontsize=8, fontweight='bold', color='#1e293b')
ax.add_patch(patches.Rectangle((24, 18), 71, 3, facecolor='#f1f5f9'))
headers = ["Date", "Description / Merchant", "Category", "Account", "Amount", "Actions"]
hx_pos = [25, 38, 57, 68, 79, 90]
for hp, ht in zip(hx_pos, headers):
    ax.text(hp, 19.5, ht, fontsize=6.5, fontweight='bold', color='#475569')

txs = [
    ("2026-11-10", "HDFC Checking -> Savings (Transfer)", "Transfer", "Checking", "-₹ 15,000.00", "[Edit] [Delete]"),
    ("2026-11-10", "HDFC Savings <- Checking (Transfer)", "Transfer", "Savings", "+₹ 15,000.00", "[Edit] [Delete]"),
    ("2026-11-08", "Swiggy Food Delivery", "Food & Dining", "Credit Card", "-₹ 640.00", "[Edit] [Delete]")
]
ty = 15
for d, desc, cat, acc, amt, act in txs:
    col = '#16a34a' if amt.startswith('+') else ('#dc2626' if amt.startswith('-') else '#1e293b')
    ax.text(25, ty, d, fontsize=6, color='#64748b')
    ax.text(38, ty, desc, fontsize=6, color='#1e293b')
    ax.text(57, ty, cat, fontsize=6, color='#64748b')
    ax.text(68, ty, acc, fontsize=6, color='#64748b')
    ax.text(79, ty, amt, fontsize=6, fontweight='bold', color=col)
    ax.text(90, ty, act, fontsize=5.8, color='#3b82f6')
    ty -= 3.5

plt.tight_layout()
fig.savefig(os.path.join(OUTPUT_DIR, "fig2_3_sprint1_ui.png"), bbox_inches='tight')
plt.close(fig)

# -------------------------------------------------------------
# 6. Figure 2.4: Sprint 1 Burndown & Standup Progress
# -------------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 3.8), dpi=200)

days = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
ideal = 26 - (26/9)*(days-1)
actual = [26, 26, 22, 18, 18, 12, 8, 4, 0, 0]

ax1.plot(days, ideal, 'r--', label='Ideal Burndown (Story Points)', lw=1.8)
ax1.plot(days, actual, 'b-o', label='Actual Burndown (FinPulse Sprint 1)', lw=2.2, color='#2563eb')
ax1.set_title("Sprint 1: Daily Story Point Burndown", fontsize=9.5, fontweight='bold')
ax1.set_xlabel("Sprint Day (Nov 01 - Nov 12)", fontsize=8)
ax1.set_ylabel("Remaining Story Points", fontsize=8)
ax1.set_ylim(0, 30)
ax1.grid(True, linestyle=':', alpha=0.6)
ax1.legend(fontsize=7.5)

# Standup log mini-table in ax2
ax2.axis('off')
ax2.text(0.5, 0.95, "Daily Standup Progress Log (Sample)", fontsize=9.5, fontweight='bold', ha='center')
standup_text = (
    "• Day 1-2: Defined JPA entities (Account, Transaction). Configured HikariCP pool.\n"
    "• Day 3-4: Implemented AccountService & @Transactional TransferService (US1, US3).\n"
    "• Day 5-6: Added double-entry validation & transfer_group_id UUID grouping.\n"
    "• Day 7-8: Implemented TransactionController & category monthly budgets (US2, US4).\n"
    "• Day 9-10: 29/29 JUnit tests passing with H2 in-memory DB. Verified zero float drift.\n"
    "• Status: 26 of 26 Committed Story Points COMPLETED (100% velocity)."
)
ax2.text(0.05, 0.85, standup_text, fontsize=7.2, va='top', linespacing=1.6, color='#1e293b',
         bbox=dict(boxstyle="round,pad=0.8", facecolor='#f8fafc', edgecolor='#cbd5e1'))

plt.tight_layout()
fig.savefig(os.path.join(OUTPUT_DIR, "fig2_4_sprint1_burndown.png"), bbox_inches='tight')
plt.close(fig)

# -------------------------------------------------------------
# 7. Figure 2.5: Sprint 1 Committed vs Completed User Stories
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(7, 3.5), dpi=200)
stories = ['US1: Accounts', 'US2: Transactions', 'US3: Transfers', 'US4: Budgets']
committed = [8, 8, 5, 5]
completed = [8, 8, 5, 5]

x = np.arange(len(stories))
width = 0.35

rects1 = ax.bar(x - width/2, committed, width, label='Committed (SP)', color='#93c5fd', edgecolor='#3b82f6')
rects2 = ax.bar(x + width/2, completed, width, label='Completed (SP)', color='#10b981', edgecolor='#047857')

ax.set_ylabel('Story Points', fontsize=8.5)
ax.set_title('Sprint 1: Committed vs Completed User Stories (100% Completion)', fontsize=9.5, fontweight='bold')
ax.set_xticks(x)
ax.set_xticklabels(stories, fontsize=8)
ax.set_ylim(0, 10)
ax.legend(fontsize=8)
ax.grid(axis='y', linestyle=':', alpha=0.6)

for r in rects1 + rects2:
    h = r.get_height()
    ax.annotate(f'{h} SP', xy=(r.get_x() + r.get_width()/2, h), xytext=(0, 2),
                textcoords="offset points", ha='center', va='bottom', fontsize=7.5, fontweight='bold')

plt.tight_layout()
fig.savefig(os.path.join(OUTPUT_DIR, "fig2_5_sprint1_committed_vs_completed.png"), bbox_inches='tight')
plt.close(fig)

# -------------------------------------------------------------
# 8. Figure 2.6: Sprint 1 Retrospective
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(9, 4.5), dpi=200)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

ax.text(50, 95, "Sprint 1 Retrospective Canvas (4Ls Framework)", fontsize=11, fontweight='bold', ha='center', color='#0f172a')

quads = [
    ("LIKED", 2, 50, 46, 40, '#f0fdf4', '#16a34a', [
        "Spring Boot 3.3 rapid scaffold", "Clean double-entry transfer atomicity", "High test confidence with H2 and JUnit"
    ]),
    ("LEARNED", 52, 50, 46, 40, '#eff6ff', '#2563eb', [
        "DECIMAL(15,2) prevents IEEE-754 drift", "Archiving accounts preserves historical audit", "JPA dirty checking simplifies balance deltas"
    ]),
    ("LACKED", 2, 5, 46, 40, '#fef2f2', '#dc2626', [
        "Manual SQL scripts needed initial tuning", "Lack of complex analytical queries in ORM", "No UI for instant visual verification yet"
    ]),
    ("LONGED FOR", 52, 5, 46, 40, '#faf5ff', '#9333ea', [
        "Pure JDBC analytics microservice (Sprint 2)", "Streaming CSV export for tax audits", "Responsive frontend charts and dark theme"
    ])
]

for title, qx, qy, qw, qh, bg, border, items in quads:
    ax.add_patch(patches.FancyBboxPatch((qx, qy), qw, qh, boxstyle="round,pad=0.8", facecolor=bg, edgecolor=border, linewidth=1.5))
    ax.text(qx + qw/2, qy + qh - 6, title, fontsize=9, fontweight='bold', color=border, ha='center')
    iy = qy + qh - 13
    for it in items:
        ax.text(qx + 3, iy, f"✓ {it}", fontsize=7.2, color='#334155')
        iy -= 8

plt.tight_layout()
fig.savefig(os.path.join(OUTPUT_DIR, "fig2_6_sprint1_retro.png"), bbox_inches='tight')
plt.close(fig)

# -------------------------------------------------------------
# 9. Figure 2.7: Sprint 2 Analytics Architecture
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 4.5), dpi=200)
ax.set_xlim(0, 100)
ax.set_ylim(0, 50)
ax.axis('off')

ax.text(50, 46, "Sprint 2 Architecture: Pure JDBC Financial Analytics Microservice (:8082)", fontsize=11, fontweight='bold', ha='center', color='#0f172a')

# Client
ax.add_patch(patches.FancyBboxPatch((3, 16), 16, 18, boxstyle="round,pad=0.6", facecolor='#f8fafc', edgecolor='#64748b', linewidth=1.5))
ax.text(11, 27, "HTTP Client", fontsize=8.5, fontweight='bold', ha='center', color='#1e293b')
ax.text(11, 23, "Reports & Insights", fontsize=7.2, ha='center', color='#64748b')
ax.text(11, 19, "GET /api/analytics/*", fontsize=6.8, ha='center', color='#0284c7')

# Analytics Microservice
ax.add_patch(patches.FancyBboxPatch((24, 6), 48, 36, boxstyle="round,pad=1", facecolor='#f0fdf4', edgecolor='#10b981', linewidth=2))
ax.text(48, 38, "finpulse-analytics-service (Spring Boot 3.3.5, Port :8082)", fontsize=8.5, fontweight='bold', ha='center', color='#065f46')

ax.add_patch(patches.FancyBboxPatch((26, 27), 44, 7, boxstyle="round,pad=0.3", facecolor='white', edgecolor='#86efac', linewidth=1))
ax.text(48, 31.5, "AnalyticsController & RestTemplate Client", fontsize=7.8, fontweight='bold', ha='center', color='#1e293b')
ax.text(48, 28.5, "Endpoints: /cashflow, /category-breakdown, /spikes, /unused-budgets, /export", fontsize=6.2, ha='center', color='#475569')

ax.add_patch(patches.FancyBboxPatch((26, 17), 44, 7, boxstyle="round,pad=0.3", facecolor='white', edgecolor='#86efac', linewidth=1))
ax.text(48, 21.5, "JdbcReportRepository (Pure JDBC Execution)", fontsize=7.8, fontweight='bold', ha='center', color='#1e293b')
ax.text(48, 18.5, "java.sql.PreparedStatement, ResultSet Cursor Streaming, HikariCP Pool", fontsize=6.2, ha='center', color='#475569')

ax.add_patch(patches.FancyBboxPatch((26, 8), 44, 6, boxstyle="round,pad=0.3", facecolor='white', edgecolor='#86efac', linewidth=1))
ax.text(48, 12, "SqlQueryCatalog.java (Externalized Raw SQL)", fontsize=7.8, fontweight='bold', ha='center', color='#1e293b')
ax.text(48, 9.5, "Subqueries, ANSI UNION, INTERSECT, EXCEPT, Formula Guard Sanitization", fontsize=6.2, ha='center', color='#475569')

# Core Service (RestTemplate target)
ax.add_patch(patches.FancyBboxPatch((78, 27), 18, 15, boxstyle="round,pad=0.6", facecolor='#eff6ff', edgecolor='#3b82f6', linewidth=1.5))
ax.text(87, 37, "Core Service (:8081)", fontsize=7.8, fontweight='bold', ha='center', color='#1e40af')
ax.text(87, 33, "RestTemplate calls:", fontsize=6.8, ha='center', color='#64748b')
ax.text(87, 30, "/api/accounts", fontsize=6.8, ha='center', color='#2563eb')

# Database
ax.add_patch(patches.FancyBboxPatch((78, 6), 18, 16, boxstyle="round,pad=0.6", facecolor='#f8fafc', edgecolor='#64748b', linewidth=1.5))
ax.text(87, 18, "Shared Database", fontsize=7.8, fontweight='bold', ha='center', color='#1e293b')
ax.text(87, 14, "Read-Only Analytics", fontsize=6.8, ha='center', color='#64748b')
ax.text(87, 10, "MySQL 8.0 / H2", fontsize=6.8, ha='center', color='#059669')

ax.annotate("", xy=(24, 25), xytext=(19, 25), arrowprops=dict(arrowstyle="<->", color="#0284c7", lw=1.5))
ax.annotate("", xy=(78, 34), xytext=(72, 34), arrowprops=dict(arrowstyle="<->", color="#3b82f6", lw=1.5))
ax.annotate("", xy=(78, 14), xytext=(72, 14), arrowprops=dict(arrowstyle="<->", color="#10b981", lw=1.5))

plt.tight_layout()
fig.savefig(os.path.join(OUTPUT_DIR, "fig2_7_sprint2_arch.png"), bbox_inches='tight')
plt.close(fig)

# -------------------------------------------------------------
# 10. Figure 2.8: Sprint 2 UI Layout (Analytics & Reports)
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 4.5), dpi=200)
ax.set_xlim(0, 100)
ax.set_ylim(0, 50)
ax.axis('off')

ax.text(50, 47, "Sprint 2 UI Layout: Financial Reports & Insight Analysis (/reports)", fontsize=11, fontweight='bold', ha='center', color='#0f172a')

ax.add_patch(patches.FancyBboxPatch((2, 2), 96, 42, boxstyle="round,pad=0.5", facecolor='#f8fafc', edgecolor='#cbd5e1', linewidth=1.5))
ax.add_patch(patches.Rectangle((2, 40), 96, 4, facecolor='#e2e8f0'))
for cx, cc in [(5, '#ef4444'), (8, '#f59e0b'), (11, '#10b981')]:
    ax.add_patch(patches.Circle((cx, 42), 1, facecolor=cc))
ax.text(50, 42, "http://localhost:5173/reports", fontsize=7.5, color='#64748b', ha='center', va='center')

# Left Sidebar
ax.add_patch(patches.Rectangle((3, 3), 18, 36, facecolor='#1e293b'))
ax.text(12, 35, "FinPulse", fontsize=10, fontweight='bold', color='white', ha='center')
for ny, nlabel in [(30, "Dashboard"), (26, "Transactions"), (22, "Accounts"), (18, "Budgets"), (14, "Reports*"), (10, "Settings")]:
    active = "*" in nlabel
    ax.text(6, ny, nlabel.replace("*", ""), fontsize=7.5, color='#38bdf8' if active else '#94a3b8', fontweight='bold' if active else 'normal')

# Content
# Spending Spike Alert Box
ax.add_patch(patches.FancyBboxPatch((23, 30), 73, 8, boxstyle="round,pad=0.3", facecolor='#fef2f2', edgecolor='#f87171', linewidth=1))
ax.text(25, 34.5, "⚠ SPENDING SPIKE DETECTED (>120% Rolling Baseline)", fontsize=7, fontweight='bold', color='#b91c1c')
ax.text(25, 31.5, "Dining & Food: Current spend ₹ 12,450.00 is 142% above 3-month average (₹ 5,140.00).", fontsize=6.5, color='#7f1d1d')

# Cash Flow Chart Mock
ax.add_patch(patches.FancyBboxPatch((23, 4), 42, 24, boxstyle="round,pad=0.3", facecolor='white', edgecolor='#e2e8f0'))
ax.text(25, 25, "6-Month Cash Flow (BarChart)", fontsize=7.5, fontweight='bold', color='#1e293b')
# Bar mock
months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
mx = 26
for m in months:
    ax.add_patch(patches.Rectangle((mx, 8), 2.2, 12, facecolor='#10b981'))
    ax.add_patch(patches.Rectangle((mx+2.4, 8), 2.2, 9, facecolor='#ef4444'))
    ax.text(mx+2.3, 5.5, m, fontsize=5.5, ha='center', color='#64748b')
    mx += 6.5

# Category Breakdown Mock
ax.add_patch(patches.FancyBboxPatch((67, 4), 29, 24, boxstyle="round,pad=0.3", facecolor='white', edgecolor='#e2e8f0'))
ax.text(69, 25, "Category Breakdown", fontsize=7.5, fontweight='bold', color='#1e293b')
ax.add_patch(patches.Circle((81.5, 14), 7, facecolor='#f1f5f9', edgecolor='#94a3b8', linewidth=1.5))
ax.add_patch(patches.Circle((81.5, 14), 4, facecolor='white'))
ax.text(81.5, 14, "6 Categories", fontsize=5.5, ha='center', va='center', color='#475569')

plt.tight_layout()
fig.savefig(os.path.join(OUTPUT_DIR, "fig2_8_sprint2_ui.png"), bbox_inches='tight')
plt.close(fig)

# -------------------------------------------------------------
# 11. Figure 2.9: Sprint 2 Burndown
# -------------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 3.8), dpi=200)

days = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
ideal = 31 - (31/9)*(days-1)
actual = [31, 31, 26, 21, 16, 11, 8, 4, 0, 0]

ax1.plot(days, ideal, 'r--', label='Ideal Burndown (Story Points)', lw=1.8)
ax1.plot(days, actual, 'g-o', label='Actual Burndown (FinPulse Sprint 2)', lw=2.2, color='#059669')
ax1.set_title("Sprint 2: Daily Story Point Burndown", fontsize=9.5, fontweight='bold')
ax1.set_xlabel("Sprint Day", fontsize=8)
ax1.set_ylabel("Remaining Story Points", fontsize=8)
ax1.set_ylim(0, 35)
ax1.grid(True, linestyle=':', alpha=0.6)
ax1.legend(fontsize=7.5)

ax2.axis('off')
ax2.text(0.5, 0.95, "Sprint 2 Standup Progress Log (Analytics)", fontsize=9.5, fontweight='bold', ha='center')
standup_text_s2 = (
    "• Day 1-2: Created finpulse-analytics-service with pure JDBC & HikariCP.\n"
    "• Day 3-4: Authored SqlQueryCatalog (Cashflow GROUP BY & Category Breakdown).\n"
    "• Day 5-6: Implemented Spending Spikes subquery (>120% 3-month rolling average).\n"
    "• Day 7-8: Added ANSI Set queries: UNION (Timeline), INTERSECT, EXCEPT.\n"
    "• Day 9-10: Built streaming CSV export with formula injection sanitization (\\t guard).\n"
    "• Status: 20/20 Analytics JUnit tests passed. 31/31 Story Points COMPLETED."
)
ax2.text(0.05, 0.85, standup_text_s2, fontsize=7.2, va='top', linespacing=1.6, color='#1e293b',
         bbox=dict(boxstyle="round,pad=0.8", facecolor='#f8fafc', edgecolor='#cbd5e1'))

plt.tight_layout()
fig.savefig(os.path.join(OUTPUT_DIR, "fig2_9_sprint2_burndown.png"), bbox_inches='tight')
plt.close(fig)

# -------------------------------------------------------------
# 12. Figure 2.10: Sprint 2 Committed vs Completed
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(8, 3.5), dpi=200)
stories_s2 = ['US5: Recurring', 'US6: Goals', 'US7: Cashflow', 'US8: Spikes', 'US9: Set Ops', 'US10: Timeline']
sp_s2 = [5, 5, 8, 5, 5, 3]

x = np.arange(len(stories_s2))
width = 0.35

rects1 = ax.bar(x - width/2, sp_s2, width, label='Committed (SP)', color='#a7f3d0', edgecolor='#10b981')
rects2 = ax.bar(x + width/2, sp_s2, width, label='Completed (SP)', color='#059669', edgecolor='#064e3b')

ax.set_ylabel('Story Points', fontsize=8.5)
ax.set_title('Sprint 2: Committed vs Completed User Stories (100% Completion)', fontsize=9.5, fontweight='bold')
ax.set_xticks(x)
ax.set_xticklabels(stories_s2, fontsize=7.5)
ax.set_ylim(0, 10)
ax.legend(fontsize=8)
ax.grid(axis='y', linestyle=':', alpha=0.6)

for r in rects1 + rects2:
    h = r.get_height()
    ax.annotate(f'{h} SP', xy=(r.get_x() + r.get_width()/2, h), xytext=(0, 2),
                textcoords="offset points", ha='center', va='bottom', fontsize=7, fontweight='bold')

plt.tight_layout()
fig.savefig(os.path.join(OUTPUT_DIR, "fig2_10_sprint2_committed_vs_completed.png"), bbox_inches='tight')
plt.close(fig)

# -------------------------------------------------------------
# 13. Figure 2.11: Sprint 2 Retrospective
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(9, 4.5), dpi=200)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

ax.text(50, 95, "Sprint 2 Retrospective Canvas (4Ls Framework)", fontsize=11, fontweight='bold', ha='center', color='#0f172a')

quads_s2 = [
    ("LIKED", 2, 50, 46, 40, '#f0fdf4', '#16a34a', [
        "Pure JDBC sub-50ms speed", "Zero entity bloat in analytics", "Clean formula injection defense with tab prefix"
    ]),
    ("LEARNED", 52, 50, 46, 40, '#eff6ff', '#2563eb', [
        "Correlated subqueries excel at rolling baselines", "H2 MySQL Mode handles ANSI set clauses cleanly", "Cursor streaming prevents JVM OutOfMemory errors"
    ]),
    ("LACKED", 2, 5, 46, 40, '#fef2f2', '#dc2626', [
        "Cross-service port coordination needed scripts", "Initial date-range boundary condition bugs", "No frontend charting integration yet"
    ]),
    ("LONGED FOR", 52, 5, 46, 40, '#faf5ff', '#9333ea', [
        "Custom Canvas 2D charting visualizer", "Responsive 12-column single-page layout", "Integrated end-to-end smoke test scripts"
    ])
]

for title, qx, qy, qw, qh, bg, border, items in quads_s2:
    ax.add_patch(patches.FancyBboxPatch((qx, qy), qw, qh, boxstyle="round,pad=0.8", facecolor=bg, edgecolor=border, linewidth=1.5))
    ax.text(qx + qw/2, qy + qh - 6, title, fontsize=9, fontweight='bold', color=border, ha='center')
    iy = qy + qh - 13
    for it in items:
        ax.text(qx + 3, iy, f"✓ {it}", fontsize=7.2, color='#334155')
        iy -= 8

plt.tight_layout()
fig.savefig(os.path.join(OUTPUT_DIR, "fig2_11_sprint2_retro.png"), bbox_inches='tight')
plt.close(fig)

# -------------------------------------------------------------
# 14. Figure 2.12: Sprint 3 Full Stack Architecture
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 4.5), dpi=200)
ax.set_xlim(0, 100)
ax.set_ylim(0, 50)
ax.axis('off')

ax.text(50, 46, "Sprint 3 Full Stack System Architecture: SPA, Canvas 2D & Dual Microservices", fontsize=11, fontweight='bold', ha='center', color='#0f172a')

# Frontend Container
ax.add_patch(patches.FancyBboxPatch((3, 5), 42, 38, boxstyle="round,pad=1", facecolor='#faf5ff', edgecolor='#8b5cf6', linewidth=2))
ax.text(24, 40, "finpulse-frontend (React 18.3 + Vite 5.4, Port :5173)", fontsize=8.5, fontweight='bold', ha='center', color='#581c87')

fe_layers = [
    ("AppShell & 8 Modular Pages", "Dashboard, Transactions, Accounts, Budgets, Recurring, Goals, Reports, Settings", 31),
    ("Context & State Engine", "AuthContext (Scoped User), ThemeContext (Light/Dark), CurrencyContext (Intl)", 22),
    ("Custom Canvas 2D Engine", "CanvasChart, DonutChart, BarChart, LineAreaChart (HiDPI, Tooltips, WCAG)", 13),
    ("Shared UI Primitives", "DataTable, StatCard, Modal, ConfirmDialog, ProgressBar, Toast, ErrorBoundary", 6)
]

for fl_t, fl_d, fl_y in fe_layers:
    ax.add_patch(patches.FancyBboxPatch((5, fl_y), 38, 7, boxstyle="round,pad=0.3", facecolor='white', edgecolor='#d8b4fe', linewidth=1))
    ax.text(24, fl_y + 4.5, fl_t, fontsize=7.2, fontweight='bold', ha='center', color='#1e293b')
    ax.text(24, fl_y + 2, fl_d, fontsize=5.8, ha='center', color='#475569')

# Proxy Connector
ax.add_patch(patches.FancyBboxPatch((48, 18), 12, 14, boxstyle="round,pad=0.4", facecolor='#f1f5f9', edgecolor='#94a3b8', linewidth=1.2))
ax.text(54, 28, "Vite Proxy", fontsize=7.5, fontweight='bold', ha='center', color='#0f172a')
ax.text(54, 24, "CORS Gateway", fontsize=6.5, ha='center', color='#64748b')
ax.text(54, 20, "Reverse Proxy", fontsize=6.5, ha='center', color='#64748b')

# Backends
ax.add_patch(patches.FancyBboxPatch((63, 26), 34, 17, boxstyle="round,pad=0.8", facecolor='#eff6ff', edgecolor='#3b82f6', linewidth=1.5))
ax.text(80, 39, "finpulse-core-service (:8081)", fontsize=8, fontweight='bold', ha='center', color='#1e40af')
ax.text(80, 35, "Spring Boot 3 + Spring Data JPA + Bean Validation", fontsize=6.5, ha='center', color='#475569')
ax.text(80, 31, "Account, Ledger, Atomic Transfers, Budgets, Goals", fontsize=6.5, ha='center', color='#1e293b')
ax.text(80, 28, "29 Passing Unit & MockMvc Tests", fontsize=6.2, fontweight='bold', ha='center', color='#16a34a')

ax.add_patch(patches.FancyBboxPatch((63, 5), 34, 17, boxstyle="round,pad=0.8", facecolor='#f0fdf4', edgecolor='#10b981', linewidth=1.5))
ax.text(80, 18, "finpulse-analytics-service (:8082)", fontsize=8, fontweight='bold', ha='center', color='#065f46')
ax.text(80, 14, "Spring Boot 3 + Pure JDBC + HikariCP", fontsize=6.5, ha='center', color='#475569')
ax.text(80, 10, "Cashflow, Spikes, Set Queries, Streaming CSV", fontsize=6.5, ha='center', color='#1e293b')
ax.text(80, 7, "20 Passing JDBC & Service Tests", fontsize=6.2, fontweight='bold', ha='center', color='#16a34a')

ax.annotate("", xy=(48, 25), xytext=(45, 25), arrowprops=dict(arrowstyle="<->", color="#8b5cf6", lw=1.5))
ax.annotate("", xy=(63, 33), xytext=(60, 27), arrowprops=dict(arrowstyle="<->", color="#3b82f6", lw=1.5))
ax.annotate("", xy=(63, 15), xytext=(60, 23), arrowprops=dict(arrowstyle="<->", color="#10b981", lw=1.5))

plt.tight_layout()
fig.savefig(os.path.join(OUTPUT_DIR, "fig2_12_sprint3_arch.png"), bbox_inches='tight')
plt.close(fig)

# -------------------------------------------------------------
# 15. Figure 2.13: Sprint 3 UI Component Hierarchy
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 4.5), dpi=200)
ax.set_xlim(0, 100)
ax.set_ylim(0, 50)
ax.axis('off')

ax.text(50, 46, "Sprint 3 React Component Hierarchy & State Propagation", fontsize=11, fontweight='bold', ha='center', color='#0f172a')

# Root App
ax.add_patch(patches.FancyBboxPatch((40, 38), 20, 6, boxstyle="round,pad=0.3", facecolor='#1e293b', edgecolor='#0f172a'))
ax.text(50, 41, "<App /> (Root Router)", color='white', fontsize=7.8, fontweight='bold', ha='center', va='center')

# Providers
ax.add_patch(patches.FancyBboxPatch((15, 29), 70, 6, boxstyle="round,pad=0.3", facecolor='#eff6ff', edgecolor='#93c5fd'))
ax.text(50, 32, "Context Providers: <ThemeProvider /> | <CurrencyProvider /> | <AuthProvider />", fontsize=7.2, fontweight='bold', color='#1e40af', ha='center', va='center')

# AppShell
ax.add_patch(patches.FancyBboxPatch((35, 20), 30, 6, boxstyle="round,pad=0.3", facecolor='#f8fafc', edgecolor='#64748b'))
ax.text(50, 23, "<AppShell /> (<Sidebar /> + <Navbar /> + <ToastContainer />)", fontsize=7.2, fontweight='bold', color='#1e293b', ha='center', va='center')

# 8 Routes
pages = ["Dashboard", "Transactions", "Accounts", "Budgets", "Recurring", "Goals", "Reports", "Settings"]
px = 3
for p in pages:
    ax.add_patch(patches.FancyBboxPatch((px, 10), 11, 6, boxstyle="round,pad=0.2", facecolor='#faf5ff', edgecolor='#d8b4fe'))
    ax.text(px + 5.5, 13, f"<{p} />", fontsize=6.2, fontweight='bold', color='#6b21a8', ha='center', va='center')
    px += 12.2

# Leaf Shared
ax.add_patch(patches.FancyBboxPatch((10, 2), 80, 5, boxstyle="round,pad=0.3", facecolor='#f1f5f9', edgecolor='#cbd5e1'))
ax.text(50, 4.5, "Shared Components: <StatCard />, <DataTable />, <DonutChart />, <BarChart />, <ProgressBar />, <Modal />", fontsize=6.8, color='#475569', ha='center', va='center')

plt.tight_layout()
fig.savefig(os.path.join(OUTPUT_DIR, "fig2_13_sprint3_ui.png"), bbox_inches='tight')
plt.close(fig)

# -------------------------------------------------------------
# 16. Figure 2.14: Sprint 3 Burndown
# -------------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 3.8), dpi=200)

days = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
ideal = 24 - (24/9)*(days-1)
actual = [24, 24, 20, 16, 12, 8, 6, 2, 0, 0]

ax1.plot(days, ideal, 'r--', label='Ideal Burndown (Story Points)', lw=1.8)
ax1.plot(days, actual, 'm-o', label='Actual Burndown (FinPulse Sprint 3)', lw=2.2, color='#9333ea')
ax1.set_title("Sprint 3: Daily Story Point Burndown", fontsize=9.5, fontweight='bold')
ax1.set_xlabel("Sprint Day", fontsize=8)
ax1.set_ylabel("Remaining Story Points", fontsize=8)
ax1.set_ylim(0, 30)
ax1.grid(True, linestyle=':', alpha=0.6)
ax1.legend(fontsize=7.5)

ax2.axis('off')
ax2.text(0.5, 0.95, "Sprint 3 Standup Progress Log (Frontend & Quality)", fontsize=9.5, fontweight='bold', ha='center')
standup_text_s3 = (
    "• Day 1-2: Constructed AppShell, Sidebar, ThemeContext & CurrencyContext.\n"
    "• Day 3-4: Developed custom HTML5 Canvas 2D engine (Donut, Bar, Spline Area).\n"
    "• Day 5-6: Built Dashboard, Transactions, Accounts, Budgets with real APIs.\n"
    "• Day 7-8: Added Recurring, Goals, Reports, Settings & ErrorBoundary.\n"
    "• Day 9-10: Automated smoke-test.ps1 (37/37 endpoints passed). Vite build: 1.64s.\n"
    "• Status: 100% of user stories accepted. Zero critical defects."
)
ax2.text(0.05, 0.85, standup_text_s3, fontsize=7.2, va='top', linespacing=1.6, color='#1e293b',
         bbox=dict(boxstyle="round,pad=0.8", facecolor='#f8fafc', edgecolor='#cbd5e1'))

plt.tight_layout()
fig.savefig(os.path.join(OUTPUT_DIR, "fig2_14_sprint3_burndown.png"), bbox_inches='tight')
plt.close(fig)

# -------------------------------------------------------------
# 17. Figure 2.15: Sprint 3 Committed vs Completed
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(8, 3.5), dpi=200)
stories_s3 = ['US11: CSV Export', 'US12: Canvas 2D', 'Dual Themes', 'Currency Context', 'Route Splitting']
sp_s3 = [3, 8, 5, 3, 3]

x = np.arange(len(stories_s3))
width = 0.35

rects1 = ax.bar(x - width/2, sp_s3, width, label='Committed (SP)', color='#e9d5ff', edgecolor='#a855f7')
rects2 = ax.bar(x + width/2, sp_s3, width, label='Completed (SP)', color='#7e22ce', edgecolor='#581c87')

ax.set_ylabel('Story Points', fontsize=8.5)
ax.set_title('Sprint 3: Committed vs Completed User Stories (100% Completion)', fontsize=9.5, fontweight='bold')
ax.set_xticks(x)
ax.set_xticklabels(stories_s3, fontsize=7.5)
ax.set_ylim(0, 10)
ax.legend(fontsize=8)
ax.grid(axis='y', linestyle=':', alpha=0.6)

for r in rects1 + rects2:
    h = r.get_height()
    ax.annotate(f'{h} SP', xy=(r.get_x() + r.get_width()/2, h), xytext=(0, 2),
                textcoords="offset points", ha='center', va='bottom', fontsize=7, fontweight='bold')

plt.tight_layout()
fig.savefig(os.path.join(OUTPUT_DIR, "fig2_15_sprint3_committed_vs_completed.png"), bbox_inches='tight')
plt.close(fig)

# -------------------------------------------------------------
# 18. Figure 2.16: Sprint 3 Retrospective
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(9, 4.5), dpi=200)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

ax.text(50, 95, "Sprint 3 Retrospective Canvas (4Ls Framework)", fontsize=11, fontweight='bold', ha='center', color='#0f172a')

quads_s3 = [
    ("LIKED", 2, 50, 46, 40, '#f0fdf4', '#16a34a', [
        "Instant zero-bundle Canvas 2D chart renders", "Smooth Light/Dark theme switching without reloads", "Complete test coverage (49/49 unit tests, 37/37 smoke)"
    ]),
    ("LEARNED", 52, 50, 46, 40, '#eff6ff', '#2563eb', [
        "Intl.NumberFormat handles cross-locale currencies natively", "HiDPI DPR scaling prevents fuzzy canvas rendering", "React.lazy splits bundle into lightweight 195 kB chunks"
    ]),
    ("LACKED", 2, 5, 46, 40, '#fef2f2', '#dc2626', [
        "Initial canvas tooltip collision bug (quickly resolved)", "Mobile touch gestures for custom canvas hover", "More advanced chart export options"
    ]),
    ("LONGED FOR", 52, 5, 46, 40, '#faf5ff', '#9333ea', [
        "Open Banking API aggregation (Future)", "Predictive ML spending anomaly models (Future)", "Multi-factor authentication (MFA / OAuth2)"
    ])
]

for title, qx, qy, qw, qh, bg, border, items in quads_s3:
    ax.add_patch(patches.FancyBboxPatch((qx, qy), qw, qh, boxstyle="round,pad=0.8", facecolor=bg, edgecolor=border, linewidth=1.5))
    ax.text(qx + qw/2, qy + qh - 6, title, fontsize=9, fontweight='bold', color=border, ha='center')
    iy = qy + qh - 13
    for it in items:
        ax.text(qx + 3, iy, f"✓ {it}", fontsize=7.2, color='#334155')
        iy -= 8

plt.tight_layout()
fig.savefig(os.path.join(OUTPUT_DIR, "fig2_16_sprint3_retro.png"), bbox_inches='tight')
plt.close(fig)

# -------------------------------------------------------------
# 19. Figure 3.1: Final Overall Velocity
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(8, 4), dpi=200)
sprints = ['Sprint 1 (Core)', 'Sprint 2 (Analytics)', 'Sprint 3 (Frontend)']
committed_all = [26, 31, 24]
completed_all = [26, 31, 24]

x = np.arange(len(sprints))
width = 0.35

rects1 = ax.bar(x - width/2, committed_all, width, label='Committed Story Points', color='#93c5fd', edgecolor='#2563eb')
rects2 = ax.bar(x + width/2, completed_all, width, label='Completed Story Points', color='#10b981', edgecolor='#047857')

ax.set_ylabel('Story Points', fontsize=9)
ax.set_title('Overall FinPulse Scrum Velocity: Committed vs Completed (81/81 SP - 100%)', fontsize=10, fontweight='bold')
ax.set_xticks(x)
ax.set_xticklabels(sprints, fontsize=8.5)
ax.set_ylim(0, 38)
ax.legend(fontsize=8.5)
ax.grid(axis='y', linestyle=':', alpha=0.6)

for r in rects1 + rects2:
    h = r.get_height()
    ax.annotate(f'{h} SP', xy=(r.get_x() + r.get_width()/2, h), xytext=(0, 2),
                textcoords="offset points", ha='center', va='bottom', fontsize=8, fontweight='bold')

plt.tight_layout()
fig.savefig(os.path.join(OUTPUT_DIR, "fig3_1_overall_velocity.png"), bbox_inches='tight')
plt.close(fig)

print("All 19 report figures generated successfully in:", OUTPUT_DIR)
