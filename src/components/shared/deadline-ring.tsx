"use client";

import { cn, remainingTime, windowElapsedPercent } from "@/lib/utils";

interface DeadlineRingProps {
  createdAt: string;
  deadline: string;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
  submitted?: boolean;
}

export function DeadlineRing({
  createdAt,
  deadline,
  size = 44,
  strokeWidth = 4,
  showLabel = true,
  className,
  submitted = false,
}: DeadlineRingProps) {
  const { overdue, urgent, label } = remainingTime(deadline);
  const percent = submitted ? 100 : windowElapsedPercent(createdAt, deadline);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const color = submitted
    ? "var(--success)"
    : overdue
      ? "var(--danger)"
      : urgent
        ? "var(--warning)"
        : "var(--primary)";

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 700ms ease-out, stroke 300ms",
            }}
          />
        </svg>
      </div>
      {showLabel && (
        <div className="min-w-0">
          <p
            className="text-xs font-semibold leading-tight"
            style={{
              color: submitted
                ? "var(--success)"
                : overdue
                  ? "var(--danger)"
                  : "var(--foreground)",
            }}
          >
            {submitted ? "Submitted" : label}
          </p>
        </div>
      )}
    </div>
  );
}



// "use client";

// import { cn, remainingTime, windowElapsedPercent } from "@/lib/utils";

// interface DeadlineRingProps {
//   createdAt: string;
//   deadline: string;
//   size?: number;
//   strokeWidth?: number;
//   showLabel?: boolean;
//   className?: string;
//   submitted?: boolean;
// }

// /**
//  * Circular "meridian dial" showing how much of an assignment's window has
//  * elapsed. This is the app's signature visual motif — reused on dashboard
//  * cards, table rows, and the assignment detail page.
//  */
// export function DeadlineRing({
//   createdAt,
//   deadline,
//   size = 44,
//   strokeWidth = 4,
//   showLabel = true,
//   className,
//   submitted = false,
// }: DeadlineRingProps) {
//   const { overdue, urgent, label } = remainingTime(deadline);
//   const percent = submitted ? 100 : windowElapsedPercent(createdAt, deadline);

//   const radius = (size - strokeWidth) / 2;
//   const circumference = 2 * Math.PI * radius;
//   const offset = circumference - (percent / 100) * circumference;

//   const color = submitted
//     ? "var(--success)"
//     : overdue
//       ? "var(--danger)"
//       : urgent
//         ? "var(--warning)"
//         : "var(--primary)";

//   return (
//     <div className={cn("inline-flex items-center gap-2.5", className)}>
//       <div className="relative shrink-0" style={{ width: size, height: size }}>
//         <svg width={size} height={size} className="-rotate-90">
//           <circle
//             cx={size / 2}
//             cy={size / 2}
//             r={radius}
//             fill="none"
//             stroke="var(--border)"
//             strokeWidth={strokeWidth}
//           />
//           <circle
//             cx={size / 2}
//             cy={size / 2}
//             r={radius}
//             fill="none"
//             stroke={color}
//             strokeWidth={strokeWidth}
//             strokeDasharray={circumference}
//             strokeDashoffset={offset}
//             strokeLinecap="round"
//             style={{
//               transition: "stroke-dashoffset 700ms ease-out, stroke 300ms",
//             }}
//           />
//         </svg>
//       </div>
//       {showLabel && (
//         <div className="min-w-0">
//           <p
//             className="text-xs font-semibold leading-tight"
//             style={{
//               color: submitted
//                 ? "var(--success)"
//                 : overdue
//                   ? "var(--danger)"
//                   : "var(--foreground)",
//             }}
//           >
//             {submitted ? "Submitted" : label}
//           </p>
//         </div>
//       )}
//     </div>
//   );
// }
