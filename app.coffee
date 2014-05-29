arDrone = require "ar-drone"
drone = arDrone.createClient()
drone.takeoff()
drone.move .5
drone.after 5000, ->
  @stop()
.after 1000, ->
  @land()