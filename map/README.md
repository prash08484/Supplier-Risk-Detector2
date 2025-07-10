# 🛡️ Walmart Risk Detection App - Enhanced Edition

> **🌐 Interactive Risk Analysis with Path Visualization and Distance Calculations**

A professional interactive web application for visualizing and analyzing risk factors associated with **50 Walmart distribution centers** and their **supplier network of 100+ shops**. Built with Streamlit and featuring real-time map visualization, path routing to nearest centers, and comprehensive distance analysis.

[![🚀 Live Demo](https://img.shields.io/badge/🚀-Live%20Demo-success?style=for-the-badge)](https://geo-location-analysis.streamlit.app/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.28+-red.svg)](https://streamlit.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue.svg)](https://postgresql.org)

## 🎯 Project Overview

This application provides a comprehensive risk assessment dashboard for Walmart's supply chain operations, featuring **50 Walmart centers** and **100+ shops** with advanced interactive capabilities:

- **🏪 50 Walmart Centers**: Complete network of distribution centers across the US
- **🏬 100+ Supplier Shops**: Comprehensive supplier network with risk assessments
- **🛣️ Path Visualization**: Purple lines showing routes to **nearest** Walmart center only
- **📏 Distance on Map**: Real-time distance calculations displayed directly on purple path (km only)
- **🎯 Interactive Selection**: Click any shop to see nearest center path and distance
- **📊 Risk Analysis**: Detailed analytics with color-coded risk levels
- **🗺️ Enhanced Mapping**: Professional dashboard with intuitive interface

## 🚀 Tech Stack

### Frontend
- **Streamlit**: Modern web app framework for the dashboard
- **Folium**: Interactive map visualization
- **Streamlit-Folium**: Seamless integration between Streamlit and Folium maps

### Backend & Database
- **PostgreSQL**: Production database (Neon cloud or local)
- **SQLite**: Development/demo database
- **psycopg2**: PostgreSQL adapter for Python
- **python-dotenv**: Environment variable management

### Additional Libraries
- **Pandas**: Data manipulation and analysis
- **Branca**: Enhanced map styling and elements

## 📊 Features

### 🗺️ Interactive Map with Smart Path Visualization
- **Risk-based Color Coding**: 🔴 Red (High), 🟡 Yellow (Medium), 🟢 Green (Low)
- **🛣️ Nearest Center Path**: Purple line showing route to closest Walmart center only
- **📏 Distance on Path**: Real-time distance shown directly on purple line (km only)
- **🎯 One-Click Analysis**: Click any shop marker for instant analysis and path display
- **🏪 50 Walmart Centers**: Complete network displayed with blue markers
- **🏬 100+ Supplier Shops**: Comprehensive supplier network with detailed popups
- **Multiple Map Styles**: OpenStreetMap, CartoDB Positron, CartoDB Dark Matter
- **🔍 Quick Selection Buttons**: Easy-to-use shop selection buttons below map

### 📈 Enhanced Analytics Dashboard
- **📊 Real-time Statistics**: Live risk distribution and shop counts
- **🎯 Nearest Center Analysis**: Automatic calculation of closest Walmart center
- **📍 Distance Metrics**: Haversine formula for accurate geographical distances
- **🔄 Interactive Filtering**: Filter by risk level (Low, Medium, High)
- **🧭 Coverage Areas**: 2km radius circles around Walmart centers
- **📋 Detailed Reports**: Comprehensive risk analysis for each location

### 🎮 Interactive Features
- **Click-to-Analyze**: Click any shop marker to see:
  - Purple path line to nearest Walmart center
  - Distance displayed directly on the path (km)
  - Detailed shop information and risk analysis
  - Nearest center identification
- **Quick Selection**: Use shop selection buttons for easy testing
- **Clear Paths**: Reset button to clear all visualizations
- **Map Controls**: Fullscreen mode and measurement tools
- **Professional UI**: Clean sidebar controls and organized layout

### 🔄 Database Flexibility & Expanded Data
- **🏪 50 Walmart Centers**: Comprehensive network across major US cities
- **🏬 100+ Supplier Shops**: Large-scale supplier network with varied risk levels
- **📄 shops_centers.txt**: Complete listing of all centers and shops
- **Dual Database Support**: SQLite for development, PostgreSQL for production
- **Cloud Integration**: Ready for Neon PostgreSQL deployment
- **Realistic Data**: Pre-loaded with authentic-looking locations and analyses

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- pip package manager
- PostgreSQL (optional, for production setup)

### 1. Clone or Download the Project
```bash
# Navigate to your project directory
cd "c:\Users\prash\OneDrive\Desktop\Prash08484\Entire-Project"
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Database Setup

#### Option A: Quick Start (SQLite)
```bash
python setup_database.py
```
This creates a local SQLite database with sample data for immediate testing.

#### Option B: PostgreSQL Local Setup
```bash
python setup_postgres.py
```
Requires local PostgreSQL installation.

#### Option C: Neon Cloud Setup (Recommended for Production)
1. Create a free account at [Neon.tech](https://neon.tech)
2. Create a new database
3. Update `.env` file with your Neon credentials:
```
DATABASE_URL=postgresql://username:password@hostname/database
DB_HOST=your-hostname
DB_NAME=your-database
DB_USER=your-username
DB_PASSWORD=your-password
DB_PORT=5432
```
4. Run the Neon setup:
```bash
python setup_neon.py
```

### 4. Launch the Application
```bash
streamlit run app.py
```

The app will open in your default browser at `http://localhost:8501`

## 📱 Usage Guide

### Getting Started
1. **Launch the app** using `streamlit run app.py`
2. **Explore 50 Walmart centers** and 100+ shops on the interactive map
3. **Use the sidebar** to filter locations by risk level
4. **Choose map style** from the dropdown options
5. **Click any shop marker** to see path visualization and distance analysis

### 🎯 Interactive Features

#### Path Visualization & Distance Analysis
- **Click any shop marker** to instantly see:
  - Purple line showing route to nearest Walmart center
  - Distance displayed directly on the purple path (in km)
  - Detailed shop analysis below the map
  - Nearest center identification with metrics

#### Quick Shop Selection
- Use the **shop selection buttons** below the map for easy testing
- Each button shows shop name and risk level with color-coded emoji
- Perfect for demonstrating the path visualization features

#### Map Interactions
- **Zoom & Pan**: Navigate the map to explore different regions
- **Marker Clicks**: Click any shop marker for detailed analysis
- **Legend**: Color-coded legend shows all risk levels and path meaning
- **Clear Paths**: Use the "Clear Paths" button to reset visualizations

#### Sidebar Controls
- **Risk Level Filter**: Show only shops with specific risk levels
- **Map Style Selector**: Choose from 3 professional map styles
- **Statistics Panel**: Real-time counts and risk distribution
- **Interactive Legend**: Comprehensive guide to all map elements

#### Shop & Center Details
Each shop marker displays:
- **Shop name and risk level** with color-coded indicators
- **Complete coordinates** for precise location tracking
- **Risk analysis preview** with detailed assessment
- **Interactive instructions** for path visualization

Each Walmart center shows:
- **Center name and ID** for easy identification
- **Status information** and operational details
- **Coverage area** with 2km radius visualization

### 🎯 Testing the Features
1. **Click shop selection buttons** below the map for quick testing
2. **Watch purple paths appear** connecting shop to nearest center
3. **Read distance on the purple line** (displayed in km)
4. **Check detailed analysis** that appears below the map
5. **Use "Clear Paths"** to reset and try another shop

## 🏗️ Project Structure

```
Entire-Project/
├── 🎯 Core Application Files
│   ├── app.py                 # Main Streamlit app with interactive mapping
│   ├── db.py                  # Database operations & data retrieval
│   └── requirements.txt       # Python dependencies & versions
│
├── 🗄️ Database & Setup
│   ├── setup_database.py      # SQLite database setup (50 centers, 100+ shops)
│   ├── setup_neon.py         # Neon PostgreSQL cloud setup
│   ├── postgresql_setup.sql  # SQL script with complete dataset
│   ├── walmart_risk.db       # Local SQLite database (auto-generated)
│   └── .env                   # Environment variables & credentials
│
├── 📊 Data & Documentation
│   ├── shops_centers.txt     # Complete listing of all locations & features
│   └── README.md             # Comprehensive project documentation
│
├── ⚙️ Configuration & Deployment
│   ├── .streamlit/           # Streamlit configuration directory
│   ├── .gitignore            # Git ignore rules for clean repository
│   ├── .git/                 # Git version control (repository history)
│   └── .venv/                # Python virtual environment (auto-generated)
│
└── 🔧 Generated Files
    └── __pycache__/          # Python cache files (auto-generated)
```

### 📁 Detailed File Descriptions

#### 🎯 Core Application Files
- **`app.py`** - Main Streamlit web application featuring:
  - Interactive Folium map with 50 Walmart centers
  - Risk-based shop visualization (100+ locations)
  - Purple path lines to nearest centers with distance display
  - Click-to-analyze functionality and shop selection buttons
  - Professional UI with sidebar controls and statistics

- **`db.py`** - Database interface module providing:
  - `get_center()` - Retrieve specific Walmart center data
  - `get_shops()` - Fetch all supplier shops with risk analysis
  - `get_all_centers()` - Get complete list of Walmart centers
  - Support for both SQLite and PostgreSQL databases

- **`requirements.txt`** - Production-ready dependencies:
  - Streamlit for web framework
  - Folium & streamlit-folium for interactive mapping
  - PostgreSQL support with psycopg2-binary
  - Data processing libraries (pandas, numpy)

#### 🗄️ Database & Setup Scripts
- **`setup_database.py`** - SQLite database initialization:
  - Creates local `walmart_risk.db` with complete dataset
  - 50 Walmart centers across major US cities
  - 100+ supplier shops with realistic risk assessments
  - Perfect for development and quick testing

- **`setup_neon.py`** - Cloud PostgreSQL setup:
  - Connects to Neon cloud database
  - Optimized dataset (30 shops for performance)
  - Production-ready configuration
  - Environment variable integration

- **`postgresql_setup.sql`** - Raw SQL script:
  - Direct database setup option
  - Complete INSERT statements for all data
  - Backup/restore functionality
  - Database migration support

#### 📊 Data Files
- **`shops_centers.txt`** - Human-readable data listing:
  - All 50 Walmart centers with coordinates
  - Complete shop inventory with risk levels
  - Feature summary and implementation notes
  - Quick reference for data verification

#### ⚙️ Configuration Files
- **`.env`** - Environment configuration:
  - Database connection strings
  - Neon PostgreSQL credentials
  - API keys and sensitive data
  - Local development settings

- **`.streamlit/`** - Streamlit app configuration:
  - Custom themes and styling
  - Server configuration options
  - Deployment settings

- **`.gitignore`** - Version control exclusions:
  - Environment files (.env)
  - Database files (*.db)
  - Python cache and virtual environments
  - System-specific files

#### 🚀 Auto-Generated Files
- **`walmart_risk.db`** - SQLite database (created by setup_database.py)
- **`.venv/`** - Python virtual environment
- **`__pycache__/`** - Python bytecode cache
- **`.git/`** - Git repository metadata

### 🔧 Quick Setup Commands

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Setup database (choose one)
python setup_database.py     # Local SQLite (recommended for testing)
python setup_neon.py        # Cloud PostgreSQL (production)

# 3. Launch application
streamlit run app.py

# 4. Access the app
# Browser opens automatically at http://localhost:8501
```

### 📋 File Dependencies

```mermaid
graph TD
    A[app.py] --> B[db.py]
    A --> C[requirements.txt]
    B --> D[walmart_risk.db]
    B --> E[.env]
    F[setup_database.py] --> D
    G[setup_neon.py] --> E
    H[postgresql_setup.sql] --> I[PostgreSQL DB]
    B --> I
```

### 🎯 Development Workflow

1. **First Time Setup**:
   ```bash
   git clone <repository>
   cd Entire-Project
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   python setup_database.py
   ```

2. **Daily Development**:
   ```bash
   .venv\Scripts\activate  # Activate environment
   streamlit run app.py    # Launch app
   # Edit files as needed
   ```

3. **Production Deployment**:
   ```bash
   # Configure .env with production credentials
   python setup_neon.py   # Setup cloud database
   # Deploy to Streamlit Cloud or other platform
   ```

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Database Configuration
DATABASE_URL=your_database_url
DB_HOST=your_host
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_PORT=5432
```

### Database Schema
The application uses expanded data tables:
- **centers**: 50 Walmart distribution centers with coordinates and details
- **shops**: 100+ supplier shops with risk assessments and analysis
- Both tables include latitude/longitude for precise mapping and distance calculations

## 🎨 Customization & Features

### Path Visualization System
- **Haversine Formula**: Accurate distance calculations between coordinates
- **Nearest Center Logic**: Automatically finds closest Walmart center
- **Purple Path Lines**: Visual representation of shop-to-center connections
- **Distance Labels**: Real-time distance display on map paths (km only)

### Enhanced Interactive Elements
- **Shop Selection Buttons**: Quick access to test any shop
- **Dynamic Map Refresh**: Automatic map updates when shop is selected
- **Session State Management**: Persistent selection across interactions
- **Coordinate Conversion**: Handles decimal/float type conversions seamlessly

### Adding New Locations
1. Connect to your database (SQLite or PostgreSQL)
2. Insert new records into `centers` or `shops` tables
3. Include precise coordinates (latitude, longitude) for mapping
4. Add risk assessment data and analysis text
5. Restart the application to see new locations with path visualization

### Testing Path Visualization
1. **Run test scripts**:
   ```bash
   python test_sqlite.py      # Test database and features
   python test_features.py    # Comprehensive feature testing
   ```
2. **Use shop selection buttons** for easy demonstration
3. **Click shop markers** to see immediate path visualization
4. **Verify distance calculations** are displayed on purple lines

### Styling Options
- Modify map styles in `app.py`
- Customize color schemes for risk levels
- Adjust popup content and formatting
- Update sidebar layout and controls

## 🚀 Deployment

### Local Development
- Use SQLite setup for quick local development with all 50 centers and 100+ shops
- Full path visualization and distance features available locally
- No external dependencies required for core functionality

### Production Deployment
- Use Neon PostgreSQL for cloud database with complete dataset
- Deploy to Streamlit Cloud, Heroku, or other platforms
- All interactive features work in production environment
- Ensure environment variables are properly configured

## ✅ Feature Verification

### Current Implementation Status
- ✅ **50 Walmart Centers**: Fully implemented and displayed
- ✅ **100+ Supplier Shops**: Complete with risk assessments  
- ✅ **Path Visualization**: Purple lines to nearest centers
- ✅ **Distance Display**: Real-time km calculations on paths
- ✅ **Interactive Selection**: Click shops for instant analysis
- ✅ **shops_centers.txt**: Complete location listing created
- ✅ **Database Expansion**: Both SQLite and Neon PostgreSQL
- ✅ **Enhanced UI**: Professional dashboard with all features

### Testing Your Installation
```bash
# Test the database setup
python test_sqlite.py

# Run the app
streamlit run app.py

# Test features interactively
# 1. Click any shop marker
# 2. Look for purple path lines
# 3. Check distance on the path
# 4. Try shop selection buttons
```

## 🤝 Contributing

This project was developed for hackathon demonstration purposes. For improvements or modifications:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is available for educational and demonstration purposes. Please respect Walmart's trademarks and use this only for learning and portfolio demonstration.

## 🆘 Troubleshooting

### Common Issues

#### Database Connection Errors
- Verify `.env` file contains correct credentials
- Check if PostgreSQL service is running (for local setup)
- Confirm Neon database is accessible (for cloud setup)

#### Path Visualization Not Showing
- Click shop markers or use shop selection buttons below map
- Check that you see "Selected: [Shop Name]" info message
- Look for purple path lines connecting shop to nearest center
- Distance should be displayed on the purple line

#### Distance Calculations
- Distances use Haversine formula for accuracy
- Only kilometers (km) are displayed, not meters
- Distance appears directly on the purple path line
- Check test_sqlite.py output for distance verification

#### Shop Selection Issues
- Use shop selection buttons below map for reliable testing
- Click shop markers directly on the map
- Purple paths appear automatically when shop is selected
- Use "Clear Paths" button to reset and try again

#### Dependencies Issues
```bash
pip install --upgrade -r requirements.txt
```

#### Port Already in Use
```bash
streamlit run app.py --server.port 8502
```

### Support
For technical issues or questions, review the code comments and error messages. The application includes comprehensive error handling and informative messages.

---

**🎯 Enhanced for Hackathon 2025 with advanced path visualization, distance calculations, and interactive shop analysis featuring 50 Walmart centers and 100+ supplier locations.**

**Built with ❤️ for supply chain risk analysis and innovative mapping solutions.**
