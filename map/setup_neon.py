#!/usr/bin/env python3
"""
Neon PostgreSQL setup script for Walmart Risk Detection System
Creates tables and inserts sample data into Neon database
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def setup_neon_database():
    """Set up tables and data in Neon PostgreSQL database"""
    try:
        # Connect to Neon database
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            sslmode='require'
        )
        
        cursor = conn.cursor()
        
        # Drop existing tables if they exist (for fresh setup)
        cursor.execute("DROP TABLE IF EXISTS shops CASCADE")
        cursor.execute("DROP TABLE IF EXISTS centers CASCADE")
        
        # Create centers table
        cursor.execute("""
        CREATE TABLE centers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            lat DECIMAL(10, 6) NOT NULL,
            lon DECIMAL(10, 6) NOT NULL
        )
        """)
        
        # Create shops table
        cursor.execute("""
        CREATE TABLE shops (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            lat DECIMAL(10, 6) NOT NULL,
            lon DECIMAL(10, 6) NOT NULL,
            risk VARCHAR(20) NOT NULL CHECK (risk IN ('low', 'medium', 'high')),
            analysis TEXT NOT NULL
        )
        """)
        
        print("✅ Tables created successfully!")
        
        # Insert 50 Walmart centers across major US cities
        centers_data = [
            (1, "Walmart Supercenter Dallas", 32.7767, -96.7970),
            (2, "Walmart Supercenter Houston", 29.7604, -95.3698),
            (3, "Walmart Supercenter Phoenix", 33.4484, -112.0740),
            (4, "Walmart Supercenter Chicago", 41.8781, -87.6298),
            (5, "Walmart Supercenter Miami", 25.7617, -80.1918),
            (6, "Walmart Supercenter Los Angeles", 34.0522, -118.2437),
            (7, "Walmart Supercenter New York", 40.7128, -74.0060),
            (8, "Walmart Supercenter San Antonio", 29.4241, -98.4936),
            (9, "Walmart Supercenter San Diego", 32.7157, -117.1611),
            (10, "Walmart Supercenter Philadelphia", 39.9526, -75.1652),
            (11, "Walmart Supercenter Jacksonville", 30.3322, -81.6557),
            (12, "Walmart Supercenter Austin", 30.2672, -97.7431),
            (13, "Walmart Supercenter Columbus", 39.9612, -82.9988),
            (14, "Walmart Supercenter Fort Worth", 32.7555, -97.3308),
            (15, "Walmart Supercenter Charlotte", 35.2271, -80.8431),
            (16, "Walmart Supercenter Indianapolis", 39.7684, -86.1581),
            (17, "Walmart Supercenter San Francisco", 37.7749, -122.4194),
            (18, "Walmart Supercenter Seattle", 47.6062, -122.3321),
            (19, "Walmart Supercenter Denver", 39.7392, -104.9903),
            (20, "Walmart Supercenter Boston", 42.3601, -71.0589),
            (21, "Walmart Supercenter El Paso", 31.7619, -106.4850),
            (22, "Walmart Supercenter Nashville", 36.1627, -86.7816),
            (23, "Walmart Supercenter Oklahoma City", 35.4676, -97.5164),
            (24, "Walmart Supercenter Portland", 45.5152, -122.6784),
            (25, "Walmart Supercenter Las Vegas", 36.1699, -115.1398),
            (26, "Walmart Supercenter Detroit", 42.3314, -83.0458),
            (27, "Walmart Supercenter Memphis", 35.1495, -90.0490),
            (28, "Walmart Supercenter Louisville", 38.2527, -85.7585),
            (29, "Walmart Supercenter Baltimore", 39.2904, -76.6122),
            (30, "Walmart Supercenter Milwaukee", 43.0389, -87.9065),
            (31, "Walmart Supercenter Albuquerque", 35.0844, -106.6504),
            (32, "Walmart Supercenter Tucson", 32.2226, -110.9747),
            (33, "Walmart Supercenter Fresno", 36.7378, -119.7871),
            (34, "Walmart Supercenter Sacramento", 38.5816, -121.4944),
            (35, "Walmart Supercenter Kansas City", 39.0997, -94.5786),
            (36, "Walmart Supercenter Mesa", 33.4152, -111.8315),
            (37, "Walmart Supercenter Atlanta", 33.7490, -84.3880),
            (38, "Walmart Supercenter Virginia Beach", 36.8529, -75.9780),
            (39, "Walmart Supercenter Omaha", 41.2565, -95.9345),
            (40, "Walmart Supercenter Colorado Springs", 38.8339, -104.8214),
            (41, "Walmart Supercenter Raleigh", 35.7796, -78.6382),
            (42, "Walmart Supercenter Long Beach", 33.7701, -118.1937),
            (43, "Walmart Supercenter Minneapolis", 44.9778, -93.2650),
            (44, "Walmart Supercenter Tampa", 27.9506, -82.4572),
            (45, "Walmart Supercenter New Orleans", 29.9511, -90.0715),
            (46, "Walmart Supercenter Cleveland", 41.4993, -81.6944),
            (47, "Walmart Supercenter Wichita", 37.6872, -97.3301),
            (48, "Walmart Supercenter Arlington", 32.7357, -97.1081),
            (49, "Walmart Supercenter Bakersfield", 35.3733, -119.0187),
            (50, "Walmart Supercenter Orlando", 28.5383, -81.3792)
        ]
        
        cursor.executemany(
            "INSERT INTO centers (id, name, lat, lon) VALUES (%s, %s, %s, %s)",
            centers_data
        )
        
        print("✅ Walmart centers data inserted!")
        
        # Insert suppliers for first 3 Walmart centers (30 shops total for demo)
        shops_data = [
            # Dallas Center Suppliers (IDs 1-10)
            (1, "Tech Electronics Store", 32.7850, -96.8000, "high", 
             "High risk due to inventory discrepancies and frequent supplier delays. Recent audit revealed 15% shortage in electronics inventory. Supplier reliability score: 2.3/10. Recommended actions: Immediate supplier review, enhanced tracking systems, daily inventory audits."),
            (2, "Fresh Grocery Mart", 32.7700, -96.7800, "low", 
             "Low risk supplier with excellent track record. 99.2% on-time delivery rate, consistent quality standards, and strong financial position. Regular certifications up to date. Recommended for expanded partnership."),
            (3, "Fashion Outlet Center", 32.7900, -96.8100, "medium", 
             "Medium risk due to seasonal demand fluctuations and occasional quality control issues. 85% delivery performance, some customer complaints about fabric quality. Requires quarterly quality assessments and demand forecasting improvements."),
            (4, "Auto Parts Warehouse", 32.7600, -96.7900, "high", 
             "High risk supplier with safety compliance concerns. Failed 2 safety inspections, delayed shipments affecting 12% of orders. Financial instability detected. Immediate corrective actions required: safety audit, financial review, alternative supplier sourcing."),
            (5, "Home & Garden Supply", 32.7750, -96.7850, "low", 
             "Excellent supplier performance with sustainable practices. LEED certified facilities, 98% accuracy rate, strong ESG compliance. Innovation partnership potential in eco-friendly products."),
            (6, "Sports Equipment Co", 32.7820, -96.8050, "medium", 
             "Moderate risk due to limited production capacity during peak seasons. Good quality standards but struggles with volume demands during holidays. Capacity planning and backup supplier arrangements recommended."),
            (7, "Beauty & Personal Care", 32.7680, -96.7750, "low", 
             "Reliable supplier with FDA compliance and quality certifications. Strong brand portfolio, consistent delivery, competitive pricing. Suitable for long-term strategic partnership."),
            (8, "Pharmacy Supplies Inc", 32.7880, -96.7980, "high", 
             "Critical risk due to regulatory compliance issues. DEA license under review, temperature control failures in 3 shipments. Patient safety concerns identified. Immediate suspension recommended pending full compliance audit."),
            (9, "Toys & Games Distributor", 32.7720, -96.8020, "medium", 
             "Medium risk supplier with seasonal performance variations. Strong Q4 performance but struggles in off-seasons. Safety testing compliance good, but inventory management needs improvement."),
            (10, "Office Supplies Hub", 32.7800, -96.7920, "low", 
             "Consistent low-risk supplier with B2B specialization. Excellent bulk order handling, digital integration capabilities, competitive pricing. Recommended for expanded office supplies category."),
            
            # Houston Center Suppliers (IDs 11-20)
            (11, "Energy Tech Solutions", 29.7700, -95.3800, "medium", 
             "Medium risk supplier specializing in oil & gas technology. Seasonal performance fluctuations tied to energy market. Strong technical capabilities but financial stability concerns during market downturns."),
            (12, "Gulf Coast Seafood", 29.7500, -95.3600, "low", 
             "Excellent seafood supplier with sustainable fishing practices. FDA compliant, temperature-controlled logistics, consistent quality. Strong relationships with local fishing industry."),
            (13, "Petroleum Equipment Co", 29.7650, -95.3750, "high", 
             "High risk due to safety compliance issues in petroleum equipment. Recent OSHA violations, product recalls affecting 8% of inventory. Requires immediate safety audit and compliance review."),
            (14, "Houston Medical Supplies", 29.7580, -95.3720, "low", 
             "Reliable medical supplier with excellent regulatory compliance. FDA approved facilities, sterile processing capabilities, emergency response protocols in place."),
            (15, "Tex-Mex Food Distributors", 29.7620, -95.3680, "medium", 
             "Regional food distributor with moderate risk profile. Good local market knowledge but limited cold chain infrastructure. Seasonal demand variations affect delivery performance."),
            (16, "Industrial Hardware Store", 29.7750, -95.3800, "high", 
             "High risk supplier with quality control issues. Failed safety testing on 12% of products, customer complaints about defective tools. Immediate quality review required."),
            (17, "Space City Electronics", 29.7520, -95.3650, "medium", 
             "Technology supplier with aerospace industry connections. Good innovation capabilities but struggles with commercial scale production. Capacity constraints during peak periods."),
            (18, "Bayou Outdoor Gear", 29.7680, -95.3780, "low", 
             "Outdoor equipment supplier with strong local presence. Excellent customer service, knowledgeable staff, consistent inventory levels. Suitable for sporting goods expansion."),
            (19, "Chemical Supply Company", 29.7600, -95.3700, "high", 
             "Critical risk due to hazardous materials handling violations. EPA citations, improper storage procedures, worker safety concerns. Requires immediate suspension pending compliance audit."),
            (20, "Houston Fashion House", 29.7720, -95.3820, "low", 
             "Fashion distributor with strong regional brand portfolio. Consistent delivery performance, trend forecasting capabilities, sustainable sourcing practices."),
            
            # Phoenix Center Suppliers (IDs 21-30)
            (21, "Desert Tech Components", 33.4550, -112.0800, "medium", 
             "Technology supplier specializing in heat-resistant components. Good product quality but limited production capacity. Seasonal manufacturing delays during extreme heat periods."),
            (22, "Cactus Fresh Produce", 33.4400, -112.0680, "low", 
             "Excellent produce supplier with sustainable farming practices. Water-efficient growing methods, organic certifications, consistent quality year-round."),
            (23, "Southwest Mining Supply", 33.4520, -112.0820, "high", 
             "High risk mining equipment supplier. Safety violations, equipment failure rate 15% above industry standard. Environmental compliance concerns require immediate attention."),
            (24, "Arizona Solar Equipment", 33.4460, -112.0720, "low", 
             "Solar technology supplier with excellent growth potential. Clean energy focus, government certifications, strong installation support network."),
            (25, "Desert Automotive Parts", 33.4580, -112.0760, "medium", 
             "Regional automotive supplier with moderate risk profile. Good local market coverage but limited inventory management systems. Requires supply chain optimization."),
            (26, "Phoenix Sporting Goods", 33.4420, -112.0700, "low", 
             "Outdoor recreation supplier with strong desert sports focus. Excellent product knowledge, seasonal inventory planning, growing customer base."),
            (27, "Grand Canyon Outfitters", 33.4540, -112.0840, "medium", 
             "Tourism-focused supplier with seasonal business variations. Strong product quality but cash flow concerns during off-season. Requires financial stability review."),
            (28, "Southwestern Textiles", 33.4480, -112.0780, "high", 
             "Textile supplier with quality control issues. Customer complaints about fabric durability, color fastness problems. Production line inspection required."),
            (29, "Arizona Health Products", 33.4500, -112.0800, "low", 
             "Health supplement supplier with strong regulatory compliance. FDA approved facilities, quality testing protocols, consistent product standards."),
            (30, "Desert Home Improvement", 33.4560, -112.0720, "medium", 
             "Construction supply company with moderate risk factors. Good local contractor relationships but inventory turnover concerns. Seasonal demand management needed.")
        ]
        
        cursor.executemany(
            "INSERT INTO shops (id, name, lat, lon, risk, analysis) VALUES (%s, %s, %s, %s, %s, %s)",
            shops_data
        )
        
        print("✅ Shops data inserted!")
        
        # Reset sequences to match inserted IDs
        cursor.execute("SELECT setval('centers_id_seq', (SELECT MAX(id) FROM centers))")
        cursor.execute("SELECT setval('shops_id_seq', (SELECT MAX(id) FROM shops))")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("\n🎉 Neon PostgreSQL database setup completed successfully!")
        print("📊 Sample data loaded:")
        print(f"   - {len(centers_data)} Walmart Centers")
        print(f"   - {len(shops_data)} Supplier Shops")
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_neon_connection():
    """Test the Neon database connection"""
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            sslmode='require'
        )
        cursor = conn.cursor()
        
        # Test queries
        cursor.execute("SELECT COUNT(*) FROM centers")
        centers_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM shops")
        shops_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT name FROM centers LIMIT 1")
        sample_center = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        print(f"\n🔗 Neon database connection successful!")
        print(f"📍 Centers in database: {centers_count}")
        print(f"🏪 Shops in database: {shops_count}")
        print(f"📋 Sample center: {sample_center}")
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Connection test failed: {e}")
        return False

if __name__ == "__main__":
    print("🏪 Walmart Risk Detection - Neon PostgreSQL Setup")
    print("=" * 55)
    
    print("🚀 Setting up Neon PostgreSQL database...")
    
    if setup_neon_database():
        if test_neon_connection():
            print("\n✅ Setup completed! Your Streamlit app is ready to run:")
            print("   streamlit run app.py")
        else:
            print("\n⚠️ Setup completed but connection test failed")
    else:
        print("\n❌ Setup failed")
