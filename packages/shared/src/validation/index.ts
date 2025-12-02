// Validation module exports
export {
  apiContract as buildTimeApiContract,
  DefineRoute,
  runBuildTimeValidation,
  exportApiContract
} from './build-time-checker';

export type {
  ApiContract as BuildTimeApiContract,
  RouteDefinition,
  ApiContractManager
} from './build-time-checker';