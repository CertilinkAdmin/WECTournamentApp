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
  const [prevTime, setPrevTime] = useState(timeRemaining);

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
          padding: 1rem;
          background: #000;
          border-radius: 0.5rem;
          min-height: 120px;
        }

        .seven-segment-timer .clock {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 120px;
        }

        .seven-segment-timer .digit {
          width: 60px;
          height: 100px;
          margin: 0 3px;
          position: relative;
          display: inline-block;
        }

        .seven-segment-timer .digit .segment {
          background: #c00;
          border-radius: 3px;
          position: absolute;
          opacity: 0.15;
          transition: opacity 0.2s;
        }

        .seven-segment-timer .digit .segment.on {
          opacity: 1;
          box-shadow: 0 0 25px rgba(255, 0, 0, 0.7);
          transition: opacity 0s;
        }

        .seven-segment-timer .separator {
          width: 10px;
          height: 10px;
          background: #c00;
          border-radius: 50%;
          display: inline-block;
          position: relative;
          margin: 0 5px;
          opacity: 1;
          box-shadow: 0 0 15px rgba(255, 0, 0, 0.7);
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

