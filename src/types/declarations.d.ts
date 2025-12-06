declare module 'react-schedule-selector' {
    import * as React from 'react';

    export interface ScheduleSelectorProps {
        selection: Date[];
        numDays?: number;
        minTime?: number;
        maxTime?: number;
        hourlyChunks?: number;
        dateFormat?: string;
        startDate?: Date;
        onChange: (newSchedule: Date[]) => void;
        selectedColor?: string;
        unselectedColor?: string;
        hoveredColor?: string;
        renderDateCell?: (datetime: Date, selected: boolean, refSetter: (dateCell: HTMLElement | null) => void) => React.ReactNode;
    }

    export default class ScheduleSelector extends React.Component<ScheduleSelectorProps> { }
}
