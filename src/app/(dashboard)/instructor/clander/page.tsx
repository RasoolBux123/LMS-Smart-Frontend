"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Calendar,
    dateFnsLocalizer,
    type View,
    type SlotInfo,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useCourseOptions } from "@/hooks/useCourseOptions";
import {
    listCalendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    type CalendarEvent,
    type CalendarEventType,
} from "@/lib/api/calendar";
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

function toLocalInputValue(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function InstructorCalendarPage() {
    const { courses, loading: coursesLoading } = useCourseOptions();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [courseFilter, setCourseFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<View>("week");

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<CalendarEvent | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [title, setTitle] = useState("");
    const [type, setType] = useState<CalendarEventType>("class");
    const [courseId, setCourseId] = useState("");
    const [startAt, setStartAt] = useState("");
    const [endAt, setEndAt] = useState("");
    const [location, setLocation] = useState("");
    const [notes, setNotes] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await listCalendarEvents(
                courseFilter !== "all" ? { courseId: courseFilter } : {},
            );
            setEvents(res.data ?? []);
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

    function openCreate(slot?: SlotInfo) {
        setEditing(null);
        setTitle("");
        setType("class");
        setCourseId(courses[0]?.id ?? "");
        if (slot) {
            setStartAt(toLocalInputValue(slot.start));
            setEndAt(toLocalInputValue(slot.end));
        } else {
            const start = new Date();
            start.setMinutes(0, 0, 0);
            start.setHours(start.getHours() + 1);
            const end = new Date(start);
            end.setHours(end.getHours() + 1);
            setStartAt(toLocalInputValue(start));
            setEndAt(toLocalInputValue(end));
        }
        setLocation("");
        setNotes("");
        setModalOpen(true);
    }

    function openEdit(ev: CalEvent) {
        const e = ev.resource;
        setEditing(e);
        setTitle(e.title);
        setType(e.type);
        setCourseId(e.courseId);
        setStartAt(toLocalInputValue(new Date(e.startAt)));
        setEndAt(toLocalInputValue(new Date(e.endAt)));
        setLocation(e.location || "");
        setNotes(e.notes || "");
        setModalOpen(true);
    }

    async function handleSave() {
        if (!title.trim()) {
            toast.error("Title is required.");
            return;
        }
        if (!courseId) {
            toast.error("Please select a course.");
            return;
        }
        if (!startAt || !endAt) {
            toast.error("Start and end time are required.");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                title: title.trim(),
                type,
                courseId,
                startAt: new Date(startAt).toISOString(),
                endAt: new Date(endAt).toISOString(),
                allDay: false,
                location: location.trim(),
                notes: notes.trim(),
            };
            if (editing) {
                await updateCalendarEvent(editing.id, payload);
                toast.success("Event updated.");
            } else {
                await createCalendarEvent(payload);
                toast.success("Event added to timetable.");
            }
            setModalOpen(false);
            await load();
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Could not save event."));
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!editing) return;
        setDeleting(true);
        try {
            await deleteCalendarEvent(editing.id);
            toast.success("Event deleted.");
            setModalOpen(false);
            await load();
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Could not delete event."));
        } finally {
            setDeleting(false);
        }
    }

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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">
                        Calendar
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Set your class timetable. Students enrolled in the course will see
                        these events.
                    </p>
                </div>
                <Button onClick={() => openCreate()} disabled={coursesLoading}>
                    <Plus className="h-4 w-4" />
                    Add event
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger className="w-full sm:w-52">
                        <SelectValue placeholder="Course" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All my courses</SelectItem>
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
                        {loading ? "Loading timetable…" : `${filtered.length} event(s)`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex h-[480px] items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading…
                        </div>
                    ) : (
                        <div className="instructor-calendar min-h-[560px]">
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
                                selectable
                                popup
                                onSelectSlot={(slot) => openCreate(slot)}
                                onSelectEvent={(ev) => openEdit(ev as CalEvent)}
                                eventPropGetter={(ev) => eventStyleGetter(ev as CalEvent)}
                                style={{ height: 560 }}
                            />
                        </div>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">
                        Tip: click an empty slot to add a class, or click an event to edit /
                        delete it.
                    </p>
                </CardContent>
            </Card>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? "Edit event" : "Add timetable event"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>Title</Label>
                            <Input
                                placeholder="e.g. Java Lecture"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label>Course</Label>
                            <Select value={courseId} onValueChange={setCourseId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select course" />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.length === 0 ? (
                                        <SelectItem value="__none" disabled>
                                            No courses assigned
                                        </SelectItem>
                                    ) : (
                                        courses.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.title}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Type</Label>
                            <Select
                                value={type}
                                onValueChange={(v) => setType(v as CalendarEventType)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(Object.keys(TYPE_META) as CalendarEventType[]).map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {TYPE_META[t].label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <Label>Start</Label>
                                <Input
                                    type="datetime-local"
                                    value={startAt}
                                    onChange={(e) => setStartAt(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>End</Label>
                                <Input
                                    type="datetime-local"
                                    value={endAt}
                                    onChange={(e) => setEndAt(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Location / Room (optional)</Label>
                            <Input
                                placeholder="Lab 2, Building A"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label>Notes (optional)</Label>
                            <Textarea
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                        {editing ? (
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={deleting || saving}
                                onClick={handleDelete}
                            >
                                {deleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                                Delete
                            </Button>
                        ) : (
                            <span />
                        )}
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setModalOpen(false)}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                {saving ? "Saving…" : editing ? "Update" : "Save event"}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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


// // Instructor Calendar Events
// const events = [

//     {
//         title: "AI Class",
//         start: new Date(2026, 7, 12, 9, 0),
//         end: new Date(2026, 7, 12, 11, 0),
//         type: "class",
//     },


//     {
//         title: "Project Review",
//         start: new Date(2026, 7, 18, 10, 0),
//         end: new Date(2026, 7, 18, 12, 0),
//         type: "review",
//     },


//     {
//         title: "Grade Submission",
//         start: new Date(2026, 7, 25),
//         end: new Date(2026, 7, 25),
//         allDay: true,
//         type: "grade",
//     },

// ];


// // Event Colors
// const eventStyleGetter = (event: any) => {

//     let background = "#4338ca";


//     if (event.type === "class") {
//         background = "#0d9488";
//     }


//     if (event.type === "review") {
//         background = "#f59e0b";
//     }


//     if (event.type === "grade") {
//         background = "#2563eb";
//     }


//     return {

//         style: {

//             backgroundColor: background,

//             color: "white",

//             borderRadius: "8px",

//             border: "none",

//             padding: "5px 8px",

//             fontSize: "13px",

//             fontWeight: "600",

//         },

//     };

// };



// export default function CalendarPage() {


//     const [currentDate, setCurrentDate] =
//         useState(new Date());


//     const [currentView, setCurrentView] =
//         useState<View>("month");



//     return (

//         <div className="p-6">


//             <h1 className="mb-5 text-2xl font-bold">
//                 Instructor Calendar
//             </h1>



//             <div
//                 className="
//           rounded-xl
//           bg-card
//           p-5
//           shadow
//         "
//             >


//                 <Calendar


//                     localizer={localizer}


//                     events={events}


//                     startAccessor="start"


//                     endAccessor="end"



//                     date={currentDate}


//                     onNavigate={(date) => {

//                         setCurrentDate(date);

//                     }}



//                     view={currentView}


//                     onView={(view) => {

//                         setCurrentView(view);

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