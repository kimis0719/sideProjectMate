/**
 * frappe-gantt 라이브러리의 TypeScript 타입 선언
 * frappe-gantt는 공식 타입 정의가 없으므로 직접 선언합니다.
 */

declare module 'frappe-gantt' {
    export interface GanttTask {
        id: string;
        name: string;
        start: Date | string;
        end: Date | string;
        progress: number;
        dependencies?: string;
        custom_class?: string;
    }

    export interface GanttOptions {
        header_height?: number;
        column_width?: number;
        step?: number;
        view_mode?: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month';
        bar_height?: number;
        bar_corner_radius?: number;
        arrow_curve?: number;
        padding?: number;
        view_modes?: string[];
        date_format?: string;
        language?: string;
        custom_popup_html?: (task: GanttTask) => string;
        on_click?: (task: GanttTask) => void;
        on_date_change?: (task: GanttTask, start: Date, end: Date) => void;
        on_progress_change?: (task: GanttTask, progress: number) => void;
        on_view_change?: (mode: string) => void;
    }

    export default class Gantt {
        constructor(element: HTMLElement | string, tasks: GanttTask[], options?: GanttOptions);
        change_view_mode(mode: string): void;
        refresh(tasks: GanttTask[]): void;
        clear(): void;
    }
}

declare module 'frappe-gantt/dist/frappe-gantt.css' {
    const content: string;
    export default content;
}
