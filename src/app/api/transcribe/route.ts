// /api/transcribe route for audio transcription fallback
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Missing GROQ_API_KEY" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const audio = formData.get("audio");
    const languageRaw = formData.get("language");
    const language =
      typeof languageRaw === "string" &&
      (languageRaw === "en" || languageRaw === "ja")
        ? languageRaw
        : undefined; // let Whisper auto-detect if not provided

    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // `audio` from formData in Next.js is a File (subclass of Blob). Pass it directly.
    const file = audio as File;

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      // Map UI language to model hint; omit to allow auto-detection when undefined
      ...(language ? { language } : {}),
    });

    const text = transcription?.text?.trim?.() ?? "";
    if (!text) {
      return NextResponse.json(
        { error: "Empty transcription" },
        { status: 502 }
      );
    }

    return NextResponse.json({ transcript: text });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
