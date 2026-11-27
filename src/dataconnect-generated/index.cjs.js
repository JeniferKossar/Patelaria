const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs, makeMemoryCacheProvider } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'pastelaria',
  service: 'pastelaria-projeto',
  location: 'southamerica-east1'
};
exports.connectorConfig = connectorConfig;
const dataConnectSettings = {
  cacheSettings: {
    cacheProvider: makeMemoryCacheProvider()
  }
};
exports.dataConnectSettings = dataConnectSettings;

const getCurrentUserAppStateRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCurrentUserAppState');
}
getCurrentUserAppStateRef.operationName = 'GetCurrentUserAppState';
exports.getCurrentUserAppStateRef = getCurrentUserAppStateRef;

exports.getCurrentUserAppState = function getCurrentUserAppState(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getCurrentUserAppStateRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const saveCurrentUserAppStateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveCurrentUserAppState', inputVars);
}
saveCurrentUserAppStateRef.operationName = 'SaveCurrentUserAppState';
exports.saveCurrentUserAppStateRef = saveCurrentUserAppStateRef;

exports.saveCurrentUserAppState = function saveCurrentUserAppState(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveCurrentUserAppStateRef(dcInstance, inputVars));
}
;
