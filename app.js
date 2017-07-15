"use strict";

const Homey = require('homey');

const api = require('./lib/athom-api.js');
const homekit = require('./lib/homekit.js')


class HomekitApp extends Homey.App {


  onInit() {

    api.getSystemInfo()
      .then(async(res) => {
        await homekit.configServer(res);
        const devices = await api.getAllDevices()
        for (var key in devices) {
          if (devices.hasOwnProperty(key)) {
            if (devices[key].capabilities.onoff) {
              await homekit.addDevice(devices[key]);
              await console.log(devices[key].name);
            }
          }
        }
        homekit.startServer();
      })
      .catch(this.error)

  }

}

module.exports = HomekitApp
