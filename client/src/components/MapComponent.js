import React, { useEffect, useRef, useState } from 'react';
import MapService from './MapService';
import RouteService from './RouteService';

const MapComponent = ({ startCoords, goalCoords }) => {
  const mapRef = useRef(null);
  const [routeType, setRouteType] = useState('normal');
  const [routeInfo, setRouteInfo] = useState(null);
  const mapService = useRef(null);
  const routeService = useRef(null);

  // 지도 초기화
  useEffect(() => {
    mapService.current = new MapService(mapRef.current);
    routeService.current = new RouteService(mapService.current.getMapInstance());
    
    // 현재 위치 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          mapService.current.setCurrentLocation(position.coords);
        },
        (error) => {
          console.error("현재 위치를 가져올 수 없습니다:", error);
        }
      );
    }
  }, []);

  // 경로 그리기
  useEffect(() => {
    const drawRoute = async () => {
      if (startCoords && goalCoords && routeService.current) {
        try {
          const result = await routeService.current.drawRoute(
            startCoords, 
            goalCoords, 
            routeType
          );
          setRouteInfo(result);
        } catch (error) {
          console.error('경로 그리기 실패:', error);
          setRouteInfo({ error: '경로 검색에 실패했습니다.' });
        }
      }
    };

    drawRoute();
  }, [startCoords, goalCoords, routeType]);

  // 거리 포맷팅 함수
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  // 시간 포맷팅 함수
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}분`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}시간 ${remainingMinutes}분`;
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* 경로 타입 선택 버튼 */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 100,
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={() => setRouteType('normal')}
          style={{
            padding: '8px 16px',
            backgroundColor: routeType === 'normal' ? '#2db400' : '#fff',
            color: routeType === 'normal' ? '#fff' : '#333',
            border: '1px solid #2db400',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          일반 경로
        </button>
        <button
          onClick={() => setRouteType('safe')}
          style={{
            padding: '8px 16px',
            backgroundColor: routeType === 'safe' ? '#4CAF50' : '#fff',
            color: routeType === 'safe' ? '#fff' : '#333',
            border: '1px solid #4CAF50',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          안전 경로
        </button>
      </div>

      <div ref={mapRef} style={{ width: '100%', height: '500px' }} />
      
      {/* 경로 정보 표시 */}
      {routeInfo && !routeInfo.error && (
        <div style={{
          position: 'absolute',
          top: '70px',
          left: '20px',
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          zIndex: 100,
          minWidth: '200px'
        }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 'bold',
            marginBottom: '8px',
            color: '#333'
          }}>
            {routeType === 'normal' ? '도보 경로 정보' : '안전 경로 정보'}
          </div>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#666' }}>총 거리:</span>
              <span style={{ color: '#2db400', fontWeight: 'bold' }}>
                {formatDistance(routeInfo.distance)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#666' }}>예상 소요 시간:</span>
              <span style={{ color: '#2db400', fontWeight: 'bold' }}>
                {formatTime(routeInfo.time)}
              </span>
            </div>
            
            {routeType === 'safe' && routeInfo?.safety && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#666' }}>경로 안전도:</span>
                  <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                    {routeInfo.safety.grade}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#666' }}>CCTV 수:</span>
                  <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                    {routeInfo.cctvCount}개
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#666' }}>편의점 수:</span>
                  <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                    {routeInfo.storeCount}개
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#666' }}>안전 커버리지:</span>
                  <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                    {routeInfo.safety.coverageRatio}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {routeInfo?.error && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          backgroundColor: '#fff3f3',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          color: '#ff0000',
          zIndex: 100
        }}>
          {routeInfo.error}
        </div>
      )}
    </div>
  );
};

export default MapComponent;