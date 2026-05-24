import { initClient } from '@ts-rest/core';
import { apiContracts } from 'api-types';
import { getBackendUrl } from './backend-url';

// Vanilla ts-rest client for use outside of React components (e.g., in async functions)
export const apiClient = initClient(apiContracts, {
  baseHeaders: {},
  baseUrl: getBackendUrl(),
});




