/* global naver */

class MapService {
    constructor(mapElement) {
      this.mapInstance = new naver.maps.Map(mapElement, {
        center: new naver.maps.LatLng(35.8714354, 128.601445),
        zoom: 14,
      });
      this.currentLocationMarker = null;
    }
  
    getMapInstance() {
      return this.mapInstance;
    }
  
    setCurrentLocation(coords) {
      const currentPosition = new naver.maps.LatLng(
        coords.latitude,
        coords.longitude
      );
  
      this.mapInstance.setCenter(currentPosition);
  
      if (this.currentLocationMarker) {
        this.currentLocationMarker.setMap(null);
      }
  
      this.currentLocationMarker = new naver.maps.Marker({
        position: currentPosition,
        map: this.mapInstance,
        icon: {
          content: `
            <div style="position: relative;">
              <div style="width: 20px; height: 20px; background: #4A90E2; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                <div style="width: 6px; height: 6px; background: white; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
              </div>
            </div>`,
          anchor: new naver.maps.Point(10, 10)
        },
        zIndex: 100
      });
  
      naver.maps.Event.addListener(this.currentLocationMarker, 'click', () => {
        const infoWindow = new naver.maps.InfoWindow({
          content: '<div style="padding: 10px; text-align: center;">현재 위치</div>'
        });
        infoWindow.open(this.mapInstance, this.currentLocationMarker);
      });
    }
  
    createMarker(position, options) {
      return new naver.maps.Marker({
        position: new naver.maps.LatLng(position.latitude, position.longitude),
        map: this.mapInstance,
        ...options
      });
    }
  
    createPolyline(path, options) {
      return new naver.maps.Polyline({
        path,
        map: this.mapInstance,
        ...options
      });
    }
  
    fitBounds(coordinates) {
      const bounds = coordinates.reduce(
        (bounds, coord) => bounds.extend(new naver.maps.LatLng(coord[1], coord[0])),
        new naver.maps.LatLngBounds()
      );
      
      this.mapInstance.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
      });
    }
  }
  
  export default MapService;