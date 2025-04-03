// Copyright 2024 Google LLC

/**
 * The final app.
 *
 * @author Gennadii Donchyts (dgena@google.com)
 * @author Tyler Erickson (tyler@vorgeo.com)
 */

/*******************************************************************************
 * Model *
 ******************************************************************************/

var m = {};

// use RADD code from: https://code.earthengine.google.com/a8b49975261d3040d203e01ee48617ca
m.radd = ee.ImageCollection('projects/radar-wur/raddalert/v1');
m.regions = ['africa', 'sa', 'asia', 'ca'];

m.forest_baseline = m.radd.filterMetadata('layer','contains','forest_baseline')
                          .mosaic();

m.radd_alert = ee.ImageCollection(
  m.regions.map(
    function(region) { 
      return m.radd.filterMetadata('layer', 'contains', 'alert')
                   .filterMetadata('geography', 'equals', region)
                   .sort('system:time_end', false)
                   .first();
    }
  )).mosaic();

m.getAlertDate = function() {
  return m.radd_alert.select('Date');
};

m.getAlertConfidence = function() {
  return m.radd_alert.select('Alert');
};


m.layerInfos = [
    {
      name: 'Alert Date',
      description: '',
      image: m.getAlertDate(),
      legend: {
        type: 'gradient',
        palette: ["ffffcc", "ffeda0", "fed976", "feb24c", "fd8d3c", "fc4e2a", "e31a1c", "bd0026", "800026"],
        min: 20000,
        max: 24000,
        labelMin: '2000',
        labelMax: '2024'
      },
      shown: true
    },
    { 
      name: 'Confidence',
      description: "",
      image: m.getAlertConfidence(),
      legend: {
        type: 'discrete',
        palette: ['00ffff', 'ea7e7d'],
        min: 2,
        max: 3,
        labels: ['2', '3']
      },
      shown: false
    },
    { 
      name: 'Primary humid tropical forest',
      description: 'Primary humid tropical forest mask 2001 from Turubanova et al (2018) with annual (Africa: 2001 - 2018; Other geographies: 2001 - 2019) forest loss (Hansen et al 2013) and mangroves (Bunting et al 2018) removed.',
      image: m.forest_baseline,
      legend: {
        type: 'discrete',
        palette: ['black'],
        opacity: 0.3,
        labels: ['']
      },
      shown: true
    },
  ];

/***
 * Convert data from RADD format YYJJJ to ee.Date()
 */
m.toDateFromYYJJJ = function(v) {
  v = ee.Number(v);
  var year = v.divide(1000).floor().add(2000);
  var doy = v.mod(1000);
    
  return ee.Date.fromYMD(year, 1, 1).advance(doy, 'day');
};

/*******************************************************************************
 * Styling *
 ******************************************************************************/

var s = {};

// RADD alert: 2 = unconfirmed (low confidence) alert; 3 = confirmed (high confidence) alert
s.visAlertConfidence = {
    min: 2,
    max: 3,
    palette: ['00FFFF', 'EA7E7D']
};
s.visForestBaseline = {
    palette: ['black'], 
    opacity: 0.3
};
s.visAlertDate = {
    min: 20000,
    max: 24000,
    palette: ["ffffcc", "ffeda0", "fed976", "feb24c", "fd8d3c",
              "fc4e2a", "e31a1c", "bd0026", "800026"]
};

s.visTimelapse = {
    bands: ['B12', 'B8', 'B3'],
    min: 500, 
    max: 3500
};

s.panelLeft = {width: '400px'};
s.titleLabel = {fontSize: '22px', fontWeight: 'bold'};
s.layerPanel = {border: '1px solid black', margin: '5px 5px 0px 5px'};
s.layerPanelName = {fontWeight: 'bold'};
s.layerPanelDescription = {color: 'grey', fontSize: '11px'};

/*******************************************************************************
 * Components *
 ******************************************************************************/

var c = {};

c.titleLabel = ui.Label('Forest disturbance alert date inspector', s.titleLabel);
c.infoPanel = ui.Label('Lorem ipsum odor amet, consectetuer adipiscing elit. Ultrices facilisis ultricies nec nibh integer leo. Libero scelerisque purus ex ultricies ipsum ornare platea euismod. Cursus blandit duis ligula lobortis rhoncus quam per eu. Dictumst proin elementum sociosqu nascetur mi integer massa euismod.');

c.buildLayerPanelName = function(layerInfo) {
  return ui.Label(layerInfo.name, s.layerPanelName);
};
c.buildLayerPanelDesc = function(layerInfo) {
  return ui.Label(layerInfo.description, s.layerPanelDescription);
};

c.buildLayerLegendPanel = function(layerInfo) {
  function createLayerLegendGradient(layerInfo) {
    var colorBar = ui.Thumbnail({
      image: ee.Image.pixelLonLat().select(0),
      params: { 
        bbox: [0, 0, 1, 0.1], dimensions: '100x10', format: 'png', 
        min: 0, max: 1, palette: layerInfo.legend.palette
      },
      style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '24px'},
    });
    
    var legendLabels = ui.Panel({
      widgets: [
        ui.Label(layerInfo.legend.labelMin, {margin: '4px 8px'}),
        ui.Label(layerInfo.legend.labelMax, {margin: '4px 8px', stretch: 'horizontal', textAlign: 'right'})
      ],
      layout: ui.Panel.Layout.flow('horizontal')
    });
    
    return ui.Panel([colorBar, legendLabels]);
  }
  
  function createLayerLegendDiscrete(layerInfo) {
    var labels = layerInfo.legend.palette.map(function(color, i) {
      return ui.Panel([
        ui.Label('', { 
          width: '15px', 
          height: '15px', 
          backgroundColor: color, 
          border: '1px solid black',
          margin: '3px 10px'
        }),
        ui.Label(layerInfo.legend.labels[i], {
          margin: '3px 10px 0px 0px'
        })
      ], ui.Panel.Layout.flow('horizontal'));
    });

    var panel = ui.Panel({
      widgets: labels,
      layout: ui.Panel.Layout.flow('vertical')
    });
    
    return panel;
  }
  
  var legendBuilders = {
    'gradient': createLayerLegendGradient,
    'discrete': createLayerLegendDiscrete
  };
  
  return legendBuilders[layerInfo.legend.type](layerInfo);
};

c.buildLayerControlsPanel = function(layerInfo) {
  
  function onLayerShownChanged(v) {
    layerInfo.layer.setShown(v);
  }
  
  var layerShownCheckbox = ui.Checkbox('', 
    layerInfo.shown, 
    onLayerShownChanged
  );
  
  function onLayerOpacityChanged(v) {
    layerInfo.layer.setOpacity(v);
  }
  
  var layerOpacitySlider = ui.Slider(0, 1, 1, 0.1, null, 'horizontal', false, { stretch: 'horizontal' });
  layerOpacitySlider.onSlide(onLayerOpacityChanged);
  
  return ui.Panel([
     layerShownCheckbox,
     layerOpacitySlider
    ], 
    ui.Panel.Layout.Flow('horizontal'), {
      width: '200px'
    });
};

c.buildLayerPanel = function(layerInfo) {
  var layerPanel = ui.Panel([
      c.buildLayerPanelName(layerInfo),
      ui.Panel([
        c.buildLayerLegendPanel(layerInfo),
        ui.Label('', { stretch: 'horizontal' }),
        c.buildLayerControlsPanel(layerInfo),
      ], ui.Panel.Layout.flow('horizontal')),
      c.buildLayerPanelDesc(layerInfo)
    ], 
    ui.Panel.Layout.flow('vertical'), s.layerPanel);
  return layerPanel;
};

c.layersPanel = ui.Panel(m.layerInfos.map(c.buildLayerPanel));

c.buildLayerInspectionPanel = function() {
  c.clickedPointLabel = ui.Label('Click on the map to query alert date -->');
  
  c.clickedPointLayer = ui.Map.Layer(ee.FeatureCollection([]), { color: 'yellow' }, 'clicked point');
  Map.layers().add(c.clickedPointLayer);
  
  return c.clickedPointLabel;
};

c.buildUI = function() { 
  var panelLeft = ui.Panel([
      c.titleLabel,
      c.infoPanel,
      c.layersPanel,
      c.buildLayerInspectionPanel(),
      c.buildHistogramPanel()
    ],
    ui.Panel.Layout.flow('vertical'),
    s.panelLeft
  );
  ui.root.widgets().insert(0, panelLeft);
};

c.addMapLayers = function() {
  m.layerInfos.slice(0).reverse().map(
    function(layerInfo) {
      var legend = layerInfo.legend;

      var visParams = {
        min: legend.min,
        max: legend.max,
        palette: legend.palette 
      };
      
      var layer = ui.Map.Layer(
        layerInfo.image,
        visParams,
        layerInfo.name,
        layerInfo.shown,
        legend.opacity);
      Map.layers().add(layer);
      
      layerInfo.layer = layer;
    });
};

c.buildHistogramPanel = function() {
  var panel = ui.Panel([]);
  
  function updateHistogram() {
    var image = m.getAlertDate();
    var bounds = ee.Geometry(Map.getBounds(true));
    var scale = Map.getScale() * 5;
    
    var chart = ui.Chart.image.histogram(image, bounds, scale, 100);
    App.histogramPanel.widgets().reset([chart]);
  }
  
  var updateHistogramDebounced = ui.util.debounce(updateHistogram, 2000);

  Map.onChangeBounds(function() { App.histogramPanel.widgets().reset([])});

  Map.onChangeBounds(updateHistogramDebounced);
  
  App.histogramPanel = panel;
  
  return panel;
};


c.Timelapse = function() {
  this.panel = null;
  this.mapControl = Map; // default map
  this.mapLayers = [];
  this.currentIndex = 0;
};

c.Timelapse.prototype.buildUI = function() {
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

c.Timelapse.prototype.inspect = function(images, pt, vis) {
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
  
  print('debug', images)
  print('debug', images.aggregate_array('system:time_start'))
  images.aggregate_array('system:time_start')
        .evaluate(function(times) {
          times.map(function(t, i) {
            var image = images
              .filter(ee.Filter.eq('system:time_start', t))
              .first()
              .select(s.visTimelapse.bands)
              .clip(aoi)
              .updateMask(mask);
            
            var mapLayer = ui.Map.Layer(
              image, s.visTimelapse,
              new Date(t).toISOString(),
              true,
              i === 0 ? 1 : 0
            );
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

c.Timelapse.prototype.clear = function() {
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

c.timelapse = new c.Timelapse();

c.Logger = function(delay) {
  // Create a panel for displaying log messages.
  this.panel = ui.Panel(null, ui.Panel.Layout.Flow('vertical'), { 
    backgroundColor: '#00000000', 
    color: '00000000',
    position: 'bottom-right'
  });
  
  this.delay = delay;
  
  // If a delay is not specified, default to 1 second.
  if(typeof(this.delay) === 'undefined') {
    this.delay = 1000;
  }
  
  // Specify a default maximum message count.
  this.maxCount = 5;
  
  Map.widgets().add(this.panel);
};

// Add a prototype function that displays a message.
c.Logger.prototype.info = function(message, color) {
  var self = this;
  
  var label = ui.Label(message, {
      backgroundColor: '#00000066',
      color: typeof(color) == 'undefined' ? 'ffffff' : color,
      fontSize: '14px',
      margin: '2px', 
      padding: '2px'
  });
  
  self.panel.widgets().add(label);
  self.panel.style().set({ shown: true });
  
  if(self.panel.widgets().length() > self.maxCount) {
    self.panel.widgets().remove(self.panel.widgets().get(0));
  }

  // Configure the widget to be removed after a specified time delay
  ui.util.setTimeout(function() { 
    self.panel.widgets().remove(label);
    
    // If all the widget have been removed, hide the panel.
    if(self.panel.widgets().length() === 0) {
      self.panel.style().set({ shown: false });
    }
  }, self.delay);
};

c.Logger.prototype.setMaxCount = function(maxCount) {
  this.maxCount = maxCount;
};

/*******************************************************************************
 * Behaviors *
 ******************************************************************************/

var b = {};

b.queryAlertDate = function(pt) {
  c.logger.info('Querying alert date from the map ...');
  
  var lon = pt.lon;
  var lat = pt.lat;
  pt = ee.Geometry.Point([lon, lat]);
  
  c.clickedPointLayer.setEeObject(pt);
  
  // query alert date value at a given point
  var alertDateImage = m.getAlertDate();

  var date_YYJJJ = alertDateImage.reduceRegion(ee.Reducer.first(), pt, 10).get('Date');

  if (date_YYJJJ.getInfo()) {
    var date = m.toDateFromYYJJJ(date_YYJJJ);
  
    var dateStr = date.format('YYYY-MM-dd');
    
    dateStr.evaluate(function(x) {
      c.logger.info('Queried date is: ' + x);
      c.clickedPointLabel.setValue('Clicked point date: ' + x);
      b.inspect(date.advance(-3, 'month'), date.advance(3, 'month'), pt);
    });
    
  } else {
    c.logger.info('No alert data found at clicked location.');
    c.logger.info('Zoom in further to select alerts.');
  }
};
Map.onClick(b.queryAlertDate);

b.inspect = function(start, end, pt) {
  c.logger.info('Fetching images for current point ...');

  var images = ee.ImageCollection('COPERNICUS/S2_HARMONIZED')
    .filterDate(start, end)
    .filterBounds(pt);

  var clouds = ee.ImageCollection('GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED')
    .filterDate(start, end)
    .filterBounds(pt)
    .select('cs_cdf');
  
  images = images.linkCollection(clouds, ['cs_cdf']);

  images.size().evaluate(function(i) {
    c.logger.info('Total number of images found: ' + i);
  });

  // filter-out cloudy images
  var scale = Map.getScale();
  var geom = pt.buffer(scale*50, scale*5);

  var imagesClean = images.filterBounds(pt).map(function(i) {
    var quality = i.select('cs_cdf').reduceRegion(ee.Reducer.mean(), geom, scale*5);
    
    return i.set({ quality: quality.values().get(0) });
  })
  .filter(ee.Filter.gt('quality', 0.7));
  
  imagesClean.size().evaluate(function(i) {
    c.logger.info('Number of clean images: ' + i);
  });

  // Inspect images
  c.timelapse.inspect(imagesClean, pt, s.vis);
};


/*******************************************************************************
 * Initialize *
 ******************************************************************************/

var App = {};

App.setupMap = function() {
  Map.setOptions('SATELLITE');
  Map.style().set({ cursor: 'crosshair' });
  Map.setCenter(10, 20, 3);
};

App.run = function() {
  c.logger = new c.Logger(5000);
  App.setupMap();
  c.addMapLayers();
  c.buildUI();
  c.timelapse = new c.Timelapse();
  c.timelapse.index = 3;
};

App.run();
