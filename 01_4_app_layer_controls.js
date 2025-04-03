// STEP4: adding layer controls (shown, opacity)

/***
 * Computed images/image collections used in the app
 */
var Images = { }

Images.getRadd = function() {
  var regions = ['africa', 'sa', 'asia', 'ca']
  var radd = ee.ImageCollection(regions.map(function(region) { 
    return ee.ImageCollection('projects/radar-wur/raddalert/v1')
      .filterMetadata('layer', 'contains', 'alert')
      .filterMetadata('geography', 'equals', region)
      .sort('system:time_end', false)
      .first()
  })).mosaic()

  return radd  
}

Images.getAlertDate = function() {
  return Images.getRadd()
    .select('Date')
}

Images.getAlertConfidence = function() {
  return Images.getRadd()
    .select('Alert')
}

Images.getPrimaryForest = function() {
  var radd = ee.ImageCollection('projects/radar-wur/raddalert/v1')

  return radd.filterMetadata('layer','contains','forest_baseline')
    .mosaic()
}

/***
 * App code
 */
var App = {
  layerInfos: [
    {
      name: 'Alert Date',
      description: '',
      image: Images.getAlertDate(),
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
      image: Images.getAlertConfidence(),
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
      image: Images.getPrimaryForest(),
      legend: {
        type: 'discrete',
        palette: ['black'],
        opacity: 0.3
      },
      shown: true
    },
  ]
}

App.run = function() {
  App.setupMap()
  
  App.addMapLayers()
  
  App.buildUI()
}

App.setupMap = function() {
  Map.setOptions('SATELLITE')
  Map.style().set({ cursor: 'crosshair' })
  Map.setCenter(10, -20, 3)
}

App.addMapLayers = function() {
  App.layerInfos.slice(0).reverse().map(function(layerInfo) {
    var legend = layerInfo.legend
    
    var visParams = {
      min: legend.min,
      max: legend.max,
      palette: legend.palette 
    }
    
    var layer = ui.Map.Layer(layerInfo.image, visParams, layerInfo.name, layerInfo.shown, legend.opacity)
    Map.layers().add(layer)
    
    layerInfo.layer = layer
  })  
}

App.buildUI = function() {
  var panelLeft = ui.Panel([
      App.buildTitleLabel(),
      App.buildInfoPanel(),
      App.buildLayersPanel()
    ],
    ui.Panel.Layout.flow('vertical'),
    { 
      width: '400px'
    }
  )

  ui.root.widgets().insert(0, panelLeft)
}

App.buildTitleLabel = function() {
  return ui.Label('Demo App', { fontSize: '20px', fontWeight: 'bold' })
}

App.buildInfoPanel = function() {
  return ui.Label(App.info)
}

App.buildLayersPanel = function() {
  var layerPanels = App.layerInfos.map(App.buildLayerPanel)
  
  var layersPanel = ui.Panel(layerPanels)
  
  return layersPanel
}

App.buildLayerPanel = function(layerInfo) {
  var layerPanel = ui.Panel([
    ui.Label(layerInfo.name, { 
      fontWeight: 'bold', 
    }),
    ui.Panel([
      App.buildLayerLegendPanel(layerInfo),
      ui.Label('', { stretch: 'horizontal' }),
      App.buildLayerControlsPanel(layerInfo)
    ], ui.Panel.Layout.flow('horizontal')),
    ui.Label(layerInfo.description, { 
      color: 'grey', 
      fontSize: '11px', 
    })
  ], ui.Panel.Layout.flow('vertical'), { 
    border: '1px solid black', 
    margin: '5px 5px 0px 5px' 
  })
  
  return layerPanel
} 

App.buildLayerLegendPanel = function(layerInfo) {
  return ui.Label('<legend>', {
      border: '1px solid red', 
  })
}

App.buildLayerControlsPanel = function(layerInfo) {
  function onLayerShownChanged(v) {
    layerInfo.layer.setShown(v)
  }
  
  var layerShownCheckbox = ui.Checkbox('', layerInfo.shown, onLayerShownChanged)
  
  function onLayerOpacityChanged(v) {
    layerInfo.layer.setOpacity(v)
  }
  
  var layerOpacitySlider = ui.Slider(0, 1, 1, 0.1, null, 'horizontal', false, { stretch: 'horizontal' })
  layerOpacitySlider.onSlide(onLayerOpacityChanged)
  
  return ui.Panel([
     layerShownCheckbox,
     layerOpacitySlider
  ], ui.Panel.Layout.Flow('horizontal'), {
      border: '1px solid red',
      width: '200px'
  })
}

App.run()


 