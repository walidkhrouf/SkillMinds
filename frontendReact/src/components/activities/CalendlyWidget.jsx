import React, { useEffect, useRef, useState } from 'react';

const CalendlyWidget = ({ url, onDateSelect, style, className }) => {
  const widgetInitialized = useRef(false);
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);

  useEffect(() => {
    if (!isWidgetVisible) return;

    
    const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        initializeCalendlyWidget();
      };

      script.onerror = () => {
        console.error('Failed to load Calendly script.');
      };
    } else if (!widgetInitialized.current) {
      
      initializeCalendlyWidget();
    }

    return () => {
      
      if (window.Calendly) {
        window.Calendly.closePopupWidget();
      }
    };
  }, [url, onDateSelect, isWidgetVisible]);

  const initializeCalendlyWidget = () => {
    try {
      window.Calendly.initInlineWidget({
        url: url,
        parentElement: document.getElementById('calendly-widget'),
        prefill: {},
        utm: {},
      });

      
      window.addEventListener('message', handleCalendlyEvent);

      widgetInitialized.current = true; 
    } catch (error) {
      console.error('Error initializing Calendly widget:', error);
    }
  };

  const handleCalendlyEvent = (event) => {
    if (event.origin !== 'https://calendly.com') return; 

    if (event.data.event === 'calendly.event_scheduled') {
      const eventData = event.data.payload;
      const eventLink = eventData.event.uri; 
      const selectedDate = eventData.invitee.start_time; 

      onDateSelect({ eventLink, selectedDate }); 
      setIsWidgetVisible(false); 
    }
  };

  const toggleWidget = () => {
    setIsWidgetVisible((prev) => !prev);
  };

  return (
    <>
      <button onClick={toggleWidget}>Schedule with Calendly</button>
      {isWidgetVisible && (
        <div
          id="calendly-widget"
          style={{ minWidth: '320px', height: '550px', ...style }}
          className={className}
          aria-label="Calendly scheduling widget"
        ></div>
      )}
    </>
  );
};

export default CalendlyWidget;