import React, { useEffect, useRef } from 'react';
import 'ol/ol.css'; 
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM'; 
import { fromLonLat, toLonLat } from 'ol/proj'; 

const MapComponent = ({ onLocationSelect }) => {
  const mapRef = useRef(null); 

  useEffect(() => {
    
    const map = new Map({
      target: mapRef.current, 
      layers: [
        new TileLayer({
          source: new OSM(), 
        }),
      ],
      view: new View({
        center: fromLonLat([9.5, 34]), 
        zoom: 6, 
      }),
    });

    
    map.on('click', (event) => {
      const coordinates = toLonLat(event.coordinate); 
      onLocationSelect(coordinates); 
    });

    // Cleanup on unmount
    return () => map.setTarget(undefined);
  }, [onLocationSelect]);

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '200px', margin: '20px 0' }}
    />
  );
};

export default MapComponent;