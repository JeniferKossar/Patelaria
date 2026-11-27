import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AppState_Key {
  ownerUid: string;
  __typename?: 'AppState_Key';
}

export interface FinancialTransaction_Key {
  id: UUIDString;
  __typename?: 'FinancialTransaction_Key';
}

export interface GetCurrentUserAppStateData {
  appStates: ({
    state: unknown;
  })[];
}

export interface InventoryItem_Key {
  id: UUIDString;
  __typename?: 'InventoryItem_Key';
}

export interface MenuItem_Key {
  id: UUIDString;
  __typename?: 'MenuItem_Key';
}

export interface OrderItem_Key {
  id: UUIDString;
  __typename?: 'OrderItem_Key';
}

export interface Order_Key {
  id: UUIDString;
  __typename?: 'Order_Key';
}

export interface SaveCurrentUserAppStateData {
  appState_upsert: AppState_Key;
}

export interface SaveCurrentUserAppStateVariables {
  state: unknown;
}

interface GetCurrentUserAppStateRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetCurrentUserAppStateData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetCurrentUserAppStateData, undefined>;
  operationName: string;
}
export const getCurrentUserAppStateRef: GetCurrentUserAppStateRef;

export function getCurrentUserAppState(options?: ExecuteQueryOptions): QueryPromise<GetCurrentUserAppStateData, undefined>;
export function getCurrentUserAppState(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetCurrentUserAppStateData, undefined>;

interface SaveCurrentUserAppStateRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveCurrentUserAppStateVariables): MutationRef<SaveCurrentUserAppStateData, SaveCurrentUserAppStateVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveCurrentUserAppStateVariables): MutationRef<SaveCurrentUserAppStateData, SaveCurrentUserAppStateVariables>;
  operationName: string;
}
export const saveCurrentUserAppStateRef: SaveCurrentUserAppStateRef;

export function saveCurrentUserAppState(vars: SaveCurrentUserAppStateVariables): MutationPromise<SaveCurrentUserAppStateData, SaveCurrentUserAppStateVariables>;
export function saveCurrentUserAppState(dc: DataConnect, vars: SaveCurrentUserAppStateVariables): MutationPromise<SaveCurrentUserAppStateData, SaveCurrentUserAppStateVariables>;

