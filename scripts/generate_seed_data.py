#!/usr/bin/env python3
"""
FinPulse v2 Seed Data Generator
Generates db/data.sql with:
- 2 Users (Aarav Sharma - INR, Sarah Connor - INR)
- 6 Accounts (Checking, Savings, Credit Card [-ve balance], Cash, Investment, Sarah Checking)
- Budgets for Current and Previous months
- 6 months of realistic transactions using relative SQL dates (CURRENT_DATE - INTERVAL 'x' DAY)
- Deliberately includes:
  * Subscriptions charged in both current & previous month (INTERSECT)
  * One category clearly spiking this month (Subquery > 120% of previous 3-month avg)
  * Budgeted categories with zero spend this month (EXCEPT)
  * Opening balance transactions 180 days ago ensuring exact balance reconciliation
- 5 Recurring Payments due within 30 days
- 2 Savings Goals
"""

from decimal import Decimal

# Target Account Balances
TARGET_BALANCES = {
    1: Decimal("68450.00"),    # HDFC Salary Checking
    2: Decimal("185000.00"),   # ICICI Emergency Savings
    3: Decimal("-14500.00"),   # Axis Flipkart Credit Card (Negative balance convention)
    4: Decimal("3200.00"),     # Cash in Wallet
    5: Decimal("240000.00"),   # Zerodha Equity Investment
    6: Decimal("15000.00"),    # Sarah Connor Checking
}

# We will collect transactions as:
# (id, account_id, category, amount, type, merchant, description, day_offset, is_transfer, transfer_group_id)
transactions = []
tx_id_seq = 1

def add_tx(account_id, category, amount_str, tx_type, merchant, desc, day_offset, is_transfer=False, grp_id="NULL"):
    global tx_id_seq
    transactions.append({
        "id": tx_id_seq,
        "account_id": account_id,
        "category": category,
        "amount": Decimal(amount_str),
        "transaction_type": tx_type,
        "merchant": merchant,
        "description": desc,
        "day_offset": day_offset,
        "is_transfer": is_transfer,
        "transfer_group_id": grp_id
    })
    tx_id_seq += 1

def add_transfer(src_acc, dst_acc, amount_str, merchant_src, merchant_dst, desc, day_offset, grp_id):
    add_tx(src_acc, "Transfer", amount_str, "EXPENSE", merchant_src, desc, day_offset, is_transfer=True, grp_id=grp_id)
    add_tx(dst_acc, "Transfer", amount_str, "INCOME", merchant_dst, desc, day_offset, is_transfer=True, grp_id=grp_id)

# -------------------------------------------------------------
# BUILD 6 MONTHS OF TRANSACTIONS (relative day offsets: ~1 to 175)
# Month 0 (Current): days 1 - 11
# Month -1: days 30 - 45
# Month -2: days 60 - 75
# Month -3: days 90 - 105
# Month -4: days 120 - 135
# Month -5: days 150 - 165
# -------------------------------------------------------------

# Month -5 (Days 150-165)
add_tx(1, "Salary", "75000.00", "INCOME", "Razorpay Software", "Monthly Tech Payroll", 165)
add_tx(1, "Housing & Rent", "25000.00", "EXPENSE", "Prestige Estate Properties", "Apartment Rent", 164)
add_tx(1, "Utilities & Bills", "2200.00", "EXPENSE", "BESCOM Electricity", "Power bill", 162)
add_tx(1, "Utilities & Bills", "999.00", "EXPENSE", "Airtel Broadband", "Fiber 200Mbps", 160)
add_tx(1, "Entertainment", "649.00", "EXPENSE", "Netflix India", "Premium 4K plan", 158)
add_tx(1, "Entertainment", "179.00", "EXPENSE", "Spotify Premium", "Individual monthly", 158)
add_tx(1, "Entertainment", "1800.00", "EXPENSE", "Cult.fit Fitness", "Gym & Yoga center", 157)
add_tx(1, "Groceries & Dining", "3200.00", "EXPENSE", "Blinkit", "Monthly pantry staples", 155)
add_tx(1, "Groceries & Dining", "740.00", "EXPENSE", "Swiggy", "Dinner delivery", 153)
add_tx(1, "Transportation", "450.00", "EXPENSE", "Uber India", "Commute to office", 152)
add_tx(1, "Shopping", "2100.00", "EXPENSE", "Amazon India", "Books and stationery", 151)
add_transfer(1, 2, "10000.00", "Transfer to Emergency Fund", "Emergency Fund Deposit", "Monthly savings transfer", 150, "'TRF-M5-01'")
add_transfer(1, 5, "15000.00", "Transfer to Zerodha SIP", "Nifty 50 Index SIP", "Monthly investment transfer", 150, "'TRF-M5-02'")

# Month -4 (Days 120-135)
add_tx(1, "Salary", "75000.00", "INCOME", "Razorpay Software", "Monthly Tech Payroll", 135)
add_tx(1, "Housing & Rent", "25000.00", "EXPENSE", "Prestige Estate Properties", "Apartment Rent", 134)
add_tx(1, "Utilities & Bills", "2150.00", "EXPENSE", "BESCOM Electricity", "Power bill", 132)
add_tx(1, "Utilities & Bills", "999.00", "EXPENSE", "Airtel Broadband", "Fiber 200Mbps", 130)
add_tx(1, "Entertainment", "649.00", "EXPENSE", "Netflix India", "Premium 4K plan", 128)
add_tx(1, "Entertainment", "179.00", "EXPENSE", "Spotify Premium", "Individual monthly", 128)
add_tx(1, "Entertainment", "1800.00", "EXPENSE", "Cult.fit Fitness", "Gym & Yoga center", 127)
add_tx(1, "Groceries & Dining", "3450.00", "EXPENSE", "Blinkit", "Monthly pantry staples", 125)
add_tx(1, "Groceries & Dining", "820.00", "EXPENSE", "Zomato", "Weekend lunch", 124)
add_tx(1, "Transportation", "1200.00", "EXPENSE", "HP Petrol Pump", "Fuel refill", 122)
add_tx(1, "Shopping", "3100.00", "EXPENSE", "Amazon India", "Kitchen cookware", 121)
add_transfer(1, 2, "10000.00", "Transfer to Emergency Fund", "Emergency Fund Deposit", "Monthly savings transfer", 120, "'TRF-M4-01'")
add_transfer(1, 5, "15000.00", "Transfer to Zerodha SIP", "Nifty 50 Index SIP", "Monthly investment transfer", 120, "'TRF-M4-02'")

# Month -3 (Days 90-105) - Part of 3-month baseline for Subquery
add_tx(1, "Salary", "75000.00", "INCOME", "Razorpay Software", "Monthly Tech Payroll", 105)
add_tx(1, "Housing & Rent", "25000.00", "EXPENSE", "Prestige Estate Properties", "Apartment Rent", 104)
add_tx(1, "Utilities & Bills", "2300.00", "EXPENSE", "BESCOM Electricity", "Power bill", 102)
add_tx(1, "Utilities & Bills", "999.00", "EXPENSE", "Airtel Broadband", "Fiber 200Mbps", 100)
add_tx(1, "Entertainment", "649.00", "EXPENSE", "Netflix India", "Premium 4K plan", 98)
add_tx(1, "Entertainment", "179.00", "EXPENSE", "Spotify Premium", "Individual monthly", 98)
add_tx(1, "Entertainment", "1800.00", "EXPENSE", "Cult.fit Fitness", "Gym & Yoga center", 97)
add_tx(1, "Groceries & Dining", "3800.00", "EXPENSE", "Nature Basket", "Organic groceries", 95)
add_tx(1, "Groceries & Dining", "650.00", "EXPENSE", "Swiggy", "Dinner order", 94)
add_tx(1, "Transportation", "550.00", "EXPENSE", "Uber India", "Airport cab", 93)
add_tx(1, "Shopping", "3200.00", "EXPENSE", "Amazon India", "Computer accessories", 92) # Shopping Baseline M3
add_tx(1, "Travel & Vacation", "8500.00", "EXPENSE", "MakeMyTrip", "Weekend getaway resort", 91)
add_transfer(1, 2, "10000.00", "Transfer to Emergency Fund", "Emergency Fund Deposit", "Monthly savings transfer", 90, "'TRF-M3-01'")
add_transfer(1, 5, "15000.00", "Transfer to Zerodha SIP", "Nifty 50 Index SIP", "Monthly investment transfer", 90, "'TRF-M3-02'")

# Month -2 (Days 60-75) - Part of 3-month baseline for Subquery
add_tx(1, "Salary", "75000.00", "INCOME", "Razorpay Software", "Monthly Tech Payroll", 75)
add_tx(1, "Housing & Rent", "25000.00", "EXPENSE", "Prestige Estate Properties", "Apartment Rent", 74)
add_tx(1, "Utilities & Bills", "2100.00", "EXPENSE", "BESCOM Electricity", "Power bill", 72)
add_tx(1, "Utilities & Bills", "999.00", "EXPENSE", "Airtel Broadband", "Fiber 200Mbps", 70)
add_tx(1, "Entertainment", "649.00", "EXPENSE", "Netflix India", "Premium 4K plan", 68)
add_tx(1, "Entertainment", "179.00", "EXPENSE", "Spotify Premium", "Individual monthly", 68)
add_tx(1, "Entertainment", "1800.00", "EXPENSE", "Cult.fit Fitness", "Gym & Yoga center", 67)
add_tx(1, "Groceries & Dining", "3600.00", "EXPENSE", "Blinkit", "Monthly groceries", 65)
add_tx(1, "Groceries & Dining", "920.00", "EXPENSE", "Zomato", "Team lunch", 64)
add_tx(1, "Healthcare", "650.00", "EXPENSE", "Apollo Pharmacy", "Vitamins and first aid", 63)
add_tx(1, "Transportation", "1350.00", "EXPENSE", "HP Petrol Pump", "Vehicle fuel", 62)
add_tx(1, "Shopping", "3800.00", "EXPENSE", "Flipkart", "Clothing and shoes", 61) # Shopping Baseline M2
add_transfer(1, 2, "10000.00", "Transfer to Emergency Fund", "Emergency Fund Deposit", "Monthly savings transfer", 60, "'TRF-M2-01'")
add_transfer(1, 5, "15000.00", "Transfer to Zerodha SIP", "Nifty 50 Index SIP", "Monthly investment transfer", 60, "'TRF-M2-02'")
add_transfer(1, 4, "3000.00", "ATM Cash Withdrawal", "ATM Cash Received", "Pocket cash refill", 60, "'TRF-M2-03'")

# Month -1 (Days 30-45 - Previous Month) - INTERSECT & Subquery Baseline
add_tx(1, "Salary", "75000.00", "INCOME", "Razorpay Software", "Monthly Tech Payroll", 42)
add_tx(1, "Housing & Rent", "25000.00", "EXPENSE", "Prestige Estate Properties", "Apartment Rent", 41)
add_tx(1, "Utilities & Bills", "2250.00", "EXPENSE", "BESCOM Electricity", "Power bill", 38)
add_tx(1, "Utilities & Bills", "999.00", "EXPENSE", "Airtel Broadband", "Fiber 200Mbps", 35) # INTERSECT candidate
add_tx(1, "Entertainment", "649.00", "EXPENSE", "Netflix India", "Premium 4K plan", 35)    # INTERSECT candidate
add_tx(1, "Entertainment", "179.00", "EXPENSE", "Spotify Premium", "Individual monthly", 35) # INTERSECT candidate
add_tx(1, "Entertainment", "1800.00", "EXPENSE", "Cult.fit Fitness", "Gym & Yoga center", 34) # INTERSECT candidate
add_tx(1, "Groceries & Dining", "3900.00", "EXPENSE", "Blinkit", "Monthly staples", 33)
add_tx(1, "Groceries & Dining", "850.00", "EXPENSE", "Swiggy", "Dinner gourmet", 32)
add_tx(1, "Healthcare", "1200.00", "EXPENSE", "Apollo Pharmacy", "Dental cleaning", 31)
add_tx(1, "Transportation", "480.00", "EXPENSE", "Uber India", "City ride", 31)
add_tx(1, "Shopping", "3500.00", "EXPENSE", "Amazon India", "Noise cancelling headphones", 30) # Shopping Baseline M1
add_transfer(1, 2, "10000.00", "Transfer to Emergency Fund", "Emergency Fund Deposit", "Monthly savings transfer", 30, "'TRF-M1-01'")
add_transfer(1, 5, "15000.00", "Transfer to Zerodha SIP", "Nifty 50 Index SIP", "Monthly investment transfer", 30, "'TRF-M1-02'")

# Month 0 (Current Month - Days 1 to 11)
# Deliberately includes:
# 1. Netflix, Spotify, Cult.fit, Airtel Broadband (INTERSECT with Month -1)
# 2. Shopping spike: Amazon India (12500.00) + Flipkart (4000.00) = 16500.00 (vs avg ~3500.00 -> >120% SPIKE!)
# 3. Healthcare & Travel categories have 0 expenses this month -> EXCEPT row!
# 4. Salary & Rent
add_tx(1, "Salary", "75000.00", "INCOME", "Razorpay Software", "Monthly Tech Payroll", 11)
add_tx(1, "Housing & Rent", "25000.00", "EXPENSE", "Prestige Estate Properties", "Apartment Rent", 10)
add_tx(1, "Utilities & Bills", "999.00", "EXPENSE", "Airtel Broadband", "Fiber 200Mbps", 8)   # INTERSECT Match
add_tx(1, "Entertainment", "649.00", "EXPENSE", "Netflix India", "Premium 4K plan", 6)      # INTERSECT Match
add_tx(1, "Entertainment", "179.00", "EXPENSE", "Spotify Premium", "Individual monthly", 6)   # INTERSECT Match
add_tx(1, "Entertainment", "1800.00", "EXPENSE", "Cult.fit Fitness", "Gym & Yoga center", 5) # INTERSECT Match
add_tx(1, "Groceries & Dining", "2150.00", "EXPENSE", "Blinkit", "Fresh vegetables & milk", 4)
add_tx(1, "Groceries & Dining", "620.00", "EXPENSE", "Swiggy", "Biryani lunch", 3)
add_tx(1, "Transportation", "340.00", "EXPENSE", "Uber India", "Metro connect", 3)
# SHOPPING SPIKE (12,500 + 4,000 = 16,500.00):
add_tx(1, "Shopping", "12500.00", "EXPENSE", "Amazon India", "Ergonomic 4K monitor", 2)
add_tx(1, "Shopping", "4000.00", "EXPENSE", "Flipkart", "Mechanical keyboard & mouse", 1)

# Credit Card (Account 3) Transactions
# Incur expenses on Credit Card (which increases amount owed / makes balance more negative)
add_tx(3, "Shopping", "8500.00", "EXPENSE", "Croma Electronics", "Soundbar sound system", 40)
add_tx(3, "Groceries & Dining", "4200.00", "EXPENSE", "Nature Basket", "Imported groceries", 20)
add_tx(3, "Shopping", "13800.00", "EXPENSE", "Amazon India", "Smartphone exchange purchase", 5)
# Credit card payment from Account 1 to Account 3:
add_transfer(1, 3, "12000.00", "Credit Card Bill Pay", "HDFC Card Payment Recd", "Monthly CC bill settlement", 12, "'TRF-CC-01'")

# Cash (Account 4) Transactions
add_tx(4, "Groceries & Dining", "450.00", "EXPENSE", "Local Vegetable Vendor", "Organic greens", 25)
add_tx(4, "Transportation", "150.00", "EXPENSE", "Auto Rickshaw", "Local market transit", 15)
add_tx(4, "Groceries & Dining", "200.00", "EXPENSE", "Chai Point", "Evening snacks", 3)

# Investment (Account 5) Transactions (Besides monthly SIP transfers)
add_tx(5, "Investments", "15000.00", "INCOME", "Zerodha Portfolio Growth", "Q3 Mutual Fund dividend appreciation", 80)

# Sarah Connor (Account 6) Seed Transactions
add_tx(6, "Salary", "25000.00", "INCOME", "Apex Tech Labs", "Consulting stipend", 30)
add_tx(6, "Housing & Rent", "8000.00", "EXPENSE", "Urban Living PG", "Monthly room rent", 28)
add_tx(6, "Groceries & Dining", "2000.00", "EXPENSE", "BigBasket", "Monthly groceries", 15)

# -------------------------------------------------------------
# CALCULATE OPENING BALANCES TO GUARANTEE BALANCE INVARIANT
# -------------------------------------------------------------
print("Calculating account balance effects...")
account_effects = {acc_id: Decimal("0.00") for acc_id in TARGET_BALANCES}

for tx in transactions:
    acc_id = tx["account_id"]
    if tx["transaction_type"] == "INCOME":
        account_effects[acc_id] += tx["amount"]
    elif tx["transaction_type"] == "EXPENSE":
        account_effects[acc_id] -= tx["amount"]

opening_txs = []
for acc_id, target in TARGET_BALANCES.items():
    current_net = account_effects[acc_id]
    required_opening = target - current_net
    print(f"Account {acc_id}: Target={target}, CurrentNet={current_net}, RequiredOpening={required_opening}")
    
    # We create an 'Opening Balance' transaction 180 days back
    # If required_opening is positive -> INCOME
    # If required_opening is negative -> EXPENSE
    tx_type = "INCOME" if required_opening >= 0 else "EXPENSE"
    amt = abs(required_opening)
    opening_txs.append({
        "id": tx_id_seq,
        "account_id": acc_id,
        "category": "Transfer",
        "amount": amt,
        "transaction_type": tx_type,
        "merchant": "Opening Balance",
        "description": "Initial account ledger balance forward",
        "day_offset": 180,
        "is_transfer": True,
        "transfer_group_id": f"'OPENING-ACC-{acc_id}'"
    })
    tx_id_seq += 1

# Prepend opening transactions so they are first in chronological order
all_transactions = opening_txs + transactions

# Re-verify that balance invariant holds 100.000%
print("\nRe-verifying Balance Invariant:")
final_effects = {acc_id: Decimal("0.00") for acc_id in TARGET_BALANCES}
for tx in all_transactions:
    acc_id = tx["account_id"]
    if tx["transaction_type"] == "INCOME":
        final_effects[acc_id] += tx["amount"]
    elif tx["transaction_type"] == "EXPENSE":
        final_effects[acc_id] -= tx["amount"]

for acc_id, target in TARGET_BALANCES.items():
    diff = target - final_effects[acc_id]
    assert diff == Decimal("0.00"), f"Balance mismatch on account {acc_id}: diff={diff}"
    print(f"  Account {acc_id}: Reconciled {final_effects[acc_id]} == Target {target} (Diff: 0.00) OK")

# -------------------------------------------------------------
# GENERATE SQL STATEMENTS
# -------------------------------------------------------------
sql_lines = []
sql_lines.append("-- FinPulse Seed Data v2")
sql_lines.append("-- Dynamic relative-date seed compatible with MySQL 8.0 and H2 (MySQL Mode)")
sql_lines.append("")

# Users
sql_lines.append("-- 1. Users")
sql_lines.append("INSERT IGNORE INTO users (id, username, email, full_name, currency, locale) VALUES")
sql_lines.append("(1, 'aarav_sharma', 'aarav.sharma@example.in', 'Aarav Sharma', 'INR', 'en-IN'),")
sql_lines.append("(2, 'sarah_connor', 'sarah.c@example.com', 'Sarah Connor', 'INR', 'en-IN');")
sql_lines.append("")

# Accounts
sql_lines.append("-- 2. Accounts")
sql_lines.append("INSERT IGNORE INTO accounts (id, user_id, account_name, account_number, account_type, balance, currency, is_archived) VALUES")
sql_lines.append("(1, 1, 'HDFC Salary Checking', 'HDFC-88219-0', 'CHECKING', 68450.00, 'INR', FALSE),")
sql_lines.append("(2, 1, 'ICICI Emergency Savings', 'ICIC-44102-1', 'SAVINGS', 185000.00, 'INR', FALSE),")
sql_lines.append("(3, 1, 'Axis Flipkart Credit Card', 'AXIS-55201-9', 'CREDIT_CARD', -14500.00, 'INR', FALSE),")
sql_lines.append("(4, 1, 'Cash in Wallet', 'CSH-00100-2', 'CASH', 3200.00, 'INR', FALSE),")
sql_lines.append("(5, 1, 'Zerodha Equity Investment', 'ZRD-99381-4', 'INVESTMENT', 240000.00, 'INR', FALSE),")
sql_lines.append("(6, 2, 'SBI Daily Checking', 'SBI-10293-8', 'CHECKING', 15000.00, 'INR', FALSE);")
sql_lines.append("")

# Budgets: Previous month and Current month
sql_lines.append("-- 3. Budgets (Current & Previous Month)")
budgets = [
    # (id, user_id, category, limit, month_expr)
    (1, 1, "Housing & Rent", "25000.00", "SUBSTRING(CAST(CURRENT_DATE - INTERVAL '1' MONTH AS CHAR(10)), 1, 7)"),
    (2, 1, "Groceries & Dining", "12000.00", "SUBSTRING(CAST(CURRENT_DATE - INTERVAL '1' MONTH AS CHAR(10)), 1, 7)"),
    (3, 1, "Utilities & Bills", "5000.00", "SUBSTRING(CAST(CURRENT_DATE - INTERVAL '1' MONTH AS CHAR(10)), 1, 7)"),
    (4, 1, "Entertainment", "3000.00", "SUBSTRING(CAST(CURRENT_DATE - INTERVAL '1' MONTH AS CHAR(10)), 1, 7)"),
    (5, 1, "Transportation", "4000.00", "SUBSTRING(CAST(CURRENT_DATE - INTERVAL '1' MONTH AS CHAR(10)), 1, 7)"),
    (6, 1, "Shopping", "8000.00", "SUBSTRING(CAST(CURRENT_DATE - INTERVAL '1' MONTH AS CHAR(10)), 1, 7)"),
    (7, 1, "Healthcare", "3000.00", "SUBSTRING(CAST(CURRENT_DATE - INTERVAL '1' MONTH AS CHAR(10)), 1, 7)"),
    
    # Current Month
    (8, 1, "Housing & Rent", "25000.00", "SUBSTRING(CAST(CURRENT_DATE AS CHAR(10)), 1, 7)"),
    (9, 1, "Groceries & Dining", "12000.00", "SUBSTRING(CAST(CURRENT_DATE AS CHAR(10)), 1, 7)"),
    (10, 1, "Utilities & Bills", "5000.00", "SUBSTRING(CAST(CURRENT_DATE AS CHAR(10)), 1, 7)"),
    (11, 1, "Entertainment", "3000.00", "SUBSTRING(CAST(CURRENT_DATE AS CHAR(10)), 1, 7)"),
    (12, 1, "Transportation", "4000.00", "SUBSTRING(CAST(CURRENT_DATE AS CHAR(10)), 1, 7)"),
    (13, 1, "Shopping", "8000.00", "SUBSTRING(CAST(CURRENT_DATE AS CHAR(10)), 1, 7)"),
    (14, 1, "Healthcare", "3000.00", "SUBSTRING(CAST(CURRENT_DATE AS CHAR(10)), 1, 7)"),        # EXCEPT: Zero spend this month
    (15, 1, "Travel & Vacation", "10000.00", "SUBSTRING(CAST(CURRENT_DATE AS CHAR(10)), 1, 7)")    # EXCEPT: Zero spend this month
]

sql_lines.append("INSERT IGNORE INTO budgets (id, user_id, category, monthly_limit, month_year) VALUES")
b_val_lines = []
for b in budgets:
    b_val_lines.append(f"({b[0]}, {b[1]}, '{b[2]}', {b[3]}, {b[4]})")
sql_lines.append(",\n".join(b_val_lines) + ";")
sql_lines.append("")

# Recurring Payments (5 due within 30 days)
sql_lines.append("-- 4. Recurring Payments (Active bills due within next 30 days)")
sql_lines.append("INSERT IGNORE INTO recurring_payments (id, user_id, account_id, name, merchant, category, amount, frequency, next_due_date, is_active) VALUES")
recurring = [
    (1, 1, 1, "Netflix 4K Subscription", "Netflix India", "Entertainment", "649.00", "MONTHLY", "CURRENT_DATE + INTERVAL '5' DAY", "TRUE"),
    (2, 1, 1, "Cult.fit Gym Membership", "Cult.fit Fitness", "Entertainment", "1800.00", "MONTHLY", "CURRENT_DATE + INTERVAL '10' DAY", "TRUE"),
    (3, 1, 1, "Airtel Fiber Broadband", "Airtel Broadband", "Utilities & Bills", "999.00", "MONTHLY", "CURRENT_DATE + INTERVAL '12' DAY", "TRUE"),
    (4, 1, 1, "Spotify Family Music", "Spotify Premium", "Entertainment", "179.00", "MONTHLY", "CURRENT_DATE + INTERVAL '18' DAY", "TRUE"),
    (5, 1, 1, "Prestige Apartment Rent", "Prestige Estate Properties", "Housing & Rent", "25000.00", "MONTHLY", "CURRENT_DATE + INTERVAL '25' DAY", "TRUE")
]
r_val_lines = []
for r in recurring:
    r_val_lines.append(f"({r[0]}, {r[1]}, {r[2]}, '{r[3]}', '{r[4]}', '{r[5]}', {r[6]}, '{r[7]}', {r[8]}, {r[9]})")
sql_lines.append(",\n".join(r_val_lines) + ";")
sql_lines.append("")

# Savings Goals (2 goals)
sql_lines.append("-- 5. Savings Goals")
sql_lines.append("INSERT IGNORE INTO savings_goals (id, user_id, name, target_amount, saved_amount, target_date) VALUES")
goals = [
    (1, 1, "6-Month Emergency Fund", "300000.00", "185000.00", "CURRENT_DATE + INTERVAL '180' DAY"),
    (2, 1, "Electric Scooter Purchase", "120000.00", "45000.00", "CURRENT_DATE + INTERVAL '90' DAY")
]
g_val_lines = []
for g in goals:
    g_val_lines.append(f"({g[0]}, {g[1]}, '{g[2]}', {g[3]}, {g[4]}, {g[5]})")
sql_lines.append(",\n".join(g_val_lines) + ";")
sql_lines.append("")

# Transactions
sql_lines.append("-- 6. Transactions (6-Month Believable History + Opening Balances)")
sql_lines.append("INSERT IGNORE INTO transactions (id, account_id, category, amount, transaction_type, merchant, description, transaction_date, is_transfer, transfer_group_id) VALUES")

t_val_lines = []
for t in all_transactions:
    date_expr = f"CURRENT_DATE - INTERVAL '{t['day_offset']}' DAY"
    is_trf_str = "TRUE" if t["is_transfer"] else "FALSE"
    merchant_str = f"'{t['merchant']}'" if t["merchant"] is not None else "NULL"
    desc_str = f"'{t['description']}'" if t["description"] is not None else "NULL"
    t_val_lines.append(
        f"({t['id']}, {t['account_id']}, '{t['category']}', {t['amount']:.2f}, '{t['transaction_type']}', {merchant_str}, {desc_str}, {date_expr}, {is_trf_str}, {t['transfer_group_id']})"
    )
sql_lines.append(",\n".join(t_val_lines) + ";")
sql_lines.append("")

# Audit Logs
sql_lines.append("-- 7. Audit Logs")
sql_lines.append("INSERT IGNORE INTO audit_logs (id, action, entity_name, entity_id, details) VALUES")
sql_lines.append("(1, 'INITIALIZE', 'DATABASE', 1, 'Seeded initial accounts, transactions, and budgets v2'),")
sql_lines.append("(2, 'LOGIN', 'USER', 1, 'User Aarav Sharma logged into FinPulse');")
sql_lines.append("")

content = "\n".join(sql_lines)
with open("C:/Users/karth/OneDrive/Desktop/FSWD/FinPulse/db/data.sql", "w", encoding="utf-8") as f:
    f.write(content)

print(f"\nSuccessfully wrote db/data.sql with {len(all_transactions)} transactions!")
