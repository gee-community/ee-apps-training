// Copyright 2024 Google LLC

/**
 * STEP 1, Code to visualize our App map layers.
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

/*******************************************************************************
 * Components *
 ******************************************************************************/

var c = {};

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

/*******************************************************************************
 * Initialize *
 ******************************************************************************/

Map.setOptions('HYBRID');
