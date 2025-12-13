'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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

    // startDate를 처음부터 00:00:00으로 정확하게 초기화하여 그리드 불일치 방지
    const [startDate] = useState<Date>(() => {
        const d = startOfWeek(new Date(), { weekStartsOn: 0 });
        d.setHours(0, 0, 0, 0);
        return d;
    });

    // 내부 변경에 의한 업데이트인지 추적하여 무한 루프 방지
    const isInternalUpdate = useRef(false);

    // 초기 로드 시 DB 데이터를 Date[]로 변환
    useEffect(() => {
        // 내부 변경 중이거나, 이미 스케줄 데이터가 있는데 props가 들어오는 경우 무시 (덮어쓰기 방지)
        // 단, 부모에서 초기 데이터를 비동기로 늦게 가져오는 경우는 허용해야 함.
        // 따라서 '내부 변경 플래그'가 true이면 절대 업데이트 금지.
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }

        // startDate는 이미 초기값으로 고정되어 있으므로 다시 set할 필요 없음.
        // 다만 Date Parsing을 위한 reference date는 startDate와 동일해야 함.
        const referenceDate = new Date(startDate); // 복사해서 사용

        // 초기 데이터가 있고, 현재 로컬 상태가 비어있을 때만 동기화 (또는 강제 리셋 로직 필요 시 추가)
        if (initialSchedule && initialSchedule.length > 0) {
            console.log('초기 스케줄 로드 중:', initialSchedule);
            const newSchedule: Date[] = [];

            initialSchedule.forEach((daySch) => {
                const dayIndex = DAYS.indexOf(daySch.day);
                if (dayIndex === -1) return;

                const targetDate = addDays(referenceDate, dayIndex);
                const dateStr = format(targetDate, 'yyyy-MM-dd');

                daySch.timeRanges.forEach((range) => {
                    // referenceDate를 start(자정 기준)로 설정하여 초/밀리초 불일치 방지
                    let curr = parse(`${dateStr} ${range.start}`, 'yyyy-MM-dd HH:mm', referenceDate);
                    let end = parse(`${dateStr} ${range.end}`, 'yyyy-MM-dd HH:mm', referenceDate);

                    // 종료 시간이 시작 시간보다 작거나 같으면(예: 00:00) 다음 날로 간주
                    if (end <= curr) {
                        end = addDays(end, 1);
                    }

                    while (curr < end) {
                        newSchedule.push(curr);
                        // 1시간 단위로 증가
                        curr = new Date(curr.getTime() + 60 * 60 * 1000);
                    }
                });
            });

            // 중복 제거 (Set 활용)
            const uniqueTimestamps = Array.from(new Set(newSchedule.map(d => d.getTime())));
            const uniqueSchedule = uniqueTimestamps.map(t => new Date(t));

            console.log('변환된 스케줄 (Before Set):', uniqueSchedule);

            // 데이터가 도착하면 무조건 업데이트 (최적화 제거)
            setSchedule(uniqueSchedule);
        }
    }, [initialSchedule]);

    const handleChange = useCallback((newSchedule: Date[]) => {
        isInternalUpdate.current = true; // 내부 변경 플래그 설정

        // 중복 제거
        const uniqueTimestamps = Array.from(new Set(newSchedule.map(d => d.getTime())));
        const uniqueDates = uniqueTimestamps.map(t => new Date(t));

        setSchedule(uniqueDates);

        // Date[] -> DaySchedule[] 변환
        const converted: DaySchedule[] = [];

        // 날짜별로 그룹화
        const grouped: { [key: string]: Date[] } = {};
        uniqueDates.forEach(date => {
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
                // 중복이 제거되었으므로 current > start 임이 보장됨
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
                key={schedule.length} // 데이터 로드 시 강제 리렌더링 유도
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
