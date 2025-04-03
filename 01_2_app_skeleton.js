// STEP 2, layout of the App, show how to organize code and build the App UI

var App = {
  layerInfos: [
    {
      name: 'Alert Date',
      description: ''
    },
    { 
      name: 'Confidence',
      description: ''
    },
    {  
      name: 'Primary humid tropical forest',
      description: 'Primary humid tropical forest mask 2001 from Turubanova et al (2018) with annual (Africa: 2001 - 2018; Other geographies: 2001 - 2019) forest loss (Hansen et al 2013) and mangroves (Bunting et al 2018) removed.'
    },
  ]
}

App.run = function() {
  App.setupMap()
  App.buildUI()
} 

App.setupMap = function() {
  Map.setOptions('SATELLITE')
  Map.style().set({ cursor: 'crosshair' })
  Map.setCenter(10, -20, 3)
}

App.buildUI = function() { 
  var panelLeft = ui.Panel([
      App.buildTitleLabel(),
      App.buildInfoPanel(),
      App.buildLayersPanel()
    ],
    ui.Panel.Layout.flow('vertical'), { width: '400px'}
  )

  ui.root.widgets().insert(0, panelLeft)
}

App.buildTitleLabel = function() {
  return ui.Label('Demo App', { fontSize: '22px', fontWeight: 'bold' })
}

App.buildInfoPanel = function() {
  return ui.Label('Lorem ipsum odor amet, consectetuer adipiscing elit. Ultrices facilisis ultricies nec nibh integer leo. Libero scelerisque purus ex ultricies ipsum ornare platea euismod. Cursus blandit duis ligula lobortis rhoncus quam per eu. Dictumst proin elementum sociosqu nascetur mi integer massa euismod.')
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

App.run()
