"use client";

import { UsersManager } from "@/features/admin/users-manager";

export default function AdminStudentsPage() {
    return <UsersManager scope="student" />;
}