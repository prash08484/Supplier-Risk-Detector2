#!/usr/bin/env python3
"""
Database setup script for Walmart Risk Detection System
Creates sample data for hackathon demo
"""

import sqlite3
import os

def create_sqlite_database():
    """Create SQLite database with sample data"""
    db_path = "walmart_risk.db"
    
    # Remove existing database
    if os.path.exists(db_path):
        os.remove(db_path)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create centers table
    cursor.execute("""
    CREATE TABLE centers (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL
    )
    """)
    
    # Create shops table
    cursor.execute("""
    CREATE TABLE shops (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        risk TEXT NOT NULL,
        analysis TEXT NOT NULL
    )
    """)
    
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
    
    cursor.executemany("INSERT INTO centers (id, name, lat, lon) VALUES (?, ?, ?, ?)", centers_data)
    
    # Insert suppliers for first 10 Walmart centers (10 shops per center = 100 total)
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
         "Construction supply company with moderate risk factors. Good local contractor relationships but inventory turnover concerns. Seasonal demand management needed."),
        
        # Chicago Center Suppliers (IDs 31-40)
        (31, "Windy City Electronics", 41.8850, -87.6350, "medium", 
         "Electronics distributor with Midwest market focus. Good product range but pricing competitiveness concerns. Requires market analysis and pricing strategy review."),
        (32, "Great Lakes Fresh Foods", 41.8720, -87.6250, "low", 
         "Fresh food supplier with excellent cold chain management. Sustainable sourcing, local farm partnerships, consistent quality standards."),
        (33, "Steel City Industrial", 41.8800, -87.6320, "high", 
         "Industrial supplier with heavy machinery focus. Safety compliance issues, worker injury incidents, equipment maintenance concerns. Immediate safety audit required."),
        (34, "Chicago Medical Center", 41.8760, -87.6280, "low", 
         "Medical equipment supplier with hospital-grade standards. Sterile processing, emergency delivery capabilities, excellent regulatory compliance record."),
        (35, "Midwest Agricultural Supply", 41.8820, -87.6340, "medium", 
         "Agricultural equipment and supplies distributor. Strong rural market connections but seasonal cash flow variations. Financial stability monitoring recommended."),
        (36, "Lake Shore Sporting Goods", 41.8740, -87.6260, "low", 
         "Sporting goods supplier with Great Lakes recreation focus. Excellent seasonal planning, water sports expertise, growing market share."),
        (37, "Chicago Fashion District", 41.8880, -87.6380, "medium", 
         "Fashion distributor with urban market focus. Good trend awareness but inventory management challenges. Requires supply chain optimization."),
        (38, "Industrial Chemical Corp", 41.8810, -87.6330, "high", 
         "Chemical supplier with environmental compliance violations. EPA citations, waste disposal issues, community safety concerns. Requires immediate environmental audit."),
        (39, "Windy City Home & Garden", 41.8770, -87.6290, "low", 
         "Home improvement supplier with strong DIY market presence. Excellent customer service, product knowledge, consistent inventory levels."),
        (40, "Chicago Tech Solutions", 41.8840, -87.6360, "medium", 
         "Technology services supplier with innovation focus. Good technical capabilities but scalability concerns. Requires capacity assessment."),
        
        # Miami Center Suppliers (IDs 41-50)
        (41, "Ocean View Electronics", 25.7680, -80.1980, "medium", 
         "Electronics supplier with Latin American market connections. Good international sourcing but import compliance concerns. Customs documentation review needed."),
        (42, "Tropical Fresh Market", 25.7550, -80.1850, "low", 
         "Fresh produce supplier with Caribbean connections. Excellent tropical fruit sourcing, sustainable practices, consistent quality standards."),
        (43, "Miami Beach Fashion", 25.7640, -80.1920, "low", 
         "Fashion supplier with resort wear specialization. Strong seasonal planning, trend forecasting, excellent customer service ratings."),
        (44, "Port of Miami Logistics", 25.7700, -80.2000, "high", 
         "Logistics provider with cargo handling focus. Safety violations, equipment maintenance issues, worker safety concerns. Port authority review required."),
        (45, "Florida Citrus Distributors", 25.7580, -80.1880, "low", 
         "Citrus supplier with state-wide growing network. Excellent quality control, sustainable farming practices, consistent year-round supply."),
        (46, "South Beach Sporting Goods", 25.7620, -80.1900, "medium", 
         "Water sports equipment supplier with seasonal variations. Strong local market knowledge but inventory management challenges during hurricane season."),
        (47, "Art Deco Home Supplies", 25.7660, -80.1940, "low", 
         "Home décor supplier with unique design focus. Excellent artistic partnerships, consistent quality, growing luxury market presence."),
        (48, "Caribbean Import Co", 25.7720, -80.2020, "high", 
         "Import company with customs compliance issues. Delayed shipments, documentation problems, quality control concerns. Requires immediate compliance review."),
        (49, "Miami Healthcare Products", 25.7600, -80.1860, "low", 
         "Healthcare supplier with bilingual service capabilities. Excellent customer service, regulatory compliance, emergency response protocols."),
        (50, "Sunshine State Electronics", 25.7640, -80.1960, "medium", 
         "Consumer electronics supplier with tourism market focus. Good product range but seasonal demand variations. Requires inventory optimization."),
        
        # Los Angeles Center Suppliers (IDs 51-60)
        (51, "Hollywood Tech Solutions", 34.0600, -118.2500, "medium", 
         "Entertainment technology supplier with film industry connections. Specialized equipment but high maintenance costs. Financial stability review needed."),
        (52, "Pacific Fresh Markets", 34.0450, -118.2350, "low", 
         "Fresh produce supplier with Asian market specialization. Excellent diversity, sustainable sourcing, consistent quality standards."),
        (53, "LA Fashion District", 34.0580, -118.2480, "low", 
         "Fashion supplier with celebrity connections. Trend-setting capabilities, excellent design partnerships, strong brand portfolio."),
        (54, "West Coast Logistics", 34.0520, -118.2420, "high", 
         "Logistics provider with port operations. Traffic congestion issues, delivery delays, environmental compliance concerns. Route optimization required."),
        (55, "California Organic Foods", 34.0460, -118.2380, "low", 
         "Organic food supplier with farm-to-table focus. Excellent sustainability practices, organic certifications, growing market demand."),
        (56, "Beach Sports Equipment", 34.0540, -118.2460, "medium", 
         "Beach and surf equipment supplier. Strong seasonal performance but off-season inventory challenges. Seasonal planning optimization needed."),
        (57, "Wellness Product Co", 34.0480, -118.2400, "low", 
         "Health and wellness supplier with celebrity endorsements. Excellent marketing capabilities, quality products, strong brand recognition."),
        (58, "Entertainment Supplies Inc", 34.0620, -118.2520, "high", 
         "Entertainment industry supplier with safety concerns. Equipment failure incidents, insurance claims, worker safety violations. Safety audit required."),
        (59, "Green Home Solutions", 34.0500, -118.2440, "low", 
         "Eco-friendly home products supplier. Excellent sustainability credentials, green certifications, growing environmental market."),
        (60, "Tech Valley Electronics", 34.0560, -118.2500, "medium", 
         "Consumer electronics with startup connections. Innovation potential but financial stability concerns. Requires venture capital assessment."),
        
        # New York Center Suppliers (IDs 61-70)
        (61, "Empire State Electronics", 40.7200, -74.0100, "medium", 
         "Electronics supplier with Wall Street connections. High-end products but premium pricing concerns. Market positioning review needed."),
        (62, "Brooklyn Fresh Markets", 40.7050, -73.9950, "low", 
         "Urban fresh food supplier with local sourcing. Excellent community connections, sustainable practices, consistent delivery performance."),
        (63, "Manhattan Fashion House", 40.7180, -74.0080, "low", 
         "High-end fashion supplier with runway connections. Excellent design capabilities, luxury market focus, strong brand partnerships."),
        (64, "NYC Logistics Solutions", 40.7150, -74.0020, "high", 
         "Urban logistics provider with traffic challenges. Delivery delays, parking violations, environmental concerns. Urban planning consultation required."),
        (65, "Organic Market Co", 40.7080, -73.9980, "low", 
         "Organic food supplier with health-conscious market focus. Excellent quality standards, nutritional expertise, growing customer base."),
        (66, "Central Park Sports", 40.7120, -74.0040, "medium", 
         "Urban recreation equipment supplier. Good market knowledge but space constraints. Warehouse optimization needed."),
        (67, "Luxury Home Furnishing", 40.7220, -74.0120, "low", 
         "High-end home décor supplier with designer connections. Excellent quality, luxury market expertise, strong customer loyalty."),
        (68, "Broadway Entertainment", 40.7190, -74.0090, "high", 
         "Entertainment industry supplier with union concerns. Labor disputes, equipment rental issues, insurance complications. Labor relations review required."),
        (69, "Manhattan Health Products", 40.7100, -74.0000, "low", 
         "Urban health supplier with pharmacy connections. Excellent regulatory compliance, prescription management, emergency protocols."),
        (70, "Wall Street Tech", 40.7160, -74.0060, "medium", 
         "Financial technology supplier with banking connections. Specialized services but regulatory compliance concerns. Financial audit recommended."),
        
        # San Antonio Center Suppliers (IDs 71-80)
        (71, "Alamo Tech Solutions", 29.4300, -98.5000, "medium", 
         "Regional technology supplier with government contracts. Security clearance capabilities but bureaucratic delays. Process optimization needed."),
        (72, "Hill Country Fresh", 29.4180, -98.4880, "low", 
         "Local produce supplier with ranch connections. Excellent regional sourcing, sustainable practices, consistent seasonal supply."),
        (73, "Fiesta Fashion Co", 29.4260, -98.4960, "low", 
         "Cultural fashion supplier with festival connections. Excellent local market knowledge, seasonal planning, strong community ties."),
        (74, "Texas Transport Services", 29.4320, -98.5020, "high", 
         "Transportation supplier with safety violations. Vehicle maintenance issues, driver safety concerns, insurance claims. Fleet audit required."),
        (75, "Lone Star Foods", 29.4200, -98.4900, "low", 
         "Regional food supplier with BBQ specialization. Excellent local cuisine expertise, quality standards, growing market presence."),
        (76, "River Walk Sports", 29.4240, -98.4940, "medium", 
         "Water recreation supplier with tourism connections. Strong seasonal performance but weather dependency concerns. Diversification recommended."),
        (77, "Mission Home & Garden", 29.4280, -98.4980, "low", 
         "Home improvement supplier with historical restoration focus. Specialized expertise, quality craftsmanship, niche market leadership."),
        (78, "Industrial Supply Co", 29.4340, -98.5040, "high", 
         "Industrial supplier with environmental violations. Waste disposal issues, air quality concerns, regulatory compliance problems. Environmental audit required."),
        (79, "San Antonio Medical", 29.4220, -98.4920, "low", 
         "Medical supplier with military hospital connections. Excellent emergency response, trauma care expertise, consistent quality standards."),
        (80, "Border Tech Solutions", 29.4300, -98.5000, "medium", 
         "Cross-border technology supplier with customs expertise. Good international connections but documentation complexity. Compliance streamlining needed."),
        
        # San Diego Center Suppliers (IDs 81-90)
        (81, "Pacific Coast Electronics", 32.7250, -117.1700, "medium", 
         "Electronics supplier with naval connections. Military-grade products but export control compliance concerns. Security clearance review needed."),
        (82, "Sunset Fresh Markets", 32.7100, -117.1550, "low", 
         "Fresh produce supplier with Mexican border connections. Excellent cross-border logistics, consistent quality, sustainable practices."),
        (83, "Surf City Fashion", 32.7200, -117.1650, "low", 
         "Beach fashion supplier with surf culture connections. Excellent seasonal planning, youth market focus, strong brand partnerships."),
        (84, "Harbor Logistics Inc", 32.7280, -117.1720, "high", 
         "Port logistics provider with cargo handling issues. Equipment breakdowns, worker safety concerns, environmental violations. Port inspection required."),
        (85, "California Cuisine Co", 32.7120, -117.1570, "low", 
         "Gourmet food supplier with farm-to-table focus. Excellent chef partnerships, quality ingredients, sustainable sourcing practices."),
        (86, "Beach Sports Central", 32.7180, -117.1630, "medium", 
         "Water sports equipment with seasonal variations. Strong summer performance but inventory challenges during winter months. Seasonal planning optimization."),
        (87, "Coastal Home Design", 32.7220, -117.1670, "low", 
         "Beach home décor supplier with resort connections. Excellent coastal design expertise, quality furnishings, luxury market presence."),
        (88, "Marine Supply Company", 32.7300, -117.1740, "high", 
         "Marine equipment supplier with safety violations. Coast Guard citations, equipment failure incidents, environmental concerns. Marine safety audit required."),
        (89, "San Diego Health Co", 32.7140, -117.1590, "low", 
         "Health supplier with biotech connections. Excellent research partnerships, innovative products, regulatory compliance expertise."),
        (90, "Border Electronics", 32.7240, -117.1680, "medium", 
         "Cross-border electronics supplier with customs expertise. Good pricing but documentation complexity concerns. Import/export process review needed."),
        
        # Philadelphia Center Suppliers (IDs 91-100)
        (91, "Liberty Bell Electronics", 39.9600, -75.1720, "medium", 
         "Historical city electronics supplier with government connections. Good institutional knowledge but technology upgrade needs. Modernization assessment required."),
        (92, "Philly Fresh Markets", 39.9450, -75.1580, "low", 
         "Urban fresh food supplier with neighborhood connections. Excellent community relationships, local sourcing, consistent delivery performance."),
        (93, "Independence Fashion", 39.9580, -75.1700, "low", 
         "Fashion supplier with historical district connections. Unique market positioning, tourist appeal, quality craftsmanship focus."),
        (94, "Delaware Valley Logistics", 39.9620, -75.1740, "high", 
         "Regional logistics with bridge traffic challenges. Delivery delays, route optimization issues, fuel cost concerns. Transportation planning required."),
        (95, "Brotherly Love Foods", 39.9480, -75.1600, "low", 
         "Local food supplier with cheesesteak specialization. Excellent regional cuisine expertise, quality standards, strong local brand."),
        (96, "City Sports Equipment", 39.9520, -75.1640, "medium", 
         "Urban sports supplier with school district connections. Good educational market but seasonal budget constraints. Contract negotiation optimization needed."),
        (97, "Colonial Home Supplies", 39.9560, -75.1680, "low", 
         "Historical home restoration supplier. Specialized expertise, authentic materials, preservation market leadership."),
        (98, "Industrial Delaware Co", 39.9640, -75.1760, "high", 
         "Industrial supplier with environmental compliance issues. Chemical storage violations, worker safety concerns, EPA citations. Environmental compliance audit required."),
        (99, "Philadelphia Medical", 39.9500, -75.1620, "low", 
         "Medical supplier with university hospital connections. Excellent research partnerships, innovative products, regulatory expertise."),
        (100, "Liberty Technology", 39.9580, -75.1700, "medium", 
         "Technology supplier with startup incubator connections. Innovation potential but scalability concerns. Growth strategy assessment needed.")
    ]
    
    cursor.executemany("INSERT INTO shops (id, name, lat, lon, risk, analysis) VALUES (?, ?, ?, ?, ?, ?)", shops_data)
    
    conn.commit()
    conn.close()
    
    print("✅ SQLite database created successfully!")
    print(f"📍 Database location: {os.path.abspath(db_path)}")
    print("📊 Sample data loaded:")
    print(f"   - {len(centers_data)} Walmart Centers")
    print(f"   - {len(shops_data)} Supplier Shops")
    
def create_postgresql_setup():
    """Create PostgreSQL setup SQL file using the same data as SQLite"""
    
    # Use the same data arrays as the SQLite function
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
    
    # Start building SQL content
    sql_content = """-- Walmart Risk Detection Database Setup
-- Run this in PostgreSQL after creating database

-- Create centers table
CREATE TABLE IF NOT EXISTS centers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    lat DECIMAL(10, 6) NOT NULL,
    lon DECIMAL(10, 6) NOT NULL
);

-- Create shops table  
CREATE TABLE IF NOT EXISTS shops (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    lat DECIMAL(10, 6) NOT NULL,
    lon DECIMAL(10, 6) NOT NULL,
    risk VARCHAR(20) NOT NULL CHECK (risk IN ('low', 'medium', 'high')),
    analysis TEXT NOT NULL
);

-- Insert Walmart centers (50 locations)
INSERT INTO centers (id, name, lat, lon) VALUES
"""
    
    # Add centers data
    center_values = []
    for center in centers_data:
        center_values.append(f"({center[0]}, '{center[1]}', {center[2]}, {center[3]})")
    
    sql_content += ",\n".join(center_values) + ";\n\n"
    
    # Add shops data (first 30 shops for PostgreSQL demo)
    sql_content += """-- Insert supplier shops (30 shops for demo - first 3 centers)
INSERT INTO shops (id, name, lat, lon, risk, analysis) VALUES
"""
    
    # Use same shops data as setup_neon.py (first 30 shops)
    shops_demo = [
        (1, "Tech Electronics Store", 32.7850, -96.8000, "high", "High risk due to inventory discrepancies and frequent supplier delays. Recent audit revealed 15% shortage in electronics inventory."),
        (2, "Fresh Grocery Mart", 32.7700, -96.7800, "low", "Low risk supplier with excellent track record. 99.2% on-time delivery rate, consistent quality standards."),
        (3, "Fashion Outlet Center", 32.7900, -96.8100, "medium", "Medium risk due to seasonal demand fluctuations and occasional quality control issues."),
        (4, "Auto Parts Warehouse", 32.7600, -96.7900, "high", "High risk supplier with safety compliance concerns. Failed 2 safety inspections, delayed shipments affecting 12% of orders."),
        (5, "Home & Garden Supply", 32.7750, -96.7850, "low", "Excellent supplier performance with sustainable practices. LEED certified facilities, 98% accuracy rate."),
        (6, "Sports Equipment Co", 32.7820, -96.8050, "medium", "Moderate risk due to limited production capacity during peak seasons. Good quality standards but struggles with volume demands."),
        (7, "Beauty & Personal Care", 32.7680, -96.7750, "low", "Reliable supplier with FDA compliance and quality certifications. Strong brand portfolio, consistent delivery."),
        (8, "Pharmacy Supplies Inc", 32.7880, -96.7980, "high", "Critical risk due to regulatory compliance issues. DEA license under review, temperature control failures."),
        (9, "Toys & Games Distributor", 32.7720, -96.8020, "medium", "Medium risk supplier with seasonal performance variations. Strong Q4 performance but struggles in off-seasons."),
        (10, "Office Supplies Hub", 32.7800, -96.7920, "low", "Consistent low-risk supplier with B2B specialization. Excellent bulk order handling, digital integration capabilities."),
        # Houston suppliers
        (11, "Energy Tech Solutions", 29.7700, -95.3800, "medium", "Medium risk supplier specializing in oil & gas technology. Seasonal performance fluctuations tied to energy market."),
        (12, "Gulf Coast Seafood", 29.7500, -95.3600, "low", "Excellent seafood supplier with sustainable fishing practices. FDA compliant, temperature-controlled logistics."),
        (13, "Petroleum Equipment Co", 29.7650, -95.3750, "high", "High risk due to safety compliance issues in petroleum equipment. Recent OSHA violations, product recalls."),
        (14, "Houston Medical Supplies", 29.7580, -95.3720, "low", "Reliable medical supplier with excellent regulatory compliance. FDA approved facilities, sterile processing capabilities."),
        (15, "Tex-Mex Food Distributors", 29.7620, -95.3680, "medium", "Regional food distributor with moderate risk profile. Good local market knowledge but limited cold chain."),
        (16, "Industrial Hardware Store", 29.7750, -95.3800, "high", "High risk supplier with quality control issues. Failed safety testing on 12% of products, customer complaints."),
        (17, "Space City Electronics", 29.7520, -95.3650, "medium", "Technology supplier with aerospace industry connections. Good innovation capabilities but capacity constraints."),
        (18, "Bayou Outdoor Gear", 29.7680, -95.3780, "low", "Outdoor equipment supplier with strong local presence. Excellent customer service, knowledgeable staff."),
        (19, "Chemical Supply Company", 29.7600, -95.3700, "high", "Critical risk due to hazardous materials handling violations. EPA citations, improper storage procedures."),
        (20, "Houston Fashion House", 29.7720, -95.3820, "low", "Fashion distributor with strong regional brand portfolio. Consistent delivery performance, trend forecasting."),
        # Phoenix suppliers
        (21, "Desert Tech Components", 33.4550, -112.0800, "medium", "Technology supplier specializing in heat-resistant components. Good product quality but limited production capacity."),
        (22, "Cactus Fresh Produce", 33.4400, -112.0680, "low", "Excellent produce supplier with sustainable farming practices. Water-efficient growing methods, organic certifications."),
        (23, "Southwest Mining Supply", 33.4520, -112.0820, "high", "High risk mining equipment supplier. Safety violations, equipment failure rate 15% above industry standard."),
        (24, "Arizona Solar Equipment", 33.4460, -112.0720, "low", "Solar technology supplier with excellent growth potential. Clean energy focus, government certifications."),
        (25, "Desert Automotive Parts", 33.4580, -112.0760, "medium", "Regional automotive supplier with moderate risk profile. Good local market coverage but limited inventory management."),
        (26, "Phoenix Sporting Goods", 33.4420, -112.0700, "low", "Outdoor recreation supplier with strong desert sports focus. Excellent product knowledge, seasonal inventory planning."),
        (27, "Grand Canyon Outfitters", 33.4540, -112.0840, "medium", "Tourism-focused supplier with seasonal business variations. Strong product quality but cash flow concerns."),
        (28, "Southwestern Textiles", 33.4480, -112.0780, "high", "Textile supplier with quality control issues. Customer complaints about fabric durability, color fastness problems."),
        (29, "Arizona Health Products", 33.4500, -112.0800, "low", "Health supplement supplier with strong regulatory compliance. FDA approved facilities, quality testing protocols."),
        (30, "Desert Home Improvement", 33.4560, -112.0720, "medium", "Construction supply company with moderate risk factors. Good local contractor relationships but inventory turnover concerns.")
    ]
    
    # Add shops values
    shop_values = []
    for shop in shops_demo:
        escaped_analysis = shop[5].replace("'", "''")  # Escape single quotes for SQL
        shop_values.append(f"({shop[0]}, '{shop[1]}', {shop[2]}, {shop[3]}, '{shop[4]}', '{escaped_analysis}')")
    
    sql_content += ",\n".join(shop_values) + ";\n\n"
    
    # Add sequence reset commands
    sql_content += """-- Reset sequences
SELECT setval('centers_id_seq', (SELECT MAX(id) FROM centers));
SELECT setval('shops_id_seq', (SELECT MAX(id) FROM shops));
"""
    
    # Write to file
    with open("postgresql_setup.sql", "w", encoding='utf-8') as f:
        f.write(sql_content)
    
    print("📄 PostgreSQL setup file created: postgresql_setup.sql")
    print(f"   - {len(centers_data)} Walmart Centers")
    print(f"   - {len(shops_demo)} Supplier Shops")

if __name__ == "__main__":
    print("🏪 Walmart Risk Detection Database Setup")
    print("=" * 50)
    
    # Create SQLite database (immediate use)
    create_sqlite_database()
    
    print()
    
    # Create PostgreSQL setup file
    create_postgresql_setup()
    
    print("\n🎯 Next Steps:")
    print("1. For immediate testing: Use SQLite (already created)")
    print("2. For PostgreSQL: Run the postgresql_setup.sql file in your PostgreSQL database")
