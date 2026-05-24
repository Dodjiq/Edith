import { initTsrReactQuery } from '@ts-rest/react-query/v5';
import { apiContracts } from 'api-types';
import { getBackendUrl } from './backend-url';

const api = initTsrReactQuery(apiContracts, {
  baseHeaders: {},
  baseUrl: getBackendUrl(),
});

export default api;
