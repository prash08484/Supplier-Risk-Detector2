import os
import psycopg2
from dotenv import load_dotenv
import streamlit as st

load_dotenv()

def get_db_connection():
    """Get PostgreSQL database connection - handles both local .env and Streamlit Cloud secrets"""
    try:
        # Try Streamlit secrets first (for cloud deployment)
        if hasattr(st, 'secrets') and 'database' in st.secrets:
            conn = psycopg2.connect(
                host=st.secrets["database"]["DB_HOST"],
                port=st.secrets["database"]["DB_PORT"],
                dbname=st.secrets["database"]["DB_NAME"],
                user=st.secrets["database"]["DB_USER"],
                password=st.secrets["database"]["DB_PASS"]
            )
        else:
            # Fallback to environment variables (for local development)
            conn = psycopg2.connect(
                host=os.getenv("DB_HOST"),
                port=os.getenv("DB_PORT"),
                dbname=os.getenv("DB_NAME"),
                user=os.getenv("DB_USER"),
                password=os.getenv("DB_PASS")
            )
        return conn
    except Exception as e:
        st.error(f"Database connection failed: {str(e)}")
        st.error("Please check your database credentials in Streamlit Cloud secrets or local .env file")
        return None

def get_center(center_id):
    """Get Walmart center information by ID"""
    conn = get_db_connection()
    if conn is None:
        return None
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, name, lat, lon FROM centers WHERE id = %s", (center_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        return row
    except Exception as e:
        st.error(f"Error fetching center data: {str(e)}")
        return None

def get_all_centers():
    """Get all Walmart centers"""
    conn = get_db_connection()
    if conn is None:
        return []
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, name, lat, lon FROM centers ORDER BY id")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return rows
    except Exception as e:
        st.error(f"Error fetching all centers data: {str(e)}")
        return []

def get_shops():
    """Get all shops with risk analysis"""
    conn = get_db_connection()
    if conn is None:
        return []
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, name, lat, lon, risk, analysis FROM shops")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return rows
    except Exception as e:
        st.error(f"Error fetching shops data: {str(e)}")
        return []

def get_shops_by_risk(risk_level):
    """Get shops filtered by risk level"""
    conn = get_db_connection()
    if conn is None:
        return []
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, name, lat, lon, risk, analysis FROM shops WHERE risk = %s", (risk_level,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return rows
    except Exception as e:
        st.error(f"Error fetching filtered shops data: {str(e)}")
        return []

def get_shop_by_id(shop_id):
    """Get specific shop by ID"""
    conn = get_db_connection()
    if conn is None:
        return None
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, name, lat, lon, risk, analysis FROM shops WHERE id = %s", (shop_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        return row
    except Exception as e:
        st.error(f"Error fetching shop data: {str(e)}")
        return None