import React, { useState, useMemo, useCallback, useEffect } from 'react';

// 로컬 저장소에서 선택된 날짜 목록을 로드하는 함수
const loadSelectedDates = () => {
  if (typeof window !== 'undefined') {
    const storedDates = localStorage.getItem('selectedDates');
    if (storedDates) {
      try {
        // JSON 문자열을 배열로 파싱하여 Set으로 변환
        const dateArray = JSON.parse(storedDates);
        return new Set(dateArray);
      } catch (e) {
        console.error("Failed to parse selected dates from localStorage:", e);
      }
    }
  }
  return new Set();
};

// 로컬 저장소에서 누적된 총 금액을 로드하는 함수
const loadCumulativeTotal = () => {
    if (typeof window !== 'undefined') {
        const storedTotal = localStorage.getItem('cumulativeTotal');
        if (storedTotal) {
            // 숫자로 변환, 실패 시 0 반환
            return parseInt(storedTotal, 10) || 0; 
        }
    }
    return 0;
};

// 유틸리티 함수: 특정 월의 날짜 배열을 생성합니다.
const getDaysInMonth = (year, month) => {
  const date = new Date(year, month, 1);
  const startDayOfWeek = date.getDay(); 
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];

  // 이전 달의 공백 채우기
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  // 현재 달의 날짜 채우기
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return days;
};

// 날짜를 YYYY-MM-DD 형식의 문자열로 변환하는 유틸리티
const formatDateKey = (year, month, day) => {
    // month는 0부터 시작하므로 1을 더해줍니다.
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// 통화 형식(KRW)으로 포맷하는 유틸리티
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
};

const DAILY_REWARD = 5000; // 날짜당 획득 금액 (5,000원)

const Calendar = () => {
  // 현재 날짜를 기준으로 초기 상태 설정
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  
  // 1. 선택된 날짜들 (현재 획득 금액 계산용)
  const [selectedDates, setSelectedDates] = useState(loadSelectedDates);
  // 2. 누적 금액 (납부 후 총 합계)
  const [cumulativeTotal, setCumulativeTotal] = useState(loadCumulativeTotal);

  // 선택된 날짜가 변경될 때마다 로컬 저장소에 저장
  useEffect(() => {
    // Set을 JSON 직렬화를 위해 배열로 변환
    const dateArray = Array.from(selectedDates);
    localStorage.setItem('selectedDates', JSON.stringify(dateArray));
  }, [selectedDates]);

  // 누적 금액이 변경될 때마다 로컬 저장소에 저장
  useEffect(() => {
    localStorage.setItem('cumulativeTotal', cumulativeTotal.toString());
  }, [cumulativeTotal]);

  // 현재 달의 날짜 배열 계산
  const days = useMemo(() => getDaysInMonth(currentYear, currentMonth), [currentYear, currentMonth]);

  // 현재 기간 동안의 총 금액 계산 (납부 전 금액)
  const currentTotalAmount = useMemo(() => {
    return selectedDates.size * DAILY_REWARD;
  }, [selectedDates.size]);

  // 납부 버튼 핸들러
  const handlePay = useCallback(() => {
    if (currentTotalAmount === 0) {
        // alert() 사용 불가 규칙에 따라 콘솔에만 기록
        console.log("납부할 금액이 없습니다.");
        return;
    }

    // 1. 현재 금액을 누적 금액에 추가
    setCumulativeTotal(prevTotal => prevTotal + currentTotalAmount);
    
    // 2. 현재 선택된 날짜 (금액) 초기화
    setSelectedDates(new Set());
    
    console.log(`Successfully paid ${formatCurrency(currentTotalAmount)}. New cumulative total: ${formatCurrency(cumulativeTotal + currentTotalAmount)}`);
  }, [currentTotalAmount, cumulativeTotal]); // currentTotalAmount는 useMemo로 계산되므로, selectedDates에 종속적임.

  // 달력 헤더에 표시할 월 이름 (한국어)
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  // 요일 이름 (일요일부터 시작)
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  
  // 이전 달로 이동
  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth(prevMonth => {
      if (prevMonth === 0) {
        setCurrentYear(prevYear => prevYear - 1);
        return 11;
      }
      return prevMonth - 1;
    });
  }, []);

  // 다음 달로 이동
  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prevMonth => {
      if (prevMonth === 11) {
        setCurrentYear(prevYear => prevYear + 1);
        return 0;
      }
      return prevMonth + 1;
    });
  }, []);

  // 날짜 클릭 핸들러: 선택 상태를 토글합니다.
  const handleDateClick = useCallback((day) => {
    if (day === null) return;

    const dateKey = formatDateKey(currentYear, currentMonth, day);
    
    setSelectedDates(prevDates => {
      const newDates = new Set(prevDates);
      if (newDates.has(dateKey)) {
        newDates.delete(dateKey); // 해제
      } else {
        newDates.add(dateKey); // 선택
      }
      return newDates;
    });
  }, [currentYear, currentMonth]);
  
  return (
    <>
      {/* 달력 본문 */}
      <div className="calendar-page">
        <div className="calendar-app-container">
          <h1 className="app-title">
            🗓️ 날짜 선택 금액 계산기
          </h1>
          <p className="app-subtitle">
            선택된 날짜당 **{formatCurrency(DAILY_REWARD)}**이(가) 적립됩니다. 납부 버튼을 누르면 누적 금액에 합산됩니다. (기록은 로컬에 저장됩니다.)
          </p>

          {/* 달력 헤더 (월/년도 표시 및 버튼) */}
          <div className="calendar-header">
            <button
              onClick={goToPreviousMonth}
              className="nav-button"
              aria-label="이전 달"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '1.5rem', height: '1.5rem'}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            
            <div className="month-display">
              {currentYear}년 {monthNames[currentMonth]}
            </div>

            <button
              onClick={goToNextMonth}
              className="nav-button"
              aria-label="다음 달"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '1.5rem', height: '1.5rem'}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
          
          {/* 요일 이름 */}
          <div className="day-names">
            {dayNames.map((day, index) => (
              <div 
                key={day} 
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="date-grid">
            {days.map((day, index) => {
              const dateKey = day !== null ? formatDateKey(currentYear, currentMonth, day) : null;
              const isSelected = day !== null && selectedDates.has(dateKey);
              const isToday = day !== null && dateKey === formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
              
              const dayOfWeekIndex = index % 7;
              let dayTextColorClass = 'text-default';
              if (dayOfWeekIndex === 0) {
                dayTextColorClass = 'text-red';
              } else if (dayOfWeekIndex === 6) {
                dayTextColorClass = 'text-blue';
              }

              return (
                <div 
                  key={index}
                  className="date-cell-wrapper"
                >
                  {day !== null ? (
                    <button
                      onClick={() => handleDateClick(day)}
                      className={`
                        date-button 
                        ${dayTextColorClass}
                        ${isSelected ? 'selected' : ''}
                        ${isToday ? 'today' : ''}
                      `}
                      aria-label={`${currentYear}년 ${currentMonth + 1}월 ${day}일`}
                    >
                      {day}
                    </button>
                  ) : (
                    <div className="date-button" style={{visibility: 'hidden'}}></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 누적 금액 표시 */}
          <div className="cumulative-display">
              <span className="cumulative-label">💰 총 누적 납부 금액:</span>
              <span className="cumulative-amount">{formatCurrency(cumulativeTotal)}</span>
          </div>

          {/* 선택된 날짜 목록 및 금액 표시 */}
          <div className="selected-list-container">
            <h3 className="list-title">
              📅 현재 기간 선택 ({selectedDates.size}일)
            </h3>
            
            {/* 현재 총 금액 표시 */}
            <div className="current-total-display">
                <span className="total-label">현재 적립 금액:</span>
                <span className="current-amount">{formatCurrency(currentTotalAmount)}</span>
            </div>

            {/* 납부 버튼 */}
            <button
                onClick={handlePay}
                className="pay-button"
                disabled={currentTotalAmount === 0}
            >
                {currentTotalAmount > 0 ? `${formatCurrency(currentTotalAmount)} 납부하고 금액 초기화` : '납부할 금액이 없습니다'}
            </button>

            <h3 className="list-title" style={{marginTop: '2rem'}}>
                선택된 날짜 목록
            </h3>
            <div className="tag-list">
              {/* Set을 배열로 변환하고 정렬하여 보여줍니다. */}
              {Array.from(selectedDates).sort().map(dateKey => (
                <span 
                  key={dateKey}
                  className="date-tag"
                >
                  {dateKey}
                </span>
              ))}
              {selectedDates.size === 0 && (
                <p className="no-selection">선택된 날짜가 없습니다.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Calendar;
