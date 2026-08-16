import { Skeleton } from "@/components/ui/skeleton";

export default function InstructorLoading() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-7 w-56" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
            </div>
            <Skeleton className="h-64 rounded-2xl" />
        </div>
    );
}
