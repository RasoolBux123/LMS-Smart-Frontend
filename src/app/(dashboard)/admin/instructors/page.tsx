"use client";

import { UsersManager } from "@/features/admin/users-manager";

export default function AdminInstructorsPage() {
    return <UsersManager scope="instructor" />;
}