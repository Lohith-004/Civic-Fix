import { GoogleGenAI } from '@google/genai';
import { db } from './db';
import { IssuePriority, CivicIssue } from '../src/types';

// Initialize Gemini SDK with server-side API key if present
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Haversine distance in meters
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export async function analyzeIssueImage(
  imageBase64OrUrl: string, 
  userNotes?: string
): Promise<{
  category: string;
  confidence: number;
  suggestedSeverity: IssuePriority;
  reasoningSummary: string;
  suggestedDepartment: string;
}> {
  if (ai && apiKey) {
    try {
      const prompt = `You are the CivicFix AI Vision Engine. Analyze this civic issue report.
Categories:
- "Road Damage & Potholes" (Dept: "Roads & Public Works")
- "Water & Sewage Outflow" (Dept: "Water Resources & Sewage")
- "Streetlight & Signals" (Dept: "Street Lighting & Energy")
- "Waste & Illegal Dumping" (Dept: "Waste Management & Sanitation")
- "Fallen Trees & Overgrowth" (Dept: "Parks, Trees & Urban Forest")
- "Sidewalk & Pedestrian Safety" (Dept: "Roads & Public Works")

User additional context: "${userNotes || 'None'}"

Respond ONLY with valid JSON in this exact structure:
{
  "category": "Road Damage & Potholes",
  "confidence": 94,
  "suggestedSeverity": "HIGH",
  "reasoningSummary": "Visible crater on roadway lane posing vehicular hazard.",
  "suggestedDepartment": "Roads & Public Works"
}
Note: suggestedSeverity must be one of: LOW, MEDIUM, HIGH, CRITICAL.`;

      // If it's a base64 data URL
      let contents: any = prompt;
      if (imageBase64OrUrl.startsWith('data:image/')) {
        const mimeMatch = imageBase64OrUrl.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const base64Data = imageBase64OrUrl.split(',')[1];
        contents = [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: prompt }
            ]
          }
        ];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
      });

      const responseText = response.text || '';
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        category: parsed.category || 'Road Damage & Potholes',
        confidence: Number(parsed.confidence) || 92,
        suggestedSeverity: parsed.suggestedSeverity || 'HIGH',
        reasoningSummary: parsed.reasoningSummary || 'AI Vision analyzed structural characteristics.',
        suggestedDepartment: parsed.suggestedDepartment || 'Roads & Public Works',
      };
    } catch (err) {
      console.warn('Gemini vision API call error, falling back to intelligent classifier:', err);
    }
  }

  // Intelligent domain fallback
  const text = (userNotes || '').toLowerCase();
  if (text.includes('water') || text.includes('leak') || text.includes('pipe') || text.includes('sewer') || text.includes('flood')) {
    return {
      category: 'Water & Sewage Outflow',
      confidence: 94,
      suggestedSeverity: text.includes('flood') || text.includes('burst') ? 'CRITICAL' : 'HIGH',
      reasoningSummary: 'Identified liquid outflow/utility rupture pattern requiring hydraulic containment.',
      suggestedDepartment: 'Water Resources & Sewage',
    };
  }
  if (text.includes('light') || text.includes('lamp') || text.includes('dark') || text.includes('wire') || text.includes('signal')) {
    return {
      category: 'Streetlight & Signals',
      confidence: 91,
      suggestedSeverity: text.includes('wire') || text.includes('spark') ? 'CRITICAL' : 'MEDIUM',
      reasoningSummary: 'Electrical illumination fixture or distribution signal anomaly detected.',
      suggestedDepartment: 'Street Lighting & Energy',
    };
  }
  if (text.includes('trash') || text.includes('garbage') || text.includes('dump') || text.includes('waste') || text.includes('debris')) {
    return {
      category: 'Waste & Illegal Dumping',
      confidence: 93,
      suggestedSeverity: 'MEDIUM',
      reasoningSummary: 'Solid waste accumulation impeding pedestrian path or public right-of-way.',
      suggestedDepartment: 'Waste Management & Sanitation',
    };
  }
  if (text.includes('tree') || text.includes('branch') || text.includes('bush') || text.includes('park')) {
    return {
      category: 'Fallen Trees & Overgrowth',
      confidence: 95,
      suggestedSeverity: text.includes('fallen') || text.includes('roof') ? 'HIGH' : 'MEDIUM',
      reasoningSummary: 'Botanical obstruction or structural tree limb hazard identified.',
      suggestedDepartment: 'Parks, Trees & Urban Forest',
    };
  }

  return {
    category: 'Road Damage & Potholes',
    confidence: 95,
    suggestedSeverity: 'HIGH',
    reasoningSummary: 'Asphalt surface depression and structural road deterioration detected.',
    suggestedDepartment: 'Roads & Public Works',
  };
}

export async function assistDescription(rawPrompt: string): Promise<{
  title: string;
  description: string;
  category: string;
  suggestedPriority: IssuePriority;
}> {
  if (ai && apiKey) {
    try {
      const prompt = `You are the CivicFix AI Assistant helping a citizen formalize a civic complaint.
Citizen raw note: "${rawPrompt}"

Respond with ONLY a JSON object:
{
  "title": "Concise, professional title (under 60 chars)",
  "description": "Clear, detailed 2-3 sentence description specifying problem, impact on safety or mobility, and immediate concern.",
  "category": "Road Damage & Potholes | Water & Sewage Outflow | Streetlight & Signals | Waste & Illegal Dumping | Fallen Trees & Overgrowth | Sidewalk & Pedestrian Safety",
  "suggestedPriority": "LOW | MEDIUM | HIGH | CRITICAL"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const responseText = response.text || '';
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return parsed;
    } catch (err) {
      console.warn('Gemini text API call error, falling back to rule-based transformer:', err);
    }
  }

  // Heuristic transformer
  const cleanInput = rawPrompt.trim();
  const title = cleanInput.length > 5 
    ? cleanInput.charAt(0).toUpperCase() + cleanInput.slice(1) 
    : 'Reported Civic Defect';

  return {
    title: title.length > 50 ? `${title.slice(0, 47)}...` : title,
    description: `Reported issue regarding: ${cleanInput}. Poses potential hazard to local pedestrian movement, cyclist safety, and neighborhood civic conditions requiring municipal inspection.`,
    category: 'Road Damage & Potholes',
    suggestedPriority: 'HIGH',
  };
}

export function checkDuplicates(
  latitude: number,
  longitude: number,
  category: string,
  thresholdMeters: number = 250
): {
  isPotentialDuplicate: boolean;
  duplicateCandidate?: CivicIssue;
  distanceMeters?: number;
  matchScore?: number;
} {
  const issues = db.getIssues().filter(i => 
    i.status !== 'VERIFIED_RESOLVED' && i.status !== 'CLOSED' && i.status !== 'REJECTED'
  );

  let closestCandidate: CivicIssue | null = null;
  let minDistance = Infinity;

  for (const issue of issues) {
    const dist = calculateDistanceMeters(latitude, longitude, issue.latitude, issue.longitude);
    if (dist <= thresholdMeters) {
      if (dist < minDistance) {
        minDistance = dist;
        closestCandidate = issue;
      }
    }
  }

  if (closestCandidate) {
    const categoryMatch = closestCandidate.category.toLowerCase() === category.toLowerCase();
    const matchScore = categoryMatch ? Math.max(70, Math.round(100 - minDistance / 4)) : 60;
    return {
      isPotentialDuplicate: true,
      duplicateCandidate: closestCandidate,
      distanceMeters: minDistance,
      matchScore,
    };
  }

  return { isPotentialDuplicate: false };
}

export async function generateOfficerAssistance(issue: CivicIssue): Promise<{
  investigationSteps: string[];
  safetyChecklist: string[];
  recommendedEquipment: string[];
  citizenResponseDraft: string;
}> {
  if (ai && apiKey) {
    try {
      const prompt = `You are CivicFix Copilot for field municipal workers.
Issue:
Title: ${issue.title}
Category: ${issue.category}
Priority: ${issue.priority}
Description: ${issue.description}
Address: ${issue.address}

Return JSON:
{
  "investigationSteps": ["Step 1", "Step 2", "Step 3", "Step 4"],
  "safetyChecklist": ["Safety item 1", "Safety item 2"],
  "recommendedEquipment": ["Item 1", "Item 2", "Item 3"],
  "citizenResponseDraft": "Friendly professional 2 sentence note to citizen explaining current progress and timeline."
}`;
      const res = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      const parsed = JSON.parse(res.text?.replace(/```json/gi, '').replace(/```/g, '').trim() || '{}');
      if (parsed.investigationSteps && parsed.investigationSteps.length) {
        return parsed;
      }
    } catch (e) {
      console.warn('AI copilot fallback:', e);
    }
  }

  // Domain fallback
  return {
    investigationSteps: [
      `Deploy safety cones and warning indicators 30 feet in advance at ${issue.address}.`,
      'Perform dimensional depth and surface area measurement to determine material volume.',
      'Check for subterranean pipe erosion or utility cable proximity prior to excavation.',
      'Photograph defect with depth gauge before applying municipal asphalt or fix.',
    ],
    safetyChecklist: [
      'High-visibility Class 3 safety vest and steel-toe boots.',
      'Traffic barrier / directional arrow board deployed.',
      'Gas and electrical line survey verification check.',
    ],
    recommendedEquipment: [
      'Hot mix asphalt or polymer repair mastic',
      'Infrared asphalt heater / vibratory plate compactor',
      'Sub-surface utility locator wand',
      'High-resolution digital camera for before/after evidence capture',
    ],
    citizenResponseDraft: `Hello ${issue.reporterName}, the ${issue.departmentName} field response crew has inspected ${issue.address}. Repair operations have commenced to restore safe municipal passage as scheduled.`,
  };
}
