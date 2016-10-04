/// <reference path='../../../../third_party/typings/index.d.ts' />

declare const freedom: freedom.FreedomInCoreEnv;

// Coarse-grained tests for tcp.ts.
// The real work is done in the Freedom module which starts a test in response
// to a Freedom message and is expected to "echo" that messages iff the test
// succeeds.
// TODO: Move the code in the Freedom module to here, with many more
//       expectations. This depends on a test runner which can run its tests
//       *inside* of a Freedom module (rather than a Chrome app):
//         https://github.com/freedomjs/freedom/issues/146
describe('core.tcpsocket wrapper', function() {
  // TODO: This is flaky! figuring out why may help explain why
  //       the SOCKS server sometimes fails to start.
  xit('listens and echoes', (done) => {
    loadFreedom('listen').then(done);
  });

  xit('sends onceShutdown notifications', (done) => {
    loadFreedom('shutdown').then(done);
  });

  it('onceClosed by server, server-side', (done) => {
    loadFreedom('onceclosedbyserverserverside').then(done);
  });

  it('onceClosed by server, client-side', (done) => {
    loadFreedom('onceclosedbyserverclientside').then(done);
  });

  it('onceClosed by client, server-side', (done) => {
    loadFreedom('onceclosedbyclientserverside').then(done);
  });

  it('onceClosed by client, client-side', (done) => {
    loadFreedom('onceclosedbyclientclientside').then(done);
  });

  xit('onceClosed returns NEVER_CONNECTED when client connection fails', (done) => {
    loadFreedom('neverconnected').then(done);
  });

  xit('serves multiple clients', (done) => {
    loadFreedom('multipleclients').then(done);
  });

  xit('connectionsCount', (done) => {
    loadFreedom('connectionscount').then(done);
  });

  // Loads the testing Freedom module, emits a signal and returns
  // a promise which fulfills once the signal is echoed.
  function loadFreedom(signalName:string) : Promise<void> {
    return freedom('files/freedom-module.json', {
        'debug': 'debug'
    }).then((integrationTestFactory) => {
      return new Promise((F, R) => {
        var testModule = integrationTestFactory();
        testModule.emit(signalName);
        testModule.on(signalName, () => {
            F(testModule);
        });
      })
      // Cleanup! Note: this will not run if the test times out... TODO: do
      // we really want close on an promise rejection? better to error then?
      .then(integrationTestFactory.close,
        (e) => {
          throw new Error('Failed to run test module: ' + e.toString());
        });
    });
  }
});
