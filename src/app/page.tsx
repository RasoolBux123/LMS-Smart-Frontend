"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Always land on login — never auto-redirect to dashboard
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}



// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { Loader2 } from "lucide-react";
// import { useAuth } from "@/hooks/useAuth";

// export default function RootPage() {
//   const { user, loading } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (loading) return;

//     if (!user) {
//       router.replace("/login");
//       return;
//     }

//     if (user.role === "admin") router.replace("/admin");
//     else if (user.role === "instructor") router.replace("/instructor");
//     else router.replace("/student");
//   }, [user, loading, router]);

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-background px-4">
//       <div className="flex flex-col items-center gap-3">
//         <Loader2 className="h-6 w-6 animate-spin text-primary" />
//         <p className="text-sm text-muted-foreground">Loading…</p>
//       </div>
//     </div>
//   );
// }
