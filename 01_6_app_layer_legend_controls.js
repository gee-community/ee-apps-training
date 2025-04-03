// STEP6: building layer legend controls based on layer type

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
      image: Images.getAlertConfidence(),
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
      image: Images.getPrimaryForest(),
      legend: {
        type: 'discrete',
        palette: ['black'],
        opacity: 0.3,
        labels: ['']
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
    
    return ui.Panel([colorBar, legendLabels])
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
      ], ui.Panel.Layout.flow('horizontal'))
    })

    var panel = ui.Panel({
      widgets: labels,
      layout: ui.Panel.Layout.flow('vertical')
    })
    
    return panel
  }
  
  var legendBuilders = {
    'gradient': createLayerLegendGradient,
    'discrete': createLayerLegendDiscrete
  }
  
  print(layerInfo.legend.type)
  
  return legendBuilders[layerInfo.legend.type](layerInfo)
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
      // border: '1px solid red',
      width: '200px'
  })
}

App.run()


 