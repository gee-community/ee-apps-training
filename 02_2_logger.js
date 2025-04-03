// Copyright 2024 Google LLC

/*
 * This script demonstrates the use of in creating a Logger widget.
 *
 */

function Logger(delay) {
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
Logger.prototype.info = function(message, color) {
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

Logger.prototype.setMaxCount = function(maxCount) {
  this.maxCount = maxCount;
};


// ======================================= test

var log = new Logger(3000);
log.setMaxCount(10);

log.info('Querying image data ...');
log.info('Querying image data v2 ...');
log.info('Querying image data v3 ...');
log.info('Querying image data v4 ...');

// Call functions after a specified delay.
ui.util.setTimeout(function() { log.info('Querying image data v5 ...') }, 1000);
ui.util.setTimeout(function() { log.info('Querying image data v6 ...', 'yellow') }, 500);
ui.util.setTimeout(function() { log.info('Querying image data v7 ...', 'lime') }, 500);
ui.util.setTimeout(function() { log.info('Querying image data v8 ...') }, 500);
