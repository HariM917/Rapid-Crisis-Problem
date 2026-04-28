import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
else:
    model = None

async def classify_incident(description: str):
    # Official SOP Context extracted from hotel documents
    sop_context = """
    HOTEL EMERGENCY PROTOCOLS (SOP):
    - FIRE: Activate alarm, evacuate via STAIRS only (No Lifts). Close doors behind you. Guide guests to Assembly Point A.
    - MEDICAL: Call 151 (Front Desk). Request EMS for serious injury. Stay with victim. Do NOT move them unless in immediate danger. Paramedics use Lift B.
    - SECURITY: Contact Security via Radio Ch 4. Secure perimeter. Approach with caution. Redirect traffic.
    - EVACUATION: Priority for elderly, mobility-impaired, and families.
    """

    if not model:
        # Grounded Fallback logic
        text_lower = description.lower()
        if any(w in text_lower for w in ["fire", "smoke", "burn", "explosion"]):
            return {
                "type": "fire", 
                "priority": "critical", 
                "steps": "🚨 EVACUATE VIA STAIRS ONLY. Close doors. Assemble at Point A.",
                "guest_steps": "🚨 FIRE ALERT: Evacuate immediately via STAIRS. Do NOT use elevators.",
                "staff_steps": "🔥 FIRE PROTOCOL: Guide guests to Exit B. Check assigned rooms. Close doors."
            }
        if any(w in text_lower for w in ["medical", "injury", "faint", "heart", "blood"]):
            return {
                "type": "medical", 
                "priority": "high", 
                "steps": "🚑 MEDICAL EMERGENCY. Call 151. Stay with victim.",
                "guest_steps": "🚑 MEDICAL ALERT: A responder is on the way. Please do not move the person.",
                "staff_steps": "🚑 MEDICAL PROTOCOL: Bring AED. Clear path for EMS. Call 151."
            }
        return {
            "type": "security", 
            "priority": "medium", 
            "steps": "🛡️ SECURE AREA. Radio Ch 4. Approach with caution.",
            "guest_steps": "⚠️ SECURITY ALERT: Please remain in your room until further notice.",
            "staff_steps": "🛡️ SECURITY PROTOCOL: Secure perimeter. Redirect traffic."
        }

    prompt = f"""
    You are an emergency classification system.

    STRICT RULES:
    - Fire, smoke, burning → type = "fire", priority = "critical"
    - Injury → "medical"
    - Threat → "security"

    DO NOT misclassify fire as security.

    Incident:
    {description}

    Return ONLY JSON:
    {{
      "type": "...",
      "priority": "...",
      "guest_instructions": [],
      "staff_instructions": []
    }}
    """

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        return json.loads(text)
    except Exception as e:
        print(f"Gemini AI Error: {e}")
        # Structured safety fallback
        text_lower = description.lower()
        if any(w in text_lower for w in ["fire", "smoke", "burning"]):
            return {
                "type": "fire", 
                "priority": "critical", 
                "guest_instructions": ["Evacuate via stairs immediately."], 
                "staff_instructions": ["Activate alarm", "Guide guests to exit"]
            }
        return {
            "type": "security",
            "priority": "medium",
            "guest_instructions": ["Please stay calm and await instructions."],
            "staff_instructions": ["Proceed to location", "Assess and report back"]
        }
