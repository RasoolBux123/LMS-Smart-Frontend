"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {Calendar,dateFnsLocalizer,type View,} 
from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    listCalendarEvents,
    type CalendarEvent,
    type CalendarEventType,
} 
from "@/lib/api/calendar";
import { listCourses, type Course } from "@/lib/api/courses";
import { errorMessage } from "@/lib/utils";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const TYPE_META: Record<
    CalendarEventType,
    { label: string; color: string }
> = {
    class: { label: "Class", color: "#0d9488" },
    lab: { label: "Lab", color: "#7c3aed" },
    review: { label: "Review", color: "#f59e0b" },
    office_hours: { label: "Office hours", color: "#2563eb" },
    other: { label: "Other", color: "#64748b" },
};

type CalEvent = {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource: CalendarEvent;
};

function toCalEvents(items: CalendarEvent[]): CalEvent[] {
    return items.map((e) => ({
        id: e.id,
        title: e.courseTitle ? `${e.title} · ${e.courseTitle}` : e.title,
        start: new Date(e.startAt),
        end: new Date(e.endAt),
        allDay: e.allDay,
        resource: e,
    }));
}

export default function StudentCalendarPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [courseFilter, setCourseFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<View>("week");
    const [selected, setSelected] = useState<CalendarEvent | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [evRes, courseRes] = await Promise.all([
                listCalendarEvents(
                    courseFilter !== "all" ? { courseId: courseFilter } : {},
                ),
                listCourses().catch(() => ({ data: [] as Course[] })),
            ]);
            setEvents(evRes.data ?? []);
            setCourses(courseRes.data ?? []);
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Could not load calendar."));
        } finally {
            setLoading(false);
        }
    }, [courseFilter]);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = useMemo(() => {
        if (typeFilter === "all") return events;
        return events.filter((e) => e.type === typeFilter);
    }, [events, typeFilter]);

    const calEvents = useMemo(() => toCalEvents(filtered), [filtered]);

    const eventStyleGetter = (event: CalEvent) => {
        const color = TYPE_META[event.resource.type]?.color ?? "#4338ca";
        return {
            style: {
                backgroundColor: color,
                borderRadius: "8px",
                border: "none",
                color: "white",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 700,
                padding: "4px 8px",
                lineHeight: 1.3,
            },
        };
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">
                    Calendar
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Your class timetable from instructors. Read-only.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger className="w-full sm:w-52">
                        <SelectValue placeholder="Course" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All courses</SelectItem>
                        {courses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                                {c.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-44">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        {(Object.keys(TYPE_META) as CalendarEventType[]).map((t) => (
                            <SelectItem key={t} value={t}>
                                {TYPE_META[t].label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex flex-wrap gap-2">
                    {(
                        Object.entries(TYPE_META) as [
                            CalendarEventType,
                            { label: string; color: string },
                        ][]
                    ).map(([key, meta]) => (
                        <Badge
                            key={key}
                            variant="outline"
                            className="gap-1.5 border-transparent text-xs"
                            style={{
                                backgroundColor: `${meta.color}22`,
                                color: meta.color,
                            }}
                        >
                            <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: meta.color }}
                            />
                            {meta.label}
                        </Badge>
                    ))}
                </div>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium text-muted-foreground">
                        {loading ? "Loading…" : `${filtered.length} event(s)`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex h-[480px] items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading…
                        </div>
                    ) : (
                        <Calendar
                            localizer={localizer}
                            events={calEvents}
                            startAccessor="start"
                            endAccessor="end"
                            date={currentDate}
                            onNavigate={setCurrentDate}
                            view={currentView}
                            onView={setCurrentView}
                            views={["month", "week", "day"]}
                            defaultView="week"
                            popup
                            onSelectEvent={(ev) => setSelected((ev as CalEvent).resource)}
                            eventPropGetter={(ev) => eventStyleGetter(ev as CalEvent)}
                            style={{ height: 560 }}
                        />
                    )}

                    {selected && (
                        <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4 text-sm">
                            <p className="font-semibold">{selected.title}</p>
                            <p className="mt-1 text-muted-foreground">
                                {selected.courseTitle} ·{" "}
                                {TYPE_META[selected.type]?.label ?? selected.type}
                            </p>
                            <p className="mt-1 text-muted-foreground">
                                {new Date(selected.startAt).toLocaleString()} –{" "}
                                {new Date(selected.endAt).toLocaleString()}
                            </p>
                            {selected.location ? (
                                <p className="mt-1">Location: {selected.location}</p>
                            ) : null}
                            {selected.notes ? (
                                <p className="mt-1 text-muted-foreground">{selected.notes}</p>
                            ) : null}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}







// "use client";

// import { useState } from "react";

// import {
//     Calendar,
//     dateFnsLocalizer,
//     View,
// } from "react-big-calendar";

// import {
//     format,
//     parse,
//     startOfWeek,
//     getDay,
// } from "date-fns";

// import { enUS } from "date-fns/locale";

// import "react-big-calendar/lib/css/react-big-calendar.css";


// const locales = {
//     "en-US": enUS,
// };


// const localizer = dateFnsLocalizer({
//     format,
//     parse,
//     startOfWeek,
//     getDay,
//     locales,
// });


// // Student Calendar Events
// const events = [

//     {
//         title: "AI Class",
//         start: new Date(2026, 7, 15, 10, 0),
//         end: new Date(2026, 7, 15, 11, 0),
//         type: "quiz",
//     },


//     {
//         title: "Grade Submission",
//         start: new Date(2026, 7, 20, 9, 0),
//         end: new Date(2026, 7, 20, 12, 0),
//         type: "exam",
//     },


//     {
//         title: "Project Submission",
//         start: new Date(2026, 7, 25),
//         end: new Date(2026, 7, 25),
//         allDay: true,
//         type: "project",
//     },

// ];



// // Event Colors
// const eventStyleGetter = (event: any) => {

//     let background = "#4338ca";


//     if (event.type === "quiz") {
//         background = "#16a34a";
//     }


//     if (event.type === "exam") {
//         background = "#dc2626";
//     }


//     if (event.type === "project") {
//         background = "#2563eb";
//     }


//     return {
//         style: {
//             backgroundColor: background,
//             color: "white",
//             borderRadius: "8px",
//             border: "none",
//             padding: "4px 8px",
//             fontSize: "13px",
//             fontWeight: "600",
//         },
//     };
// };



// export default function StudentCalendar() {


//     const [date, setDate] = useState(
//         new Date()
//     );


//     const [view, setView] =
//         useState<View>("month");



//     return (

//         <div className="p-6">


//             <h1 className="mb-5 text-2xl font-bold">
//                 Student Calendar
//             </h1>



//             <div className="
//         rounded-xl
//         bg-#4338ca
//         p-5
//         shadow
//       ">


//                 <Calendar

//                     localizer={localizer}


//                     events={events}


//                     startAccessor="start"


//                     endAccessor="end"


//                     date={date}


//                     view={view}


//                     onNavigate={(newDate) => {

//                         setDate(newDate);

//                     }}


//                     onView={(newView) => {

//                         setView(newView);

//                     }}



//                     views={[
//                         "month",
//                         "week",
//                         "day",
//                     ]}



//                     defaultView="month"



//                     toolbar={true}



//                     popup={true}



//                     eventPropGetter={
//                         eventStyleGetter
//                     }



//                     style={{
//                         height: 650,
//                     }}


//                 />


//             </div>


//         </div>

//     );

// }
