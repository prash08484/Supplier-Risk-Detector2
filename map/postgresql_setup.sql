-- Walmart Risk Detection Database Setup
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
(1, 'Walmart Supercenter Dallas', 32.7767, -96.797),
(2, 'Walmart Supercenter Houston', 29.7604, -95.3698),
(3, 'Walmart Supercenter Phoenix', 33.4484, -112.074),
(4, 'Walmart Supercenter Chicago', 41.8781, -87.6298),
(5, 'Walmart Supercenter Miami', 25.7617, -80.1918),
(6, 'Walmart Supercenter Los Angeles', 34.0522, -118.2437),
(7, 'Walmart Supercenter New York', 40.7128, -74.006),
(8, 'Walmart Supercenter San Antonio', 29.4241, -98.4936),
(9, 'Walmart Supercenter San Diego', 32.7157, -117.1611),
(10, 'Walmart Supercenter Philadelphia', 39.9526, -75.1652),
(11, 'Walmart Supercenter Jacksonville', 30.3322, -81.6557),
(12, 'Walmart Supercenter Austin', 30.2672, -97.7431),
(13, 'Walmart Supercenter Columbus', 39.9612, -82.9988),
(14, 'Walmart Supercenter Fort Worth', 32.7555, -97.3308),
(15, 'Walmart Supercenter Charlotte', 35.2271, -80.8431),
(16, 'Walmart Supercenter Indianapolis', 39.7684, -86.1581),
(17, 'Walmart Supercenter San Francisco', 37.7749, -122.4194),
(18, 'Walmart Supercenter Seattle', 47.6062, -122.3321),
(19, 'Walmart Supercenter Denver', 39.7392, -104.9903),
(20, 'Walmart Supercenter Boston', 42.3601, -71.0589),
(21, 'Walmart Supercenter El Paso', 31.7619, -106.485),
(22, 'Walmart Supercenter Nashville', 36.1627, -86.7816),
(23, 'Walmart Supercenter Oklahoma City', 35.4676, -97.5164),
(24, 'Walmart Supercenter Portland', 45.5152, -122.6784),
(25, 'Walmart Supercenter Las Vegas', 36.1699, -115.1398),
(26, 'Walmart Supercenter Detroit', 42.3314, -83.0458),
(27, 'Walmart Supercenter Memphis', 35.1495, -90.049),
(28, 'Walmart Supercenter Louisville', 38.2527, -85.7585),
(29, 'Walmart Supercenter Baltimore', 39.2904, -76.6122),
(30, 'Walmart Supercenter Milwaukee', 43.0389, -87.9065),
(31, 'Walmart Supercenter Albuquerque', 35.0844, -106.6504),
(32, 'Walmart Supercenter Tucson', 32.2226, -110.9747),
(33, 'Walmart Supercenter Fresno', 36.7378, -119.7871),
(34, 'Walmart Supercenter Sacramento', 38.5816, -121.4944),
(35, 'Walmart Supercenter Kansas City', 39.0997, -94.5786),
(36, 'Walmart Supercenter Mesa', 33.4152, -111.8315),
(37, 'Walmart Supercenter Atlanta', 33.749, -84.388),
(38, 'Walmart Supercenter Virginia Beach', 36.8529, -75.978),
(39, 'Walmart Supercenter Omaha', 41.2565, -95.9345),
(40, 'Walmart Supercenter Colorado Springs', 38.8339, -104.8214),
(41, 'Walmart Supercenter Raleigh', 35.7796, -78.6382),
(42, 'Walmart Supercenter Long Beach', 33.7701, -118.1937),
(43, 'Walmart Supercenter Minneapolis', 44.9778, -93.265),
(44, 'Walmart Supercenter Tampa', 27.9506, -82.4572),
(45, 'Walmart Supercenter New Orleans', 29.9511, -90.0715),
(46, 'Walmart Supercenter Cleveland', 41.4993, -81.6944),
(47, 'Walmart Supercenter Wichita', 37.6872, -97.3301),
(48, 'Walmart Supercenter Arlington', 32.7357, -97.1081),
(49, 'Walmart Supercenter Bakersfield', 35.3733, -119.0187),
(50, 'Walmart Supercenter Orlando', 28.5383, -81.3792);

-- Insert supplier shops (30 shops for demo - first 3 centers)
INSERT INTO shops (id, name, lat, lon, risk, analysis) VALUES
(1, 'Tech Electronics Store', 32.785, -96.8, 'high', 'High risk due to inventory discrepancies and frequent supplier delays. Recent audit revealed 15% shortage in electronics inventory.'),
(2, 'Fresh Grocery Mart', 32.77, -96.78, 'low', 'Low risk supplier with excellent track record. 99.2% on-time delivery rate, consistent quality standards.'),
(3, 'Fashion Outlet Center', 32.79, -96.81, 'medium', 'Medium risk due to seasonal demand fluctuations and occasional quality control issues.'),
(4, 'Auto Parts Warehouse', 32.76, -96.79, 'high', 'High risk supplier with safety compliance concerns. Failed 2 safety inspections, delayed shipments affecting 12% of orders.'),
(5, 'Home & Garden Supply', 32.775, -96.785, 'low', 'Excellent supplier performance with sustainable practices. LEED certified facilities, 98% accuracy rate.'),
(6, 'Sports Equipment Co', 32.782, -96.805, 'medium', 'Moderate risk due to limited production capacity during peak seasons. Good quality standards but struggles with volume demands.'),
(7, 'Beauty & Personal Care', 32.768, -96.775, 'low', 'Reliable supplier with FDA compliance and quality certifications. Strong brand portfolio, consistent delivery.'),
(8, 'Pharmacy Supplies Inc', 32.788, -96.798, 'high', 'Critical risk due to regulatory compliance issues. DEA license under review, temperature control failures.'),
(9, 'Toys & Games Distributor', 32.772, -96.802, 'medium', 'Medium risk supplier with seasonal performance variations. Strong Q4 performance but struggles in off-seasons.'),
(10, 'Office Supplies Hub', 32.78, -96.792, 'low', 'Consistent low-risk supplier with B2B specialization. Excellent bulk order handling, digital integration capabilities.'),
(11, 'Energy Tech Solutions', 29.77, -95.38, 'medium', 'Medium risk supplier specializing in oil & gas technology. Seasonal performance fluctuations tied to energy market.'),
(12, 'Gulf Coast Seafood', 29.75, -95.36, 'low', 'Excellent seafood supplier with sustainable fishing practices. FDA compliant, temperature-controlled logistics.'),
(13, 'Petroleum Equipment Co', 29.765, -95.375, 'high', 'High risk due to safety compliance issues in petroleum equipment. Recent OSHA violations, product recalls.'),
(14, 'Houston Medical Supplies', 29.758, -95.372, 'low', 'Reliable medical supplier with excellent regulatory compliance. FDA approved facilities, sterile processing capabilities.'),
(15, 'Tex-Mex Food Distributors', 29.762, -95.368, 'medium', 'Regional food distributor with moderate risk profile. Good local market knowledge but limited cold chain.'),
(16, 'Industrial Hardware Store', 29.775, -95.38, 'high', 'High risk supplier with quality control issues. Failed safety testing on 12% of products, customer complaints.'),
(17, 'Space City Electronics', 29.752, -95.365, 'medium', 'Technology supplier with aerospace industry connections. Good innovation capabilities but capacity constraints.'),
(18, 'Bayou Outdoor Gear', 29.768, -95.378, 'low', 'Outdoor equipment supplier with strong local presence. Excellent customer service, knowledgeable staff.'),
(19, 'Chemical Supply Company', 29.76, -95.37, 'high', 'Critical risk due to hazardous materials handling violations. EPA citations, improper storage procedures.'),
(20, 'Houston Fashion House', 29.772, -95.382, 'low', 'Fashion distributor with strong regional brand portfolio. Consistent delivery performance, trend forecasting.'),
(21, 'Desert Tech Components', 33.455, -112.08, 'medium', 'Technology supplier specializing in heat-resistant components. Good product quality but limited production capacity.'),
(22, 'Cactus Fresh Produce', 33.44, -112.068, 'low', 'Excellent produce supplier with sustainable farming practices. Water-efficient growing methods, organic certifications.'),
(23, 'Southwest Mining Supply', 33.452, -112.082, 'high', 'High risk mining equipment supplier. Safety violations, equipment failure rate 15% above industry standard.'),
(24, 'Arizona Solar Equipment', 33.446, -112.072, 'low', 'Solar technology supplier with excellent growth potential. Clean energy focus, government certifications.'),
(25, 'Desert Automotive Parts', 33.458, -112.076, 'medium', 'Regional automotive supplier with moderate risk profile. Good local market coverage but limited inventory management.'),
(26, 'Phoenix Sporting Goods', 33.442, -112.07, 'low', 'Outdoor recreation supplier with strong desert sports focus. Excellent product knowledge, seasonal inventory planning.'),
(27, 'Grand Canyon Outfitters', 33.454, -112.084, 'medium', 'Tourism-focused supplier with seasonal business variations. Strong product quality but cash flow concerns.'),
(28, 'Southwestern Textiles', 33.448, -112.078, 'high', 'Textile supplier with quality control issues. Customer complaints about fabric durability, color fastness problems.'),
(29, 'Arizona Health Products', 33.45, -112.08, 'low', 'Health supplement supplier with strong regulatory compliance. FDA approved facilities, quality testing protocols.'),
(30, 'Desert Home Improvement', 33.456, -112.072, 'medium', 'Construction supply company with moderate risk factors. Good local contractor relationships but inventory turnover concerns.');

-- Reset sequences
SELECT setval('centers_id_seq', (SELECT MAX(id) FROM centers));
SELECT setval('shops_id_seq', (SELECT MAX(id) FROM shops));
