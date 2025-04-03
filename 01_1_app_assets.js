// STEP 1, code to visualize our App map layers



// use RADD code from: https://code.earthengine.google.com/a8b49975261d3040d203e01ee48617ca

Map.setOptions('HYBRID')

var radd = ee.ImageCollection('projects/radar-wur/raddalert/v1');

//----------------------------------------
//Forest baseline 
//Primary humid tropical forest mask 2001 from Turubanova et al (2018) with annual (Africa: 2001-2018; Asia: 2001 - 2019) forest loss (Hansen et al 2013) and mangroves (Bunting et al 2018) removed
//----------------------------------------
var forest_baseline = radd.filterMetadata('layer','contains','forest_baseline').mosaic()

Map.addLayer(forest_baseline, {palette:['black'], opacity: 0.3},'Forest baseline')

//-----------------
//RADD alert
//-----------------
var regions = ['africa', 'sa', 'asia', 'ca']
var radd_alert = ee.ImageCollection(regions.map(function(region) { 
  return ee.ImageCollection('projects/radar-wur/raddalert/v1')
    .filterMetadata('layer', 'contains', 'alert')
    .filterMetadata('geography', 'equals', region)
    .sort('system:time_end', false)
    .first()
})).mosaic()


//RADD alert: 2 = unconfirmed (low confidence) alert; 3 = confirmed (high confidence) alert
var paletteAlertConfidence = ['00FFFF', 'EA7E7D']

Map.addLayer(radd_alert.select('Alert'), {min:2,max:3,palette:paletteAlertConfidence}, 'RADD alert')

//-----------------
//RADD alert date
//-----------------

//RADD alert date: YYDOY (Year-Year-Day-Of-Year)
var paletteAlertDate = ["ffffcc", "ffeda0", "fed976", "feb24c", "fd8d3c", "fc4e2a", "e31a1c", "bd0026", "800026"]
Map.addLayer(radd_alert.select('Date'), {min:20000,max:24000, palette: paletteAlertDate}, 'RADD alert date')

