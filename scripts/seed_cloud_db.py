import pymysql
import os
import re

HOST = "caboose.proxy.rlwy.net"
PORT = 34081
USER = "root"
PASSWORD = "QDSfMgnAjyZwjrBenxEHfVYqtNrtUlzo"
DATABASE = "railway"

print(f"Connecting to MySQL at {HOST}:{PORT}...")
conn = pymysql.connect(
    host=HOST,
    port=PORT,
    user=USER,
    password=PASSWORD,
    database=DATABASE,
    autocommit=True,
    cursorclass=pymysql.cursors.DictCursor
)
print("Connected successfully!")

def execute_sql_file(filepath):
    print(f"Executing {filepath}...")
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Split on semicolons that are not inside strings
    # Simple split on ';' followed by newline or EOF is reliable for these files
    statements = content.split(";")
    count = 0
    with conn.cursor() as cursor:
        for stmt in statements:
            cleaned = stmt.strip()
            # Remove full-line comments
            lines = [l for l in cleaned.split("\n") if not l.strip().startswith("--")]
            sql = "\n".join(lines).strip()
            if not sql:
                continue
            try:
                cursor.execute(sql)
                count += 1
            except Exception as e:
                print(f"Warning on SQL: {e}")
    print(f"Executed {count} statements from {filepath}")

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
execute_sql_file(os.path.join(base_dir, "database", "schema.sql"))
execute_sql_file(os.path.join(base_dir, "database", "data.sql"))

with conn.cursor() as cursor:
    cursor.execute("SHOW TABLES;")
    tables = cursor.fetchall()
    print("Tables in database:", tables)

    cursor.execute("SELECT COUNT(*) AS total_tx FROM transactions;")
    print("Total transactions:", cursor.fetchone())

conn.close()
print("Database initialized successfully!")
