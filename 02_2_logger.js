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


// ======================================= test

var log = new Logger(3000)
log.setMaxCount(3)

log.info('Querying image data ...')
log.info('Querying image data v2 ...')
log.info('Querying image data v3 ...')
log.info('Querying image data v4 ...')

ui.util.setTimeout(function() { log.info('Querying image data v5 ...') }, 1000)
ui.util.setTimeout(function() { log.info('Querying image data v6 ...', 'yellow') }, 500)
ui.util.setTimeout(function() { log.info('Querying image data v7 ...', 'lime') }, 500)
ui.util.setTimeout(function() { log.info('Querying image data v8 ...') }, 500)



// var log2 = new Logger(3000)
// log2.panel.style().set({ position: 'bottom-left' })

// log2.info('Querying image data v6 ...')

// ui.util.setTimeout(function() { 
//   log2.info('Querying image data v7 ...', 'yellow')
// }, 1000)

// ui.util.setTimeout(function() { 
//   log2.info('Querying image data v8 ...', 'lime')
// }, 1000)

