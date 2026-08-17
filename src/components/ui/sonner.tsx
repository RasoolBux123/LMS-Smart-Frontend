"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-secondary group-[.toast]:text-secondary-foreground",
          success:
            "group-[.toaster]:bg-emerald-600 group-[.toaster]:text-white group-[.toaster]:border-emerald-700",
          error:
            "group-[.toaster]:bg-red-600 group-[.toaster]:text-white group-[.toaster]:border-red-700",
          warning:
            "group-[.toaster]:bg-amber-500 group-[.toaster]:text-white group-[.toaster]:border-amber-600",
          info: "group-[.toaster]:bg-blue-600 group-[.toaster]:text-white group-[.toaster]:border-blue-700",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };



// "use client";

// import { useTheme } from "next-themes";
// import { Toaster as Sonner } from "sonner";

// type ToasterProps = React.ComponentProps<typeof Sonner>;

// const Toaster = ({ ...props }: ToasterProps) => {
//   const { theme = "system" } = useTheme();

//   return (
//     <Sonner
//       theme={theme as ToasterProps["theme"]}
//       className="toaster group"
//       toastOptions={{
//         classNames: {
//           toast:
//             "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl",
//           description: "group-[.toast]:text-muted-foreground",
//           actionButton:
//             "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
//           cancelButton:
//             "group-[.toast]:bg-secondary group-[.toast]:text-secondary-foreground",
//         },
//       }}
//       {...props}
//     />
//   );
// };

// export { Toaster };
