const DOOR_KEYS = [
  'preheatInDoorOpen',
  'preheatInDoorClosed',
  'preheatOutDoorOpen',
  'preheatOutDoorClosed',
  'sterilizeInDoorOpen',
  'sterilizeInDoorClosed',
  'sterilizeOutDoorOpen',
  'sterilizeOutDoorClosed'
];

const EXEC_KEYS = [
  'disinfectionExecuting',
  'disinfectionNeedQty',
  'disinfectionTargetTotal',
  'disinfectionTrayCode',
  'preheatSelectedFrom',
  'sterilizeSelectedTo',
  'transferExecuting',
  'transferNeedQty',
  'transferTrayCode',
  'transferSelectedFrom',
  'transferSelectedTo',
  'outSterilizeExecuting',
  'outSterilizeSelected',
  'outSterilizeTrayCode',
  'dischargeDestination',
  'dischargeDestSetted',
  'currentExecutingBatch',
  'lastProcessedPallet',
  'unloadInfo',
  'unloadInfo2',
  'currentDestination',
  'disinfectionRoomLoading',
  'transferLoading',
  'outSterilizeLoading',
  'dischargeDestLoading',
  'skipScanCheck'
];

function copyPlain(value) {
  if (value == null) {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
}

function hasOwn(target, key) {
  return !!target && Object.prototype.hasOwnProperty.call(target, key);
}

function cabinetStatus(list) {
  return (list || []).map((item) => ({
    cabinetNo: item.cabinetNo,
    completed: item.completed,
    starting: item.starting
  }));
}

function buildPoints(vm) {
  const devices = {};
  Object.keys(vm.deviceNodes).forEach((id) => {
    const node = vm.deviceNodes[id];
    const row = {};
    if (hasOwn(node, 'motorStatus')) {
      row.motorStatus = node.motorStatus ? 1 : 0;
    }
    if (hasOwn(node, 'sensorStatus')) {
      row.sensorStatus = node.sensorStatus ? 1 : 0;
    }
    if (hasOwn(node, 'trayId')) {
      row.trayId = node.trayId || '';
    }
    if (hasOwn(node, 'destination')) {
      row.destination = Number(node.destination) || 0;
    }
    devices[id] = row;
  });
  const doors = {};
  DOOR_KEYS.forEach((key) => {
    doors[key] = Object.assign({}, vm[key]);
  });
  return {
    type: 'points',
    devices,
    alarmPoints: Object.assign({}, vm.alarmPoints),
    doors,
    cart: {
      cart1: vm.cartPositionValues.cart1,
      indicator: Object.assign({}, vm.cartIndicator)
    },
    preheatCompleted: cabinetStatus(vm.preheatCompleted),
    sterilizationCompleted: cabinetStatus(vm.sterilizationCompleted)
  };
}

function buildExec(vm) {
  const frame = { type: 'exec' };
  EXEC_KEYS.forEach((key) => {
    frame[key] = copyPlain(vm[key]);
  });
  return frame;
}

function buildQueues(vm) {
  return {
    type: 'queues',
    queues: vm.queues.map((queue) => ({
      id: queue.id,
      trayInfo: copyPlain(queue.trayInfo) || []
    }))
  };
}

function applyPoints(vm, frame) {
  const devices = frame.devices || {};
  Object.keys(devices).forEach((id) => {
    const node = vm.deviceNodes[id];
    const row = devices[id];
    if (!node || !row) {
      return;
    }
    if (hasOwn(node, 'motorStatus') && hasOwn(row, 'motorStatus')) {
      node.motorStatus = row.motorStatus === 1;
    }
    if (hasOwn(node, 'sensorStatus') && hasOwn(row, 'sensorStatus')) {
      node.sensorStatus = row.sensorStatus === 1;
    }
    if (hasOwn(node, 'trayId') && hasOwn(row, 'trayId')) {
      node.trayId = row.trayId ? String(row.trayId) : '';
    }
    if (hasOwn(node, 'destination') && hasOwn(row, 'destination')) {
      node.destination = Number(row.destination) || 0;
    }
  });
  const alarmPoints = frame.alarmPoints || {};
  Object.keys(alarmPoints).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(vm.alarmPoints, key)) {
      vm.alarmPoints[key] = alarmPoints[key];
    }
  });
  const doors = frame.doors || {};
  DOOR_KEYS.forEach((key) => {
    if (doors[key] && vm[key]) {
      Object.assign(vm[key], doors[key]);
    }
  });
  if (frame.cart) {
    vm.cartPositionValues.cart1 = frame.cart.cart1;
    if (frame.cart.indicator && vm.cartIndicator) {
      Object.assign(vm.cartIndicator, frame.cart.indicator);
    }
  }
  applyCabinetStatus(vm.preheatCompleted, frame.preheatCompleted);
  applyCabinetStatus(vm.sterilizationCompleted, frame.sterilizationCompleted);
  refreshOpenPopover(vm);
}

function refreshOpenPopover(vm) {
  if (!vm.popoverVisible || !vm.popoverData) {
    return;
  }
  const id = vm.popoverData.id || vm.currentSelectedNodeId;
  const current = (id && vm.deviceNodes[id]) || vm.popoverData;
  if (!current) {
    return;
  }
  if (!current.groupId) {
    vm.popoverList = [current];
    vm.popoverData = current;
    return;
  }
  const groupIds = (vm.groupIndex && vm.groupIndex[current.groupId]) || [];
  vm.popoverList = groupIds.map((deviceId) => ({
    id: deviceId,
    ...vm.deviceNodes[deviceId]
  }));
  vm.popoverData = current;
}

function applyCabinetStatus(list, incoming) {
  if (!Array.isArray(list) || !Array.isArray(incoming)) {
    return;
  }
  incoming.forEach((item) => {
    const target = list.find((row) => row.cabinetNo === item.cabinetNo);
    if (!target) {
      return;
    }
    target.completed = item.completed;
    target.starting = item.starting;
  });
}

function applyExec(vm, frame) {
  EXEC_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(frame, key)) {
      vm[key] = frame[key];
    }
  });
}

function applyQueues(vm, frame) {
  const incoming = frame.queues || [];
  incoming.forEach((queue) => {
    const target = vm.queues.find((item) => item.id === queue.id);
    if (!target) {
      return;
    }
    target.trayInfo = Array.isArray(queue.trayInfo) ? queue.trayInfo : [];
  });
  if (typeof vm.selectedQueueIndex === 'number' && vm.selectedQueueIndex >= 0) {
    vm.showTrays(vm.selectedQueueIndex);
  }
}

module.exports = {
  buildPoints,
  buildExec,
  buildQueues,
  applyPoints,
  applyExec,
  applyQueues
};
