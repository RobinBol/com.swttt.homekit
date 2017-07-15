'use strict'

const Homey = require('homey');
const Client = require('node-rest-client').Client;

let client = require('node-rest-client-promise').Client();
let apiUrl = "http://127.0.0.1/api/";
let bearertoken = Homey.env.BEARER_TOKEN;

async function getAllDevices() {
  var args = {
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + bearertoken
    }
  };
  const devices = await client.getPromise(apiUrl + "manager/devices/device/", args);
  return devices.data.result;
}

async function getSystemInfo() {
  var args = {
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + bearertoken
    }
  };
  const systeminfo = await client.getPromise(apiUrl + "manager/system/", args)
  // await console.log(systeminfo);
  return systeminfo.data.result;
}

async function setDeviceState(deviceid, capability, state) {
  var args = {
    data: {
      value: state
    },
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + bearertoken
    }
  };
  const setDevice = await client.putPromise(apiUrl + "manager/devices/device/" + deviceid + "/state/" + capability + "/", args);
  return setDevice.data.result;
}

module.exports = {
  setDeviceState: setDeviceState,
  getSystemInfo: getSystemInfo,
  getAllDevices: getAllDevices
}
