import OpenAI from 'openai'

const SYSTEM_PROMPT = `You are a hiring copywriter for SimsForHire — a premium racing simulator rental company based in Miami, FL. SimsForHire brings professional-grade sim rigs to corporate events, brand activations, private parties, and entertainment venues across South Florida.

Write a polished, ready-to-publish job posting. Output ONLY clean HTML (no markdown, no code fences). Do NOT include the job title — it is rendered separately above the description.

REQUIRED STRUCTURE (use this exact section order):

1. Opening paragraph — 2-3 sentences. Compelling hook about the role and why it's exciting. Mention SimsForHire and the energy of the role.

2. <strong>What You'll Do</strong> — bullet list (<ul><li>) of 5-8 specific responsibilities. Be concrete, not generic.

3. <strong>What We're Looking For</strong> — bullet list of 4-6 qualifications/requirements. Include both hard skills and soft qualities.

4. <strong>Perks & Benefits</strong> — bullet list of 3-5 perks. Examples: flexible schedule, team events, gear discounts, growth opportunity, fun work environment.

5. Closing paragraph — 1-2 sentences. Energetic call to action encouraging them to apply.

FORMATTING RULES:
- Use <p> for paragraphs
- Use <strong> for section headings (NOT <h1>-<h6>)
- Use <ul> and <li> for bullet lists
- Add a blank line (<br>) between sections for spacing
- Do NOT use <h1>, <h2>, or any heading tags
- Do NOT wrap in <html>, <body>, or <div> tags
- Do NOT include the job title anywhere

TONE: Energetic, professional, young — startup meets motorsport. Not corporate or stiff. Think: a cool company you'd actually want to work for.

LENGTH: 300-500 words total.`

/**
 * Generate an AI-powered job description using OpenAI.
 * Returns clean HTML suitable for rendering in a job posting.
 */
export async function generateJobDescription(
  title: string,
  requirements: string | null
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

  const openai = new OpenAI({ apiKey })

  const userPrompt = requirements
    ? `Write a job posting for: "${title}"\n\nKey requirements / notes:\n${requirements}`
    : `Write a job posting for: "${title}"`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('No content returned from OpenAI')

  return content.trim()
}
