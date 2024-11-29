import React, { useState, useEffect } from "react";
import axios from "axios";

const AddressToCoords = ({ setStartCoords, setGoalCoords }) => {
  const [startAddress, setStartAddress] = useState("");
  const [goalAddress, setGoalAddress] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchResult, setSearchResult] = useState("");

  // 카표 형식 통일화 함수
  const formatCoords = (latitude, longitude) => {
    return {
      // 내부적으로 사용할 좌표 객체 형식
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      // TMap API 요청용 문자열 형식
      toString: function() {
        return `${this.longitude},${this.latitude}`;
      }
    };
  };

  // 카카오 키워드 검색 API 호출
  const fetchCoordsFromKakao = async (query, setCoords, type) => {
    const KAKAO_API_KEY = process.env.REACT_APP_KAKAO_API_KEY;
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`;

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `KakaoAK ${KAKAO_API_KEY}`,
        },
      });

      const documents = response.data.documents;
      if (documents && documents.length > 0) {
        const { x, y, place_name } = documents[0];
        // 좌표 형식 통일화
        const coords = formatCoords(y, x);
        setCoords(coords);
        setSearchResult((prev) => `${prev}\n${type}: ${place_name} (${coords.latitude}, ${coords.longitude})`);
        setErrorMessage("");
      } else {
        setErrorMessage(`${type}에 해당하는 결과를 찾을 수 없습니다.`);
      }
    } catch (error) {
      console.error(`${type} 검색 실패`, error);
      setErrorMessage(`${type} 검색 실패.`);
    }
  };

  // Google Places Autocomplete 이벤트 처리
  useEffect(() => {
    if (window.google) {
      const autocompleteStart = new window.google.maps.places.Autocomplete(
        document.getElementById('start-address-input'),
        { types: ['geocode'] }
      );

      const autocompleteGoal = new window.google.maps.places.Autocomplete(
        document.getElementById('goal-address-input'),
        { types: ['geocode'] }
      );

      // 출발지 Place 선택 이벤트 리스너
      autocompleteStart.addListener('place_changed', () => {
        const place = autocompleteStart.getPlace();
        if (place.geometry) {
          setStartAddress(place.formatted_address);
          // 좌표 형식 통일화
          const coords = formatCoords(
            place.geometry.location.lat(),
            place.geometry.location.lng()
          );
          setStartCoords(coords);
          setSearchResult(prev => 
            `${prev}\n출발지: ${place.formatted_address} (${coords.latitude}, ${coords.longitude})`
          );
          setErrorMessage("");
        }
      });

      // 도착지 Place 선택 이벤트 리스너
      autocompleteGoal.addListener('place_changed', () => {
        const place = autocompleteGoal.getPlace();
        if (place.geometry) {
          setGoalAddress(place.formatted_address);
          // 좌표 형식 통일화
          const coords = formatCoords(
            place.geometry.location.lat(),
            place.geometry.location.lng()
          );
          setGoalCoords(coords);
          setSearchResult(prev => 
            `${prev}\n도착지: ${place.formatted_address} (${coords.latitude}, ${coords.longitude})`
          );
          setErrorMessage("");
        }
      });
    }
  }, [setStartCoords, setGoalCoords]);

  // 검색 버튼 클릭 (카카오 API 사용)
  const handleSearch = () => {
    setErrorMessage("");
    setSearchResult("");

    if (!startAddress || !goalAddress) {
      setErrorMessage("출발지와 도착지 모두 입력하세요.");
      return;
    }

    fetchCoordsFromKakao(startAddress, setStartCoords, "출발지");
    fetchCoordsFromKakao(goalAddress, setGoalCoords, "도착지");
  };

  return (
    <div>
      <h3>주소 입력</h3>
      <input
        id="start-address-input"
        type="text"
        placeholder="출발지 입력"
        value={startAddress}
        onChange={(e) => setStartAddress(e.target.value)}
      />
      <input
        id="goal-address-input"
        type="text"
        placeholder="도착지 입력"
        value={goalAddress}
        onChange={(e) => setGoalAddress(e.target.value)}
      />
      <button onClick={handleSearch}>검색</button>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      <pre style={{ whiteSpace: "pre-line" }}>{searchResult}</pre>
    </div>
  );
};

export default AddressToCoords;