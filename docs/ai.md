# CivicFix — AI Architecture & Gemini 3.8 Flash Integration

CivicFix integrates generative and multimodal AI as a core architectural asset rather than an ornamental chatbot.

## Core Models

- **Multimodal Classification & Vision**: `gemini-3.8-flash`
- **Text Formalization & Description Drafting**: `gemini-3.8-flash`
- **Field Copilot & Procedure Generation**: `gemini-3.8-flash`

## Capabilities

### 1. AI Vision Analysis
- Receives uploaded image base64 data.
- Analyzes structural pavement failure, botanical obstruction, hazardous wires, or utility leaks.
- Outputs standardized JSON:
  - `category`: e.g. "Road Damage & Potholes"
  - `confidence`: numeric percentage (e.g. 96%)
  - `suggestedSeverity`: LOW, MEDIUM, HIGH, or CRITICAL
  - `reasoningSummary`: Human-readable justification of the assessment
  - `suggestedDepartment`: Routing recommendation

### 2. Description Assistant
- Accepts colloquial voice or typed text (e.g. "massive hole in road by school bus stop").
- Formulates a formal municipal title and safety impact statement.
- Citizen can review, modify, or accept suggestions prior to submission.

### 3. Duplicate Detection
- Uses Haversine geospatial proximity formula combined with category matching.
- Flags existing open tickets within 250m.
- Empowers the citizen to endorse the existing ticket or proceed with a separate report.

### 4. Field Officer Copilot
- Generates site safety checklists (cones, reflective gear, gas detector).
- Outlines step-by-step investigation protocols.
- Drafts personalized citizen status updates.
