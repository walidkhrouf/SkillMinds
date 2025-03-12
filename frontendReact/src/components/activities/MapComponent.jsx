import React, { useEffect, useRef } from 'react';
import 'ol/ol.css'; // Import OpenLayers CSS
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM'; // OpenStreetMap as the base layer
import { fromLonLat, toLonLat } from 'ol/proj'; // For coordinate conversion

const MapComponent = ({ onLocationSelect }) => {
  const mapRef = useRef(null); // Reference to the map container

  useEffect(() => {
    // Initialize the map
    const map = new Map({
      target: mapRef.current, // Attach the map to the DOM element
      layers: [
        new TileLayer({
          source: new OSM(), // Use OpenStreetMap as the base layer
        }),
      ],
      view: new View({
        center: fromLonLat([0, 0]), // Initial center (longitude, latitude)
        zoom: 2, // Initial zoom level
      }),
    });

    // Add click event listener to the map
    map.on('click', (event) => {
      const coordinates = toLonLat(event.coordinate); // Convert coordinates to longitude/latitude
      onLocationSelect(coordinates); // Pass coordinates to the parent component
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