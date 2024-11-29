const fetch = require("node-fetch");

const tmapService = {
  validateCoordinates: (start, goal) => {
    const [startLat, startLng] = start.split(",").map(coord => parseFloat(coord));
    const [endLat, endLng] = goal.split(",").map(coord => parseFloat(coord));

    if ([startLat, startLng, endLat, endLng].some(coord => isNaN(coord))) {
      throw new Error("유효하지 않은 좌표값입니다.");
    }

    return {
      startX: startLng.toString(),
      startY: startLat.toString(),
      endX: endLng.toString(),
      endY: endLat.toString()
    };
  },

  getRoute: async (start, goal) => {
    const coords = tmapService.validateCoordinates(start, goal);
    const response = await tmapService.requestRoute(coords);
    return await tmapService.processResponse(response);
  },

  getMultipleRoutes: async (start, goal) => {
    const coords = tmapService.validateCoordinates(start, goal);
    const routeOptions = [
      { searchOption: 0 }, // 추천경로
      { searchOption: 4 }, // 대로우선
      { searchOption: 10 } // 최단거리
    ];

    try {
      const routePromises = routeOptions.map(option =>
        tmapService.requestRoute(coords, option.searchOption)
      );

      const responses = await Promise.all(routePromises);
      const routes = await Promise.all(
        responses.map(response => tmapService.processResponse(response))
      );

      console.log('TMap 경로 응답:', JSON.stringify(routes[0], null, 2));

      routes.forEach((route, index) => {
        if (!route.features || !route.features[0]?.geometry?.coordinates) {
          throw new Error(`유효하지 않은 경로 데이터 (경로 ${index + 1})`);
        }
      });

      return routes;
    } catch (error) {
      console.error('경로 요청 실패:', error);
      throw error;
    }
  },

  requestRoute: async (coords, searchOption = 0) => {
    const { startX, startY, endX, endY } = coords;
    const response = await fetch(
      "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "appKey": process.env.TMAP_API_KEY,
        },
        body: JSON.stringify({
          startX,
          startY,
          endX,
          endY,
          reqCoordType: "WGS84GEO",
          resCoordType: "WGS84GEO",
          startName: "출발지",
          endName: "도착지",
          searchOption
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TMap API 오류 응답:', errorText);
      throw new Error(`TMAP API 오류: ${response.status} ${response.statusText}`);
    }

    return response;
  },

  processResponse: async (response) => {
    const data = await response.json();
    
    if (!data.features || !Array.isArray(data.features)) {
      console.error('유효하지 않은 TMap 응답:', data);
      throw new Error("유효하지 않은 응답 데이터입니다.");
    }

    const allCoordinates = [];
    data.features.forEach(feature => {
      if (feature.geometry.type === 'LineString') {
        allCoordinates.push(...feature.geometry.coordinates);
      }
    });

    const uniqueCoordinates = allCoordinates.filter((coord, index, self) =>
      index === self.findIndex(c => 
        c[0] === coord[0] && c[1] === coord[1]
      )
    );

    return {
      ...data,
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: uniqueCoordinates
          },
          properties: {
            totalDistance: data.features.reduce((sum, feature) => 
              sum + (feature.properties?.distance || 0), 0),
            totalTime: data.features.reduce((sum, feature) => 
              sum + (feature.properties?.time || 0), 0)
          }
        }
      ]
    };
  }
};

module.exports = tmapService;
