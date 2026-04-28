import xml.etree.ElementTree as ET
import json
import os

def parse_gml(file_path):
    # Namespace dictionary to handle GML and FME tags
    namespaces = {
        'gml': 'http://www.opengis.net/gml',
        'fme': 'http://www.safe.com/gml/fme'
    }

    tree = ET.parse(file_path)
    root = tree.getroot()

    rooms = []
    exits = []
    paths = []

    # Iterate through each feature member
    for feature_member in root.findall('gml:featureMember', namespaces):
        index_node = feature_member.find('fme:Index', namespaces)
        if index_node is None:
            continue

        feature_id = index_node.get('{http://www.opengis.net/gml}id')
        venue_name = index_node.findtext('fme:Venue_Eng_name', default='Unknown', namespaces=namespaces)
        building_name = index_node.findtext('fme:Building_Eng_name', default='Unknown', namespaces=namespaces)
        
        # Extract coordinates from gml:posList
        # Note: We look for any posList within the feature
        pos_lists = index_node.findall('.//gml:posList', namespaces)
        
        coords_sets = []
        for pl in pos_lists:
            raw_coords = pl.text.strip().split()
            # Convert to float and take only X, Y (Ignore Z)
            # GML often uses (X, Y, Z) or (Lat, Lng, Alt)
            coords = []
            for i in range(0, len(raw_coords), 3):
                try:
                    # Taking first two as X, Y
                    coords.append({
                        "x": float(raw_coords[i]),
                        "y": float(raw_coords[i+1])
                    })
                except (IndexError, ValueError):
                    continue
            coords_sets.append(coords)

        if coords_sets:
            # For this demo, we classify all Index features as 'rooms' or 'zones'
            rooms.append({
                "id": feature_id,
                "name": f"{venue_name} - {building_name}",
                "boundaries": coords_sets
            })

            # Mock some exits and paths for the demo based on the first coordinate of each room
            # In a real GML, we would look for 'Transition' or 'Entrance' features
            if len(coords_sets[0]) > 0:
                first_pt = coords_sets[0][0]
                # If name contains 'Exit' or 'Entrance', mark as exit
                if 'Exit' in venue_name or 'Entrance' in venue_name:
                    exits.append({
                        "id": f"exit-{feature_id}",
                        "coords": first_pt,
                        "name": venue_name
                    })
                
                # Mock a path connection to the next room
                if len(rooms) > 1:
                    paths.append({
                        "from": rooms[-2]["id"],
                        "to": rooms[-1]["id"]
                    })

    return {
        "rooms": rooms[:50], # Limit for demo performance
        "exits": exits,
        "paths": paths
    }

if __name__ == "__main__":
    gml_file = '3DIndoorMap_GML/3DIndoorMap_gml_converted.gml'
    if os.path.exists(gml_file):
        data = parse_gml(gml_file)
        with open('map_data.json', 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Successfully extracted {len(data['rooms'])} rooms, {len(data['exits'])} exits, and {len(data['paths'])} paths.")
    else:
        print("GML file not found.")
