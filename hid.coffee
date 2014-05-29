HID = require 'node-hid'
_ = require 'underscore'

devices = HID.devices()
console.log(devices)
gamepadMeta = _.find(devices, (dev) -> return dev.vendorId is 121)
console.log gamepadMeta.vendorId
gamepad = new HID.HID('121', '6')
console.log gamepad