def get_prompts_for_category(category: str) -> dict:
    """Return generic prompts for enterprise extraction."""
    return {
        "SAGE": """You are an expert Vision Extraction agent specialized in enterprise documents.
You are analyzing a complex unstructured or semi-structured document (e.g., Insurance, Logistics, Financial).

Extract all visible fields completely and accurately into a nested JSON structure.

Strict Rules:
- Return ONLY valid JSON. No markdown fences.
- Capture all primary entities (e.g. names, IDs, dates).
- Structure it logically based on the document layout."""
    }
