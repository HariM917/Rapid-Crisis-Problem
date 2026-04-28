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
        if "fire" in text_lower or "smoke" in text_lower:
            return {
                "type": "fire", 
                "priority": "critical", 
                "steps": "🚨 EVACUATE VIA STAIRS ONLY. Close doors. Assemble at Point A.",
                "guest_steps": "🚨 FIRE ALERT: Evacuate immediately via STAIRS. Do NOT use elevators.",
                "staff_steps": "🔥 FIRE PROTOCOL: Guide guests to Exit B. Check assigned rooms. Close doors."
            }
        return {
            "type": "security", 
            "priority": "medium", 
            "steps": "🛡️ SECURE AREA. Radio Ch 4. Approach with caution.",
            "guest_steps": "⚠️ SECURITY ALERT: Please remain in your room until further notice.",
            "staff_steps": "🛡️ SECURITY PROTOCOL: Secure perimeter. Redirect traffic."
        }

    prompt = f"""
    You are an elite emergency response AI for a luxury hotel, trained on these SOPs:
    {sop_context}

    Analyze the incident description and return a JSON object ONLY.

    Description: "{description}"

    Return JSON Format:
    {{
      "type": "fire | medical | security",
      "priority": "low | medium | high | critical",
      "steps": "Concise strategic action for the commander",
      "guest_steps": "Direct, calm instructions for the guest",
      "staff_steps": "Specific tactical tasks for responders"
    }}

    Rules:
    - If Fire: Instructions MUST emphasize using stairs and avoiding elevators.
    - If Medical: Instructions MUST emphasize staying with the victim and calling 151.
    - Output ONLY valid JSON. No markdown formatting.
    """

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean Gemini's potentially verbose output
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        return json.loads(text)
    except Exception as e:
        print(f"Gemini AI Error: {e}")
        # Structured fallback
        return {
            "type": "security",
            "priority": "medium",
            "steps": "Investigate reported incident and secure area.",
            "guest_steps": "Please stay calm and await staff instructions.",
            "staff_steps": "Proceed to location, assess situation, and report back."
        }
