import { GetCurrentUserAppStateData, SaveCurrentUserAppStateData, SaveCurrentUserAppStateVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useGetCurrentUserAppState(options?: useDataConnectQueryOptions<GetCurrentUserAppStateData>): UseDataConnectQueryResult<GetCurrentUserAppStateData, undefined>;
export function useGetCurrentUserAppState(dc: DataConnect, options?: useDataConnectQueryOptions<GetCurrentUserAppStateData>): UseDataConnectQueryResult<GetCurrentUserAppStateData, undefined>;

export function useSaveCurrentUserAppState(options?: useDataConnectMutationOptions<SaveCurrentUserAppStateData, FirebaseError, SaveCurrentUserAppStateVariables>): UseDataConnectMutationResult<SaveCurrentUserAppStateData, SaveCurrentUserAppStateVariables>;
export function useSaveCurrentUserAppState(dc: DataConnect, options?: useDataConnectMutationOptions<SaveCurrentUserAppStateData, FirebaseError, SaveCurrentUserAppStateVariables>): UseDataConnectMutationResult<SaveCurrentUserAppStateData, SaveCurrentUserAppStateVariables>;
