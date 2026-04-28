import json
import os

def get_room_from_coords(lat, lng):
    file_path = os.path.join(os.getcwd(), "map_data.json")
    if not os.path.exists(file_path):
        return "Unknown Area"

    try:
        with open(file_path, "r") as f:
            data = json.load(f)
            
        # Constants for coordinate transformation (matching main.py)
        CENTER_LAT = 13.111
        CENTER_LNG = 80.135
        GRID_X_OFFSET = 807600
        GRID_Y_OFFSET = 820900
        SCALE = 0.00001

        best_room = "General Area"
        min_dist = float('inf')

        for room in data.get("rooms", []):
            # Calculate a rough center for the room from its grid boundaries
            # In a real app we'd use point-in-polygon
            # For demo, we'll check proximity to the room's first point
            if room.get("boundaries") and len(room["boundaries"]) > 0:
                first_pt = room["boundaries"][0][0]
                r_lat = CENTER_LAT + (first_pt["y"] - GRID_Y_OFFSET) * SCALE
                r_lng = CENTER_LNG + (first_pt["x"] - GRID_X_OFFSET) * SCALE
                
                dist = ((lat - r_lat)**2 + (lng - r_lng)**2)**0.5
                if dist < min_dist:
                    min_dist = dist
                    best_room = room.get("name", "Unknown Room")
        
        # Clean up the room name if it's too long
        if " - " in best_room:
            best_room = best_room.split(" - ")[-1]
            
        return best_room
    except Exception as e:
        print(f"Map resolution error: {e}")
        return "Building Sector A"

def get_coords_from_room(room_name):
    file_path = os.path.join(os.getcwd(), "map_data.json")
    if not os.path.exists(file_path):
        return {"lat": 13.111, "lng": 80.135} # Default center

    try:
        with open(file_path, "r") as f:
            data = json.load(f)
            
        CENTER_LAT = 13.111
        CENTER_LNG = 80.135
        GRID_X_OFFSET = 807600
        GRID_Y_OFFSET = 820900
        SCALE = 0.00001

        for room in data.get("rooms", []):
            if room_name.lower() in room.get("name", "").lower():
                if room.get("boundaries") and len(room["boundaries"]) > 0:
                    first_pt = room["boundaries"][0][0]
                    r_lat = CENTER_LAT + (first_pt["y"] - GRID_Y_OFFSET) * SCALE
                    r_lng = CENTER_LNG + (first_pt["x"] - GRID_X_OFFSET) * SCALE
                    return {"lat": r_lat, "lng": r_lng}
        
        return {"lat": 13.111, "lng": 80.135}
    except Exception as e:
        print(f"Coordinate resolution error: {e}")
        return {"lat": 13.111, "lng": 80.135}
