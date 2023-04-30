// not sure if this makes sense rn but have this in mind for later
// later in try catch block can use instanceof to determine type of error and hadnle it accordingly
// STATUS: not used AS OF: 04/17/2023


class noDeviceConnectedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'noDeviceConnectedError';
  }
}

class endOfConnectedDevices extends Error {
  constructor(message) {
    super(message);
    this.name = 'endOfConnectedDevices';
  }
}

export { noDeviceConnectedError, endOfConnectedDevices };