import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'API Key missing.' }, { status: 500 });
    }

    const systemPrompt = `You are MUETBot, a helpful assistant for MUET students. 
    
    ### RESPONSE GUIDELINES:
    - Answer ONLY what the user asks. 
    - Do NOT give unsolicited advice or repetitive reminders (like attendance rules) unless specifically asked.
    - Keep responses concise and direct.
    - If asked about the university, use the following verified facts:

    ### UNIVERSITY DATA:
    - Vice Chancellor: Prof. Dr. Tauha Hussain Ali.
    - Chairman CSE: Prof. Dr. Shahnawaz Talpur.
    - Chairman Software: Prof. Dr. Nafeesa Bohra.
    - Boys Hostels: Dr. Abdul Qadeer Khan (Afghan) Hostel, Pir Hissam-ud-Din Shah Rashidi Hostel, Shaikh Abdul Majeed Sindhi Hostel, Hyder Bux Jatoi Hostel, Sachal Hostel, and Shah Latif Hostel.
    - Girls Hostels: Marvi Hostel, Nilam Hostel.
    - Minimum Attendance: 75%.
    - Minimum Passing: 50%.
    - Transport: University Points serve Hyderabad, Kotri, and Jamshoro.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "MUET Study Hub"
      },
      body: JSON.stringify({
        model: "openrouter/free", 
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.1, // Even lower temperature for maximum precision
      })
    });

    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data?.error?.message }, { status: response.status });

    return NextResponse.json({ content: data?.choices?.[0]?.message?.content });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
