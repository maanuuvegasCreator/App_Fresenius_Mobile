import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

jest.mock('@twilio/voice-react-native-sdk', () => {
  class Voice {
    on() {
      return this;
    }
    addListener() {
      return this;
    }
    unregister() {
      return Promise.resolve();
    }
    register() {
      return Promise.resolve();
    }
    getDeviceToken() {
      return Promise.resolve('mock-device-token');
    }
    initializePushRegistry() {
      return Promise.resolve();
    }
    connect() {
      return Promise.resolve({});
    }
  }
  Voice.Event = {
    CallInvite: 'callInvite',
    Error: 'error',
    Registered: 'registered',
    Unregistered: 'unregistered',
    AudioDevicesUpdated: 'audioDevicesUpdated',
  };
  return { Voice };
});

global.fetch = jest.fn((input) => {
  const u = String(input);
  if (u.includes('register-binding')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
  }
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({ token: 'fake-jwt', identity: 'pedro_castro' }),
  });
});
