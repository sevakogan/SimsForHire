import OpenAI from 'openai'

const SYSTEM_PROMPT = `You are writing a job posting for SimsForHire, a premium racing simulator rental company in Miami. Energetic, professional, young tone — startup meets motorsport. Output clean HTML with strong, ul/li, p tags. 200-400 words. Don't include job title as h1.`

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
