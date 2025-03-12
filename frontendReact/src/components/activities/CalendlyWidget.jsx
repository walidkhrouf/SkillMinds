import React, { useEffect, useRef, useState } from 'react';

const CalendlyWidget = ({ url, onDateSelect, style, className }) => {
  const widgetInitialized = useRef(false);
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);

  useEffect(() => {
    if (!isWidgetVisible) return;

    // Check if the Calendly script is already loaded
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
      // If the script is already loaded but the widget isn't initialized, initialize it
      initializeCalendlyWidget();
    }

    return () => {
      // Cleanup: Destroy the widget when the component unmounts
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

      // Listen for the calendly.event_scheduled event using postMessage
      window.addEventListener('message', handleCalendlyEvent);

      widgetInitialized.current = true; // Mark as initialized
    } catch (error) {
      console.error('Error initializing Calendly widget:', error);
    }
  };

  const handleCalendlyEvent = (event) => {
    if (event.origin !== 'https://calendly.com') return; // Ensure the message is from Calendly

    if (event.data.event === 'calendly.event_scheduled') {
      const eventData = event.data.payload;
      const eventLink = eventData.event.uri; // Get the Calendly event link
      const selectedDate = eventData.invitee.start_time; // Get the selected date/time

      onDateSelect({ eventLink, selectedDate }); // Pass the event data to the callback
      setIsWidgetVisible(false); // Close the widget after selection
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