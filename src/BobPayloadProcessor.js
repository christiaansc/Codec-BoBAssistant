/*#*
 ***************************************************************************************************
 ** BSD 3-Clause License
 **
 ** Copyright (c) 2021, Watteco
 ** All rights reserved.
 ** 
 ** Redistribution and use in source and binary forms, with or without
 ** modification, are permitted provided that the following conditions are met:
 ** 
 ** 1. Redistributions of source code must retain the above copyright notice, this
 **    list of conditions and the following disclaimer.
 ** 
 ** 2. Redistributions in binary form must reproduce the above copyright notice,
 **    this list of conditions and the following disclaimer in the documentation
 **    and/or other materials provided with the distribution.
 ** 
 ** 3. Neither the name of the copyright holder nor the names of its
 **    contributors may be used to endorse or promote products derived from
 **    this software without specific prior written permission.
 ** 
 ** THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 ** AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 ** IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 ** DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 ** FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 ** DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 ** SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 ** CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 ** OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 ** OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 **
 ***************************************************************************************************
 *#*/

/** @module BobPayloadProcessor */

'use strict';

// ┌───────────────────────────────────────────────────────────────────────────┐
// | IMPORT ++                                                                 |
// └───────────────────────────────────────────────────────────────────────────┘
const { range, isNumber, isArray, isEmpty } = require('lodash');

// ┌───────────────────────────────────────────────────────────────────────────┐
// | IMPORT --                                                                 |
// └───────────────────────────────────────────────────────────────────────────┘

// ┌───────────────────────────────────────────────────────────────────────────┐
// | GLOBAL VARIABLE ++                                                        |
// └───────────────────────────────────────────────────────────────────────────┘

const COMPONENT_NAME = 'BobPayloadProcessor';
const BOB_PROPS = Object.freeze({
  /* Learning  */
  learningfromscratch: 'learningfromscratch',
  temperature: 'temperature',
  learningpercentage: 'learningpercentage',
  vibrationlevel: 'vibrationlevel',
  fft: 'fft',

  /* report */
  anomalylevel: 'anomalylevel',
  vibrationpercentage: 'vibrationpercentage',      /* new -> Operating Time: (Report Period * Percentage Vibration) / 100 */
  goodvibration: 'goodvibration',            /* new - unused */
  operatingtime: 'operatingtime',
  totaloperatingtimeknown: 'totaloperatingtimeknown',
  totalunknown1020: 'totalunknown1020',
  totalunknown2040: 'totalunknown2040',
  totalunknown4060: 'totalunknown4060',
  totalunknown6080: 'totalunknown6080',
  totalunknown80100: 'totalunknown80100',
  reportlength: 'reportlength',
  reportid: 'reportid',                 /* new - unused */
  nbalarmreport: 'nbalarmreport',
  // temperature              : 'temperature',
  // vibrationlevel           : 'vibrationlevel',
  batterypercentage: 'batterypercentage',
  peakfrequencyindex: 'peakfrequencyindex',
  badvibrationpercentage1020: 'badvibrationpercentage1020',
  badvibrationpercentage2040: 'badvibrationpercentage2040',
  badvibrationpercentage4060: 'badvibrationpercentage4060',
  badvibrationpercentage6080: 'badvibrationpercentage6080',
  badvibrationpercentage80100: 'badvibrationpercentage80100',
  anomalylevelto20last24h: 'anomalylevelto20last24h',
  anomalylevelto50last24h: 'anomalylevelto50last24h',
  anomalylevelto80last24h: 'anomalylevelto80last24h',
  anomalylevelto20last30d: 'anomalylevelto20last30d',
  anomalylevelto50last30d: 'anomalylevelto50last30d',
  anomalylevelto80last30d: 'anomalylevelto80last30d',
  anomalylevelto20last6mo: 'anomalylevelto20last6mo',
  anomalylevelto50last6mo: 'anomalylevelto50last6mo',
  anomalylevelto80last6mo: 'anomalylevelto80last6mo',

  /* alarm */
  // anomalylevel           : 'anomalylevel',
  // temperature            : 'temperature',
  // vibrationlevel         : 'vibrationlevel',
  // fft                    : 'fft',

  /* startstop */
  state: 'state',
});

const constants = Object.freeze({
  SIGNIFICATION_BYTE_IDX: 0,

  LEARNING: {
    NAME: 'learning',
    PAYLOAD_LENGTH: 80, /* 40 bytes: 0 -> 39 */
    SIGNIFICATION: 'L',
    SIGNIFICATION_VALUE: {
      MPU6500: 76,
      KX: 108,
    },
    PROPERTIES_BYTE_IDX: {
      [BOB_PROPS.learningpercentage]: 1,
      [BOB_PROPS.vibrationlevel]: [2, 3, 4],
      [BOB_PROPS.peakfrequencyindex]: 5,
      [BOB_PROPS.temperature]: 6,
      [BOB_PROPS.learningfromscratch]: 7,
      [BOB_PROPS.fft]: range(8, 39 + 1), /* 32 fft -> 32 bytes: 8 -> 39 */
    },
  },


  REPORT: {
    NAME: 'report',
    PAYLOAD_LENGTH: 54, /* 27 bytes: 0 -> 26 */
    SIGNIFICATION: 'R',
    SIGNIFICATION_VALUE: {
      MPU6500: 82,
      KX: 114,
    },
    PROPERTIES_BYTE_IDX: {
      [BOB_PROPS.anomalylevel]: 1,
      [BOB_PROPS.vibrationpercentage]: 2,            // Operating time  of the monitored equipment over the report length
      [BOB_PROPS.goodvibration]: 3,
      [BOB_PROPS.nbalarmreport]: 4,
      [BOB_PROPS.temperature]: 5,
      [BOB_PROPS.reportlength]: 6,
      [BOB_PROPS.reportid]: 7,
      [BOB_PROPS.vibrationlevel]: [8, 9, 10],
      [BOB_PROPS.peakfrequencyindex]: 11,
      [BOB_PROPS.badvibrationpercentage1020]: 12,
      [BOB_PROPS.badvibrationpercentage2040]: 13,
      [BOB_PROPS.badvibrationpercentage4060]: 14,
      [BOB_PROPS.badvibrationpercentage6080]: 15,
      [BOB_PROPS.badvibrationpercentage80100]: 16,
      [BOB_PROPS.batterypercentage]: 17,
      [BOB_PROPS.anomalylevelto20last24h]: 18,
      [BOB_PROPS.anomalylevelto50last24h]: 19,
      [BOB_PROPS.anomalylevelto80last24h]: 20,
      [BOB_PROPS.anomalylevelto20last30d]: 21,
      [BOB_PROPS.anomalylevelto50last30d]: 22,
      [BOB_PROPS.anomalylevelto80last30d]: 23,
      [BOB_PROPS.anomalylevelto20last6mo]: 24,
      [BOB_PROPS.anomalylevelto50last6mo]: 25,
      [BOB_PROPS.anomalylevelto80last6mo]: 26,
    },
  },

  ALARM: {
    NAME: 'alarm',
    PAYLOAD_LENGTH: 80, /* 40 bytes: 0 -> 39 */
    SIGNIFICATION: 'A',
    SIGNIFICATION_VALUE: {
      MPU6500: 65,
      KX: 97,
    },
    PROPERTIES_BYTE_IDX: {
      [BOB_PROPS.anomalylevel]: 1,
      [BOB_PROPS.temperature]: 2,
      /* NA: 3 */
      [BOB_PROPS.vibrationlevel]: [4, 5, 6],
      /* NA: 7 */
      [BOB_PROPS.fft]: range(8, 39 + 1),
    },
  },

  STARTSTOP: { /* State */
    NAME: 'startstop',
    PAYLOAD_LENGTH: 6, /* 2 bytes: 0 -> 1 */
    SIGNIFICATION: 'Header',
    SIGNIFICATION_VALUE: {
      MPU6500: 83,
      KX: 83,
    },
    PROPERTIES_BYTE_IDX: {
      [BOB_PROPS.state]: 1,
      [BOB_PROPS.batterypercentage]: 2,
    },
  },

  BOB_SENSOR_TYPES: {
    MPU6500: {
      NAME: 'MPU6500',
      FREQ_SAMPLING_ACC_LF: 1000, /* Hz */
      FREQ_SAMPLING_ACC_HF: 1000, /* Hz */
    },
    KX: {
      NAME: 'KX',
      FREQ_SAMPLING_ACC_LF: 800,   /* Hz */
      FREQ_SAMPLING_ACC_HF: 25600, /* Hz */
    },
  },
});

const ONE_BYTE_LENGTH = 2;
const SENSOR_STATES = Object.freeze({
  SENSOR_START: 0,
  SENSOR_STOP: 1,
  MACHINE_START: 2,
  MACHINE_STOP: 3,
  SENSOR_STOP_WITH_ERASE: 4,
  SENSOR_STOP_NO_VIB: 5,
  SENSOR_START_NO_VIB: 6,
  SENSOR_LEARN_KEEPALIVE: 7,
});
const LIST_MPU_SENSOR_SIGNIFICATION_VALUES = Object.freeze([
  constants.LEARNING.SIGNIFICATION_VALUE.MPU6500,
  constants.REPORT.SIGNIFICATION_VALUE.MPU6500,
  constants.ALARM.SIGNIFICATION_VALUE.MPU6500,
  constants.STARTSTOP.SIGNIFICATION_VALUE.MPU6500,
]);
const LIST_KX_SENSOR_SIGNIFICATION_VALUES = Object.freeze([
  constants.LEARNING.SIGNIFICATION_VALUE.KX,
  constants.REPORT.SIGNIFICATION_VALUE.KX,
  constants.ALARM.SIGNIFICATION_VALUE.KX,
  constants.STARTSTOP.SIGNIFICATION_VALUE.KX,
]);

// ┌───────────────────────────────────────────────────────────────────────────┐
// | GLOBAL VARIABLE --                                                        |
// └───────────────────────────────────────────────────────────────────────────┘


// ┌───────────────────────────────────────────────────────────────────────────┐
// | CLASS DECLARATION ++                                                      |
// └───────────────────────────────────────────────────────────────────────────┘

/**
 * @class
 * @name BobPayloadProcessor
 * @description Bob local payload decryptor
 * @constructor
 */
function BobPayloadProcessor() {
  this.serviceName = COMPONENT_NAME;
}

BobPayloadProcessor.prototype.processDecryptedPayload = processDecryptedPayload;

// ┌───────────────────────────────────────────────────────────────────────────┐
// | CLASS DECLARATION --                                                      |
// └───────────────────────────────────────────────────────────────────────────┘


// ┌───────────────────────────────────────────────────────────────────────────┐
// | EXPORT ++                                                                 |
// └───────────────────────────────────────────────────────────────────────────┘

module.exports = new BobPayloadProcessor();

// ┌───────────────────────────────────────────────────────────────────────────┐
// | EXPORT --                                                                 |
// └───────────────────────────────────────────────────────────────────────────┘


// ┌───────────────────────────────────────────────────────────────────────────┐
// | IMPLEMENTATION ++                                                         |
// └───────────────────────────────────────────────────────────────────────────┘

/**
 * @function
 * @name processDecryptedPayload
 * @description do decrypt raw payload
 * @param {string} rawPayload
 * @returns {{code: number, sensor: string, status: string}}
 */
function processDecryptedPayload(rawPayload) {
  const payloadLength = rawPayload.length;
  const signification = _oneByteHexToUnsignedDec(rawPayload, constants.SIGNIFICATION_BYTE_IDX);
  const messageType = _findMessageTypeBySignification(signification);
  const response = {
    code: 200,
    status: 'success',
    sensor: _findSensorTypeBySignification(signification),
  };

  response.type = messageType.NAME;

  if (payloadLength === messageType.PAYLOAD_LENGTH) {
    response.msg = _findAllPropertiesValue(rawPayload, messageType.PROPERTIES_BYTE_IDX, response.sensor, response.type);
  } else {
    throw new Error('Invalid payload length "' + payloadLength + '" for message type ' + response.type);
  }

  return response;
}

/**
 * @function
 * @name _findAllPropertiesValue
 * @description find all message type's properties values from raw payload
 * @param {string} rawPayload
 * @param {number} propertiesByteIdx
 * @param {string} sensorType
 * @param {string} messageType
 * @private
 */
function _findAllPropertiesValue(rawPayload, propertiesByteIdx, sensorType, messageType) {
  const propertiesValue = {};

  for (let propertyName in propertiesByteIdx) {
    if (propertiesByteIdx.hasOwnProperty(propertyName)) {
      const byteIdx = propertiesByteIdx[propertyName];

      propertiesValue[propertyName] = _findPropertyValue(rawPayload, byteIdx, propertyName, sensorType);
    }
  }

  _findMissingProperties(propertiesValue, rawPayload, messageType);

  return propertiesValue;
}

/**
 * @function
 * @name _findMissingProperties
 * @description find missing properties after decrypt all
 * @param {object} propertiesValue
 * @param {string} rawPayload
 * @param {string} messageType
 * @private
 */
function _findMissingProperties(propertiesValue, rawPayload, messageType) {
  _findOperatingTimeInReport(propertiesValue);
  _findTotalUnknownsInReport(propertiesValue, rawPayload, messageType);
  _findFftValuesFromOriginalValues(propertiesValue);
}

/**
 * @function
 * @name _findOperatingTimeInReport
 * @description find operating time value in report
 * @param {object} propertiesValue
 * @param {number} propertiesValue.reportLength
 * @param {number} propertiesValue.vibrationpercentage
 * @private
 */
function _findOperatingTimeInReport(propertiesValue) {
  const reportLength = propertiesValue[BOB_PROPS.reportlength];
  const vibrationPercentage = propertiesValue[BOB_PROPS.vibrationpercentage];

  if (isNumber(reportLength) && isNumber(vibrationPercentage)) {
    propertiesValue[BOB_PROPS.operatingtime] = Math.round((reportLength * vibrationPercentage) / 100);
  }
}

/**
 * @function
 * @name _findTotalUnknownsInReport
 * @description find total unknown values
 * @param {object} propertiesValue
 * @param {string} rawPayload
 * @param {string} messageType
 * @private
 */
function _findTotalUnknownsInReport(propertiesValue, rawPayload, messageType) {
  const reportTypeConfig = constants.REPORT;

  if (messageType !== reportTypeConfig.NAME) {
    return;
  }

  const reportLength = propertiesValue[BOB_PROPS.reportlength];
  const operatingTime = propertiesValue[BOB_PROPS.operatingtime];
  const totalOperatingTimeKnown = propertiesValue[BOB_PROPS.totaloperatingtimeknown] = Math.round(propertiesValue[BOB_PROPS.goodvibration] * operatingTime / 127);
  const operatingTimeUnknown = operatingTime - totalOperatingTimeKnown;

  propertiesValue[BOB_PROPS.totalunknown1020] = Math.round((operatingTime - totalOperatingTimeKnown) * propertiesValue[BOB_PROPS.badvibrationpercentage1020] / 127);
  propertiesValue[BOB_PROPS.totalunknown2040] = Math.round((operatingTime - totalOperatingTimeKnown) * propertiesValue[BOB_PROPS.badvibrationpercentage2040] / 127);
  propertiesValue[BOB_PROPS.totalunknown4060] = Math.round((operatingTime - totalOperatingTimeKnown) * propertiesValue[BOB_PROPS.badvibrationpercentage4060] / 127);
  propertiesValue[BOB_PROPS.totalunknown6080] = Math.round((operatingTime - totalOperatingTimeKnown) * propertiesValue[BOB_PROPS.badvibrationpercentage6080] / 127);
  propertiesValue[BOB_PROPS.totalunknown80100] = Math.round((operatingTime - totalOperatingTimeKnown) * propertiesValue[BOB_PROPS.badvibrationpercentage80100] / 127);
}

/**
 * @function
 * @name _findFftValuesFromOriginalValues
 * @description find fft value calculated from origin value - values parse from hex to dec
 * @param {Object} propertiesValue
 * @param {number[]} propertiesValue.fft
 * @param {number} propertiesValue.vibrationlevel
 * @private
 */
function _findFftValuesFromOriginalValues(propertiesValue) {
  const newFft = [];
  const fft = propertiesValue[BOB_PROPS.fft];
  const vibrationlevel = propertiesValue[BOB_PROPS.vibrationlevel];

  if (!isEmpty(fft)) {
    if (!isNumber(vibrationlevel)) {
      delete propertiesValue[BOB_PROPS.fft];
      error('Cannot calculate fft, no vibrationlevel value found!');
    } else {
      for (let originValue of fft) {
        const fftValue = originValue * vibrationlevel / 127;

        newFft.push(fftValue);
      }

      propertiesValue[BOB_PROPS.fft] = newFft;
    }
  }
}

/**
 * @function
 * @name _findPropertyValue
 * @description find value of a single property in raw payload
 * @param {string}          rawPayload
 * @param {number|number[]} byteIdx
 * @param {string}          propertyName
 * @param {string}          sensorType
 * @returns {number|*[]}
 * @private
 */
function _findPropertyValue(rawPayload, byteIdx, propertyName, sensorType) {
  let value = _findValuesByIndexes(rawPayload, byteIdx);

  switch (propertyName) {
    case BOB_PROPS.vibrationlevel: {
      value = parseFloat(((value[0] * 128 + value[1] + value[2] / 100) / 10 / 121.45).toFixed(4));
      break;
    }

    case BOB_PROPS.peakfrequencyindex: {
      value += 1;
      break;
    }

    case BOB_PROPS.temperature: {
      value -= 30;
      break;
    }

    case BOB_PROPS.reportlength: {
      value = (value <= 59) ? value : (value - 59) * 60;
      break;
    }

    case BOB_PROPS.anomalylevel:
    case BOB_PROPS.vibrationpercentage: {
      value = parseFloat((value * 100 / 127).toFixed(1));
      break;
    }

    case BOB_PROPS.batterypercentage: {
      value = parseFloat((value * 100 / 127).toFixed(2));
      break;
    }

    case BOB_PROPS.state: {
      value = _findStateInPayload(value);

      break;
    }

    default: {
      break;
    }
  }

  if (!value && !isNumber(value)) {
    warn('Property ' + propertyName + ' has value: ' + value);
  }

  return value;
}

/**
 * @function
 * @name _findValuesByIndexes
 * @param {string} rawPayload
 * @param {number | number[]} indexes
 * @returns {number|number[]}
 * @private
 */
function _findValuesByIndexes(rawPayload, indexes) {
  let value = null;

  if (isNumber(indexes)) {
    value = _oneByteHexToUnsignedDec(rawPayload, indexes);
  } else if (isArray(indexes)) {
    value = [];

    for (let idx of indexes) {
      const v = _oneByteHexToUnsignedDec(rawPayload, idx);

      value.push(v);
    }
  } else {
    throw new Error('Invalid byte indexes configuration: ' + indexes);
  }

  return value;
}

/**
 * @function
 * @name _findStateInPayload
 * @description find sensor state in payload
 * @param {number} value
 * @returns {number}
 * @private
 */
function _findStateInPayload(value) {
  let state = 0;

  switch (value) {
    case 100: {
      state = SENSOR_STATES.SENSOR_START;
      break;
    }

    case 101: {
      state = SENSOR_STATES.SENSOR_STOP;
      break;
    }

    case 104: {
      state = SENSOR_STATES.SENSOR_START_NO_VIB;
      break;
    }

    case 105: {
      state = SENSOR_STATES.SENSOR_STOP_NO_VIB;
      break;
    }

    case 106: {
      state = SENSOR_STATES.SENSOR_LEARN_KEEPALIVE;
      break;
    }

    case 110: {
      state = SENSOR_STATES.SENSOR_STOP_WITH_ERASE;
      break;
    }

    case 125: {
      state = SENSOR_STATES.MACHINE_STOP;
      break;
    }

    case 126: {
      state = SENSOR_STATES.MACHINE_START;
      break;
    }

    default: {
      const m = 'invalid sensor state: ' + value;

      error(m);
      throw new Error(m);
    }
  }

  return state;
}

/**
 * @function
 * @name _findMessageTypeBySignification
 * @description find message type configuration by input signification
 * @param {Number} signification
 * @returns {constants.LEARNING|{PAYLOAD_LENGTH, SIGNIFICATION_VALUE, PROPERTIES_BYTE_IDX, NAME, SIGNIFICATION}|constants.REPORT|constants.ALARM|constants.STARTSTOP}
 * @private
 */
function _findMessageTypeBySignification(signification) {
  let messageType = 'unknown';

  switch (signification) {
    case constants.LEARNING.SIGNIFICATION_VALUE.KX:
    case constants.LEARNING.SIGNIFICATION_VALUE.MPU6500: {
      messageType = constants.LEARNING;
      break;
    }

    case constants.REPORT.SIGNIFICATION_VALUE.KX:
    case constants.REPORT.SIGNIFICATION_VALUE.MPU6500: {
      messageType = constants.REPORT;
      break;
    }

    case constants.ALARM.SIGNIFICATION_VALUE.KX:
    case constants.ALARM.SIGNIFICATION_VALUE.MPU6500: {
      messageType = constants.ALARM;
      break;
    }

    case constants.STARTSTOP.SIGNIFICATION_VALUE.KX:
    case constants.STARTSTOP.SIGNIFICATION_VALUE.MPU6500: {
      messageType = constants.STARTSTOP;
      break;
    }

    default: {
      throw new Error('Invalid data signification ' + signification);
    }
  }

  return messageType;
}

/**
 * @function
 * @name _findSensorTypeBySignification
 * @description find sensor type of BOB from its signification
 * @param {number} signification
 * @returns {string}
 * @private
 */
function _findSensorTypeBySignification(signification) {
  if (LIST_MPU_SENSOR_SIGNIFICATION_VALUES.includes(signification)) {
    return constants.BOB_SENSOR_TYPES.MPU6500.NAME;
  } else if (LIST_KX_SENSOR_SIGNIFICATION_VALUES.includes(signification)) {
    return constants.BOB_SENSOR_TYPES.KX.NAME;
  } else {
    throw new Error('Invalid data signification ' + signification);
  }
}

/**
 * @function
 * @name _oneByteHexToUnsignedDec
 * @description parse one byte hexadecimal in rawPayload to decimal by index
 * @param {string} rawPayload
 * @param {number} byteIdx
 * @returns {number}
 * @private
 */
function _oneByteHexToUnsignedDec(rawPayload, byteIdx) {
  const startIdx = byteIdx * ONE_BYTE_LENGTH;
  const endIdx = startIdx + ONE_BYTE_LENGTH;
  const hexString = rawPayload.substring(startIdx, endIdx);

  return _hexToUnsignedDec(hexString);
}

/**
 * @function
 * @name _hexToUnsignedDec
 * @description parse hexadecimal number to decimal
 * @param {string} hex
 * @returns {number}
 * @private
 */
function _hexToUnsignedDec(hex) {
  if ((hex.length % 2) !== 0) {
    hex = '0' + hex;
  }

  return parseInt(hex, 16);
}

BobPayloadProcessor.prototype.debug = debug;
BobPayloadProcessor.prototype.info = info;
BobPayloadProcessor.prototype.warn = warn;
BobPayloadProcessor.prototype.error = error;

function debug(message) {
  console.debug('[{0}] {1}'.format(COMPONENT_NAME, message));
}

function error(message, ex) {
  console.error('[{0}] {1}'.format(COMPONENT_NAME, message), ex);
}

function info(message) {
  console.info('[{0}] {1}'.format(COMPONENT_NAME, message));
}

function warn(message) {
  console.warn('[{0}] {1}'.format(COMPONENT_NAME, message));
}

// ┌───────────────────────────────────────────────────────────────────────────┐
// | IMPLEMENTATION --                                                         |
// └───────────────────────────────────────────────────────────────────────────┘

