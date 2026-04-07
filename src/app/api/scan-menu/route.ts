import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    // Auth check — solo usuarios logueados con tenant
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

    // Validar tipo y tamaño de archivo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Formato de imagen no soportado. Usa JPG, PNG o WebP." }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "La imagen es muy pesada. Maximo 10MB." }, { status: 400 });
    }

    // Inicializando el modelo estable 2.5 Flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Convertir archivo a base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");

    const prompt = `Actua como un extractor de datos estructurados para menús de restaurantes. 
Tu tarea es leer la imagen del menú y extraer todas las categorías y productos.

Devuelve ÚNICAMENTE un JSON (sin markdown, sin bloques de código, sin texto adicional) con esta estructura exacta:
{
  "categorias": [
    {
      "nombre": "String",
      "productos": [
        {
          "nombre": "String",
          "descripcion": "String (o vacío)",
          "precio": Number (o 0 si no se lee)
        }
      ]
    }
  ]
}

Si no puedes leer la imagen con claridad o no parece un menú, devuelve un error descriptivo en JSON.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    console.log("Respuesta cruda de Gemini:", text);

    // Limpieza estricta del JSON
    const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
      const parsedData = JSON.parse(cleanText);
      return NextResponse.json(parsedData);
    } catch (parseError: any) {
      console.error("❌ ERROR EN API SCAN-MENU (Parse):", parseError, "Texto recibido:", cleanText);
      return NextResponse.json(
        { error: "La IA devolvió un formato inválido. Revisa los logs para más detalles." },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("❌ ERROR EN API SCAN-MENU:", error);
    return NextResponse.json(
      { error: error.message || "Error desconocido en el servidor" },
      { status: 500 }
    );
  }
}
