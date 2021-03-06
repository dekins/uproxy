/// <reference path='../../third_party/typings/index.d.ts' />

/**
 * core.ts
 *
 * This is the primary uproxy code. It maintains in-memory state,
 * checkpoints information to local storage, and synchronizes state with the
 * front-end.
 *
 * In-memory state includes:
 *  - Roster, which is a list of contacts, always synced with friend lists.
 *  - Instances, which is a list of active uProxy installs.
 */

import * as browser_connector from '../interfaces/browser_connector';
import * as globals from './globals';
import * as logging from '../lib/logging/logging';
import * as loggingprovider from '../lib/loggingprovider/loggingprovider.types';
import * as metrics_module from './metrics';
import * as rtc_to_net from '../lib/rtc-to-net/rtc-to-net';
import * as social_network from './social';
import * as social from '../interfaces/social';
import * as socks_to_rtc from '../lib/socks-to-rtc/socks-to-rtc';
import * as ui from './ui_connector';
import * as uproxy_core from './uproxy_core';
import * as uproxy_core_api from '../interfaces/uproxy_core_api';
import * as version from '../generic/version';

import ui_connector = ui.connector;

// Prepare all the social providers from the manifest.
social_network.initializeNetworks();

// --------------------------------------------------------------------------
// Register Core responses to UI commands.
// --------------------------------------------------------------------------
var core = new uproxy_core.uProxyCore();

// These are exported for debugging from the browser console.
var exported = {
  core: core,
  moduleName: 'uProxy Core Freedom Module',
  social_network: social_network,
  version: version,
  browser_connector: browser_connector,
  ui_connector: ui_connector,
  loggingController: uproxy_core.loggingController,
  logging_types: loggingprovider,
  socks_to_rtc: socks_to_rtc,
  rtc_to_net: rtc_to_net,
  globals: globals
};
export default exported;

// Note: Our mechanism for dispatching commands requires that the
// members of core are bound closures.  E.g.:
//    public foo = (args) => {..}
// And NOT:
//    public foo (args) {..}
var commands :{[command :number] :((data?:any) => (Promise<any>|void))} = {};
commands[uproxy_core_api.Command.LOGIN] = core.login;
commands[uproxy_core_api.Command.LOGOUT] = core.logout;
commands[uproxy_core_api.Command.MODIFY_CONSENT] = core.modifyConsent;
commands[uproxy_core_api.Command.START_PROXYING] = core.start;
commands[uproxy_core_api.Command.INVITE_GITHUB_USER] = core.inviteGitHubUser;
commands[uproxy_core_api.Command.GET_INVITE_URL] = core.getInviteUrl;
commands[uproxy_core_api.Command.SEND_EMAIL] = core.sendEmail;
commands[uproxy_core_api.Command.STOP_PROXYING] = core.stop;
commands[uproxy_core_api.Command.UPDATE_GLOBAL_SETTINGS] = core.updateGlobalSettings;
commands[uproxy_core_api.Command.GET_LOGS] = core.getLogsAndNetworkInfo;
commands[uproxy_core_api.Command.GET_NAT_TYPE] = core.getNatType;
commands[uproxy_core_api.Command.REFRESH_PORT_CONTROL] = core.refreshPortControlSupport;
commands[uproxy_core_api.Command.GET_FULL_STATE] = core.getFullState;
commands[uproxy_core_api.Command.HANDLE_CORE_UPDATE] = core.handleUpdate;
commands[uproxy_core_api.Command.GET_VERSION] = core.getVersion;
commands[uproxy_core_api.Command.PING_UNTIL_ONLINE] = core.pingUntilOnline;
commands[uproxy_core_api.Command.ACCEPT_INVITATION] = core.acceptInvitation;
commands[uproxy_core_api.Command.CLOUD_UPDATE] = core.cloudUpdate;
commands[uproxy_core_api.Command.UPDATE_ORG_POLICY] = core.updateOrgPolicy;
commands[uproxy_core_api.Command.REMOVE_CONTACT] = core.removeContact;
commands[uproxy_core_api.Command.POST_REPORT] = core.postReport;
commands[uproxy_core_api.Command.VERIFY_USER] = core.verifyUser;
commands[uproxy_core_api.Command.VERIFY_USER_SAS] = core.finishVerifyUser;
commands[uproxy_core_api.Command.GET_PORT_CONTROL_SUPPORT] = core.getPortControlSupport;
commands[uproxy_core_api.Command.UPDATE_GLOBAL_SETTING] = core.updateGlobalSetting;
commands[uproxy_core_api.Command.CHECK_REPROXY] = core.checkReproxy;

for (var command in commands) {
  ui_connector.onCommand(parseInt(command, 10), commands[command]);
}

var dailyMetricsReporter = new metrics_module.DailyMetricsReporter(
    globals.metrics, globals.storage, core.getNetworkInfoObj,
    (payload :any) => {
      if (globals.settings.statsReportingEnabled) {
        core.postReport({payload: payload, path: 'submit-rappor-stats'});
      }
    });
