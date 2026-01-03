import { useEffect, useRef } from 'react';

interface SevenSegmentTimerProps {
  timeRemaining: number; // seconds
  isPaused?: boolean;
}

const digitSegments = [
  [1, 2, 3, 4, 5, 6],      // 0
  [2, 3],                   // 1
  [1, 2, 7, 5, 4],         // 2
  [1, 2, 7, 3, 4],         // 3
  [6, 7, 2, 3],            // 4
  [1, 6, 7, 3, 4],         // 5
  [1, 6, 5, 4, 3, 7],      // 6
  [1, 2, 3],               // 7
  [1, 2, 3, 4, 5, 6, 7],   // 8
  [1, 2, 7, 3, 6]          // 9
];

function setNumber(digitElement: HTMLElement, number: number) {
  const segments = digitElement.querySelectorAll('.segment');
  const current = parseInt(digitElement.getAttribute('data-value') || 'NaN');

  // Only switch if number has changed or wasn't set
  if (!isNaN(current) && current !== number) {
    // Unset previous number
    digitSegments[current].forEach((digitSegment, index) => {
      setTimeout(() => {
        segments[digitSegment - 1]?.classList.remove('on');
      }, index * 45);
    });
  }

  if (isNaN(current) || current !== number) {
    // Set new number after
    setTimeout(() => {
      digitSegments[number].forEach((digitSegment, index) => {
        setTimeout(() => {
          segments[digitSegment - 1]?.classList.add('on');
        }, index * 45);
      });
    }, 250);
    digitElement.setAttribute('data-value', number.toString());
  }
}

export default function SevenSegmentTimer({ timeRemaining, isPaused = false }: SevenSegmentTimerProps) {
  const minutesDigit1Ref = useRef<HTMLDivElement>(null);
  const minutesDigit2Ref = useRef<HTMLDivElement>(null);
  const secondsDigit1Ref = useRef<HTMLDivElement>(null);
  const secondsDigit2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Always update when time changes, even if paused (to show current time)
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;

    const minutesTens = Math.floor(minutes / 10);
    const minutesOnes = minutes % 10;
    const secondsTens = Math.floor(seconds / 10);
    const secondsOnes = seconds % 10;

    if (minutesDigit1Ref.current) setNumber(minutesDigit1Ref.current, minutesTens);
    if (minutesDigit2Ref.current) setNumber(minutesDigit2Ref.current, minutesOnes);
    if (secondsDigit1Ref.current) setNumber(secondsDigit1Ref.current, secondsTens);
    if (secondsDigit2Ref.current) setNumber(secondsDigit2Ref.current, secondsOnes);
  }, [timeRemaining]);

  return (
    <div className="seven-segment-timer">
      <style>{`
        .seven-segment-timer {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0.5rem;
          background: #000000;
          border: 4px solid #f2e6d3;
          border-radius: 0.5rem;
          min-height: 70px;
          box-shadow: 
            inset 0 0 20px rgba(0, 0, 0, 0.8),
            0 0 10px rgba(246, 244, 238, 0.3),
            0 4px 8px rgba(0, 0, 0, 0.5);
          position: relative;
        }

        .seven-segment-timer::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(135deg, #f2e6d3 0%, #f2e6d3 100%);
          border-radius: 0.5rem;
          z-index: -1;
          opacity: 0.6;
        }

        @media (min-width: 640px) {
          .seven-segment-timer {
            padding: 0.75rem;
            min-height: 100px;
            border-width: 5px;
          }
        }

        /* Landscape mobile optimizations */
        @media (max-height: 500px) and (orientation: landscape) {
          .seven-segment-timer {
            min-height: 60px;
            padding: 0.5rem;
            border-width: 3px;
          }

          .seven-segment-timer .clock {
            height: 60px;
          }

          .seven-segment-timer .digit {
            width: 30px;
            height: 45px;
            margin: 0 1px;
          }
        }

        .seven-segment-timer .clock {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 70px;
        }

        @media (min-width: 640px) {
          .seven-segment-timer .clock {
            height: 100px;
          }
        }

        .seven-segment-timer .digit {
          width: 35px;
          height: 55px;
          margin: 0 1px;
          position: relative;
          display: inline-block;
        }

        @media (min-width: 640px) {
          .seven-segment-timer .digit {
            width: 50px;
            height: 80px;
            margin: 0 2px;
          }
        }

        .seven-segment-timer .digit .segment {
          background: #ff0000;
          border-radius: 2px;
          position: absolute;
          opacity: 0.1;
          transition: opacity 0.2s;
          filter: blur(0.5px);
        }

        .seven-segment-timer .digit .segment.on {
          opacity: 1;
          box-shadow: 
            0 0 15px rgba(255, 0, 0, 0.9),
            0 0 30px rgba(255, 0, 0, 0.6),
            0 0 45px rgba(255, 0, 0, 0.3),
            inset 0 0 10px rgba(255, 100, 100, 0.5);
          transition: opacity 0s;
          filter: blur(0px);
        }

        .seven-segment-timer .separator {
          width: 8px;
          height: 8px;
          background: #ff0000;
          border-radius: 50%;
          display: inline-block;
          position: relative;
          margin: 0 4px;
          opacity: 1;
          box-shadow: 
            0 0 10px rgba(255, 0, 0, 0.9),
            0 0 20px rgba(255, 0, 0, 0.6),
            inset 0 0 5px rgba(255, 100, 100, 0.5);
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }

        .seven-segment-timer .digit .segment:nth-child(1) {
          top: 5px;
          left: 10px;
          right: 10px;
          height: 5px;
        }

        .seven-segment-timer .digit .segment:nth-child(2) {
          top: 10px;
          right: 5px;
          width: 5px;
          height: calc(50% - 15px);
        }

        .seven-segment-timer .digit .segment:nth-child(3) {
          bottom: 10px;
          right: 5px;
          width: 5px;
          height: calc(50% - 15px);
        }

        .seven-segment-timer .digit .segment:nth-child(4) {
          bottom: 5px;
          right: 10px;
          height: 5px;
          left: 10px;
        }

        .seven-segment-timer .digit .segment:nth-child(5) {
          bottom: 10px;
          left: 5px;
          width: 5px;
          height: calc(50% - 15px);
        }

        .seven-segment-timer .digit .segment:nth-child(6) {
          top: 10px;
          left: 5px;
          width: 5px;
          height: calc(50% - 15px);
        }

        .seven-segment-timer .digit .segment:nth-child(7) {
          bottom: calc(50% - 3px);
          right: 10px;
          left: 10px;
          height: 5px;
        }
      `}</style>
      <div className="clock">
        <div className="digit minutes" ref={minutesDigit1Ref}>
          <div className="segment"></div>
          <div className="segment"></div>
          <div className="segment"></div>
          <div className="segment"></div>
          <div className="segment"></div>
          <div className="segment"></div>
          <div className="segment"></div>
        </div>

        <div className="digit minutes" ref={minutesDigit2Ref}>
          <div className="segment"></div>
          <div className="segment"></div>
          <div className="segment"></div>
          <div className="segment"></div>
          <div className="segment"></div>
          <div className="segment"></div>
          <div className="segment"></div>
        </div>

        <div className="separator"></div>

        <div className="digit seconds" ref={secondsDigit1Ref}>
          <div className="segment"></div>
          <div className="segment"></div>
          <div className="segment"></div>
          <div className="segment"></div>
          <div className="segment"></div>
          <div className="segment"></div>
          <div className="segment"></div>
        </div>

        <div className="digit seconds" ref={secondsDigit2Ref}>
          <div className="segment"></div>
          <div className="segment"></div>
          <div className="segment"></div>
          <div className="segment"></div>
          <div className="segment"></div>
          <div className="segment"></div>
          <div className="segment"></div>
        </div>
      </div>
    </div>
  );
}

