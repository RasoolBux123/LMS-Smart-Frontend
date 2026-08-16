"use client";

import { useEffect, useState } from "react";
import { listCourses, type Course } from "@/lib/api/courses";
import { useAuth } from "@/hooks/useAuth";

export function useCourseOptions() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const params =
      user?.role === "instructor" && user.id ? { instructorId: user.id } : {};

    listCourses(params)
      .then((res) => {
        if (!cancelled) setCourses(res.data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  return { courses, loading, error };
}