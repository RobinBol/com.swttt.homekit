'use strict'
const HAS = require('has-node');
const api = require('./athom-api.js');
var server = {};
var uniqueid = 2;

function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this,
      args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

function configServer(homey) {
  this.config = new HAS.Config('Homey', '00:00:00:00:6E:AD', HAS.categories.bridge, '../userdata/homey.json', 8090, '200-20-200');
  server = new HAS.Server(this.config);
  var bridge = new HAS.Accessory(1);
  var identify = HAS.predefined.Identify(1, undefined, function(value, callback) {
      console.log('Homey' + ' Identify', value);
      callback(HAS.statusCodes.OK);
    }),
    manufacturer = HAS.predefined.Manufacturer(2, 'Athom'),
    model = HAS.predefined.Model(3, 'Homey'),
    name = HAS.predefined.Name(4, 'Homey'),
    serialNumber = HAS.predefined.SerialNumber(5, '1337'),
    firmwareVersion = HAS.predefined.FirmwareRevision(6, '1.5.0');
  bridge.addServices(HAS.predefined.AccessoryInformation(1, [identify, manufacturer, model, name, serialNumber, firmwareVersion]));
  server.addAccessory(bridge);
  server.onIdentify = identify.onWrite;
}

function addLight(device) {

  // New light
  var light = new HAS.Accessory(uniqueid);

  // Make the light blink on identify
  var lightIdentify = HAS.predefined.Identify(1, undefined, function(value, callback) {
    console.log(device.name)
    callback(HAS.statusCodes.OK);
  });
  // Set light details
  var lightManufacturer = HAS.predefined.Manufacturer(2, device.driver.owner_name),
    lightModel = HAS.predefined.Model(3, device.driver.id),
    lightName = HAS.predefined.Name(4, device.name),
    lightSerialNumber = HAS.predefined.SerialNumber(5, device.id),
    lightFirmwareVersion = HAS.predefined.FirmwareRevision(6, '1.0.0');
  light.addServices(HAS.predefined.AccessoryInformation(1, [lightIdentify, lightManufacturer, lightModel, lightName, lightSerialNumber, lightFirmwareVersion]));


  // Set all capabilities
  var capabilities = [];
  // onoff
  if (device.capabilities.onoff) {
    var on = HAS.predefined.On(8, false, (value, callback) => {
      api.setDeviceState(device.id, 'onoff', value);
      callback(HAS.statusCodes.OK);
    });

    capabilities.push(on);
  }
  // dim
  if (device.capabilities.dim) {
    var brightness = HAS.predefined.Brightness(9, 1, (value, callback) => {
      debounce(api.setDeviceState(device.id, 'dim', value / 100), 750);
      callback(HAS.statusCodes.OK);
    });

    capabilities.push(brightness);
  }

  // add service to light
  light.addServices(HAS.predefined.Lightbulb(9, capabilities));



  // Add light to server
  server.addAccessory(light);

  // Add 1 to unique id
  uniqueid = uniqueid + 1;
}

function startServer() {
  server.startServer();

  // Set interval to check onoff(charaseristic 8) and dim(charaseristic 8) states
  // Only checking service 9(lightbulb service)
  setInterval(async function() {
    for (var key in server.accessories) {
      if (server.accessories.hasOwnProperty(key)) {
        if(server.accessories[key].services[9]){
          var id = await server.accessories[key].services[1].characteristics[5].value;
          var onoff = await api.getDeviceState(id, 'onoff')
          server.accessories[key].services[9].characteristics[8].setValue(onoff || false)
          if(server.accessories[key].services[9].characteristics[9]){
          var dim = await api.getDeviceState(id, 'dim')
          server.accessories[key].services[9].characteristics[9].setValue(dim*100 || 0)
          }
        }
      }
    }
  }, 3000);
}

function stopServer() {
  server.stopServer();
}

module.exports = {
  startServer: startServer,
  stopServer: stopServer,
  configServer: configServer,
  addLight: addLight
}
