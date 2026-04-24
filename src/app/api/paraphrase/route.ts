import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { text, tone } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert academic and professional paraphraser. Your task is to rewrite the text provided by the user to improve clarity, flow, and vocabulary. Maintain the original meaning perfectly. Do not add any conversational filler, introductions, or explanations. Return ONLY the paraphrased text. The tone should be: ${tone || 'Professional'}.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
    })

    return NextResponse.json({ paraphrasedText: chatCompletion.choices[0]?.message?.content || '' })
  } catch (error: any) {
    console.error('Groq API Error:', error)
    
    let errorMessage = 'Failed to paraphrase text'
    if (error?.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
