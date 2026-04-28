from openai import AsyncOpenAI
import os
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def classify_incident(text: str):
    if not os.getenv("OPENAI_API_KEY"):
        # Grounded Fallback logic based on Housekeeping SOP & Emergency Response Plan
        text_lower = text.lower()
        if "fire" in text_lower or "smoke" in text_lower:
            return {
                "type": "fire", 
                "priority": "critical", 
                "steps": "EMERGENCY: USE STAIRCASE ONLY. Do not use elevators. Assist mobility-impaired guests. Assembly at designated point.",
                "guest_steps": "🚨 FIRE ALERT: Evacuate immediately via STAIRS. Do NOT use elevators. Floor wardens will assist you.",
                "staff_steps": "🔥 FIRE PROTOCOL: Guide guests to Exit B. Check rooms 201-205. Avoid elevators. Report to assembly point."
            }
        if "doctor" in text_lower or "medical" in text_lower or "hurt" in text_lower:
            return {
                "type": "medical", 
                "priority": "high", 
                "steps": "EMERGENCY: USE LIFT FOR SPEED. Get to the ground floor or meet paramedics at the elevator lobby. Do not move victim unless unsafe.",
                "guest_steps": "🚑 MEDICAL EMERGENCY: Stay calm. If possible, move to the elevator lobby for faster paramedic access. Do not move the injured person.",
                "staff_steps": "🏥 MEDICAL PROTOCOL: Bring First Aid kit to location. Clear elevator for paramedic use. Stay with victim until help arrives."
            }
        return {
            "type": "security", 
            "priority": "medium", 
            "steps": "1. Inform supervisor/security via radio. 2. Approach with caution. 3. Secure the area and guide guests away from hazard. 4. Document incident timeline.",
            "guest_steps": "⚠️ SECURITY ALERT: Please remain in your room until further notice. Avoid the affected area.",
            "staff_steps": "🛡️ SECURITY PROTOCOL: Secure perimeter. Redirect guest traffic. Monitor CCTV. Radio supervisor for backup."
        }

    try:
        # For OpenAI, we inject the SOP context into the system prompt
        sop_context = """
        Official Protocol Context:
        - FIRE: Pull alarm, evacuate via stairs only, assist mobility-impaired, close doors, assemble and account.
        - MEDICAL: Assess ABCs, call emergency 151/Front Desk, stay with victim, no moving unless unsafe.
        - SECURITY: Secure area, guide guests away, document timeline, approach with caution.
        - EVACUATION: Calm tone, priority for elderly/families, use assembly monitors.
        """
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": f"You are an expert emergency dispatcher trained on these SOPs: {sop_context}. Analyze the description and return a JSON object with: 'type' (fire, medical, security), 'priority' (low, medium, high, critical), 'steps' (concise string of general actions), 'guest_steps' (specific instructions for guests), and 'staff_steps' (specific tasks for staff)."},
                {"role": "user", "content": text}
            ],
            response_format={ "type": "json_object" }
        )
        import json
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"AI Classification Error: {e}")
        return {
            "type": "security", 
            "priority": "medium", 
            "steps": "Standard security protocol.",
            "guest_steps": "Follow staff instructions.",
            "staff_steps": "Implement standard security protocol."
        }
