import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Formato no soportado. Usa JPG, PNG o WebP." }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Imagen muy pesada. Máximo 10MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");

    const mediaType = file.type === "image/jpg" ? "image/jpeg" : file.type as "image/jpeg" | "image/png" | "image/webp";

    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64Data },
            },
            {
              type: "text",
              text: `Extraé categorías y productos de este menú. Respondé SOLO JSON:
{"categorias":[{"nombre":"Cat","productos":[{"nombre":"Prod","descripcion":"","precio":0}]}]}
Si no es un menú legible, respondé: {"error":"descripción del problema"}`,
            },
          ],
        },
      ],
    });

    const text = result.content[0].type === "text" ? result.content[0].text : "";
    const cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    try {
      const parsed = JSON.parse(cleanText);
      if (parsed.error) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      return NextResponse.json(parsed);
    } catch {
      console.error("Parse error, raw response:", cleanText);
      return NextResponse.json(
        { error: "La IA devolvió un formato inválido. Intentá con otra foto." },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error scan-menu:", error);
    return NextResponse.json(
      { error: error.message || "Error del servidor" },
      { status: 500 }
    );
  }
}
