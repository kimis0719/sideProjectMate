'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ScheduleSelector from 'react-schedule-selector';
import styled from 'styled-components';
import { startOfWeek, addDays, format, parse, getDay } from 'date-fns';

interface TimeRange {
    start: string;
    end: string;
}

interface DaySchedule {
    day: string;
    timeRanges: TimeRange[];
}

interface AvailabilitySchedulerProps {
    initialSchedule?: DaySchedule[];
    onChange: (schedule: DaySchedule[]) => void;
}

const Container = styled.div`
  width: 100%;
  & > div {
    width: 100% !important;
  }
`;

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function AvailabilityScheduler({ initialSchedule = [], onChange }: AvailabilitySchedulerProps) {
    const [schedule, setSchedule] = useState<Date[]>([]);
    const [startDate, setStartDate] = useState<Date>(new Date());

    // 초기 로드 시 DB 데이터를 Date[]로 변환
    useEffect(() => {
        // 이번 주 일요일을 기준으로 날짜 매핑
        const start = startOfWeek(new Date(), { weekStartsOn: 0 });
        setStartDate(start);

        if (initialSchedule && initialSchedule.length > 0) {
            const newSchedule: Date[] = [];

            initialSchedule.forEach((daySch) => {
                const dayIndex = DAYS.indexOf(daySch.day);
                if (dayIndex === -1) return;

                const targetDate = addDays(start, dayIndex);
                const dateStr = format(targetDate, 'yyyy-MM-dd');

                daySch.timeRanges.forEach((range) => {
                    // 시간 범위 (예: 09:00 ~ 10:00)를 1시간 단위 블록으로 변환
                    // react-schedule-selector는 기본적으로 1시간 단위라고 가정 (설정에 따라 다름)
                    // 여기서는 간단하게 start 시간만 체크해서 추가하는 식으로 구현하거나
                    // 정확하게 범위를 채워야 함.

                    // 30분 단위나 1시간 단위로 루프를 돌며 Date 객체 생성
                    let curr = parse(`${dateStr} ${range.start}`, 'yyyy-MM-dd HH:mm', new Date());
                    const end = parse(`${dateStr} ${range.end}`, 'yyyy-MM-dd HH:mm', new Date());

                    while (curr < end) {
                        newSchedule.push(curr);
                        // 1시간 단위로 증가 (ScheduleSelector 기본값)
                        curr = new Date(curr.getTime() + 60 * 60 * 1000);
                    }
                });
            });
            setSchedule(newSchedule);
        }
    }, [initialSchedule]);

    const handleChange = useCallback((newSchedule: Date[]) => {
        setSchedule(newSchedule);

        // Date[] -> DaySchedule[] 변환
        const converted: DaySchedule[] = [];

        // 날짜별로 그룹화
        const grouped: { [key: string]: Date[] } = {};
        newSchedule.forEach(date => {
            const dayName = DAYS[getDay(date)];
            if (!grouped[dayName]) grouped[dayName] = [];
            grouped[dayName].push(date);
        });

        // 각 요일별로 시간 범위 병합
        Object.keys(grouped).forEach(day => {
            const dates = grouped[day].sort((a, b) => a.getTime() - b.getTime());
            const ranges: TimeRange[] = [];

            if (dates.length === 0) return;

            let start = dates[0];
            let end = new Date(start.getTime() + 60 * 60 * 1000); // 1시간 블록

            for (let i = 1; i < dates.length; i++) {
                const current = dates[i];
                // 연속된 시간인지 확인
                if (current.getTime() === end.getTime()) {
                    end = new Date(current.getTime() + 60 * 60 * 1000);
                } else {
                    // 끊기면 저장하고 새로 시작
                    ranges.push({
                        start: format(start, 'HH:mm'),
                        end: format(end, 'HH:mm')
                    });
                    start = current;
                    end = new Date(current.getTime() + 60 * 60 * 1000);
                }
            }
            // 마지막 범위 저장
            ranges.push({
                start: format(start, 'HH:mm'),
                end: format(end, 'HH:mm')
            });

            converted.push({
                day: day,
                timeRanges: ranges
            });
        });

        onChange(converted);
    }, [onChange]);

    return (
        <Container>
            <ScheduleSelector
                selection={schedule}
                numDays={7}
                minTime={6} // 오전 6시부터
                maxTime={24} // 자정까지
                hourlyChunks={1} // 1시간 단위
                dateFormat="ddd" // 요일만 표시
                startDate={startDate}
                onChange={handleChange}
                selectedColor="#3b82f6" // Tailwind blue-500
                unselectedColor="#f3f4f6" // Tailwind gray-100
                hoveredColor="#93c5fd" // Tailwind blue-300
            />
        </Container>
    );
}
