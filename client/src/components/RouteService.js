/* global naver */

class RouteService {
  constructor(mapInstance) {
    this.mapInstance = mapInstance;
    this.markers = [];
    this.cctvMarkers = [];
    this.pathInstance = null;
    this.storeMarkers = [];
    this.currentInfoWindow = null;
  }

  clearMap() {
    if (this.pathInstance) {
      this.pathInstance.setMap(null);
    }
    this.markers.forEach(marker => marker.setMap(null));
    this.cctvMarkers.forEach(marker => marker.setMap(null));
    this.storeMarkers.forEach(marker => marker.setMap(null));
    
    this.markers = [];
    this.cctvMarkers = [];
    this.storeMarkers = [];
    
    if (this.currentInfoWindow) {
      this.currentInfoWindow.close();
    }
  }

  async drawRoute(startCoords, goalCoords, routeType) {
    try {
      this.clearMap();

      // 출발지 마커 생성
      const startMarker = new naver.maps.Marker({
        position: new naver.maps.LatLng(startCoords.latitude, startCoords.longitude),
        map: this.mapInstance,
        icon: {
          content: `
            <div style="position: relative;">
              <div style="width: 16px; height: 16px; background: #2db400; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
            </div>`,
          anchor: new naver.maps.Point(8, 8)
        }
      });

      // 도착지 마커 생성
      const endMarker = new naver.maps.Marker({
        position: new naver.maps.LatLng(goalCoords.latitude, goalCoords.longitude),
        map: this.mapInstance,
        icon: {
          content: `
            <div style="position: relative;">
              <div style="width: 16px; height: 16px; background: #ff0000; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
            </div>`,
          anchor: new naver.maps.Point(8, 8)
        }
      });

      this.markers.push(startMarker, endMarker);

      // 경로 API 호출
      const apiEndpoint = routeType === 'safe' ? 'safe-direction' : 'normal-direction';
      const startStr = `${startCoords.latitude},${startCoords.longitude}`;
      const goalStr = `${goalCoords.latitude},${goalCoords.longitude}`;
      
      console.log('요청 좌표:', { start: startStr, goal: goalStr });

      const response = await fetch(
        `http://localhost:3001/direction/${apiEndpoint}?start=${startStr}&goal=${goalStr}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '경로 검색 실패');
      }

      const result = await response.json();
      console.log('서버 응답:', result);

      if (result.success && result.data.features) {
        const pathCoordinates = [];
        
        result.data.features.forEach(feature => {
          if (feature.geometry.type === 'LineString') {
            pathCoordinates.push(...feature.geometry.coordinates);
          }
        });

        // 경로 그리기
        this.pathInstance = new naver.maps.Polyline({
          map: this.mapInstance,
          path: pathCoordinates.map(coord => new naver.maps.LatLng(coord[1], coord[0])),
          strokeColor: '#5347AA',
          strokeWeight: 5
        });

        // 경로가 보이도록 지도 범위 조정
        const bounds = new naver.maps.LatLngBounds();
        pathCoordinates.forEach(coord => {
          bounds.extend(new naver.maps.LatLng(coord[1], coord[0]));
        });
        
        this.mapInstance.fitBounds(bounds);

        // 안전 경로일 경우 CCTV와 편의점 표시
        if (routeType === 'safe') {
          //console.log('CCTV 데이터:', result.data.nearbyCCTVs);
          //console.log('편의점 데이터:', result.data.nearbyStores);

          if (result.data.nearbyCCTVs && result.data.nearbyCCTVs.length > 0) {
            this.displayCCTVMarkers(result.data.nearbyCCTVs);
          }
          if (result.data.nearbyStores && result.data.nearbyStores.length > 0) {
            this.displayStoreMarkers(result.data.nearbyStores);
          }
        }

        // 경로 정보 포맷팅
        return {
          distance: result.data.features[0].properties.totalDistance || 0,  // 미터 단위
          time: result.data.features[0].properties.totalTime || 0,         // 초 단위
          safety: result.data.safety,
          cctvCount: result.data.nearbyCCTVs?.length || 0,
          storeCount: result.data.nearbyStores?.length || 0
        };
      }
    } catch (error) {
      console.error('경로 그리기 실패:', error);
      throw error;
    }
  }

  displayCCTVMarkers(cctvData) {
    cctvData.forEach(cctv => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(cctv.latitude, cctv.longitude),
        map: this.mapInstance,
        icon: {
          content: `
            <div style="position: relative;">
              <div style="width: 24px; height: 24px; background: #FFD700; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center;">
                <div style="font-size: 10px; color: #000; font-weight: bold;">${cctv.cameraCount || 1}</div>
              </div>
            </div>`,
          anchor: new naver.maps.Point(12, 12)
        }
      });

      const infoWindow = new naver.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 200px;">
            <h4 style="margin: 0 0 5px 0;">CCTV 정보</h4>
            <p style="margin: 5px 0;">카메라 수: ${cctv.cameraCount || 1}대</p>
            <p style="margin: 5px 0;">설치 목적: ${cctv.purpose || '안전 감시'}</p>
            <p style="margin: 5px 0; font-size: 12px;">${cctv.address || '주소 정보 없음'}</p>
          </div>
        `,
        borderWidth: 0,
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
      });

      naver.maps.Event.addListener(marker, 'click', () => {
        if (this.currentInfoWindow) {
          this.currentInfoWindow.close();
        }
        infoWindow.open(this.mapInstance, marker);
        this.currentInfoWindow = infoWindow;
      });

      this.cctvMarkers.push(marker);
    });
  }

  displayStoreMarkers(stores) {
    stores.forEach(store => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(store.latitude, store.longitude),
        map: this.mapInstance,
        icon: {
          content: `
            <div style="position: relative;">
              <div style="width: 24px; height: 24px; background: #4CAF50; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center;">
                <div style="font-size: 12px; color: white;">C</div>
              </div>
            </div>`,
          anchor: new naver.maps.Point(12, 12)
        }
      });

      const infoWindow = new naver.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 200px;">
            <h4 style="margin: 0 0 5px 0;">${store.name || '편의점'}</h4>
            <p style="margin: 5px 0;">${store.address || '주소 정보 없음'}</p>
            <p style="margin: 5px 0; color: #666;">거리: ${store.distance || '정보 없음'}</p>
          </div>
        `,
        borderWidth: 0,
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
      });

      naver.maps.Event.addListener(marker, 'click', () => {
        if (this.currentInfoWindow) {
          this.currentInfoWindow.close();
        }
        infoWindow.open(this.mapInstance, marker);
        this.currentInfoWindow = infoWindow;
      });

      this.storeMarkers.push(marker);
    });
  }
}

export default RouteService;
