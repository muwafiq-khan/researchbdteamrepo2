import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import Groq from 'groq-sdk'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.AI_HELP_GROQ_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI Help Groq Key not configured' }, { status: 500 })
  }

  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const groq = new Groq({ apiKey })
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful research assistant for the ResearchBD platform. Help users with their academic queries, paper writing, and data analysis."
        },
        {
          role: "user",
          content: message
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    })

    const aiResponse = chatCompletion.choices[0]?.message?.content || ''

    return NextResponse.json({ response: aiResponse })
  } catch (error: any) {
    console.error('Groq AI Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate response' }, { status: 500 })
  }
}
