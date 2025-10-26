import React, { useEffect, useRef } from 'react';

const AnalogClock: React.FC = () => {
  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);
  const secRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const deg = 6;
    
    const setClock = () => {
      const day = new Date();
      const hh = day.getHours() * 30;
      const mm = day.getMinutes() * deg;
      const ss = day.getSeconds() * deg;
      
      if (hourRef.current) {
        hourRef.current.style.transform = `rotateZ(${hh + mm / 12}deg)`;
      }
      if (minRef.current) {
        minRef.current.style.transform = `rotateZ(${mm}deg)`;
      }
      if (secRef.current) {
        secRef.current.style.transform = `rotateZ(${ss}deg)`;
      }
    };

    // First time
    setClock();
    
    // Update every 1000 ms
    const interval = setInterval(setClock, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="analog-clock">
      <div className="clock">
        <div className="hour" ref={hourRef}></div>
        <div className="min" ref={minRef}></div>
        <div className="sec" ref={secRef}></div>
      </div>
    </div>
  );
};

export default AnalogClock;
