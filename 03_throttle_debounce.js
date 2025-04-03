// Copyright 2024 Google LLC

/*
 * This script demonstrates the throttling of widgets
 */

Map.setOptions('TERRAIN');

var image = ee.Image("CGIAR/SRTM90_V4");

var panel = ui.Panel([], null, { 
  width: '400px', 
  height: '250px', 
  position: 'bottom-left'
});

Map.add(panel);

function updateHistogram() {
  var bounds = ee.Geometry(Map.getBounds(true));
  var scale = Map.getScale() * 5;

  print('Updating histogram ... ', Map.getZoom(), bounds);

  var chart = ui.Chart.image.histogram(image, bounds, scale, 30);
  panel.widgets().reset([chart]);
}

// Define functions that update the histogram using different strategies.

function manualUpdate() {
  print('Updating histogram when script is run');
  updateHistogram();
}

function updateOnChange() {
  print('Updating histogram after map change');
  Map.onChangeZoom(updateHistogram);
  Map.onChangeBounds(updateHistogram);
}

function updateOnChangeWithDebounce() {
  print('Updating histogram 2 seconds after map change');
  var updateHistogramDebounced = ui.util.debounce(updateHistogram, 2000);
  Map.onChangeZoom(updateHistogramDebounced);
  Map.onChangeBounds(updateHistogramDebounced);
}

// Uncomment one of the following function calls
// manualUpdate();
// updateOnChange();
updateOnChangeWithDebounce();
