from openai import AsyncOpenAI
import os
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def classify_incident(text: str):
    # Official SOP Context extracted from hotel documents
    sop_context = """
    HOTEL EMERGENCY PROTOCOLS (SOP):
    - FIRE: Activate alarm, evacuate via STAIRS only (No Lifts). Close doors behind you. Guide guests to Assembly Point A. Housekeeping to check rooms 201-205.
    - MEDICAL: Call 151 (Front Desk). Request EMS for serious injury. Stay with victim. Do NOT move them unless in immediate danger. Paramedics use Lift B for access.
    - SECURITY: Contact Security via Radio Ch 4. Secure perimeter. Approach with caution. Redirect guest traffic away from hazard.
    - EVACUATION: Priority for elderly, mobility-impaired, and families. Staff must lead guests to designated assembly areas and account for everyone.
    
    ROLE-SPECIFIC TASKS:
    - FIREFIGHTER: Contain fire if small, guide evacuation, verify room clearance.
    - PARAMEDIC: Provide first aid, coordinate with EMS, use medical lifts.
    - SECURITY: Perimeter control, guest safety, radio coordination.
    - HOUSEKEEPING: Room-by-room clearance, assisting mobility-impaired guests.
    """

    if not os.getenv("OPENAI_API_KEY"):
        # Grounded Fallback logic
        text_lower = text.lower()
        if "fire" in text_lower or "smoke" in text_lower:
            return {
                "type": "fire", 
                "priority": "critical", 
                "steps": "🚨 EVACUATE VIA STAIRS ONLY. Close doors. Assemble at Point A.",
                "guest_steps": "🚨 FIRE ALERT: Evacuate immediately via STAIRS. Do NOT use elevators. Follow floor wardens.",
                "staff_steps": "🔥 FIRE PROTOCOL: Guide guests to Exit B. Check assigned rooms. Close doors. Report to assembly point."
            }
        if "doctor" in text_lower or "medical" in text_lower or "hurt" in text_lower:
            return {
                "type": "medical", 
                "priority": "high", 
                "steps": "🚑 STAY WITH VICTIM. Call 151. Use Lift B for Paramedics. Do not move injured person.",
                "guest_steps": "🚑 MEDICAL EMERGENCY: Paramedics are on the way. Stay calm. Do not move if injured.",
                "staff_steps": "🏥 MEDICAL PROTOCOL: Bring First Aid kit. Clear Lift B. Stay with victim until help arrives."
            }
        return {
            "type": "security", 
            "priority": "medium", 
            "steps": "🛡️ SECURE AREA. Radio Ch 4. Approach with caution. Guide guests away.",
            "guest_steps": "⚠️ SECURITY ALERT: Please remain in your room until further notice. Avoid the affected area.",
            "staff_steps": "🛡️ SECURITY PROTOCOL: Secure perimeter. Redirect traffic. Monitor CCTV. Radio for backup."
        }

    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": f"You are an elite emergency dispatcher trained on these hotel SOPs: {sop_context}. Analyze the description and return a JSON object with: 'type' (fire, medical, security), 'priority' (low, medium, high, critical), 'steps' (concise strategic actions), 'guest_steps' (clear instructions for guests), and 'staff_steps' (specific tasks for staff members based on their roles)."},
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
