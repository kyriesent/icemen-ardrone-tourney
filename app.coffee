arDrone = require("ar-drone")
drone = arDrone.createClient()
2) Takeoff!
The AR Drone Library is gloriously high level, so (I hope) I don’t have to explain what the addition here does:
1
drone.takeoff()
3) Move forward for five seconds then stop
Our drone library gives us move() and stop(), so that is easy. The timing is less obvious. There is no wait(time) function, but there is drone.after(time,callback), so our code becomes
1
2
3
drone.move .5
drone.after 5000, ->
  @stop()