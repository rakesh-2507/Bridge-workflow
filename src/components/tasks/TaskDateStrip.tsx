import {
    useRef,
    useState,
} from "react";

import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

interface TaskDateStripProps {
    selectedDate: string;
    onDateChange: (date: string) => void;
    getTaskCount: (date: string) => number;
}

interface DateItem {
    date: Date;
    dateKey: string;
}

function TaskDateStrip({
    selectedDate,
    onDateChange,
    getTaskCount,
}: TaskDateStripProps) {
    const [isDragging, setIsDragging] =
        useState(false);

    const dragStartX =
        useRef<number | null>(null);

    const hasDragged =
        useRef(false);

    const dates = generateDates(
        selectedDate,
        7
    );

    /*
     * Move selected date by one day.
     */
    const moveDate = (
        direction: "prev" | "next"
    ) => {
        const current =
            new Date(
                `${selectedDate}T00:00:00`
            );

        current.setDate(
            current.getDate() +
                (direction === "next"
                    ? 1
                    : -1)
        );

        onDateChange(
            getDateKey(current)
        );
    };

    /*
     * Select a date.
     *
     * Ignore the click if the pointer
     * interaction was actually a drag.
     */
    const handleDateClick = (
        dateKey: string
    ) => {
        if (hasDragged.current) {
            hasDragged.current = false;
            return;
        }

        onDateChange(dateKey);
    };

    /*
     * Start pointer interaction.
     */
    const handlePointerDown = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        dragStartX.current =
            event.clientX;

        hasDragged.current = false;

        setIsDragging(true);

        /*
         * IMPORTANT:
         * Do NOT use setPointerCapture here.
         *
         * Pointer capture on the parent can prevent
         * the date button's click from behaving normally.
         */
    };

    /*
     * Detect horizontal dragging.
     */
    const handlePointerMove = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        if (
            dragStartX.current === null
        ) {
            return;
        }

        const distance =
            event.clientX -
            dragStartX.current;

        /*
         * Consider it a drag only after
         * moving more than 8px.
         */
        if (Math.abs(distance) > 8) {
            hasDragged.current = true;
        }
    };

    /*
     * Finish pointer interaction.
     */
    const handlePointerUp = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        if (
            dragStartX.current === null
        ) {
            setIsDragging(false);
            return;
        }

        const distance =
            event.clientX -
            dragStartX.current;

        const SWIPE_THRESHOLD = 50;

        /*
         * Only change the date when this was
         * actually a horizontal swipe.
         */
        if (
            Math.abs(distance) >=
            SWIPE_THRESHOLD
        ) {
            if (distance < 0) {
                moveDate("next");
            } else {
                moveDate("prev");
            }

            hasDragged.current = true;
        }

        dragStartX.current = null;

        setIsDragging(false);
    };

    /*
     * Reset drag state when pointer interaction
     * is cancelled.
     */
    const handlePointerCancel = () => {
        dragStartX.current = null;
        hasDragged.current = false;

        setIsDragging(false);
    };

    return (
        <div
            className="
                w-full
                min-w-0
                border-b
                border-gray-200
                bg-gradient-to-r
                from-sky-50
                via-white
                to-sky-50
                px-3
                py-3
                dark:border-gray-800
                dark:from-gray-950
                dark:via-gray-900
                dark:to-gray-950
            "
        >
            <div
                className="
                    mx-auto
                    flex
                    w-full
                    max-w-[1400px]
                    items-center
                    gap-2
                "
            >
                {/* Previous */}
                <button
                    type="button"
                    onClick={() =>
                        moveDate("prev")
                    }
                    className="
                        group
                        flex
                        h-14
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-p 
                        bg-s 
                        text-white
                        shadow-sm
                        transition-all
                        duration-200
                        hover:-translate-x-0.5
                        hover:bg-sky-800
                        hover:shadow-md
                        active:scale-95
                        dark:border-sky-200
                        dark:bg-sky-200
                        dark:text-sky-950
                    "
                    aria-label="Previous dates"
                >
                    <ChevronLeft
                        size={19}
                        className="
                            transition-transform
                            group-hover:-translate-x-0.5
                        "
                    />
                </button>

                {/* Date strip */}
                <div
                    className={[
                        "grid",
                        "min-w-0",
                        "flex-1",
                        "grid-cols-7",
                        "gap-2",
                        "touch-pan-y",
                        "select-none",
                        isDragging
                            ? "cursor-grabbing"
                            : "cursor-grab",
                    ].join(" ")}
                    onPointerDown={
                        handlePointerDown
                    }
                    onPointerMove={
                        handlePointerMove
                    }
                    onPointerUp={
                        handlePointerUp
                    }
                    onPointerCancel={
                        handlePointerCancel
                    }
                >
                    {dates.map((item) => {
                        const isSelected =
                            item.dateKey ===
                            selectedDate;

                        const taskCount =
                            getTaskCount(
                                item.dateKey
                            );

                        return (
                            <button
                                type="button"
                                key={item.dateKey}
                                onClick={() =>
                                    handleDateClick(
                                        item.dateKey
                                    )
                                }
                                className={[
                                    "group",
                                    "relative",
                                    "h-14",
                                    "min-w-0",
                                    "overflow-hidden",
                                    "rounded-xl",
                                    "border",
                                    "px-2",
                                    "transition-all",
                                    "duration-200",

                                    isSelected
                                        ? [
                                              "border-p ",
                                              "bg-s ",
                                              "text-white",
                                              "shadow-lg",
                                              "shadow-sky-900/20",
                                              "ring-2",
                                              "ring-sky-900/10",
                                              "dark:border-sky-200",
                                              "dark:bg-sky-200",
                                              "dark:text-sky-950",
                                              "dark:ring-sky-200/10",
                                          ].join(" ")
                                        : [
                                              "border-gray-200",
                                              "bg-white",
                                              "text-gray-600",
                                              "shadow-sm",
                                              "hover:-translate-y-0.5",
                                              "hover:border-sky-300",
                                              "hover:bg-sky-50",
                                              "hover:shadow-md",
                                              "dark:border-gray-700",
                                              "dark:bg-gray-800",
                                              "dark:text-gray-300",
                                              "dark:hover:border-sky-700",
                                              "dark:hover:bg-gray-750",
                                          ].join(" "),
                                ].join(" ")}
                            >
                                {isSelected && (
                                    <span
                                        className="
                                            absolute
                                            left-0
                                            top-0
                                            h-1
                                            w-full
                                            bg-sky-300
                                            dark:bg-sky-700
                                        "
                                    />
                                )}

                                <div
                                    className="
                                        flex
                                        h-full
                                        items-center
                                        justify-center
                                        gap-2
                                    "
                                >
                                    {/* Date */}
                                    <div
                                        className="
                                            min-w-0
                                            text-left
                                            leading-none
                                        "
                                    >
                                        <div
                                            className={[
                                                "mb-1",
                                                "text-[9px]",
                                                "font-bold",
                                                "uppercase",
                                                "tracking-[0.12em]",
                                                isSelected
                                                    ? "text-sky-200 dark:text-sky-800"
                                                    : "text-sky-700 dark:text-sky-400",
                                            ].join(" ")}
                                        >
                                            {item.date.toLocaleDateString(
                                                "en-US",
                                                {
                                                    weekday:
                                                        "short",
                                                }
                                            )}
                                        </div>

                                        <div
                                            className="
                                                whitespace-nowrap
                                                text-sm
                                                font-bold
                                            "
                                        >
                                            {item.date.toLocaleDateString(
                                                "en-US",
                                                {
                                                    month:
                                                        "short",
                                                }
                                            )}{" "}
                                            {String(
                                                item.date.getDate()
                                            ).padStart(
                                                2,
                                                "0"
                                            )}
                                        </div>
                                    </div>

                                    {/* Task count */}
                                    <span
                                        className={[
                                            "flex",
                                            "h-7",
                                            "min-w-7",
                                            "shrink-0",
                                            "items-center",
                                            "justify-center",
                                            "rounded-full",
                                            "px-2",
                                            "text-[10px]",
                                            "font-bold",

                                            isSelected
                                                ? [
                                                      "bg-white",
                                                      "text-sky-900",
                                                      "shadow-sm",
                                                      "dark:bg-sky-950",
                                                      "dark:text-sky-100",
                                                  ].join(" ")
                                                : taskCount >
                                                    0
                                                  ? [
                                                        "bg-sky-100",
                                                        "text-sky-800",
                                                        "dark:bg-s ",
                                                        "dark:text-sky-200",
                                                    ].join(
                                                        " "
                                                    )
                                                  : [
                                                        "bg-gray-100",
                                                        "text-gray-400",
                                                        "dark:bg-gray-700",
                                                        "dark:text-gray-500",
                                                    ].join(
                                                        " "
                                                    ),
                                        ].join(" ")}
                                    >
                                        {taskCount}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Next */}
                <button
                    type="button"
                    onClick={() =>
                        moveDate("next")
                    }
                    className="
                        group
                        flex
                        h-14
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-p 
                        bg-s 
                        text-white
                        shadow-sm
                        transition-all
                        duration-200
                        hover:translate-x-0.5
                        hover:bg-sky-800
                        hover:shadow-md
                        active:scale-95
                        dark:border-sky-200
                        dark:bg-sky-200
                        dark:text-sky-950
                    "
                    aria-label="Next dates"
                >
                    <ChevronRight
                        size={19}
                        className="
                            transition-transform
                            group-hover:translate-x-0.5
                        "
                    />
                </button>
            </div>
        </div>
    );
}

/*
 * Generate 7 dates around the selected date:
 *
 * -3
 * -2
 * -1
 *  0
 * +1
 * +2
 * +3
 */
function generateDates(
    centerDate: string,
    totalDays: number
): DateItem[] {
    const center =
        new Date(
            `${centerDate}T00:00:00`
        );

    const half =
        Math.floor(
            totalDays / 2
        );

    const dates: DateItem[] = [];

    for (
        let index = -half;
        index <= half;
        index++
    ) {
        const date =
            new Date(center);

        date.setDate(
            center.getDate() +
                index
        );

        dates.push({
            date,
            dateKey:
                getDateKey(date),
        });
    }

    return dates;
}

function getDateKey(
    date: Date
): string {
    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export default TaskDateStrip;
