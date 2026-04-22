export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 }
            },
            {
              type: 'text',
              text: `Parse this quotation PDF and return ONLY a JSON object (no markdown, no backticks, no explanation) with this exact structure:

{
  "project": "project name",
  "salesArea": number (sqm),
  "gender": "Men/Women/Unisex or null",
  "updated": "date string",
  "revision": "revision string",
  "supplier": "supplier name from letterhead",
  "deliveryDate": "date or TBC",
  "openingDate": "date or TBC",
  "categories": [
    {
      "name": "INVENTORY",
      "items": [
        { "itemNo": "string", "name": "string", "qty": number, "unit": "string", "unitPrice": number, "totalPrice": number }
      ],
      "total": number
    }
  ],
  "summary": {
    "inventory": number,
    "selectedDeliveries": number,
    "specificProjectCost": number,
    "specialElements": number,
    "fittingRooms": number,
    "floor": number,
    "avHifi": number,
    "construction": number,
    "totalExclVat": number,
    "sqmPrice": number
  }
}

Parse ALL line items from every category. Use 0 for empty/missing amounts. Return ONLY valid JSON.`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Claude API error:', errText);
      return Response.json({ error: 'Failed to parse PDF. Make sure ANTHROPIC_API_KEY is set.' }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    
    // Try to parse JSON from response
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanText);
    
    return Response.json(parsed);
  } catch (error) {
    console.error('Parse error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
