const fetch = require("node-fetch");

const storeService = {
  getStoreData: async (coordinates) => {
    try {
      if (!coordinates || !coordinates.length) {
        console.error('유효하지 않은 좌표 데이터:', coordinates);
        return [];
      }

      // 시작점 사용
      const searchPoint = {
        latitude: coordinates[1],  // 위도
        longitude: coordinates[0]  // 경도
      };

      console.log('편의점 검색 기준점:', searchPoint);

      const kakaoApiUrl = new URL('https://dapi.kakao.com/v2/local/search/category.json');
      kakaoApiUrl.searchParams.append('category_group_code', 'CS2');
      kakaoApiUrl.searchParams.append('x', searchPoint.longitude.toString());
      kakaoApiUrl.searchParams.append('y', searchPoint.latitude.toString());
      kakaoApiUrl.searchParams.append('radius', '1000');
      kakaoApiUrl.searchParams.append('size', '15');

      const response = await fetch(kakaoApiUrl.toString(), {
        headers: {
          Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`편의점 데이터 가져오기 실패: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.documents) {
        throw new Error('유효하지 않은 데이터 형식');
      }

      const stores = data.documents.map(store => ({
        name: store.place_name,
        latitude: parseFloat(store.y),
        longitude: parseFloat(store.x),
        address: store.road_address_name || store.address_name,
        distance: parseFloat(store.distance)
      }));

      console.log('편의점 데이터 처리 완료:', {
        count: stores.length,
        sample: stores[0]
      });

      return stores;

    } catch (error) {
      console.error('편의점 데이터 요청 실패:', error);
      return [];
    }
  }
};

module.exports = storeService;

