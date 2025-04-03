// Copyright 2024 Google LLC

/**
 * Visualize imagery with timelapse prototype.
 * 
 * @author Gennadii Donchyts (dgena@google.com)
 * @author Tyler Erickson (tyler@vorgeo.com)
 */

/*******************************************************************************
 * Model *
 ******************************************************************************/

var m = {};

m.start = '2022';
m.end = '2023';

var images = ee.ImageCollection('COPERNICUS/S2_HARMONIZED')
               .filterDate(m.start, m.end);


var clouds = ee.ImageCollection('GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED')
               .filterDate(m.start, m.end)
               .select('cs_cdf');

// Combine collections
images = images.linkCollection(clouds, ['cs_cdf']);

/*******************************************************************************
 * Styling *
 ******************************************************************************/

var s = {};

s.vis = {
  bands: ['B12', 'B8', 'B3'],
  min: 500, 
  max: 3500
};


/*******************************************************************************
 * Components *
 ******************************************************************************/
 
var c = {};

function Timelapse() {
  this.panel = null;
  this.mapControl = Map; // default map
  this.mapLayers = [];
  this.currentIndex = 0;
}

Timelapse.prototype.buildUI = function() {
  var self = this;
  var label = ui.Label();
  
  var slider = ui.Slider(0, 1, 0, 1);
  slider.style().set({ width: '300px' });
  slider.onSlide(function(i) {
    self.mapLayers[self.currentIndex].setOpacity(0);
    self.currentIndex = i;
    self.mapLayers[self.currentIndex].setShown(true);
    self.mapLayers[self.currentIndex].setOpacity(1);
    label.setValue(self.mapLayers[self.currentIndex].getName());
  });
  
  var button = ui.Button('Clear');
  button.style().set({
    margin: '0px',
    padding: '0px',
    width: '60px'
  });
  
  button.onClick(function() {
    self.clear();
  });

  label.setValue(self.mapLayers[self.currentIndex].getName());

  slider.setMax(self.mapLayers.length - 1);

  self.panel = ui.Panel([
    label, 
    ui.Panel([slider, button], ui.Panel.Layout.flow('horizontal'))
  ]);
  
  return self.panel;
};

Timelapse.prototype.inspect = function(images, pt, vis) {
  
  var self = this;
  
  self.images = images;
  self.pt = pt;
  
  self.clear();
  
  var scale = self.mapControl.getScale()  ;
  var r = 200;
  var d = 50;
  var aoi = pt.buffer(r * scale);
  
  var mask = ee.Image().paint(pt.buffer(scale * (r - d)), 1).fastDistanceTransform().sqrt()
    .reproject(ee.Projection('EPSG:3857').atScale(scale))
    .unitScale(0, d)
    .clip(aoi);
  mask = ee.Image(1).subtract(mask).pow(2).selfMask();
  
  images.aggregate_array('system:time_start')
        .evaluate(function(times) {
          times.map(function(t, i) {
            var image = images
              .filter(ee.Filter.eq('system:time_start', t))
              .first()
              .select(s.vis.bands)
              .clip(aoi)
              .updateMask(mask);
            
            var mapLayer = ui.Map.Layer(image, vis, new Date(t).toISOString(), true, i === 0 ? 1 : 0);
            self.mapLayers.push(mapLayer);
            self.mapControl.layers().add(mapLayer);
          });
          
          if(self.panel) {
            self.mapControl.remove(self.panel);
          }
          
          self.panel = self.buildUI();
          self.mapControl.add(self.panel);
        });
};

Timelapse.prototype.clear = function() {
  var self = this;
  
  self.mapControl.widgets().remove(self.panel);
  self.panel = null;
  self.panel = null;

  self.mapLayers.map(function(mapLayer) {
    self.mapControl.layers().remove(mapLayer);
  });
  self.mapLayers.length = 0;
  self.currentIndex = 0;
  self.pt = null;
  self.images = null;
};

c.timelapse = new Timelapse();

/*******************************************************************************
 * Composition *
 ******************************************************************************/

Map.setOptions('HYBRID');
Map.style().set({ cursor: 'crosshair' });

Map.addLayer(images.select(s.vis.bands)
                   .reduce(ee.Reducer.percentile([25]))
                   .rename(s.vis.bands),
             s.vis,
             'images',
             false);
Map.addLayer(clouds, {}, 'clouds', false);

/*******************************************************************************
 * Behaviors *
 ******************************************************************************/

Map.onClick(function(pt) {
  pt = ee.Geometry.Point([pt.lon, pt.lat]);
  
  // Remove cloudy images
  var scale = Map.getScale();
  var geom = pt.buffer(scale*50, scale*5);
  var imagesLocal = images.filterBounds(pt)
    .map(function(i) {
      var quality = i.select('cs_cdf')
                     .reduceRegion(ee.Reducer.mean(), geom, scale*5);
    
      return i.set({ quality: quality.values().get(0) });
    })
  .filter(ee.Filter.gt('quality', 0.7));

  // Inspect images
  c.timelapse.inspect(imagesLocal, pt, s.vis);
});

/*******************************************************************************
 * Initialize *
 ******************************************************************************/
