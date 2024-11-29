import React, { useState } from "react";

const CurrentLocationComponent = ({ setStartCoords }) => {
  const [location, setLocation] = useState(null); // 현재 위치 상태
  const [error, setError] = useState(null); // 에러 메시지 상태

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const coords = `${longitude},${latitude}`; // 좌표 포맷: "경도,위도"
          setLocation({ latitude, longitude });
          setStartCoords(coords); // 부모 컴포넌트에 좌표 전달
        },
        (err) => {
          console.error(err);
          setError("위치 정보를 가져올 수 없습니다.");
        },
        {
          enableHighAccuracy: true, // 높은 정확도 모드 활성화
          timeout: 10000, // 타임아웃 시간 (10초)
          maximumAge: 0, // 이전 위치 데이터를 사용하지 않음
        }
      );
    } else {
      setError("이 브라우저는 Geolocation을 지원하지 않습니다.");
    }
  };

  return (
    <div>
      <button onClick={getCurrentLocation}>현재 위치 가져오기</button>
      {location && (
        <p>
          현재 위치: 위도 {location.latitude}, 경도 {location.longitude}
        </p>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default CurrentLocationComponent;
