// Copyright 2021 Google LLC

/**
 * UI Pattern Template
 *
 * This script is a template for organizing code into distinct sections
 * to improve readability/maintainability:
 *   Model, Components, Composition, Styling, Behaviors, Initialization
 *
 * Source: https://code.earthengine.google.com/bab500e5290d579f8d5f1cc5715314cf
 * 
 * @author Tyler Erickson (tyler@vorgeo.com)
 * @author Justin Braaten (braaten@google.com)
 */

/*******************************************************************************
 * Model *
 *
 * A section to define information about the data being presented in your
 * app.
 *
 * Guidelines: Use this section to import assets and define information that
 * are used to parameterize data-dependant widgets and control style and
 * behavior on UI interactions.
 ******************************************************************************/

// Define a JSON object for storing the data model.
var m = {};

/* Example
// Selected year.
m.year = null;
*/


/*******************************************************************************
 * Components *
 *
 * A section to define the widgets that will compose your app.
 *
 * Guidelines:
 * 1. Except for static text and constraints, accept default values;
 *    initialize others in the initialization section.
 * 2. Limit composition of widgets to those belonging to an inseparable unit
 *    (i.e. a group of widgets that would make no sense out of order).
 ******************************************************************************/

// Define a JSON object for storing UI components.
var c = {};

/* Example
c.legend = {
  title: ui.Label();
}
*/


/*******************************************************************************
 * Composition *
 *
 * A section to compose the app i.e. add child widgets and widget groups to
 * first-level parent components like control panels and maps.
 *
 * Guidelines: There is a gradient between components and composition. There
 * are no hard guidelines here; use this section to help conceptually break up
 * the composition of complicated apps with many widgets and widget groups.
 ******************************************************************************/

/* Example
ui.root.clear();
ui.root.add(c.controlPanel);
ui.root.add(c.map);
*/


/*******************************************************************************
 * Styling *
 *
 * A section to define and set widget style properties.
 *
 * Guidelines:
 * 1. At the top, define styles for widget "classes" i.e. styles that might be
 *    applied to several widgets, like text styles or margin styles.
 * 2. Set "inline" style properties for single-use styles.
 * 3. You can add multiple styles to widgets, add "inline" style followed by
 *    "class" styles. If multiple styles need to be set on the same widget, do
 *    it consecutively to maintain order.
 ******************************************************************************/

// Define a JSON object for defining CSS-like class style properties.
var s = {};

/* Example
s.legend.title = {
  fontWeight: 'bold',
  fontSize: '12px',
  color: '383838'
};
c.legend.title.style().set(s.legend.title);
*/


/*******************************************************************************
 * Behaviors *
 *
 * A section to define app behavior on UI activity.
 *
 * Guidelines:
 * 1. At the top, define helper functions and functions that will be used as
 *    callbacks for multiple events.
 * 2. For single-use callbacks, define them just prior to assignment. If
 *    multiple callbacks are required for a widget, add them consecutively to
 *    maintain order; single-use followed by multi-use.
 * 3. As much as possible, include callbacks that update URL parameters.
 ******************************************************************************/

/* Example
// Handles updating the legend when band selector changes.
function updateLegend() {
  c.legend.title.setValue(c.bandSelect.getValue() + ' (%)');
}
*/


/*******************************************************************************
 * Initialize *
 *
 * A section to initialize the app state on load.
 *
 * Guidelines:
 * 1. At the top, define any helper functions.
 * 2. As much as possible, use URL params to initial the state of the app.
 ******************************************************************************/

/* Example
// Selected year.
m.year = 2020;
*/
