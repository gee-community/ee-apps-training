// Copyright 2024 Google LLC

/**
 * STEP 3, Add layer images to the map.
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
        type: 'continuous',
        palette: ["ffffcc", "ffeda0", "fed976", "feb24c", "fd8d3c", "fc4e2a", "e31a1c", "bd0026", "800026"],
        min: 20000,
        max: 24000
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
        max: 3
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
        opacity: 0.3
      },
      shown: true
    },
  ];

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

s.panelLeft = {width: '400px'};
s.titleLabel = {fontSize: '22px', fontWeight: 'bold'};
s.layerPanel = {border: '1px solid black', margin: '5px 5px 0px 5px'};
s.layerPanelName = {fontWeight: 'bold'};
s.layerPanelDescription = {color: 'grey', fontSize: '11px'};

/*******************************************************************************
 * Components *
 ******************************************************************************/

var c = {};

c.titleLabel = ui.Label('Demo App', s.titleLabel);
c.infoPanel = ui.Label('Lorem ipsum odor amet, consectetuer adipiscing elit. Ultrices facilisis ultricies nec nibh integer leo. Libero scelerisque purus ex ultricies ipsum ornare platea euismod. Cursus blandit duis ligula lobortis rhoncus quam per eu. Dictumst proin elementum sociosqu nascetur mi integer massa euismod.');

c.buildLayerPanelName = function(layerInfo) {
  return ui.Label(layerInfo.name, s.layerPanelName);
};
c.buildLayerPanelDesc = function(layerInfo) {
  return ui.Label(layerInfo.description, s.layerPanelDescription);
};

c.buildLayerLegendPanel = function(layerInfo) {
  return ui.Label('<legend>');
};

c.buildLayerLegendPanel = function(layerInfo) {
  return ui.Label('<legend>');
};
c.buildLayerControlsPanel = function(layerInfo) {
  return ui.Panel([
      ui.Label('<shown>'),
      ui.Label('<opacity>')
    ], 
    ui.Panel.Layout.Flow('vertical')
  );
};

c.buildLayerPanel = function(layerInfo) {
  var layerPanel = ui.Panel([
      c.buildLayerPanelName(layerInfo),
      ui.Panel([
        c.buildLayerLegendPanel(layerInfo),
        c.buildLayerControlsPanel(layerInfo),
      ], ui.Panel.Layout.flow('horizontal')),
      c.buildLayerPanelDesc(layerInfo)
    ], 
    ui.Panel.Layout.flow('vertical'), s.layerPanel);
  return layerPanel;
};

c.layersPanel = ui.Panel(m.layerInfos.map(c.buildLayerPanel));

c.buildUI = function() { 
  var panelLeft = ui.Panel([
      c.titleLabel,
      c.infoPanel,
      c.layersPanel
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

/*******************************************************************************
 * Composition *
 ******************************************************************************/

Map.addLayer(
    m.forest_baseline,
    s.visForestBaseline,
    'Forest baseline');
Map.addLayer(
    m.radd_alert.select('Alert'),
    s.visAlertConfidence,
    'RADD alert');
Map.addLayer(
    m.radd_alert.select('Date'),
    s.visAlertDate,
    'RADD alert date');

/*******************************************************************************
 * Behaviors *
 ******************************************************************************/

var b = {};

/*******************************************************************************
 * Initialize *
 ******************************************************************************/

var App = {};

App.setupMap = function() {
  Map.setOptions('SATELLITE');
  Map.style().set({ cursor: 'crosshair' });
  Map.setCenter(10, -20, 3);
};

App.run = function() {
  App.setupMap();
  c.addMapLayers();
  c.buildUI();
};

App.run();
