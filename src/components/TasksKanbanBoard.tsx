"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  CollisionDetection,
  pointerWithin,
  getFirstCollision,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { theme, STATUS_STYLES, PRIORITY_STYLES } from "@/lib/theme";

type Task = {
  id: string;
  name: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: { id: string; name: string; email: string } | null;
  pinned?: boolean;
  _count?: { comments: number; attachments: number };
};

type StatusColumn = {
  id: string;
  name: string;
  color: string;
  order: number;
};

type TasksKanbanBoardProps = {
  tasks: Task[];
  statusColumns: StatusColumn[];
  onTaskMove: (taskId: string, newStatus: string) => void;
  onTaskClick?: (taskId: string) => void;
  loading?: boolean;
};

// Sortable Task Card Component
function SortableTaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

// Task Card Component
function TaskCard({
  task,
  onClick,
  isDragging = false,
}: {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
}) {
  const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      onClick={onClick}
      style={{
        background: theme.colors.bgSecondary,
        borderRadius: 10,
        padding: 14,
        marginBottom: 10,
        border: `1px solid ${theme.colors.borderLight}`,
        cursor: isDragging ? "grabbing" : "pointer",
        boxShadow: isDragging
          ? "0 8px 24px rgba(0,0,0,0.15)"
          : "0 1px 3px rgba(0,0,0,0.05)",
        transform: isDragging ? "rotate(3deg)" : "none",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
          e.currentTarget.style.borderColor = theme.colors.primary;
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
          e.currentTarget.style.borderColor = theme.colors.borderLight;
        }
      }}
    >
      {/* Priority indicator bar at top */}
      <div
        style={{
          height: 3,
          borderRadius: 2,
          background: priorityStyle.color,
          marginBottom: 10,
          marginTop: -4,
          marginLeft: -4,
          marginRight: -4,
        }}
      />

      {/* Task name */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: theme.colors.textPrimary,
          marginBottom: 8,
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {task.pinned && (
          <span style={{ marginRight: 6, color: theme.colors.warning }}>📌</span>
        )}
        {task.name}
      </div>

      {/* Meta info row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Priority badge */}
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 12,
              fontSize: 10,
              fontWeight: 600,
              background: priorityStyle.bg,
              color: priorityStyle.color,
              textTransform: "uppercase",
            }}
          >
            {task.priority}
          </span>

          {/* Due date */}
          {task.dueDate && (
            <span
              style={{
                fontSize: 11,
                color: isOverdue ? theme.colors.error : theme.colors.textMuted,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>

        {/* Assignee avatar */}
        {task.assignee && (
          <div
            title={task.assignee.name}
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: theme.gradients.primary,
              color: "white",
              fontSize: 10,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {task.assignee.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
        )}
      </div>

      {/* Comment & attachment count */}
      {task._count && (task._count.comments > 0 || task._count.attachments > 0) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 10,
            paddingTop: 8,
            borderTop: `1px solid ${theme.colors.borderLight}`,
          }}
        >
          {task._count.comments > 0 && (
            <span
              style={{
                fontSize: 11,
                color: theme.colors.textMuted,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {task._count.comments}
            </span>
          )}
          {task._count.attachments > 0 && (
            <span
              style={{
                fontSize: 11,
                color: theme.colors.textMuted,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              {task._count.attachments}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Kanban Column Component
function KanbanColumn({
  column,
  tasks,
  onTaskClick,
}: {
  column: StatusColumn;
  tasks: Task[];
  onTaskClick?: (taskId: string) => void;
}) {
  // Make the column a droppable area
  const { setNodeRef, isOver } = useDroppable({
    id: column.name, // Use status name as droppable ID
  });

  const statusStyle = STATUS_STYLES[column.name] || {
    color: column.color,
    bg: column.color + "20",
  };

  return (
    <div
      style={{
        flex: "0 0 300px",
        minWidth: 300,
        maxWidth: 300,
        background: isOver ? `${statusStyle.color || column.color}10` : theme.colors.bgPrimary,
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100vh - 280px)",
        transition: "background 0.2s ease",
        border: isOver ? `2px dashed ${statusStyle.color || column.color}` : "2px solid transparent",
      }}
    >
      {/* Column header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: `2px solid ${statusStyle.color || column.color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: theme.colors.bgSecondary,
          borderRadius: "10px 10px 0 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: statusStyle.color || column.color,
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: theme.colors.textPrimary,
              textTransform: "capitalize",
            }}
          >
            {column.name.replace(/_/g, " ").toLowerCase()}
          </span>
        </div>
        <span
          style={{
            padding: "2px 10px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            background: statusStyle.bg || column.color + "20",
            color: statusStyle.color || column.color,
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Column content - this is the droppable area */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          padding: 12,
          overflowY: "auto",
          minHeight: 150,
        }}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task.id)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: isOver ? statusStyle.color || column.color : theme.colors.textMuted,
              fontSize: 13,
              border: `2px dashed ${isOver ? statusStyle.color || column.color : theme.colors.borderLight}`,
              borderRadius: 8,
              marginTop: 8,
              transition: "all 0.2s ease",
            }}
          >
            {isOver ? "Drop here" : "No tasks"}
          </div>
        )}
      </div>
    </div>
  );
}

// Main Kanban Board Component
export default function TasksKanbanBoard({
  tasks,
  statusColumns,
  onTaskMove,
  onTaskClick,
  loading = false,
}: TasksKanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

  // Update local tasks when props change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    statusColumns.forEach((col) => {
      grouped[col.name] = [];
    });
    localTasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      } else {
        // If task has unknown status, put in first column
        const firstCol = statusColumns[0]?.name;
        if (firstCol && grouped[firstCol]) {
          grouped[firstCol].push(task);
        }
      }
    });
    return grouped;
  }, [localTasks, statusColumns]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = localTasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active task
    const activeTask = localTasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Determine the new status
    let newStatus = activeTask.status;

    // Check if over a column (droppable area - uses status name as ID)
    const overColumn = statusColumns.find((col) => col.name === overId);
    if (overColumn) {
      newStatus = overColumn.name;
    } else {
      // Check if over another task
      const overTask = localTasks.find((t) => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    // Update local state for immediate visual feedback
    if (newStatus !== activeTask.status) {
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: newStatus } : t))
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the task being dragged
    const task = localTasks.find((t) => t.id === activeId);
    if (!task) return;

    // Determine final status
    let finalStatus = task.status;

    // Check if dropped on a column
    const overColumn = statusColumns.find((col) => col.name === overId);
    if (overColumn) {
      finalStatus = overColumn.name;
    } else {
      // Check if dropped on another task
      const overTask = localTasks.find((t) => t.id === overId);
      if (overTask) {
        finalStatus = overTask.status;
      }
    }

    // Update local state and persist to server
    if (finalStatus !== task.status || overColumn || localTasks.find(t => t.id === overId)) {
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: finalStatus } : t))
      );
      // Call the parent handler to persist the change
      onTaskMove(activeId, finalStatus);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          gap: 16,
          overflowX: "auto",
          padding: "16px 0",
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: "0 0 300px",
              height: 400,
              background: theme.colors.bgTertiary,
              borderRadius: 12,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    );
  }

  // Custom collision detection that prioritizes droppable columns
  const customCollisionDetection: CollisionDetection = (args) => {
    // First check if we're over a droppable column
    const pointerCollisions = pointerWithin(args);

    // Find if any collision is with a column (status name)
    const columnCollision = pointerCollisions.find((collision) =>
      statusColumns.some((col) => col.name === collision.id)
    );

    if (columnCollision) {
      return [columnCollision];
    }

    // If not over a column, check for task collisions
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    // Fallback to rect intersection
    return rectIntersection(args);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        style={{
          display: "flex",
          gap: 16,
          overflowX: "auto",
          padding: "16px 0",
          minHeight: 400,
        }}
      >
        {statusColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.name] || []}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      {/* Drag overlay for smooth dragging */}
      <DragOverlay>
        {activeTask && (
          <div style={{ width: 280 }}>
            <TaskCard task={activeTask} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
