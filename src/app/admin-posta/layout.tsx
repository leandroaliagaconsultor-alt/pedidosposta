import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPostaLayout({ children }: { children: ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check if user is logged in and is the admin
    if (!user || user.email !== "leandro@pedidosposta.com") {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-[#FAFAFA] antialiased selection:bg-primary/30 font-sans">
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md">
                <div className="flex h-16 items-center px-6 gap-4 max-w-7xl mx-auto">
                    <span className="text-xl font-black uppercase tracking-tighter text-white flex gap-1">
                        Pedidos<span className="text-primary">Posta</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 rounded-full px-2 py-0.5 border border-primary/20">
                        God Mode
                    </span>
                    <div className="ml-auto flex items-center gap-4 text-sm text-zinc-400 font-medium">
                        <span>{user.email}</span>
                        <form action={async () => {
                            "use server";
                            const supabase = await createClient();
                            await supabase.auth.signOut();
                            redirect("/");
                        }}>
                            <button type="submit" className="text-xs uppercase tracking-wider font-bold hover:text-white transition-colors">
                                Salir
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="w-full flex justify-center">
                <main className="w-full max-w-7xl flex-1 flex-col p-6 lg:p-10 space-y-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
