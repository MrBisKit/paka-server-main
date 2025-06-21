import axios from 'axios';

import type { Delivery } from '@prisma/client';

export const getCoordinates = async (
  address: string
): Promise<{ coordinateX: number; coordinateY: number }> => {
  const apiKey = process.env.AZURE_MAPS_API_KEY;
  const url = `https://atlas.microsoft.com/search/address/json?&subscription-key=${apiKey}&api-version=1.0&language=en-US&query=${address}`;

  const response = await axios.get(url);

  return {
    coordinateX: response.data.results[0].position.lat,
    coordinateY: response.data.results[0].position.lon,
  };
};

const DEPOT_COORDINATES = {
  x: 54.4141644329496,
  y: 18.45831346256514,
};

export const getRoute = async (deliveries: Delivery[]): Promise<Delivery[]> => {
  if (deliveries.length === 0) return [];

  const points = [
    [DEPOT_COORDINATES.x, DEPOT_COORDINATES.y],
    ...deliveries.map((d) => [d.coordinateX, d.coordinateY]),
    [DEPOT_COORDINATES.x, DEPOT_COORDINATES.y],
  ];

  const apiKey = process.env.AZURE_MAPS_API_KEY;
  const queryParam = points.map((coord) => coord.join(',')).join(':');
  const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${apiKey}&query=${encodeURIComponent(
    queryParam
  )}&computeBestOrder=true&travelMode=car&routeType=shortest`;

  console.log('Fetching route with URL:', url);

  const response = await axios.get(url);
  const data = response.data;

  const optymalizedWaypoints = data.optimizedWaypoints;

  // Assign correct index
  const deliveriesWithIndex = deliveries.map((delivery, i) => {
    const optimized = optymalizedWaypoints.find((wp: any) => wp.providedIndex === i);
    return {
      ...delivery,
      index: optimized?.optimizedIndex ?? delivery.index,
    };
  });

  // Output google maps link with optimized route
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${DEPOT_COORDINATES.x},${
    DEPOT_COORDINATES.y
  }&destination=${DEPOT_COORDINATES.x},${DEPOT_COORDINATES.y}&waypoints=${deliveriesWithIndex
    .map((d) => `${d.coordinateX},${d.coordinateY}`)
    .join('|')}&travelmode=driving`;

  return deliveriesWithIndex;
};
