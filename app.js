// The final app

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
  App.logger = new Logger(5000)
  
  App.setupMap()
  
  App.addMapLayers()
  
  App.buildUI()
  
  App.timelapse = new Timelapse()
  App.timelapse.index = 3
}

App.setupMap = function() {
  Map.setOptions('SATELLITE')
  Map.style().set({ cursor: 'crosshair' })
  Map.setCenter(10, 20, 3)
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
      App.buildLayersPanel(),
      App.buildLayerInspectionPanel(),
      App.buildHisogramPanel()
    ],
    ui.Panel.Layout.flow('vertical'),
    { 
      width: '400px'
    }
  )

  ui.root.widgets().insert(0, panelLeft)
}

App.buildTitleLabel = function() {
  return ui.Label('Forest disturbance alert date inspector', { fontSize: '20px', fontWeight: 'bold' })
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

App.buildLayerInspectionPanel = function() {
  App.clickedPointLabel = ui.Label('Click on the map to query alert date -->')
  
  App.clickedPointLayer = ui.Map.Layer(ee.FeatureCollection([]), { color: 'yellow' }, 'clicked point')
  Map.layers().add(App.clickedPointLayer)
  
  function queryAlertDate(pt) {
    App.logger.info('Querying alert date from the map ...')
    
    var lon = pt.lon;
    var lat = pt.lat
    pt = ee.Geometry.Point([lon, lat])
    
    App.clickedPointLayer.setEeObject(pt)
    
    // query alert date value at a given point
    var image = Images.getAlertDate()
    var date = image.reduceRegion(ee.Reducer.first(), pt, 10).get('Date')
    
    date = toDateFromYYJJJ(date)
    
    var dateStr = date.format('YYYY-MM-dd')
    
    dateStr.evaluate(function(s) {
      App.logger.info('Queried date is: ' + s)

      App.clickedPointLabel.setValue('Clicked point date: ' + s)
      
      App.inspect(date.advance(-3, 'month'), date.advance(3, 'month'), pt)
    })
  }
  
  Map.onClick(queryAlertDate)
  
  return App.clickedPointLabel
}

App.inspect = function(start, end, pt) {
  App.logger.info('Fetching images for current point ...')

  var images = ee.ImageCollection('COPERNICUS/S2_HARMONIZED')
    .filterDate(start, end)
    .filterBounds(pt)
    
  var clouds = ee.ImageCollection('GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED')
    .filterDate(start, end)
    .filterBounds(pt)
    .select('cs_cdf')
  
  images = images.linkCollection(clouds, ['cs_cdf'])

  images.size().evaluate(function(i) {
    App.logger.info('Total number of images found: ' + i)
  })

  // filter-out cloudy images
  var s = Map.getScale()
  var geom = pt.buffer(s*50, s*5)

  var imagesClean = images.filterBounds(pt).map(function(i) {
    var quality = i.select('cs_cdf').reduceRegion(ee.Reducer.mean(), geom, s*5)
    
    return i.set({ quality: quality.values().get(0) })
  })
  .filter(ee.Filter.gt('quality', 0.7))
  
  imagesClean.size().evaluate(function(i) {
    App.logger.info('Number of clean images: ' + i)
  })
  
  var vis = {
    bands: ['B12', 'B8', 'B3'],
    min: 500, 
    max: 3500
  }

  // inspect images
  App.timelapse.inspect(imagesClean, pt, vis)
}

App.buildHisogramPanel = function() {
  var panel = ui.Panel([])
  
  function updateHistogram() {
    var image = Images.getAlertDate()
    var bounds = ee.Geometry(Map.getBounds(true))
    var scale = Map.getScale() * 5
    
    var chart = ui.Chart.image.histogram(image, bounds, scale, 100)
    App.histogramPanel.widgets().reset([chart])
  }
  
  var updateHistogramDebounced = ui.util.debounce(updateHistogram, 2000)

  Map.onChangeBounds(function() { App.histogramPanel.widgets().reset([])})

  Map.onChangeBounds(updateHistogramDebounced)
  
  App.histogramPanel = panel
  
  return panel
}


App.run()







/***
 * Convert data from RADD format YYJJJ to ee.Date()
 */
function toDateFromYYJJJ(v) {
  v = ee.Number(v)
  var year = v.divide(1000).floor().add(2000)
  var doy = v.mod(1000)
    
  return ee.Date.fromYMD(year, 1, 1).advance(doy, 'day')
}


/***
 * Timelapse inspector control
 */
function Timelapse() {
  this.panel = null
  this.mapControl = Map // default map
  this.mapLayers = []
  this.currentIndex = 0
  this.index = 0
}

Timelapse.prototype.buildUI = function() {
  var self = this
  var label = ui.Label()
  
  var slider = ui.Slider(0, 1, 0, 1)
  slider.style().set({ width: '300px' })
  slider.onSlide(function(i) {
    self.mapLayers[self.currentIndex].setOpacity(0)
  
    self.currentIndex = i
    self.mapLayers[self.currentIndex].setShown(true)
    self.mapLayers[self.currentIndex].setOpacity(1)
    
    label.setValue(self.mapLayers[self.currentIndex].getName())
  })
  
  var button = ui.Button('Clear')
  button.style().set({
    margin: '0px',
    padding: '0px',
    width: '60px'
  })
  
  button.onClick(function() {
    self.clear()
  })

  label.setValue(self.mapLayers[self.currentIndex].getName())

  slider.setMax(self.mapLayers.length - 1)

  self.panel = ui.Panel([
    label, 
    ui.Panel([slider, button], ui.Panel.Layout.flow('horizontal'))
  ])
  
  return self.panel
}

Timelapse.prototype.inspect = function(images, pt, vis) {
  var self = this
  
  self.images = images
  self.pt = pt
  
  self.clear()
  
  var s = self.mapControl.getScale()  
  var r = 200
  var d = 50
  var aoi = pt.buffer(r * s)
  
  var mask = ee.Image().paint(pt.buffer(s * (r - d)), 1).fastDistanceTransform().sqrt()
    .reproject(ee.Projection('EPSG:3857').atScale(s))
    .unitScale(0, d)
    .clip(aoi)
  mask = ee.Image(1).subtract(mask).pow(2).selfMask()
  
  images.aggregate_array('system:time_start').evaluate(function(times) {
    times.map(function(t, i) {
      var image = images
        .filter(ee.Filter.eq('system:time_start', t))
        .first()
        .select(vis.bands)
        .clip(aoi)
        .updateMask(mask)
      
      var mapLayer = ui.Map.Layer(image, vis, new Date(t).toISOString(), true, i == 0 ? 1 : 0)
      self.mapLayers.push(mapLayer)
      self.mapControl.layers().insert(self.index, mapLayer)
    })
    
    if(self.panel) {
      self.mapControl.remove(self.panel)
    }
    
    self.panel = self.buildUI()
    self.mapControl.add(self.panel)
  })
}

Timelapse.prototype.clear = function() {
  var self = this
  
  self.mapControl.widgets().remove(self.panel)
  self.panel = null
  self.panel = null

  self.mapLayers.map(function(mapLayer) {
    self.mapControl.layers().remove(mapLayer)
  })
  self.mapLayers.length = 0
  self.currentIndex = 0
  self.pt = null
  self.images = null
}


/***
 * Logger class
 */
function Logger(delay) {
  this.panel = ui.Panel(null, ui.Panel.Layout.Flow('vertical'), { 
    backgroundColor: '#00000000', 
    color: '00000000',
    position: 'bottom-right'
  })
  
  this.delay = delay
  
  if(typeof(this.delay) === 'undefined') {
    this.delay = 1000
  }
  
  this.maxCount = 5
  
  Map.widgets().add(this.panel)
}

Logger.prototype.info = function(message, color) {
  var self = this
  
  var label = ui.Label('message', {
      backgroundColor: '#00000066',
      color: typeof(color) == 'undefined' ? 'ffffff' : color,
      fontSize: '14px',
      margin: '2px', 
      padding: '2px'
  })
  
  label.setValue(message)
  
  self.panel.widgets().add(label)
  self.panel.style().set({ shown: true })
  
  if(self.panel.widgets().length() > self.maxCount) {
    self.panel.widgets().remove(self.panel.widgets().get(0))
  }

  ui.util.setTimeout(function() { 
    self.panel.widgets().remove(label)
    
    if(self.panel.widgets().length() == 0) {
      self.panel.style().set({ shown: false })
    }
  }, self.delay)
}

Logger.prototype.setMaxCount = function(maxCount) {
  this.maxCount = maxCount
}
