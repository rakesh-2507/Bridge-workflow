// src/components/tasks/TaskStatus.tsx

import {
    CheckCircle2,
    Clock3,
    X,
} from "lucide-react";

interface TaskStatusProps {
    status?: number;
}

function TaskStatus({
    status,
}: TaskStatusProps) {
    if (status === 1) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                <CheckCircle2 size={13} />
                Accepted
            </span>
        );
    }

    if (status === 2) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-blue-950 dark:text-blue-300">
                <X size={13} />
                Rejected
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
            <Clock3 size={13} />
            Pending
        </span>
    );
}

export default TaskStatus;