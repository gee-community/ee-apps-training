// Copyright 2024 Google LLC

/*
 * This script demonstrates the use of Javascript prototypes
 *
 */

function Person(name, surname, location) {
  this.name = name
  this.surname = surname
  this.location = location
}
  
Person.prototype.getFullName = function() {
  return this.name + ' ' + this.surname
}
  
// ======================= test

var p1 = new Person('Homer', 'Simpson')
var p2 = new Person('Donald', 'Duck')
  
print(p1.getFullName())
print(p2.getFullName())
