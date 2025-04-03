var lat = ui.url.get('lat', 25)
var lon = ui.url.get('lon', 0)
var zoom = ui.url.get('zoom', 3)

Map.setCenter(lon, lat, zoom)

Map.onChangeZoom(function() { 
  ui.url.set('zoom', Map.getZoom())  
})

Map.onChangeBounds(function(center) { 
  ui.url.set('lon', parseFloat(center.lon).toFixed(4)) 
  ui.url.set('lat', parseFloat(center.lat).toFixed(4)) 
})
