import requests
import json

url = "https://rapid-crisis-problem.onrender.com/incident/create"
payload = {
    "description": "Large fire reported in the kitchen on the first floor. Smoke spreading to the lobby.",
    "room_name": "Kitchen",
    "reporter_id": 1
}
headers = {
    "accept": "application/json",
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
