import { EventEmitter } from 'eventemitter3'
// import { IStream, IStreamConfig } from './../interfaces/stream';

const DigestFetch = require('digest-fetch')

export interface WowzaOptions {
  address?: string
  port?: number
  username?: string
  password?: string
  application?: string
  streamFile?: string
  appInstance?: string
  mediaCasterType?: string
  commonRequestUrl?: string
}

export interface httpOptions {
  headers: object
}

export interface recorderParameters {
  recorderName?: string;
  instanceName?: string;
  recorderState?: string;
  defaultRecorder?: boolean;
  segmentationType?: string;
  outputPath?: string;
  baseFile?: string;
  fileVersionDelegateName?: string;
  fileTemplate?: string;
  segmentDuration?: number;
  segmentSize?: number;
  recordData?: boolean;
  startOnKeyFrame?: boolean;
  splitOnTcDiscontinuity?: boolean;
  backBufferTime?: number;
  option?: string;
  moveFirstVideoFrameToZero?: boolean;
  currentSize?: number;
  currentDuration?: number;
  recordingStartTime?: string;
  serverName?: string;
  segmentSchedule?: string;
  currentFile?: string;
  saveFieldList?: string[];
  applicationName?: string;
  recorderErrorString?: string;
  version?: string;
  fileFormat?: string;
}

export interface recorderOptions {
  streamFile: string,
  application?: string,
  appInstance?: string
}

export interface StreamFile {
  id: string;
  href: string;
}

export interface StreamConfig {
  version: string,
  serverName: string,
  name: string,
  uri: string,
}

export interface RecordingStatus {
  serverName: string;
  recorderName: string;
  instanceName: string;
  recorderState: string;
  defaultRecorder: boolean;
  segmentationType: string;
  outputPath: string;
  baseFile: string;
  fileFormat: string;
  fileVersionDelegateName: string;
  fileTemplate: string;
  segmentDuration: number;
  segmentSize: number;
  segmentSchedule: string;
  recordData: boolean;
  startOnKeyFrame: boolean;
  splitOnTcDiscontinuity: boolean;
  backBufferTime: 0,
  option: string;
  moveFirstVideoFrameToZero: boolean;
  currentSize: number;
  currentDuration: number;
  currentFile: string;
  recordingStartTime: string;
  timeScale: number;
  defaultAudioSearchPosition: boolean;
  skipKeyFrameUntilAudioTimeout: number;
}

export type WowzaEvents = {
}

export class Wowza extends EventEmitter<WowzaEvents> {
  DEFAULT_PORT = 8087

  private client: typeof DigestFetch;
  private baseUrl: string;
  private address: string;
  private application: string;
  private streamFile: string;
  private appInstance: string;
  private mediaCasterType: string;
  private commonRequestUrl: string;
  private httpOptions: httpOptions;

  constructor(options: WowzaOptions) {
    super()

    this.client = new DigestFetch(options.username, options.password)

    this.baseUrl = "http://" + options.address + ":" + options.port
    this.address = options.address || 'localhost';
    this.application = options.application || 'live';
    this.streamFile = options.streamFile || 'myStream.stream';
    this.appInstance = options.appInstance || '_definst_';
    this.mediaCasterType = options.mediaCasterType || 'rtp';
    this.commonRequestUrl = `http://${this.address}:8087/v2/servers/_defaultServer_/vhosts/_defaultVHost_`;

    this.httpOptions = {
      headers: {
        'Accept': 'application/json; charset=utf-8',
        'Content-Type': 'application/json; charset=utf-8'
      }
    }
  }

  /**
  *Get a list of streamfiles
  *
  * @function getStreamFilesList
  * @param {Object} [options]
  * @param {string}  [options.application = 'live'] name of an application (default value can be another if it was passed to the class constructor)
  * @return {Promise} promise which resolve by object which contains array of streamFiles and it's confifurations
  *
  * @example
  * Wowza.getStreamFilesList(application: 'webrtc'})
  * 	.then( responseMsg => console.log(responseMsg))
  * 	.catch( errorMsg => console.log(errorMsg));
  *
  * // Wowza answer example:
  * //{serverName: '_defaultServer_', streamFiles: [{id: 'ipCamera2', href: '/v2/servers/_defaultServer_/vhosts/_defaultVHost_/applications/webrtc/streamfiles/ipCamera2'}]}
  */
  async getStreamFilesList(application = "live") {
    const response: Response = await this.client.fetch(
      `${this.commonRequestUrl}/applications/${application}/streamfiles`,
      {
        method: 'GET',
        headers: this.httpOptions.headers
      }
    )

    if (response.ok) {
      const json: {
        serverName: string,
        streamFiles: StreamFile
      } = await response.json()
      return {
        data: json
      };
    }
    else {
      const json: any = await response.json()
      console.log(json)
      return {
        errors: [{ message: `Fetch to the Wowza REST API failed with code: ${response.status}` }],
        json: json
      };
    }
  }

  /**
 *Get specific stream configuration
 *
 * @function getStreamConfiguration
 * @param {Object} [options]
 * @param {string} [options.application = 'live'] name of an application (default value can be another if it was passed to the class constructor)
 * @param {string} [options.streamFile = 'myStream.stream'] name of a streamfile (default value can be another if it was passed to the class constructor)
 * @return {Promise} promise which resolve by stream configurations object 
 *
 * @example 
 * wowza.getStreamConfiguration()
 *	.then(response => console.log(response))
 *	.catch(errorMsg => console.log(errorMsg));
 * // Wowza answer example: 
 * // {version: '1488715914000', serverName: '_defaultServer_', uri: 'rtsp://admin:admin@192.168.42.231', name: 'ipCamera'}
 */
  async getStreamConfiguration(application = "live", streamFile = "myStream") {
    const response: Response = await this.client.fetch(
      `${this.commonRequestUrl}/applications/${application}/streamfiles/${streamFile}`,
      {
        method: 'GET',
        headers: this.httpOptions.headers
      }
    )

    if (response.ok) {
      const json: StreamConfig = await response.json()
      return {
        data: json
      };
    }
    else {
      const json: any = await response.json()
      console.log(json)
      return {
        errors: [{ message: `Fetch to the Wowza REST API failed with code: ${response.status}` }],
        json: json
      };
    }

  }

  /**
	 *Create Recorder
	 *
	 * @method createRecorder
   * @param {Object} [recorderParameters]
   * @param {Object} [options]
	 * @return {Promise} promise which resolve when rec will start  
	 * @example
	 * wowza.createRecorder({
	 * 	"recorderName": "ipCameraRecorder",
	 * 	"instanceName": "_definst_",
	 * 	"recorderState": "Waiting for stream",
	 * 	"defaultRecorder": true,
	 * 	"segmentationType": "None",
	 * 	"outputPath": "", // default value is [] and wowza save files in [install-dir]/content, not tested
	 * 	"baseFile": "myrecord2.mp4", // default is [], and wowza will name file as a streamfile name, not tested
	 * 	"fileFormat": "MP4",
	 * 	"fileVersionDelegateName": "com.wowza.wms.livestreamrecord.manager.StreamRecorderFileVersionDelegate",
	 * 	"fileTemplate": "${BaseFileName}_${RecordingStartTime}_${SegmentNumber}",
	 * 	"segmentDuration": 900000,
	 * 	"segmentSize": 10485760,
	 * 	"segmentSchedule": "0 * * * * *",
	 * 	"recordData": true,
	 * 	"startOnKeyFrame": true,
	 * 	"splitOnTcDiscontinuity": false,
	 * 	"backBufferTime": 3000,
	 * 	"option": "Version existing file", //should to work with one of: version | append | overwrite, but not tested
	 * 	"moveFirstVideoFrameToZero": true,
	 * 	"currentSize": 0,
	 * 	"currentDuration": 0,
	 * 	"recordingStartTime": ""
	 * },{
	 * 	streamFile: 'ipCamera', 
	 * 	application: 'webrtc',
	 * 	appIstance: '_definst_'
	 * })
	 * 	.then(response => console.log(response))
	 * 	.catch(errorMsg => console.log(errorMsg));
	 * // Wowza answer example: 
	 * //{ success: true, message: 'Recorder Created', data: null }
	 */
  async createRecorder(recorderParameters?: recorderParameters, options?: recorderOptions) {
    let application = this.application;
    let streamFile = this.streamFile;
    let appInstance = this.appInstance;

    if (options) {
      application = options.application || this.application;
      streamFile = options.streamFile || this.streamFile;
      appInstance = options.appInstance || this.appInstance;
    }

    const defaultParameters: recorderParameters = {
      "instanceName": "",
      "fileVersionDelegateName": "com.wowza.wms.livestreamrecord.manager.StreamRecorderFileVersionDelegate",
      "serverName": "",
      "recorderName": `${streamFile}.stream`,
      "currentSize": 0,
      "segmentSchedule": "",
      "startOnKeyFrame": true,
      "outputPath": "",
      "currentFile": "",
      "saveFieldList": [
        ""
      ],
      "recordData": false,
      "applicationName": "",
      "moveFirstVideoFrameToZero": false,
      "recorderErrorString": "",
      "segmentSize": 0,
      "defaultRecorder": false,
      "splitOnTcDiscontinuity": false,
      "version": "",
      "baseFile": "",
      "segmentDuration": 0,
      "recordingStartTime": "",
      "fileTemplate": "",
      "backBufferTime": 0,
      "segmentationType": "",
      "currentDuration": 0,
      "fileFormat": "",
      "recorderState": "",
      "option": ""
    }

    let body = { ...defaultParameters, ...recorderParameters };

    const response: Response = await this.client.fetch(
      `${this.commonRequestUrl}/applications/${application}/instances/${appInstance}/streamrecorders/${streamFile}.stream`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json; charset=utf-8',
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(body)
      }
    )

    if (response.ok) {
      const json: StreamConfig = await response.json()
      console.log(json)
      return {
        data: json
      };
    }
    else {
      const json: any = await response.json()
      console.log(json)
      return {
        errors: [{ message: `Fetch to the Wowza REST API failed with code: ${response.status}` }],
        json: json
      };
    }
  }

  /**
   * Stop recording
   *
   * @method stopRecording
   * @param {Object} [options]
   * @param {string} [options.application = 'live'] name of an application (default value can be another if it was passed to the class constructor)
   * @param {string} [options.streamFile = 'myStream.stream'] name of a streamfile (default value can be another if it was passed to the class constructor)
   * @param {string} [options.appInstance = '_definst_'] name of an instance (default value can be another if it was passed to the class constructor)
   * @return {Promise} promise which resolve when rec will stop
   * @example
   * wowza.stopRecording({
   * 	streamFile: 'ipCamera', 
   * 	application: 'webrtc',
   * 	appIstance: '_definst_'
   * }).then(response => console.log(response)).catch(errorMsg => console.log(errorMsg));
   * // Wowza answer example: 
   * // { success: true, message: 'Recording (ipCamera) stopped', data: null }
   */
  async stopRecording(application = "live", appInstance = "_definst_", streamFile = "myStream") {

    const response: Response = await this.client.fetch(
      `${this.commonRequestUrl}/applications/${application}/instances/${appInstance}/streamrecorders/${streamFile}.stream/actions/stopRecording`,
      {
        method: 'PUT',
        headers: {
          'Accept': 'application/json; charset=utf-8',
          'Content-Type': 'application/json; charset=utf-8'
        },
      }
    )
    if (response.ok) {
      const json: any = await response.json()
      return {
        data: json
      };
    }
    else {
      const json: any = await response.json()
      console.log(json)
      return {
        errors: [{ message: `Fetch to the Wowza REST API failed with code: ${response.status}` }],
        json: json
      };
    }
  }

  /**
  *Get specific stream configuration
  *
  * @function getRecorderStatus
  * @param {Object} [options]
  * @param {string} [options.application = 'live'] name of an application (default value can be another if it was passed to the class constructor)
  * @param {string} [options.appInstance = 'live'] name of an application (default value can be another if it was passed to the class constructor)
  * @param {string} [options.streamFile = 'myStream.stream'] name of a streamfile (default value can be another if it was passed to the class constructor)
  * @return {Promise} promise which resolve by stream configurations object 
  *
  * @example 
  * wowza.getRecorderStatus()
  *	.then(response => console.log(response))
  *	.catch(errorMsg => console.log(errorMsg));
  * // Wowza answer example: 
  * // {"serverName":"_defaultServer_","recorderName":"mystream.stream","instanceName":"_definst_","recorderState":"Recording in Progress","defaultRecorder":false,"segmentationType":"None","outputPath":"D:\\Recordings","baseFile":"","fileFormat":"MP4","fileVersionDelegateName":"com.wowza.wms.livestreamrecord.manager.StreamRecorderFileVersionDelegate","fileTemplate":"${SourceStreamName}_${RecordingStartTime}_${SegmentNumber}","segmentDuration":3078742,"segmentSize":10485760,"segmentSchedule":"0 * * * * *","recordData":false,"startOnKeyFrame":true,"splitOnTcDiscontinuity":false,"backBufferTime":0,"option":"Version existing file","moveFirstVideoFrameToZero":true,"currentSize":626866569,"currentDuration":3078742,"recordingStartTime":"2020-09-10-11.55.13.489-+01:00","timeScale":90000,"defaultAudioSearchPosition":true,"skipKeyFrameUntilAudioTimeout":10000}⏎
  */
  async getRecorderStatus(application = "live", appInstance = "_definst_", streamFile = "myStream") {
    const response: Response = await this.client.fetch(
      `${this.commonRequestUrl}/applications/${application}/instances/${appInstance}/streamrecorders/${streamFile}.stream`,

      {
        method: 'GET',
        headers: this.httpOptions.headers
      }
    )

    if (response.ok) {
      const json: StreamConfig = await response.json()
      return {
        data: json
      };
    }
    else {
      const json: RecordingStatus = await response.json()
      console.log(json)
      return {
        errors: [{ message: `Fetch to the Wowza REST API failed with code: ${response.status}` }],
        json: json
      };
    }

  }

}