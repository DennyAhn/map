const fetch = require("node-fetch");

const cctvService = {
  getCCTVData: async () => {
    try {
      // 일반 인증키 (Decoding)
      const serviceKey = 'tM2CcqNLmOh1H/mJrtUz+Q/v20hppCEEet5Xc1OqN3V+5tn90SEVQ8GqGRdhp5Slcq/4xEUF8AmXoBBIP75gdg==';
      
      // URL 구성 (새로운 URL로 수정)
      const url = 'https://api.odcloud.kr/api/15083776/v1/uddi:c311f3b0-6de3-4269-b4b3-bd3ea8eedbff';
      
      // 요청 파라미터 구성
      const queryParams = new URLSearchParams({
        page: '1',
        perPage: '1000',
        serviceKey: serviceKey,
        returnType: 'JSON'  // 응답 형식 지정
      });

      const response = await fetch(`${url}?${queryParams}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API 응답 상세:', errorData);
        throw new Error(`CCTV 데이터 가져오기 실패: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data) {
        console.error('API 응답 데이터:', data);
        throw new Error('유효하지 않은 데이터 형식');
      }

      // 데이터 확인을 위한 로그
      //console.log('CCTV 데이터 샘플:', data.data[0]);  // 원본 데이터 확인

      // 필요한 데이터만 매핑하여 반환
      return data.data.map(item => ({
        latitude: parseFloat(item.위도),
        longitude: parseFloat(item.경도),
        address: item.소재지도로명주소,
        purpose: item.설치목적구분,
        cameraCount: parseInt(item.카메라대수) || 1
      }));

    } catch (error) {
      console.error('CCTV 데이터 요청 실패:', error);
      throw new Error('CCTV 데이터 가져오기 실패');
    }
  }
};

module.exports = cctvService;