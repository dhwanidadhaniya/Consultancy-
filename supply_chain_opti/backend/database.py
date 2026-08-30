"""
database.py
Lightweight SQLite persistence layer for the Supply Chain Network Optimizer.

No ORM is used on purpose: this is a student project, and raw sqlite3 keeps the
data layer easy to read end-to-end. All sample data is FICTIONAL and is only
loosely anchored to real Indian city coordinates so that transportation
distances (and therefore transportation costs) come out realistic.
"""

import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), "supply_chain.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    capacity REAL NOT NULL,
    procurement_cost REAL NOT NULL,
    reliability REAL NOT NULL DEFAULT 0.95,
    active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    capacity REAL NOT NULL,
    production_cost REAL NOT NULL,
    fixed_cost REAL NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    capacity REAL NOT NULL,
    fixed_cost REAL NOT NULL,
    holding_cost REAL NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    is_potential INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    demand REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS last_result (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    payload TEXT NOT NULL
);
"""


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db(reset: bool = False):
    if reset and os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    with get_conn() as conn:
        conn.executescript(SCHEMA)
        cur = conn.execute("SELECT COUNT(*) AS c FROM suppliers")
        if cur.fetchone()["c"] == 0:
            seed(conn)


def seed(conn):
    """Illustrative, internally-consistent fictional dataset.
    Cities are real Indian locations used only to generate realistic
    distances; company/site names are fictional student-project data."""

    suppliers = [
        ("Kaveri Components Pvt Ltd", "Coimbatore, TN", 11.0168, 76.9558, 4200, 182, 0.94),
        ("Deccan Metal Works", "Nagpur, MH", 21.1458, 79.0882, 3600, 175, 0.90),
        ("Ganga Polymers", "Kanpur, UP", 26.4499, 80.3319, 5000, 168, 0.88),
        ("Vindhya Electronics Supply Co.", "Bhopal, MP", 23.2599, 77.4126, 3000, 195, 0.96),
        ("Konkan Fasteners", "Pune, MH", 18.5204, 73.8567, 3800, 179, 0.92),
    ]

    plants = [
        ("Ashoka Assembly Plant", "Pune, MH", 18.5204, 73.8567, 6000, 240, 18000),
        ("Sahyadri Manufacturing Unit", "Nashik, MH", 19.9975, 73.7898, 4800, 232, 15500),
        ("Godavari Production Center", "Hyderabad, TS", 17.3850, 78.4867, 5200, 245, 16800),
    ]

    warehouses = [
        ("North Zone DC - Delhi", "Delhi, DL", 28.7041, 77.1025, 3200, 9200, 6.2, 1, 0),
        ("West Zone DC - Ahmedabad", "Ahmedabad, GJ", 23.0225, 72.5714, 3600, 8600, 5.8, 1, 0),
        ("South Zone DC - Bengaluru", "Bengaluru, KA", 12.9716, 77.5946, 4000, 9800, 6.5, 1, 0),
        ("East Zone DC - Kolkata", "Kolkata, WB", 22.5726, 88.3639, 2800, 8100, 5.5, 1, 0),
        ("Central Reserve DC - Nagpur", "Nagpur, MH", 21.1458, 79.0882, 3000, 7400, 5.0, 0, 1),
    ]

    customers = [
        ("Northern Retail Cluster", "Delhi NCR", 28.6139, 77.2090, 2600),
        ("Western Retail Cluster", "Mumbai, MH", 19.0760, 72.8777, 3100),
        ("Southern Retail Cluster", "Chennai, TN", 13.0827, 80.2707, 2400),
        ("Deccan Retail Cluster", "Bengaluru, KA", 12.9716, 77.5946, 2200),
        ("Eastern Retail Cluster", "Kolkata, WB", 22.5726, 88.3639, 1900),
        ("Central Retail Cluster", "Bhopal, MP", 23.2599, 77.4126, 1500),
    ]

    conn.executemany(
        "INSERT INTO suppliers (name, location, lat, lon, capacity, procurement_cost, reliability) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        suppliers,
    )
    conn.executemany(
        "INSERT INTO plants (name, location, lat, lon, capacity, production_cost, fixed_cost) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        plants,
    )
    conn.executemany(
        "INSERT INTO warehouses (name, location, lat, lon, capacity, fixed_cost, holding_cost, active, is_potential) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        warehouses,
    )
    conn.executemany(
        "INSERT INTO customers (name, location, lat, lon, demand) VALUES (?, ?, ?, ?, ?)",
        customers,
    )
