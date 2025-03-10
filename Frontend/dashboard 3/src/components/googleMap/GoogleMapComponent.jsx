import React, { useState, useEffect } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useParams } from "react-router-dom";
import { request } from "../../axios_Helper.js";
import "./googleMapComponent.scss";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const center = {
  lat: 3.215438,
  lng: 101.727046,
};

const GoogleMapComponent = () => {
  const { id } = useParams();
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "",
    libraries: ["geometry", "places", "routes"],
  });

  const [markerPositions, setMarkerPositions] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);

  useEffect(() => {
    const fetchRouteData = async () => {
      if (!id) return;

      try {
        const response = await request(
          "GET",
          `http://localhost:8090/api/v1/routes/${id}`,
          {}
        );

        const { route_stops, routeTotalDistance } = response.data;

        let routeTotalDistanceNum = Number(routeTotalDistance);

        let busStops = route_stops;

        // Update state with retrieved data
        setMarkerPositions(
          busStops.map((stop) => {
            console.log("latNum: " + stop.lat);
            console.log("lngNum: " + stop.lng);

            return {
              lat: stop.lat,
              lng: stop.lng,
              name: stop.stopName,
            };
          })
        );

        setTotalDistance(routeTotalDistanceNum);
      } catch (error) {
        console.error("Error fetching route data:", error);
      }
    };

    fetchRouteData();
  }, [id]);

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div className="googleContent1">
      <div className="google">
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
          {markerPositions.map((position, index) => (
            <Marker
              key={index}
              position={position}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png", // Red marker
              }}
            />
          ))}
        </GoogleMap>
      </div>
      <div className="markerPositions">
        <h3>Marker Position List</h3>
        {markerPositions.length > 0 ? (
          <div className="infoContainer">
            {markerPositions.map((position, index) => (
              <div className="info">
                <div className="inner-info">
                  <span>Bus Stop No: {index + 1}</span> <br />
                  <span>Bus Stop Name: {position.name}</span> <br />
                  <span>Latitude: {position.lat}</span>
                  <br />
                  <span>Longitude: {position.lng}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No record...</p>
        )}
      </div>

      <div className="totalDistance">
        <h3>Total Distance: {totalDistance.toFixed(2)} km</h3>
      </div>
    </div>
  );
};

export default GoogleMapComponent;
