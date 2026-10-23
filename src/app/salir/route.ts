import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Cierra la sesión de un agente dado de baja (ver getAgenteActual). Es un
// Route Handler porque desde un Server Component no se pueden borrar cookies.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login?baja=1", request.url));
}
