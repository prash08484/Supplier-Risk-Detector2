import streamlit as st
from streamlit_folium import st_folium
import folium
from folium import plugins
from db import get_center, get_shops, get_all_centers
import json

st.set_page_config(page_title="Walmart Risk Detection Map", layout="wide")

st.title("🏪 Walmart Risk Detection Map")
st.markdown("---")

# Initialize session state for selected shop
if 'selected_shop_id' not in st.session_state:
    st.session_state.selected_shop_id = None

# Sidebar for controls
with st.sidebar:
    st.header("🎛️ Map Controls")
    center_id = st.text_input("Enter Walmart Center ID:", value="1", help="Enter the ID of the Walmart center to focus on")
    
    # Map style options
    map_style = st.selectbox(
        "Map Style:",
        ["OpenStreetMap", "CartoDB Positron", "CartoDB Dark_Matter"],
        index=1
    )
    
    # Risk filter
    st.subheader("Risk Level Filter")
    show_high = st.checkbox("High Risk", value=True)
    show_medium = st.checkbox("Medium Risk", value=True) 
    show_low = st.  checkbox("Low Risk", value=True)
    
    # Legend
    st.subheader("📍 Map Legend")
    st.markdown("""
    - 🏪 **Blue**: Main Walmart Center
    - 🏪 **Light Blue**: Other Walmart Centers
    - 🔴 **Red**: High Risk Shop
    - 🟡 **Yellow**: Medium Risk Shop  
    - 🟢 **Green**: Low Risk Shop
    - 🟣 **Purple Line**: Path to Nearest Center (with distance)
    """)
    


center = get_center(center_id)

if not center:
    st.error("❌ Walmart Center not found! Please check the Center ID.")
    st.info("💡 Make sure you have entered a valid Walmart Center ID in the sidebar.")
    st.stop()

center_id, center_name, center_lat, center_lon = center
shops = get_shops()

# Filter shops based on risk level selection
filtered_shops = []
risk_filter = {
    'high': show_high,
    'medium': show_medium, 
    'low': show_low
}

for shop in shops:
    shop_risk = shop[4].lower()
    if risk_filter.get(shop_risk, True):
        filtered_shops.append(shop)

# Main content area
col1, col2 = st.columns([3, 1])

with col1:
    st.markdown(f"### 🎯 Focus: **{center_name}** (ID: {center_id})")
    st.markdown(f"📍 **Coordinates:** {center_lat:.4f}, {center_lon:.4f}")
    
    # Map tiles configuration
    tile_mapping = {
        "OpenStreetMap": "OpenStreetMap",
        "CartoDB Positron": "CartoDB positron", 
        "CartoDB Dark_Matter": "CartoDB dark_matter"
    }
    
    # Create the map with enhanced styling
    m = folium.Map(
        location=[center_lat, center_lon], 
        zoom_start=13,
        tiles=tile_mapping[map_style]
    )
    
    # Add custom CSS for better styling
    m.get_root().html.add_child(folium.Element("""
    <style>
    .leaflet-popup-content-wrapper {
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }
    .leaflet-popup-content {
        font-family: 'Arial', sans-serif;
        line-height: 1.4;
    }
    </style>
    """))
    
    # Add Walmart center marker with custom styling
    walmart_popup = f"""
    <div style='font-family: Arial; width: 200px;'>
        <h4 style='color: #0071ce; margin: 0;'>🏪 {center_name}</h4>
        <hr style='margin: 5px 0;'>
        <p><b>Center ID:</b> {center_id}</p>
        <p><b>Type:</b> Walmart Center</p>
        <p><b>Status:</b> <span style='color: green;'>Active</span></p>
    </div>
    """
    
    folium.Marker(
        [center_lat, center_lon],
        tooltip=f"🏪 Walmart Center: {center_name}",
        popup=folium.Popup(walmart_popup, max_width=250),
        icon=folium.Icon(
            color="blue", 
            icon="shopping-cart", 
            prefix="fa"
        )
    ).add_to(m)    # Enhanced risk color and icon mapping
    RISK_CONFIG = {
        "high": {"color": "red", "icon": "exclamation-triangle", "emoji": "🔴"},
        "medium": {"color": "orange", "icon": "exclamation-circle", "emoji": "🟡"}, 
        "low": {"color": "green", "icon": "check-circle", "emoji": "🟢"}
    }
    
    # Add shop markers with enhanced popups and click detection
    for shop_id, shop_name, shop_lat, shop_lon, risk, analysis in filtered_shops:
        # Convert coordinates to float to avoid decimal type issues
        shop_lat_float = float(shop_lat)
        shop_lon_float = float(shop_lon)
        risk_lower = risk.lower()
        config = RISK_CONFIG.get(risk_lower, {"color": "gray", "icon": "question", "emoji": "⚪"})
        
        # Create detailed popup with click detection
        shop_popup = f"""
        <div style='font-family: Arial; width: 250px;' data-shop-id='{shop_id}'>
            <h4 style='color: {config["color"]}; margin: 0;'>{config["emoji"]} {shop_name}</h4>
            <hr style='margin: 5px 0;'>
            <p><b>Shop ID:</b> {shop_id}</p>
            <p><b>Risk Level:</b> <span style='color: {config["color"]}; font-weight: bold;'>{risk.upper()}</span></p>
            <p><b>Location:</b> {shop_lat_float:.4f}, {shop_lon_float:.4f}</p>
            <div style='background-color: #f0f0f0; padding: 8px; border-radius: 5px; margin-top: 8px;'>
                <b>Analysis Preview:</b><br>
                <small>{analysis[:100]}{"..." if len(analysis) > 100 else ""}</small>
            </div>
            <p style='font-size: 11px; color: #666; margin-top: 8px;'>🔍 Click marker to show paths to all centers</p>
        </div>
        """
        
        # Add shop marker
        marker = folium.Marker(
            [shop_lat_float, shop_lon_float],
            tooltip=f"{config['emoji']} {shop_name} (Risk: {risk}) - Click for analysis",
            popup=folium.Popup(shop_popup, max_width=300),
            icon=folium.Icon(
                color=config["color"], 
                icon=config["icon"], 
                prefix="fa"
            )
        )
        marker.add_to(m)
    
    # Get all centers for path visualization
    all_centers = get_all_centers()
    
    # Add all other Walmart centers as smaller markers
    for center_id_other, center_name_other, center_lat_other, center_lon_other in all_centers:
        if center_id_other != int(center_id):  # Don't duplicate the main center
            folium.Marker(
                [center_lat_other, center_lon_other],
                tooltip=f"🏪 {center_name_other}",
                popup=f"<b>{center_name_other}</b><br>Center ID: {center_id_other}",
                icon=folium.Icon(
                    color="lightblue", 
                    icon="shopping-cart", 
                    prefix="fa"
                )
            ).add_to(m)
    
    # If a shop is selected, show path to nearest center only
    if st.session_state.selected_shop_id:
        selected_shop = next((s for s in filtered_shops if s[0] == st.session_state.selected_shop_id), None)
        if selected_shop:
            # Convert coordinates to float
            shop_lat_path = float(selected_shop[2])
            shop_lon_path = float(selected_shop[3])
            
            # Calculate distance function
            import math
            def calculate_distance(lat1, lon1, lat2, lon2):
                lat1, lon1, lat2, lon2 = float(lat1), float(lon1), float(lat2), float(lon2)
                R = 6371  # Earth's radius in kilometers
                dlat = math.radians(lat2 - lat1)
                dlon = math.radians(lon2 - lon1)
                a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
                c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
                return R * c
            
            # Find nearest center
            nearest_center = None
            min_distance = float('inf')
            
            for center_id_path, center_name_path, center_lat_path, center_lon_path in all_centers:
                center_lat_float = float(center_lat_path)
                center_lon_float = float(center_lon_path)
                distance = calculate_distance(shop_lat_path, shop_lon_path, center_lat_float, center_lon_float)
                
                if distance < min_distance:
                    min_distance = distance
                    nearest_center = (center_id_path, center_name_path, center_lat_float, center_lon_float)
            
            # Draw line only to nearest center with distance on the path
            if nearest_center:
                center_id_path, center_name_path, center_lat_float, center_lon_float = nearest_center
                
                folium.PolyLine(
                    locations=[[shop_lat_path, shop_lon_path], [center_lat_float, center_lon_float]],
                    color='purple',
                    weight=4,
                    opacity=0.8,
                    popup=f"<b>📍 Distance: {min_distance:.2f} km</b><br>From: {selected_shop[1]}<br>To: {center_name_path}",
                    tooltip=f"Distance: {min_distance:.2f} km"
                ).add_to(m)
                
                # Add a marker at the midpoint showing distance
                mid_lat = (shop_lat_path + center_lat_float) / 2
                mid_lon = (shop_lon_path + center_lon_float) / 2
                
                folium.Marker(
                    [mid_lat, mid_lon],
                    popup=f"<b>📏 {min_distance:.2f} km</b>",
                    tooltip=f"{min_distance:.2f} km",
                    icon=folium.DivIcon(
                        html=f'<div style="background-color: purple; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px; font-weight: bold;">{min_distance:.2f} km</div>',
                        icon_size=(80, 20),
                        icon_anchor=(40, 10)
                    )
                ).add_to(m)
    
    # Add a circle around the Walmart center to show coverage area
    folium.Circle(
        location=[center_lat, center_lon],
        radius=2000,  # 2km radius
        popup=f"Coverage Area (2km radius)",
        color="#0071ce",
        fill=True,
        opacity=0.3,
        fillOpacity=0.1
    ).add_to(m)
    
    # Add plugins for better functionality
    plugins.Fullscreen().add_to(m)
    plugins.MeasureControl().add_to(m)
    
    # Display the map
    st.markdown("### 🗺️ Interactive Risk Detection Map")
    
    # Show current selection status
    if st.session_state.selected_shop_id:
        selected_shop_info = next((s for s in filtered_shops if s[0] == st.session_state.selected_shop_id), None)
        if selected_shop_info:
            st.info(f"🎯 **Selected:** {selected_shop_info[1]} (ID: {st.session_state.selected_shop_id}) - Purple path to nearest center is visible!")
    else:
        st.info("👆 Click any shop marker or use the buttons below to see path to nearest Walmart center with distance")
    
    # Create a unique key based on selected shop to force map refresh
    map_key = f"main_map_{st.session_state.selected_shop_id or 'none'}"
    map_data = st_folium(m, width=1000, height=600, returned_objects=["last_object_clicked"], key=map_key)

with col2:
    st.markdown("### 📊 Map Statistics")
    
    total_shops = len(shops)
    filtered_count = len(filtered_shops)
    
    st.metric("Total Shops", total_shops)
    st.metric("Visible Shops", filtered_count)
    
    # Risk distribution
    if shops:
        risk_counts = {'high': 0, 'medium': 0, 'low': 0}
        for shop in shops:
            risk_level = shop[4].lower()
            if risk_level in risk_counts:
                risk_counts[risk_level] += 1
        
        st.markdown("#### Risk Distribution")
        st.markdown(f"🔴 High: {risk_counts['high']}")
        st.markdown(f"🟡 Medium: {risk_counts['medium']}")
        st.markdown(f"🟢 Low: {risk_counts['low']}")
        
        # Calculate risk percentage
        high_percentage = (risk_counts['high'] / total_shops) * 100 if total_shops > 0 else 0
        if high_percentage > 30:
            st.warning(f"⚠️ High risk shops: {high_percentage:.1f}%")
        elif high_percentage > 15:
            st.info(f"ℹ️ High risk shops: {high_percentage:.1f}%")
        else:
            st.success(f"✅ High risk shops: {high_percentage:.1f}%")# Handle marker clicks for detailed analysis and path visualization
st.markdown("---")

# Add shop selection buttons for easier interaction
st.markdown("### 🎯 Quick Shop Selection")
if filtered_shops:
    col1, col2, col3, col4 = st.columns(4)
    
    # Show first few shops as buttons for easy testing
    for i, (shop_id, shop_name, shop_lat, shop_lon, risk, analysis) in enumerate(filtered_shops[:8]):
        with [col1, col2, col3, col4][i % 4]:
            risk_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(risk.lower(), "⚪")
            if st.button(f"{risk_emoji} {shop_name[:15]}...", key=f"shop_{shop_id}"):
                st.session_state.selected_shop_id = shop_id
                st.rerun()

# Check if a marker was clicked on the map
if map_data and map_data.get("last_object_clicked"):
    clicked_data = map_data["last_object_clicked"]
    popup_content = clicked_data.get("popup", "")
    lat_clicked = clicked_data.get("lat")
    lng_clicked = clicked_data.get("lng")
    
    # Try to find shop by coordinates if popup parsing fails
    if lat_clicked and lng_clicked:
        # Find closest shop to clicked coordinates
        min_distance = float('inf')
        closest_shop_id = None
        
        for shop_id, shop_name, shop_lat, shop_lon, risk, analysis in filtered_shops:
            # Convert decimal coordinates to float for calculation
            shop_lat_float = float(shop_lat)
            shop_lon_float = float(shop_lon)
            distance = abs(shop_lat_float - lat_clicked) + abs(shop_lon_float - lng_clicked)
            if distance < min_distance and distance < 0.001:  # Very close tolerance
                min_distance = distance
                closest_shop_id = shop_id
        
        if closest_shop_id and closest_shop_id != st.session_state.selected_shop_id:
            st.session_state.selected_shop_id = closest_shop_id
            st.rerun()
    
    # Also try popup parsing as backup
    if popup_content and "Shop ID:" in popup_content:
        try:
            # Extract shop ID from popup HTML
            import re
            shop_id_match = re.search(r'<b>Shop ID:</b>\s*(\d+)', popup_content)
            if shop_id_match:
                shop_id = int(shop_id_match.group(1))
                if st.session_state.selected_shop_id != shop_id:
                    st.session_state.selected_shop_id = shop_id
                    st.rerun()
        except (ValueError, AttributeError):
            pass  # Silently handle parsing errors

# Show detailed analysis if a shop is selected
if st.session_state.selected_shop_id:
    # Find the selected shop
    selected_shop = next((s for s in shops if s[0] == st.session_state.selected_shop_id), None)
    if selected_shop:
        _, shop_name, shop_lat, shop_lon, risk, analysis = selected_shop
        
        # Create detailed analysis section
        st.markdown("## 🔍 Detailed Shop Analysis & Nearest Center")
        
        # Calculate nearest center for display
        import math
        def calculate_distance(lat1, lon1, lat2, lon2):
            lat1, lon1, lat2, lon2 = float(lat1), float(lon1), float(lat2), float(lon2)
            R = 6371  # Earth's radius in kilometers
            dlat = math.radians(lat2 - lat1)
            dlon = math.radians(lon2 - lon1)
            a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            return R * c
        
        # Find nearest center
        nearest_center = None
        min_distance = float('inf')
        
        for center_id_dist, center_name_dist, center_lat_dist, center_lon_dist in all_centers:
            center_lat_float = float(center_lat_dist)
            center_lon_float = float(center_lon_dist)
            shop_lat_float = float(shop_lat)
            shop_lon_float = float(shop_lon)
            distance = calculate_distance(shop_lat_float, shop_lon_float, center_lat_float, center_lon_float)
            
            if distance < min_distance:
                min_distance = distance
                nearest_center = (center_name_dist, distance)
        
        if nearest_center:
            st.info(f"🛣️ Nearest center: **{nearest_center[0]}** - Distance: **{nearest_center[1]:.2f} km**")
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Shop Name", shop_name)
        with col2:
            risk_color = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(risk.lower(), "⚪")
            st.metric("Risk Level", f"{risk_color} {risk.upper()}")
        with col3:
            if nearest_center:
                st.metric("Distance to Nearest Center", f"{nearest_center[1]:.2f} km")
        
        # Analysis details
        st.markdown("### 📋 Risk Analysis Report")
        st.markdown(f"**Location:** {shop_lat:.6f}, {shop_lon:.6f}")
        
        # Analysis in an expandable section
        with st.expander("📊 Full Analysis Details", expanded=True):
            st.markdown(analysis)
        
        # Action buttons
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            if st.button("📧 Generate Report"):
                st.success("Report generation initiated!")
        with col2:
            if st.button("🚨 Flag for Review"):
                st.warning("Shop flagged for immediate review!")
        with col3:
            if st.button("📞 Contact Shop"):
                st.info("Contact information retrieved!")
        with col4:
            if st.button("🗺️ Clear Paths"):
                st.session_state.selected_shop_id = None
                st.rerun()
            
# Footer
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: #666; font-size: 14px;'>
    🏪 Walmart Risk Detection System | Built for Hackathon 2025
</div>
""", unsafe_allow_html=True)