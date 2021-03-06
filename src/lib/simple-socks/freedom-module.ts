/// <reference path='../../../third_party/typings/index.d.ts' />

import * as bridge from '../bridge/bridge';
import * as logging from '../logging/logging';
import * as loggingTypes from '../loggingprovider/loggingprovider.types';
import * as net from '../net/net.types';
import * as rtc_to_net from '../rtc-to-net/rtc-to-net';
import * as socks_to_rtc from '../socks-to-rtc/socks-to-rtc';
import * as tcp from '../net/tcp';

declare const freedom: freedom.FreedomInModuleEnv;

const loggingController = freedom['loggingcontroller']();
loggingController.setDefaultFilter(loggingTypes.Destination.console,
                                   loggingTypes.Level.debug);

const log :logging.Log = new logging.Log('simple-socks');

const socksEndpoint:net.Endpoint = {
  address: '0.0.0.0',
  port: 9999
};

const pcConfig :freedom.RTCPeerConnection.RTCConfiguration = {
  iceServers: [{urls: ['stun:stun.l.google.com:19302']},
               {urls: ['stun:stun.services.mozilla.com']}]
};

export const socksToRtc = new socks_to_rtc.SocksToRtc();
export const rtcToNet = new rtc_to_net.RtcToNet();

rtcToNet.start({
  allowNonUnicast: true
}, bridge.best('rtctonet', pcConfig)).then(() => {
  log.info('RtcToNet ready');
}, (e:Error) => {
  log.error('failed to start RtcToNet: %1', e.message);
});

socksToRtc.start(
  new tcp.Server(socksEndpoint),
  // If you encounter issues w/obfuscation, replace bridge.best(...)
  // with bridge.preObfuscation('sockstortc', pcConfig))
  bridge.best('sockstortc', pcConfig, undefined, {
    // See churn pipe source for the full list of transformer names.
    name: 'rc4'
  })).then((endpoint:net.Endpoint) => {
    log.info('SocksToRtc listening on %1', endpoint);
    log.info('curl -x socks5h://%1:%2 www.example.com',
             endpoint.address, endpoint.port);
  }, (e:Error) => {
    log.error('failed to start SocksToRtc: %1', e.message);
  });

// Must do this after calling start.
rtcToNet.signalsForPeer.setSyncHandler(socksToRtc.handleSignalFromPeer);
socksToRtc.signalsForPeer.setSyncHandler(rtcToNet.handleSignalFromPeer);
