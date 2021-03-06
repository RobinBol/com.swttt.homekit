"use strict";

const debug = true;

// Enable TCP debug
// process.env.DEBUG = 'TCP';

const Homey = require('homey')
const { HomeyAPI } = require('./lib/athom-api.js')
const Homekit = require('./lib/homekit.js')



let allDevices = {},
    server = {},
    log = [];

if (debug) {
  console.log = function(string, type) {
    const d = new Date();
    const n = d.toLocaleTimeString();
    let item = {};
    item.time = n;
    item.string = string;
    item.type = type;
    log.push(item);
    Homey.ManagerApi.realtime('log.new', log)
      .catch( this.error )
    if(log.length > 50){
      log.splice(0,1);
    }
  };
}


class HomekitApp extends Homey.App {
  // Get homey object
  getApi() {
    if (!this.api) {
      this.api = HomeyAPI.forCurrentHomey();
    }
    return this.api;
  }
  async getDevices() {
    const api = await this.getApi();
    allDevices = await api.devices.getDevices();
    return allDevices;
  }

  getLog() {
    return log;
  }

  // Start server function
  async startingServer() {


    // Get the homey object
    const api = await this.getApi();
    // Get system info
    const systeminfo = await api.system.getInfo();
    // Subscribe to realtime events and set all devices global
    await api.devices.subscribe();
    allDevices = await api.devices.getDevices();

    server = await Homekit.configServer(systeminfo);

    // Loop all devices
    const allPairedDevices = await Homey.ManagerSettings.get('pairedDevices') || [];
    var arrayLength = await allPairedDevices.length;

    for (var i = 0; i < arrayLength; i++) {
      // If device has the class light
      await this.addDevice(allPairedDevices[i]);
    }
    if(arrayLength){
      await console.log('Added all devices..done here!', 'success');
    }
    else{
      await console.log('No devices found...', 'info');
    }

    // Start the server
    await server.startServer();
    console.log('Homekit server started.', 'success');
  }

  async onInit() {
    // Start the server
    await this.startingServer()
      .then(console.log('Homekit server starting!', 'info'))
      .catch(this.error);

  }

  async addDevice(device) {
    await this.getDevices();
    // If device has the class light
    if (allDevices[device.id].class == 'light') {
      // Add light object to server
      let light = await Homekit.createLight(allDevices[device.id], server.config.getHASID(device.id));
      await server.addAccessory(light);
      console.log(device.name + ' is added!', 'success');
    }
    // If device has the class socket
    if (allDevices[device.id].class == 'socket') {
      // Add socket object to server
      let socket = await Homekit.createSocket(allDevices[device.id], server.config.getHASID(device.id));
      await server.addAccessory(socket);
      console.log(device.name + ' is added!', 'success');
    }
    if (allDevices[device.id].class == 'sensor') {
      // Add sensor object to server
      let sensor = await Homekit.createSensor(allDevices[device.id], server.config.getHASID(device.id));
      await server.addAccessory(sensor);
      console.log(device.name + ' is added!', 'success');
    }
    if (allDevices[device.id].class == 'lock') {
      // Add lock object to server
      let lock = await Homekit.createLock(allDevices[device.id], server.config.getHASID(device.id));
      await server.addAccessory(lock);
      console.log(device.name + ' is added!', 'success');
    }
  }

  async deleteDevice(device) {
    console.log('Trying to remove device ' + device.id, "info");
    server.removeAccessory(server.config.getHASID(device.id));
    console.log(device.name + ' is removed!', 'success');
  }

}

module.exports = HomekitApp
