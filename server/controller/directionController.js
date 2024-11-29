const tmapService = require('../services/tmapService');
const cctvService = require('../services/cctvService');

const { safetyService, storeService } = require('../services/safetyService');

// 좌표 객체를 문자열로 변환하는 헬퍼 함수
const formatCoords = (coords) => {
  return `${coords.latitude},${coords.longitude}`;
};

function isNearRoute(facility, routeCoordinates, maxDistance = 100) {
  for (const coord of routeCoordinates) {
    const distance = calculateDistance(
      facility.latitude,
      facility.longitude,
      coord[1],
      coord[0]
    );
    if (distance <= maxDistance) {
      return true;
    }
  }
  return false;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

const directionController = {
  // 일반 경로 탐색
  getNormalRoute: async (req, res) => {
    try {
      const { start, goal } = req.query;

      if (!start || !goal) {
        return res.status(400).json({
          success: false,
          error: "출발지와 도착지 좌표가 필요합니다."
        });
      }

      // 객체를 문자열로 변환
      const startCoord = typeof start === 'object' ? formatCoords(start) : start;
      const goalCoord = typeof goal === 'object' ? formatCoords(goal) : goal;

      console.log('일반 경로 검색 요청:', {
        start: startCoord,
        goal: goalCoord
      });

      const route = await tmapService.getRoute(startCoord, goalCoord);
      res.json({
        success: true,
        data: route
      });
    } catch (error) {
      console.error("일반 경로 검색 실패:", error);
      res.status(500).json({
        success: false,
        error: error.message || "경로 검색 중 오류가 발생했습니다."
      });
    }
  },

  // 안전 경로 탐색
  getSafeRoute: async (req, res) => {
    try {
      const { start, goal } = req.query;
      console.log('안전 경로 검색 시작:', { start, goal });

      // 객체를 문자열로 변환
      const startCoord = typeof start === 'object' ? formatCoords(start) : start;
      const goalCoord = typeof goal === 'object' ? formatCoords(goal) : goal;

      // CCTV 데이터 가져오기
      const cctvData = await cctvService.getCCTVData();
      console.log('CCTV 데이터 조회 완료:', cctvData.length + '개');
      
      const routes = await tmapService.getMultipleRoutes(startCoord, goalCoord);
      console.log(`${routes.length}개의 경로 조회 완료`);

      // 각 경로에 대해 안전도 계산
      const validRoutes = await safetyService.calculateRouteSafety(routes, cctvData);
      
      if (validRoutes.length === 0) {
        throw new Error('유효한 경로를 찾을 수 없습니다.');
      }

      // 최적 경로 선택
      const bestRoute = safetyService.selectBestRoute(validRoutes);
      console.log('최적 경로 선택:', {
        safety: bestRoute.safety,
        cctvCount: bestRoute.safety.cctvCount,
        storeCount: bestRoute.safety.storeCount,
        coverageRatio: bestRoute.safety.coverageRatio,
        totalDistance: bestRoute.features[0].properties.totalDistance,
        totalTime: bestRoute.features[0].properties.totalTime
      });

      res.json({
        success: true,
        data: bestRoute
      });

    } catch (error) {
      console.error('안전 경로 검색 실패:', error);
      res.status(500).json({
        success: false,
        error: error.message || '안전 경로 검색에 실패했습니다.'
      });
    }
  }
};

module.exports = directionController;